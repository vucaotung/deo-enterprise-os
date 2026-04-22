---
name: van-phong
description: >
  Tạo, sửa, chuyển đổi file văn phòng (Word, Excel, PowerPoint, PDF). Có sẵn tiêu chuẩn trình bày
  cho văn bản ngắn, văn bản dài, văn bản hành chính NĐ 30, kèm bộ phối màu chuyên nghiệp.
  Kích hoạt khi user đề cập 'soạn công văn', 'tạo file word', 'làm slide', 'tạo bảng tính',
  'cắt file pdf', 'chuyển sang word', 'làm đề xuất', 'bắt chước format file này',
  'tạo báo cáo', 'gộp file', 'tách trang', 'đổi sang pdf', 'format cho đẹp';
  hoặc khi user gửi file Word/Excel/PDF/Slide kèm yêu cầu chỉnh sửa.
---

# Skill: Xử lý Văn phòng

> Agent đọc skill này trước khi tạo bất kỳ file văn phòng nào.
> Không tự chọn font, margin, màu sắc — phải tuân theo standards dưới đây.

---

## Architecture: Composable 4 Tầng

```
Output = Structure × Color (optional)
```

Mặc định mọi văn bản xuất ra đen trắng. Gắn thêm bộ màu khi user cần trình bày đẹp.

---

## Tầng 1 — Kỹ thuật (`resources/`)

### DOCX — python-docx / docx-js / XML

**Khổ giấy (A4 chuẩn):**
```python
PAGE_WIDTH    = 11906   # EMU (21cm)
CONTENT_WIDTH =  9071   # EMU sau khi trừ margin
MARGIN_LEFT   =  1701   # EMU = 3cm (lề trái văn bản doanh nghiệp)
MARGIN_RIGHT  =  1134   # EMU = 2cm
MARGIN_TOP    =  1134   # EMU = 2cm
MARGIN_BOTTOM =  1134   # EMU = 2cm
```

**Hai tình huống chính:**
| Tình huống | Dùng |
|---|---|
| Tạo DOCX từ đầu | `python-docx` (Python) hoặc `docx-js` (Node.js cho complex layout) |
| Giữ format file mẫu | Unpack XML → sửa `<w:t>` → Pack (không dùng python-docx) |

**Quy tắc XML (khi Unpack):**
- `<w:rPr>` — định dạng. **KHÔNG ĐỤNG CHẠM.**
- `<w:t>` — văn bản thô. Chỉ thay nội dung ở đây.

### XLSX — openpyxl

**Nguyên tắc cứng:**
1. **Live Formula:** Mọi ô tính toán PHẢI dùng công thức. Không hardcode kết quả.
2. **Zero Error Policy:** Không để lại `#REF!`, `#DIV/0!`, `#VALUE!` trong file cuối.
3. **Column width:** Tối thiểu 10, header ≥ 15, content ≥ 20 (đơn vị openpyxl).

**Naming convention multi-sheet:**
- `DATA` — raw data input
- `CALC` — calculation layer
- `REPORT` / `SUMMARY` — output dành cho đọc

### PPTX — pptxgenjs (Node.js)

```bash
npm install -g pptxgenjs
```

**Nguyên tắc thiết kế:**
- Mỗi slide ≥ 1 yếu tố thị giác (image, chart, icon, shape)
- KHÔNG dùng accent line dưới title (dấu hiệu AI tạo)
- Font: không dùng Arial default
  - Georgia / Calibri (formal)
  - Arial Black / Arial (bold modern)
  - Cambria / Calibri (corporate)
- Cỡ chữ: Title 36-44pt, Section 20-24pt, Body 14-16pt, Caption 10-12pt

### PDF — Local only (không upload cloud)

```python
# pip install pypdf pdfplumber pdf2docx
import pypdf        # ghép, tách, xoay, encrypt
import pdfplumber   # trích text và bảng (tốt hơn pypdf)
from pdf2docx import Converter  # PDF digital → DOCX
```

| Loại | Nhận dạng | Xử lý |
|---|---|---|
| PDF digital | Có thể select text | pypdf / pdf2docx |
| PDF scan | Không select được | AI Vision → tái tạo cấu trúc |

### Chuyển đổi

```bash
# MD → DOCX
python scripts/convert/convert_md_to_docx.py input.md output.docx
python scripts/format/format_docx.py output.docx  # post-process

# PDF digital → DOCX
python scripts/convert/convert_pdf_to_docx.py input.pdf output.docx

# DOCX/PPTX → PDF (LibreOffice headless)
python scripts/office/soffice.py --headless --convert-to pdf input.docx
```

---

## Tầng 2 — Cấu trúc (`standards/structure/`)

### Khổ giấy & Lề theo loại văn bản

| Loại | Lề trái | Lề phải | Lề trên | Lề dưới | Line spacing |
|---|---|---|---|---|---|
| NĐ 30 (hành chính) | 3.0 cm | 2.0 cm | 2.0 cm | 2.0 cm | 1.3–1.5 |
| Văn bản ngắn (<10 trang) | 3.0 cm | 2.0 cm | 2.5 cm | 2.5 cm | 1.3–1.5 |
| Văn bản dài (>10 trang) | 3.5 cm | 2.0 cm | 2.5 cm | 2.5 cm | 1.3–1.5 |

### Typography mặc định (đen trắng)

| Loại VB | Font | Heading | Body | Caption |
|---|---|---|---|---|
| Hành chính NĐ 30 | Times New Roman | 13-14pt Bold | 13-14pt Regular | 11pt |
| Doanh nghiệp ngắn | Calibri | 16-18pt Bold | 11-12pt Regular | 9-10pt |
| Kỹ thuật dài | Calibri (heading) / Calibri (body) | 16pt Bold | 11pt Regular | 9pt |

### Hệ thống Heading

**Văn bản ngắn (5 cấp):**
```
Điều/Phần X. TÊN (L1)     — Bold, uppercase, 14pt
X.1. Tên mục (L2)          — Bold, 13pt
X.1.1. Tên tiểu mục (L3)   — Bold italic, 12pt
a) Tên (L4)                — Regular, 12pt
- Tên (L5)                 — Regular, bullet
```

**Văn bản dài (9 cấp)** — xem `standards/structure/docx-heading-numbering.md`

### Bảng — 5 mẫu chuẩn

| Mẫu | Dùng cho |
|---|---|
| Lộ trình | Timeline, milestone, gantt đơn giản |
| Traffic light | Status, RAG rating |
| Zebra | Dữ liệu dài, dễ đọc theo dòng |
| Matrix | So sánh nhiều chiều |
| Số liệu | Financial, metrics, bảng số |

---

## Tầng 2 — Phối màu (`standards/color/`)

### Bộ màu DOCX

#### Formal Navy — Trang trọng, cấp chiến lược
```python
NAVY_DARK    = "1B2A4A"   # Header, cover title
NAVY_MID     = "2E4070"   # H1, section title
NAVY_LIGHT   = "4A6FA5"   # H2, accent
GOLD_ACCENT  = "C4952A"   # Highlight, CTA
GRAY_TEXT    = "4A4A4A"   # Body text
TABLE_HEADER = "1B2A4A"   # Table header bg, text white
TABLE_ALT    = "EBF0F8"   # Zebra row
```

#### Modern Blue — Hiện đại, startup/SME
```python
BLUE_PRIMARY = "2196F3"
BLUE_DARK    = "1565C0"
BLUE_LIGHT   = "BBDEFB"
ACCENT_TEAL  = "00BCD4"
GRAY_BODY    = "424242"
TABLE_HEADER = "1565C0"
TABLE_ALT    = "E3F2FD"
```

#### Editorial Burgundy — Review, phản biện
```python
BURGUNDY     = "6D1E3B"
BURGUNDY_MID = "9B2752"
ROSE_LIGHT   = "F5D5E0"
GOLD         = "B8860B"
GRAY_BODY    = "3D3D3D"
TABLE_HEADER = "6D1E3B"
TABLE_ALT    = "FDF0F4"
```

#### Technical Multicolor — Kỹ thuật dài, heading phân cấp
```python
# Heading level → màu riêng biệt
H1_COLOR = "1A237E"  # Indigo
H2_COLOR = "1B5E20"  # Green
H3_COLOR = "B71C1C"  # Red
H4_COLOR = "4A148C"  # Purple
CODE_BG  = "F5F5F5"
CODE_FG  = "212121"
```

### Bộ màu XLSX

#### Professional Dark (X1)
```python
HEADER_BG   = "1F2D3D"   # Dark navy
HEADER_FG   = "FFFFFF"
ALT_ROW_BG  = "F7F9FC"
TOTAL_BG    = "2D4A6B"
TOTAL_FG    = "FFFFFF"
ACCENT      = "E8A020"
```

#### Corporate Green (X2)
```python
HEADER_BG   = "1B4332"
HEADER_FG   = "FFFFFF"
ALT_ROW_BG  = "F0FAF5"
TOTAL_BG    = "2D6A4F"
TOTAL_FG    = "FFFFFF"
ACCENT      = "40916C"
```

#### Blue Corporate (X3)
```python
HEADER_BG   = "003566"
HEADER_FG   = "FFFFFF"
ALT_ROW_BG  = "EBF5FB"
TOTAL_BG    = "005A9E"
TOTAL_FG    = "FFFFFF"
ACCENT      = "0096C7"
```

#### Traffic Light (dùng trong mọi bộ)
```python
GREEN  = "D9EAD3"   # On track
YELLOW = "FFF2CC"   # At risk
RED    = "FCE4D6"   # Overdue / Critical
```

---

## Tầng 2 — NĐ 30/2020/NĐ-CP

> Văn bản hành chính Việt Nam. Đây là quy chuẩn quốc gia — không tự ý điều chỉnh.

**Khổ giấy & lề:**
- A4 (210×297mm), lề trái 30mm, phải 20mm, trên 20mm, dưới 20mm

**Font:** Times New Roman, Unicode TCVN 6909:2001, màu đen

**Header 2 cột:**
- Cột trái (cơ quan): 6.0 cm, character scale 90-95%
- Cột phải (quốc hiệu): 10.0 cm, character scale 90-95%

**Cỡ chữ theo thành phần:**
| Thành phần | Cỡ | Kiểu |
|---|---|---|
| Tên CQ chủ quản | 12-13pt | IN HOA, đứng |
| Tên CQ ban hành | 12-13pt | IN HOA, đậm, gạch dưới |
| Quốc hiệu | 12-13pt | IN HOA, đậm |
| Tiêu ngữ | 13-14pt | Thường, đậm, kẻ dưới |
| Số ký hiệu | 13pt | Thường |
| Địa danh, ngày | 13-14pt | Thường, nghiêng |
| Tên loại VB | 13-14pt | IN HOA, đậm |
| Trích yếu | 13-14pt | Thường, đậm |
| Nội dung | 13-14pt | Thường, justify |
| Chức vụ người ký | 13-14pt | IN HOA, đậm |
| Họ tên người ký | 13-14pt | Thường, đậm |
| Nơi nhận | 11pt | Thường, "Nơi nhận:" nghiêng đậm |

**9 loại văn bản NĐ 30 có template:**
- Công văn, Quyết định, Tờ trình, Biên bản, Báo cáo
- Thông báo, Kế hoạch, Giấy mời / Ủy quyền, Đề xuất / Siêu đề xuất

---

## Tầng 3 — Scripts (đường dẫn khi deployed)

```bash
# Unpack/Pack XML
python scripts/office/unpack.py input.docx unpacked/
python scripts/office/pack.py unpacked/ output.docx

# Clone text từ file mẫu
python scripts/office/clone_text.py unpacked/word/document.xml --map mapping.json
# mapping.json: { "Chữ Cũ": "Chữ Mới" }

# Validate XML
python scripts/office/validate.py output.docx

# Convert
python scripts/office/soffice.py --headless --convert-to pdf output.docx
python scripts/convert/convert_md_to_docx.py in.md out.docx
python scripts/convert/convert_pdf_to_docx.py in.pdf out.docx
python scripts/format/format_docx.py out.docx  # post-process sau Pandoc
```

---

## Bảng composable — Chọn format theo tình huống

| Tình huống | Structure | Color | Kỹ thuật |
|---|---|---|---|
| Công văn NĐ 30 | NĐ 30 | Không (đen trắng) | python-docx |
| Quyết định, tờ trình, biên bản | NĐ 30 | Không | python-docx |
| Đề xuất chiến lược | page-setup + heading + table + cover | Formal Navy | python-docx |
| Đề xuất startup/SME | page-setup + heading + table | Modern Blue | python-docx |
| Review, phản biện | page-setup + heading | Editorial Burgundy | python-docx |
| Thuyết minh kỹ thuật dài | page-setup + heading 9 cấp + caption | Technical Multicolor | python-docx |
| Báo cáo nội bộ nhanh | page-setup + heading + table | Không (đen trắng) | python-docx |
| Giữ format file mẫu | — | — | Unpack/Pack XML |
| Bảng tính tracking | xlsx-structure | Corporate Green | openpyxl |
| Bảng tính tài chính | xlsx-structure | Professional Dark | openpyxl |
| Slide pitch deck | pptx-structure | Chọn từ 10 palettes | pptxgenjs |
| PDF digital → DOCX | Phân tích gốc | — | convert.py |
| PDF scan → DOCX | AI Vision rebuild | Map sang palette gần nhất | Vision + python-docx |

---

## QA Checklist (bắt buộc trước khi giao file)

### DOCX
- [ ] Mở không lỗi, không placeholder text còn sót
- [ ] Font, cỡ chữ đúng theo standards đã chọn
- [ ] Heading hierarchy nhất quán
- [ ] Bảng không bị vỡ layout
- [ ] Convert sang PDF xem preview không bị lỗi

### XLSX
- [ ] Tất cả ô tính toán dùng công thức (không hardcode)
- [ ] Không có lỗi `#REF!`, `#DIV/0!`, `#VALUE!`
- [ ] Column width đủ rộng để đọc
- [ ] Scroll xuống cuối dữ liệu — công thức vẫn đúng

### PPTX
- [ ] Mỗi slide có ít nhất 1 visual element
- [ ] Không có text overflow hoặc overlap
- [ ] Không có placeholder chưa thay
- [ ] Convert sang PDF để kiểm tra layout

### PDF
- [ ] File mở được, không corrupted
- [ ] Trang đúng thứ tự (khi ghép/tách)
- [ ] Text trích ra đọc được (nếu là thao tác extract)

---

*Skill version: 1.0 — Dựa trên xu-ly-van-phong Release 20260421*
*Tác giả: Nguyễn Duy Tùng | 0904.004.920*
