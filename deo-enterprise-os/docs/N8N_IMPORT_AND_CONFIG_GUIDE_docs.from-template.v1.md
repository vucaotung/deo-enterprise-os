# N8N IMPORT AND CONFIG GUIDE `docs.from-template.v1`

**Ngày:** 2026-04-05  
**Mục tiêu:** Hướng dẫn import workflow skeleton `docs.from-template.v1` vào n8n và cấu hình các node chính để bắt đầu chạy thử thật.

---

## 1. File cần import

File workflow:
- `infrastructure/n8n/docs.from-template.v1.workflow.skeleton.json`

Docs tham chiếu kèm:
- `docs/N8N_WORKFLOW_docs.from-template.v1_SPEC.md`
- `docs/N8N_NODE_BUILD_CHECKLIST_docs.from-template.v1.md`
- `docs/BACKOFFICE_TEST_PAYLOADS_V1.md`
- `docs/BACKOFFICE_N8N_WEBHOOK_CONTRACT_V1.md`

---

## 2. Import workflow vào n8n

### Bước 1
Mở n8n → **Workflows** → **Import from File**

### Bước 2
Chọn file:
- `docs.from-template.v1.workflow.skeleton.json`

### Bước 3
Đổi tên workflow nếu cần, nhưng nên giữ:
- `docs.from-template.v1`

---

## 3. Sau import sẽ thấy gì

Workflow import vào sẽ có sẵn các node khung:
- Webhook Trigger
- Guard Check
- Normalize Input
- Resolve Template ID
- Copy Template Document
- Build Replace Requests
- Apply Placeholder Replacements
- Build Success Callback Payload
- POST Success Callback
- Respond

Ngoài ra có sticky note nhắc chỗ cần cắm thêm logic thật cho:
- Ensure Folder Exists
- Optional Reviewer Sharing

---

## 4. Cấu hình từng node chính

## Node: Webhook Trigger
### Cần kiểm tra
- Method = `POST`
- Path = `backoffice/docs/from-template`
- Response mode phù hợp (workflow skeleton đang để `responseNode`)

### Sau đó
- copy webhook test URL
- copy webhook production URL khi activate workflow

---

## Node: Guard Check
### Việc cần làm
- mở code node
- xác nhận logic validate vẫn đúng với contract hiện tại
- nếu dùng Bearer auth nghiêm ngặt hơn, thêm check token tại đây

---

## Node: Normalize Input
### Việc cần làm
- kiểm tra các field map:
  - `payload.template_key`
  - `payload.template_id`
  - `payload.title`
  - `payload.data`
  - `payload.target_folder`
  - `reviewers`
  - `callback.url`
  - `callback.token`

### Lưu ý
Nếu payload backend đổi, node này là chỗ sửa đầu tiên.

---

## Node: Resolve Template ID
### Việc cần làm
- thay placeholder map bằng template thật

### Ví dụ
```js
const map = {
  hop_dong_dich_vu_v1: '1REAL_TEMPLATE_ID_ABC',
  bao_gia_v1: '1REAL_TEMPLATE_ID_XYZ'
};
```

### Lưu ý
- nếu workflow luôn nhận `template_id` thật từ backend thì có thể giảm vai trò node này
- nhưng V1 nên giữ để hỗ trợ `template_key`

---

## Node: Ensure Folder Exists
### Skeleton hiện tại mới là note
Sếp cần tự thêm các node thật ở đây.

### Cách pragmatic cho V1
- parse `target_folder.folder_path`
- tách path segments
- dùng Google Drive search node tìm từng folder
- nếu chưa có thì create folder
- trả ra:
  - `target_folder_id`
  - `target_folder_path`

### Tối thiểu phải đạt
- copy template vào đúng folder cha cuối cùng

---

## Node: Copy Template Document
### Cần cấu hình
- chọn Google Drive credential thật
- source file = `template_id`
- new name = `title`
- parent folder = `target_folder_id`

### Verify
- copy ra đúng tên
- file xuất hiện đúng folder

---

## Node: Build Replace Requests
### Việc cần làm
- giữ logic transform `data` → `replaceAllText[]`
- confirm placeholder format trong template đang là `{{key}}`

Nếu template không dùng format này, sửa node này.

---

## Node: Apply Placeholder Replacements
### Cần cấu hình
- auth tới Google Docs API
- nếu n8n không có node Docs phù hợp, giữ `HTTP Request`
- gắn credential Google OAuth/Service Account đúng

### Lưu ý
Node này phải dùng `documentId` là file vừa copy, không phải template gốc.

---

## Node: Optional Reviewer Sharing
### Skeleton hiện tại mới là note
Sếp cần thêm branch thật nếu muốn share tự động.

### Pragmatic V1
- thêm IF node: `reviewers.length > 0`
- loop từng email
- add Google Drive permission
- permission mặc định: `commenter`

---

## Node: Build Success Callback Payload
### Việc cần làm
- xác nhận payload đúng contract backend
- đảm bảo lấy đúng:
  - `file_id`
  - `file_url`
  - `folder_id`
  - `folder_path`

---

## Node: POST Success Callback
### Cần cấu hình
- URL = `callback_url`
- header:
  - `X-Backoffice-Callback-Token`
  - `X-Invocation-Id`
  - `X-Backoffice-Workflow-Key`

### Verify
- backend trả `ok: true`

---

## Node: Failure Branch
### Nên tự thêm
- branch bắt lỗi
- build fail callback payload
- POST fail callback về Work OS

V1 rất nên có branch này, không thì test lỗi khá mù.

---

## 5. Credentials cần có trong n8n

Tối thiểu:
- Google Drive credential
- Google Docs API access
- HTTP callback access ra Work OS

### Nếu dùng HTTP Request cho Docs API
cần bảo đảm credential Google có scope đủ cho:
- đọc template
- copy file
- sửa nội dung doc
- set permissions

---

## 6. Env/config cần có phía backend trước khi test

- `BACKOFFICE_N8N_WEBHOOK_URL`
- `BACKOFFICE_N8N_API_KEY` (nếu dùng)
- `BACKOFFICE_CALLBACK_URL`
- `BACKOFFICE_CALLBACK_TOKEN`

---

## 7. Trình tự test khuyên dùng

1. import workflow
2. cấu hình template map
3. cấu hình Google credential
4. test webhook bằng sample request
5. test copy template trước
6. test replace placeholders
7. test callback success
8. test failure branch

---

## 8. One-line conclusion

**Guide này là bản thao tác sau-import cho `docs.from-template.v1`: import skeleton trước, rồi lần lượt gắn template map, folder logic, Google credentials, callback headers và failure branch để biến artifact trong repo thành workflow live thật trong n8n.**
