# N8N LOCAL IMPORT AND GOOGLE CREDENTIAL QUICKSTART

**Ngày:** 2026-04-05  
**Mục tiêu:** Checklist ngắn + hướng dẫn thao tác nhanh để import workflow back office vào local n8n hiện có và tạo Google credential cần thiết để bắt đầu test.

---

## 1. Checklist cực ngắn

- [ ] Mở local n8n tại `http://127.0.0.1:5678`
- [ ] Đăng nhập tài khoản n8n hiện có
- [ ] Import file `infrastructure/n8n/docs.from-template.v1.workflow.skeleton.json`
- [ ] Kiểm tra workflow xuất hiện trong editor
- [ ] Tạo Google credential cho Drive/Docs
- [ ] Gắn credential vào các node Google/HTTP cần thiết
- [ ] Điền template map thật ở node `Resolve Template ID`
- [ ] Test webhook bằng payload mẫu
- [ ] Test callback success path

---

## 2. Import workflow

### Bước 1
Mở:
- `http://127.0.0.1:5678`

### Bước 2
Login vào instance local.

### Bước 3
Vào **Workflows** → **Import from File**.

### Bước 4
Chọn file:
- `infrastructure/n8n/docs.from-template.v1.workflow.skeleton.json`

### Bước 5
Giữ tên workflow là:
- `docs.from-template.v1`

---

## 3. Tạo Google credential

## Mục tiêu
Cần ít nhất quyền cho:
- Google Drive
- Google Docs API

### Cách pragmatic cho local n8n
Dùng Google OAuth credential trong n8n nếu giao diện node hỗ trợ.

### Bước làm
1. Vào **Credentials**
2. Tạo credential Google phù hợp
3. Nếu node Google Drive và Docs dùng credential khác nhau thì tạo đủ cả hai
4. Authorize bằng account Google sẽ dùng cho workspace back office

### Lưu ý
- account này phải có quyền đọc template
- có quyền tạo/copy file ở folder đích
- có quyền set sharing nếu muốn workflow share reviewer

---

## 4. Sau khi tạo credential, cần cắm vào đâu

### Node cần gắn credential thật
- `Copy Template Document`
- `Apply Placeholder Replacements`
- các node Google Drive tìm/create folder nếu sếp thêm vào
- các node Google Drive permissions nếu bật reviewer sharing

---

## 5. Những chỗ bắt buộc sửa sau import

## A. Node `Resolve Template ID`
Thay map placeholder bằng template id thật.

### Ví dụ
```js
const map = {
  hop_dong_dich_vu_v1: '1REAL_TEMPLATE_ID_ABC',
  bao_gia_v1: '1REAL_TEMPLATE_ID_XYZ'
};
```

## B. Logic `Ensure Folder Exists`
Skeleton hiện mới là note.  
Cần thêm node Google Drive search/create folder nếu muốn chạy thật.

## C. Reviewer sharing
Skeleton mới là note.  
Nếu muốn share tự động thì thêm branch permissions.

## D. Callback URL / token
Đảm bảo backend có:
- `BACKOFFICE_CALLBACK_URL`
- `BACKOFFICE_CALLBACK_TOKEN`

---

## 6. Test khuyên dùng ngay sau import

### Test 1
Bắn payload dispatch mẫu vào backend route `/api/backoffice/docs/from-template`

### Test 2
Xem n8n có nhận webhook không

### Test 3
Chạy copy template trước, chưa cần reviewer sharing cũng được

### Test 4
Nếu workflow chưa full, dùng callback success thủ công để test backend side

---

## 7. Một câu chốt

**Quickstart này dùng để đưa local n8n từ trạng thái “đã cài và đang chạy” sang trạng thái “đã import được workflow back office đầu tiên và bắt đầu test được với Google credential thật”.**
