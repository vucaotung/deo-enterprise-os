# GOOGLE DRIVE FOLDER AND NAMING STANDARD V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Chốt riêng chuẩn cấu trúc folder và naming convention cho nhánh tài liệu/back office trên Google Drive, theo hướng dễ dùng cho người thật, đủ sạch cho hệ thống, và đồng bộ với workflow-first architecture.

---

## 1. Nguyên tắc tổng quát

Chuẩn này ưu tiên đồng thời 3 thứ:
1. **dễ nhìn với user nội bộ**
2. **dễ sort / dễ quản lý trên Drive**
3. **dễ parse / trace trong hệ thống**

### Quyết định chính
- dùng **tiếng Việt không dấu**
- dùng **space** trong phần tên hiển thị
- giữ **prefix số** ở đầu folder để ổn định thứ tự
- dùng `_` để phân tách các block lớn trong tên file/folder khi cần
- không dùng ký tự đặc biệt rác

---

## 2. Chuẩn folder name

## Công thức
```text
<prefix_thu_tu>_<ten ngan khong dau>
```

### Quy tắc chi tiết
- `prefix_thu_tu` là số 2 chữ số: `00`, `01`, `02`, ...
- sau prefix có đúng **1 dấu `_`**
- phần tên phía sau dùng **space**
- toàn bộ dùng chữ thường, không dấu
- tránh tên quá dài

### Ví dụ đúng
- `00_dieu hanh`
- `01_templates`
- `02_ho so theo mau`
- `03_ho so theo yeu cau`
- `04_du an`
- `05_khach hang`
- `09_luu tru`

### Ví dụ không nên
- `02_ho_so_theo_mau`
- `Ho so theo mau`
- `03_HO SO THEO YEU CAU`
- `folder moi!!!`

---

## 3. Root folder đề xuất

```text
Deo Workspace/
  00_dieu hanh
  01_templates
  02_ho so theo mau
  03_ho so theo yeu cau
  04_du an
  05_khach hang
  06_tai chinh
  07_bao cao
  08_luu tam
  09_luu tru
```

---

## 4. Chuẩn folder theo domain

## Templates
```text
01_templates/
  docs/
    hop dong/
    bao gia/
    cong van/
    bien ban/
    de xuat/
  sheets/
    theo doi tien do/
    tong hop chi phi/
    bao cao tuan/
```

## Hồ sơ theo mẫu
```text
02_ho so theo mau/
  2026/
    hop dong/
    bao gia/
    cong van/
    bien ban/
    bao cao/
```

## Hồ sơ theo yêu cầu
```text
03_ho so theo yeu cau/
  2026/
    de xuat/
    ghi nho/
    ke hoach/
    bien ban hop/
    tai lieu tong hop/
    bang theo doi/
```

## Dự án
```text
04_du an/
  du an <ma hoac ten ngan>/
    01_tai lieu chung/
    02_hop dong bao gia/
    03_ke hoach tien do/
    04_bien ban ghi nho/
    05_file ban giao/
    99_luu tru/
```

## Khách hàng
```text
05_khach hang/
  <ten khach hang slug>/
    01_thong tin chung/
    02_hop dong bao gia/
    03_tai lieu trao doi/
    99_luu tru/
```

---

## 5. Chuẩn file name

## Công thức
```text
<yyyy.mm.dd>_<loai tai lieu>_<doi tuong chinh>_<mo ta ngan>_<trang thai or version>
```

### Quy tắc chi tiết
- dùng ngày theo format `yyyy.mm.dd`
- giữa các block dùng `_`
- bên trong block dùng **space**
- dùng tiếng Việt không dấu
- phần mô tả ngắn giữ gọn, không lan man
- luôn có block trạng thái hoặc version ở cuối

### Ví dụ đúng
- `2026.04.05_hop dong_cong ty abc_ban nhap_v1`
- `2026.04.05_bao gia_khach hang xyz_goi dich vu_v2`
- `2026.04.05_de xuat_he thong quan tri_draft_v1`
- `2026.04.05_bien ban hop_du an delta_final_v1`
- `2026.04.05_bang theo doi_du an delta_v1`

### Ví dụ không nên
- `Hop dong moi final final.doc`
- `2026-04-05_hop_dong_abc`
- `tai lieu soan thu`
- `FINAL_DE_XUAT_ABC`

---

## 6. Block từ vựng nên chuẩn hóa

### Loại tài liệu
- `hop dong`
- `bao gia`
- `cong van`
- `bien ban`
- `bien ban hop`
- `de xuat`
- `ghi nho`
- `ke hoach`
- `bao cao`
- `bang theo doi`

### Trạng thái
- `draft`
- `review`
- `final`
- `signed`
- `archived`

### Version
- `v1`
- `v2`
- `v3`

---

## 7. Cách chuẩn hóa tên đối tượng chính

### Công ty / khách hàng
- `Công ty TNHH Ánh Dương` → `cong ty anh duong`

### Dự án
- `Dự án CRM nội bộ` → `du an crm noi bo`

### Hồ sơ
- `Biên bản họp tuần 1` → `bien ban hop tuan 1`

### Quy tắc
- bỏ dấu
- bỏ ký tự đặc biệt
- rút gọn vừa đủ
- không nhồi quá nhiều thông tin vào tên

---

## 8. Metadata cần lưu ngoài tên file

Không dồn hết ý nghĩa vào tên file/folder.

### Hệ thống nên lưu thêm
- `file_id`
- `url`
- `document_type`
- `generation_mode`
- `source_thread_id`
- `linked_project_id`
- `linked_task_id`
- `owner_user_id`
- `reviewers`
- `status`
- `version`
- `folder_id`
- `folder_path`

---

## 9. Cách dùng chuẩn này trong workflow

### `drive.resolve-folder.v1`
Dùng chuẩn folder tree để xác định nơi đặt file.

### `docs.from-template.v1` / `docs.materialize.v1`
Dùng chuẩn file name để đặt tên file khi materialize.

### `drive.archive-file.v1`
Dùng chuẩn archive path để chuyển file cũ vào đúng nơi.

### `drive.ensure-folder-tree.v1`
Tạo folder nếu cây chuẩn chưa tồn tại.

---

## 10. Rule ưu tiên khi có xung đột tên

Nếu tên file trùng:
1. ưu tiên tăng version (`v2`, `v3`, ...)
2. không thêm từ vô nghĩa kiểu `final final`
3. nếu là draft song song, có thể thêm block ngắn mô tả reviewer/nhánh xử lý trong metadata, không ưu tiên đưa hết vào tên file

---

## 11. Rule cho file tạo từ chat/context

Với file sinh từ chat:
- vẫn theo cùng chuẩn file name
- nhưng `document_type` và `mo ta ngan` phải phản ánh đúng mục đích thực tế
- nếu chưa chốt nội dung, nên để trạng thái `draft`

### Ví dụ
- `2026.04.05_de xuat_du an crm noi bo_draft_v1`
- `2026.04.05_bien ban hop_nhom van hanh_review_v1`

---

## 12. One-line conclusion

**GOOGLE_DRIVE_FOLDER_AND_NAMING_STANDARD_V1 chốt chuẩn đặt tên và tổ chức thư mục cho nhánh back office: prefix số để giữ thứ tự, tiếng Việt không dấu để dễ dùng, space trong phần tên để thân thiện với user, và block-based file naming để hệ thống vẫn trace/quản lý tốt khi scale.**
