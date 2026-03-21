# GOOGLE_CHEATSHEET_DEO.md

## Gmail — account chính
Account: `vucaotung@gmail.com`

### Xem mail chưa đọc
```powershell
cd C:\Users\Admin\.openclaw\workspace
.\gog.cmd gmail search "is:unread" --account vucaotung@gmail.com
```

### Xem mail chưa đọc dạng JSON
```powershell
.\gog.cmd gmail search "is:unread" --account vucaotung@gmail.com --json
```

### Tìm mail từ một người
```powershell
.\gog.cmd gmail search "from:someone@example.com" --account vucaotung@gmail.com
```

### Tìm mail mới 3 ngày
```powershell
.\gog.cmd gmail search "newer_than:3d" --account vucaotung@gmail.com
```

### Xem labels
```powershell
.\gog.cmd gmail labels list --account vucaotung@gmail.com
```

### Labels/nhóm đã tạo
- `Meta Business`
- `Promotions Bulk`
- `Finance`
- `Security`

---

## Calendar — account chính
Account: `vucaotung@gmail.com`

### Xem calendars
```powershell
.\gog.cmd calendar calendars --account vucaotung@gmail.com
```

### Xem lịch hôm nay
```powershell
.\gog.cmd calendar events --account vucaotung@gmail.com --today
```

### Xem lịch ngày mai
```powershell
.\gog.cmd calendar events --account vucaotung@gmail.com --tomorrow
```

### Tạo event
```powershell
.\gog.cmd calendar create vucaotung@gmail.com --account vucaotung@gmail.com --summary "Tên việc" --from "2026-03-22T08:00:00+07:00" --to "2026-03-22T08:15:00+07:00"
```

### Ví dụ nhắc việc có popup
```powershell
.\gog.cmd calendar create vucaotung@gmail.com --account vucaotung@gmail.com --summary "Nhắc việc" --from "2026-03-22T08:00:00+07:00" --to "2026-03-22T08:15:00+07:00" --reminder popup:10m
```

---

## Drive chính của sếp
Account: `vucaotung@gmail.com`

### Rule:
- chỉ đọc
- không tự ghi

---

## Drive phụ của Dẹo
Account: `zman8585@gmail.com`

### Rule:
- được ghi
- đây là workspace của Dẹo

### Folder gốc
- `Workspace`
- Link: <https://drive.google.com/drive/folders/16dPdbV5TAmCExHZTxW-LeVxjVmm8V-bS>

### Cấu trúc hiện tại
- `Workspace/Inbox`
- `Workspace/Projects`
- `Workspace/Exports`
- `Workspace/Temp`

---

## Drive phụ — lệnh hay dùng

### Xem file/folder
```powershell
.\gog.cmd drive ls --account zman8585@gmail.com
```

### Tạo folder
```powershell
.\gog.cmd drive mkdir "Tên folder" --account zman8585@gmail.com
```

### Upload file
```powershell
.\gog.cmd drive upload "tenfile.txt" --account zman8585@gmail.com --parent FOLDER_ID
```

### Tìm file
```powershell
.\gog.cmd drive search "keyword" --account zman8585@gmail.com
```

### Xem metadata file
```powershell
.\gog.cmd drive get FILE_ID --account zman8585@gmail.com
```

---

## Luật vận hành của Dẹo

### Được làm:
- Gmail + Calendar trên `vucaotung@gmail.com`
- Drive ghi trên `zman8585@gmail.com`

### Không tự ý làm:
- ghi vào Drive chính của sếp
- xoá bừa file
- gửi email thay mặt sếp nếu chưa chốt nội dung/quyền

---

## Các kiểu câu lệnh sếp có thể sai
- Xem mail chưa đọc
- Tóm tắt mail tài chính hôm nay
- Tạo lịch 3h chiều mai họp
- Quăng file này vào Workspace/Inbox
- Tìm trong Drive file hợp đồng
- Lấy mấy mail Microsoft bảo mật
- Lập sổ chi tiêu hôm nay

---

## Tóm tắt hệ Google hiện tại
- Gmail thật: `vucaotung@gmail.com`
- Calendar thật: `vucaotung@gmail.com`
- Drive chính: `vucaotung@gmail.com` → đọc
- Drive làm việc: `zman8585@gmail.com` → ghi
