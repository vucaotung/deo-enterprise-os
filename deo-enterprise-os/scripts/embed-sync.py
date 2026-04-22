#!/usr/bin/env python3
"""
Dẹo Enterprise OS — Embed Sync
Reads Obsidian vault notes → chunks → embeds into ChromaDB
Runs via cron or brain-sync.sh --quick flag

Usage:
  python3 embed-sync.py           # full sync all pending notes
  python3 embed-sync.py --quick   # only notes changed in last hour
  python3 embed-sync.py --force   # re-embed all notes (rebuild index)
"""

import os
import sys
import json
import hashlib
import argparse
import requests
from pathlib import Path
from datetime import datetime, timedelta, timezone

# ── Optional imports (fail gracefully) ────────────────────
try:
    import frontmatter
    HAS_FRONTMATTER = True
except ImportError:
    HAS_FRONTMATTER = False
    print("[WARN] python-frontmatter not installed — frontmatter parsing disabled")

try:
    import chromadb
    HAS_CHROMA = True
except ImportError:
    HAS_CHROMA = False
    print("[WARN] chromadb not installed — vector embedding disabled")

# ── Config ─────────────────────────────────────────────────
VAULT_PATH   = os.environ.get("BRAIN_VAULT_PATH",  "/opt/deo-brain/vault")
CHROMA_HOST  = os.environ.get("CHROMA_HOST",        "localhost")
CHROMA_PORT  = int(os.environ.get("CHROMA_PORT",    "8000"))
CHROMA_TOKEN = os.environ.get("CHROMA_AUTH_TOKEN",  "")
COLLECTION   = os.environ.get("CHROMA_COLLECTION",  "deo_brain")
OPENAI_KEY   = os.environ.get("OPENAI_API_KEY",     "")
EMBED_MODEL  = os.environ.get("BRAIN_EMBED_MODEL",  "text-embedding-3-small")
API_BASE     = os.environ.get("API_BASE_URL",        "http://localhost:3001")
INTERNAL_TOK = os.environ.get("INTERNAL_TOKEN",      "")
CHUNK_SIZE   = int(os.environ.get("BRAIN_CHUNK_SIZE", "500"))   # words per chunk
CHUNK_OVERLAP= int(os.environ.get("BRAIN_CHUNK_OVERLAP", "50")) # words overlap

# ── Ignore patterns ─────────────────────────────────────────
IGNORE_DIRS  = {".obsidian", ".git", ".trash", "05-archive", "_templates"}
IGNORE_FILES = {"_INDEX.md"}  # Skip index files


def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def hash_content(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()[:16]


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping word-based chunks."""
    words = text.split()
    if len(words) <= chunk_size:
        return [text] if text.strip() else []

    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def parse_note(filepath: Path) -> dict | None:
    """Parse an Obsidian markdown note."""
    try:
        content = filepath.read_text(encoding="utf-8")
    except Exception as e:
        log(f"  [SKIP] Cannot read {filepath}: {e}")
        return None

    meta = {}
    body = content

    if HAS_FRONTMATTER:
        try:
            post = frontmatter.loads(content)
            meta = dict(post.metadata)
            body = post.content
        except Exception:
            pass

    # Relative vault path
    vault_path = str(filepath.relative_to(VAULT_PATH))
    title = meta.get("title") or filepath.stem.replace("-", " ").replace("_", " ").title()

    return {
        "vault_path": vault_path,
        "title": title,
        "type": meta.get("type", "note"),
        "status": meta.get("status", "active"),
        "tags": meta.get("tags", []),
        "gdrive_path": meta.get("gdrive", ""),
        "frontmatter": meta,
        "body": body,
        "content_hash": hash_content(content),
        "word_count": len(body.split()),
    }


def get_embedding(texts: list[str]) -> list[list[float]] | None:
    """Get embeddings from OpenAI API."""
    if not OPENAI_KEY or not texts:
        return None
    try:
        resp = requests.post(
            "https://api.openai.com/v1/embeddings",
            headers={"Authorization": f"Bearer {OPENAI_KEY}"},
            json={"model": EMBED_MODEL, "input": texts},
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
        return [item["embedding"] for item in data["data"]]
    except Exception as e:
        log(f"  [WARN] Embedding API error: {e}")
        return None


def upsert_note_to_api(note: dict) -> str | None:
    """Register/update note in PostgreSQL via API."""
    try:
        payload = {
            "vault_path":   note["vault_path"],
            "title":        note["title"],
            "type":         note["type"],
            "status":       note["status"],
            "tags":         note["tags"],
            "gdrive_path":  note["gdrive_path"],
            "frontmatter":  note["frontmatter"],
            "content_hash": note["content_hash"],
            "word_count":   note["word_count"],
        }
        resp = requests.post(
            f"{API_BASE}/api/brain/notes/upsert",
            headers={
                "Authorization": f"Bearer {INTERNAL_TOK}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=10
        )
        if resp.ok:
            return resp.json().get("id")
    except Exception as e:
        log(f"  [WARN] API upsert failed for {note['vault_path']}: {e}")
    return None


def sync_to_chroma(note_id: str, note: dict, chunks: list[str], client) -> int:
    """Embed chunks and store in ChromaDB."""
    if not HAS_CHROMA or not chunks:
        return 0

    try:
        collection = client.get_or_create_collection(
            name=COLLECTION,
            metadata={"hnsw:space": "cosine"}
        )
    except Exception as e:
        log(f"  [WARN] ChromaDB collection error: {e}")
        return 0

    embeddings = get_embedding(chunks) if OPENAI_KEY else None
    synced = 0

    for i, chunk in enumerate(chunks):
        doc_id = f"{note_id}_chunk_{i}"
        meta = {
            "note_id":    note_id,
            "vault_path": note["vault_path"],
            "title":      note["title"],
            "type":       note["type"],
            "tags":       json.dumps(note["tags"]),
            "chunk_index": i,
        }
        try:
            if embeddings and i < len(embeddings):
                collection.upsert(
                    ids=[doc_id],
                    documents=[chunk],
                    embeddings=[embeddings[i]],
                    metadatas=[meta]
                )
            else:
                # ChromaDB will use its default embedding function
                collection.upsert(
                    ids=[doc_id],
                    documents=[chunk],
                    metadatas=[meta]
                )
            synced += 1
        except Exception as e:
            log(f"  [WARN] ChromaDB upsert error chunk {i}: {e}")

    return synced


def main():
    parser = argparse.ArgumentParser(description="Dẹo Brain — Embed Sync")
    parser.add_argument("--quick",  action="store_true", help="Only files modified in last hour")
    parser.add_argument("--force",  action="store_true", help="Re-embed all notes (full rebuild)")
    parser.add_argument("--dry-run", action="store_true", help="Parse only, no writes")
    args = parser.parse_args()

    vault = Path(VAULT_PATH)
    if not vault.exists():
        log(f"[ERROR] Vault not found: {VAULT_PATH}")
        sys.exit(1)

    # ── Setup ChromaDB client ──────────────────────────────
    chroma_client = None
    if HAS_CHROMA:
        try:
            chroma_client = chromadb.HttpClient(
                host=CHROMA_HOST,
                port=CHROMA_PORT,
            )
            chroma_client.heartbeat()
            log(f"ChromaDB connected at {CHROMA_HOST}:{CHROMA_PORT}")
        except Exception as e:
            log(f"[WARN] ChromaDB unavailable: {e} — skipping vector embedding")
            chroma_client = None

    # ── Find notes to process ──────────────────────────────
    cutoff = None
    if args.quick and not args.force:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=1)

    notes_found  = 0
    notes_synced = 0
    chunks_total = 0
    errors       = 0

    for md_file in sorted(vault.rglob("*.md")):
        # Skip ignored dirs/files
        parts = md_file.relative_to(vault).parts
        if any(p in IGNORE_DIRS for p in parts):
            continue
        if md_file.name in IGNORE_FILES:
            continue

        # Quick mode: only recently modified
        if cutoff:
            mtime = datetime.fromtimestamp(md_file.stat().st_mtime, tz=timezone.utc)
            if mtime < cutoff:
                continue

        notes_found += 1
        note = parse_note(md_file)
        if not note:
            errors += 1
            continue

        if note["status"] == "archived" and not args.force:
            continue

        log(f"Processing: {note['vault_path']} ({note['word_count']} words)")

        if args.dry_run:
            notes_synced += 1
            continue

        # Upsert to PostgreSQL
        note_id = upsert_note_to_api(note)
        if not note_id:
            # API not available — generate a local ID for chroma
            note_id = hash_content(note["vault_path"])

        # Chunk and embed
        chunks = chunk_text(note["body"])
        if chunks and chroma_client:
            synced = sync_to_chroma(note_id, note, chunks, chroma_client)
            chunks_total += synced

        notes_synced += 1

    # ── Summary ────────────────────────────────────────────
    mode = "DRY RUN" if args.dry_run else ("QUICK" if args.quick else "FULL")
    log(f"──────────────────────────────────────")
    log(f"Embed sync [{mode}] done:")
    log(f"  Notes found:  {notes_found}")
    log(f"  Notes synced: {notes_synced}")
    log(f"  Chunks embed: {chunks_total}")
    log(f"  Errors:       {errors}")

    if errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
