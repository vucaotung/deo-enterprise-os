# RELEASE PROCESS

**Mục đích:** Chuẩn hóa cách Dẹo Enterprise OS được cập nhật, version, tag, và ghi nhận thay đổi từ thời điểm bắt đầu có GitHub repo chính thức.

---

## 1. Nguyên tắc chung

1. Mọi thay đổi quan trọng phải đi qua Git.
2. Mọi hotfix production phải có changelog.
3. Mỗi version phải có tag Git tương ứng.
4. Nếu production khác repo, phải cập nhật `docs/PRODUCTION_DRIFT.md`.
5. Không coi production là “nguồn nhớ duy nhất”. Repo phải phản ánh được trạng thái đủ quan trọng để tái tạo và audit.

---

## 2. Cấu trúc file điều hành release

Các file chính:
- `CHANGELOG.md` — lịch sử thay đổi theo version
- `VERSION.md` — version hiện tại + target tiếp theo
- `KNOWN_ISSUES.md` — các lỗi/hở đang sống
- `ROADMAP_NEXT.md` — thứ tự việc tiếp theo
- `docs/PRODUCTION_DRIFT.md` — lệch giữa repo và production
- `docs/RELEASE_PROCESS.md` — quy trình này

---

## 3. Quy tắc bump version

Giai đoạn hiện tại là **pre-1.0**, nên dùng semantic version nhẹ:

### Patch bump (`v0.x.Z`)
Dùng khi:
- hotfix production
- fix auth/frontend/runtime
- fix webhook/bot wiring
- update docs quan trọng đi kèm trạng thái vận hành

Ví dụ:
- `v0.2.1` → `v0.2.2`
- `v0.2.2` → `v0.2.3`

### Minor bump (`v0.Y.0`)
Dùng khi:
- chốt một milestone kỹ thuật đáng kể
- đồng bộ một lớp contract lớn
- thêm capability mới tương đối hoàn chỉnh
- giảm một khối nợ kỹ thuật lớn

Ví dụ:
- `v0.2.3` → `v0.3.0` khi dọn xong auth/task/dashboard/agent-jobs contract

### Major bump (`v1.0.0`)
Chỉ dùng khi:
- source-of-truth đã sạch
- release process đã ổn
- production stack đủ tin cậy
- contract chính ổn định
- team có thể dựa vào version để phát triển tiếp mà không phải đoán

---

## 4. Khi nào phải cập nhật CHANGELOG

Bắt buộc cập nhật `CHANGELOG.md` khi có một trong các trường hợp:
- deploy production thay đổi hành vi thực tế
- hotfix bug user-facing
- thay đổi auth/task/dashboard contract
- thêm route/API mới có dùng thật
- thay đổi cách agent runtime hoạt động
- thêm hoặc bỏ workaround production

Không bắt buộc bump version ngay nếu chỉ sửa typo/docs nhỏ, nhưng nếu docs đó ảnh hưởng vận hành thì vẫn nên có entry.

---

## 5. Khi nào phải cập nhật PRODUCTION_DRIFT

Cập nhật `docs/PRODUCTION_DRIFT.md` khi:
- production được hotfix trực tiếp nhưng repo chưa sync ngay
- agent runtime local có patch ngoài repo
- VPS đang chạy logic khác repo
- có workaround mới chưa được hợp thức hóa

Nếu đã sync production sạch vào repo, phải giảm/bỏ drift tương ứng trong file này.

---

## 6. Quy trình release chuẩn

### Bước 1 — Chốt thay đổi
- xác định thay đổi thuộc patch hay minor
- rà xem có đụng production behavior không

### Bước 2 — Cập nhật tài liệu điều hành
Tùy thay đổi, cập nhật:
- `CHANGELOG.md`
- `VERSION.md`
- `KNOWN_ISSUES.md`
- `ROADMAP_NEXT.md`
- `docs/PRODUCTION_DRIFT.md`

### Bước 3 — Commit theo ý nghĩa rõ ràng
Ví dụ:
- `fix: align dashboard auth flow`
- `fix: bridge agent admin to production tasks api`
- `docs: add production drift audit`
- `docs: update changelog for v0.2.4`

### Bước 4 — Push branch chính
- push `main`
- verify repo sạch

### Bước 5 — Tạo tag version
Ví dụ:
```bash
git tag -a v0.2.4 -m "v0.2.4 - short summary"
git push origin v0.2.4
```

### Bước 6 — Ghi chú release ngắn
Ghi rõ:
- version
- mục tiêu của version
- điểm đã fix
- known issue còn lại

---

## 7. Mẫu format commit message

### Code / bugfix
- `fix: correct dashboard summary response shape`
- `fix: align agent admin with production api`
- `fix: stabilize telegram webhook task flow`

### Docs / release management
- `docs: add next roadmap for v0.3.0`
- `docs: add production drift audit`
- `docs: update changelog for v0.2.4`

### Baseline / setup
- `chore: bootstrap production-aligned baseline`
- `chore: initialize github release management files`

---

## 8. Mẫu format release note nội bộ

```text
Version: v0.2.4
Name: <release name>

Highlights:
- ...
- ...
- ...

Known issues:
- ...
- ...
```

---

## 9. Quy tắc riêng cho hotfix production

Nếu có hotfix trực tiếp trên production:
1. Ghi lại thay đổi
2. Cập nhật `CHANGELOG.md`
3. Cập nhật `docs/PRODUCTION_DRIFT.md` nếu repo chưa sync kịp
4. Tạo issue/roadmap action để kéo patch về repo
5. Không để patch production “sống mồ côi” quá lâu

---

## 10. Quy tắc riêng cho agent runtime patches

Nếu vá ở:
- OpenClaw workspace
- agent prompt/rules
- local agent scripts

thì phải làm ít nhất 1 trong 2:
1. kéo logic quan trọng vào repo chính
2. hoặc tài liệu hóa rõ trong docs

Mục tiêu là tránh tình trạng:
- bot chạy được trên máy hiện tại
- nhưng người khác hoặc lần deploy sau không biết vì sao nó chạy

---

## 11. Definition of Done cho một release nhỏ

Một release nhỏ được coi là xong khi:
- code/Docs đã commit
- đã push lên GitHub
- changelog đã cập nhật
- version/tag đã tạo nếu là mốc version
- nếu có drift, đã ghi vào `PRODUCTION_DRIFT.md`
- người đọc mới có thể hiểu được thay đổi chính mà không cần đọc lại toàn bộ chat log

---

## 12. Một câu chốt

**Từ mốc này trở đi, Dẹo Enterprise OS không còn được phát triển kiểu “sửa xong rồi để đó”; mọi thay đổi quan trọng phải đi qua repo, changelog, version, và nếu có lệch production thì phải được ghi lại rõ ràng.**
