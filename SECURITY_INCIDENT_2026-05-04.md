# Security Incident — GoClaw Gateway Token Leak

**Phát hiện:** 2026-05-04 (trong Sprint A audit)
**Mức độ:** High — production credential leak vào public-ish git history
**Trạng thái:** ⚠️ Token vẫn còn trong git history. File đã bị xóa khỏi HEAD.

---

## Sự việc

File `deo-enterprise-os/.env.local` được commit vào repo ở commit `2248ef4` (2026-04-22, "fix: convert deo-enterprise-os from submodule to regular directory").

Nội dung leak:

```
GOCLAW_GATEWAY_TOKEN=13b2146048b3e88b29fdd16764098ba2469fdcbfb71772793c37d7a0807a7442
GOCLAW_OWNER_IDS=system,tung
```

## Phạm vi

- **Branch chứa**: `main` (cả `2248ef4`), `claude/review-progress-planning-1cf9v` (kế thừa từ main)
- **Public exposure**: tuỳ visibility repo `vucaotung/deo-enterprise-os` — nếu public thì coi như compromised hoàn toàn.
- **Số commit còn giữ secret**: từ `2248ef4` đến trước commit cleanup (file đã xóa khỏi HEAD ở `b67d6b2`)

## Remediation checklist

- [x] Xóa file khỏi HEAD (commit `b67d6b2`)
- [x] Thêm `.env.local`, `.env.*.local` vào `.gitignore`
- [ ] **Rotate GoClaw gateway token trên server** (việc external — sếp làm)
- [ ] Cập nhật token mới vào `.env.local` trên Xeon Workstation và VPS
- [ ] Restart GoClaw service để áp dụng token mới
- [ ] Verify Telegram bot, Zalo OA, n8n webhook vẫn hoạt động sau rotation
- [ ] (Optional) Rewrite git history để xóa hẳn secret — yêu cầu force-push `main`, cần explicit authorization

## Chống tái diễn

- [x] `.gitignore` block `.env.local` patterns
- [ ] Setup `gitleaks` hoặc `pre-commit` hook scan secret trước khi commit (Sprint A+1)
- [ ] CI lint job: scan PR diff cho pattern token (Sprint D)
- [ ] Document rule "never commit `.env.*` except `.env.example`" trong README

## Decision: rewrite history hay không?

**Trade-off:**

| Action | Pro | Con |
|---|---|---|
| Chỉ rotate token (giữ history) | Không destructive, không break clones, lịch sử git rõ | Token cũ vẫn lộ — nếu attacker lưu token trước khi rotate có thể đã dùng |
| Rewrite history (force-push main) | Xoá hẳn secret khỏi git | Phá break mọi clone hiện có; yêu cầu mọi developer re-clone; phá tag v3.1.0 |

**Khuyến nghị:** Rotate token + giữ history. Token mới ở server invalidate token cũ → leak vô hại. Force-push main chỉ làm khi có signal cụ thể là token cũ đang bị abuse.

---

*Ghi chú: file này tracked trong git để có audit trail. Sau khi remediation xong, đánh dấu `RESOLVED` và move vào `docs/security/`.*
