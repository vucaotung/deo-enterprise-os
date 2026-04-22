# TELEGRAM GROUP TO PROJECT TASK MAPPING

**Ngày:** 2026-04-05  
**Mục tiêu:** Chốt cách map group Telegram sang `project`, `task`, `clarification`, `notebook` trong Work OS để group chat tự nhiên có thể trở thành nơi khởi phát workflow nhưng không bị loạn object model.

---

## 1. Tư duy lõi

Không phải group nào cũng tương đương một project.

### Quy tắc đúng
- **Group chat là work thread / discussion container**
- từ group đó có thể:
  - map sang một project
  - gắn với nhiều task
  - sinh clarifications
  - tạo notebooks/decision notes

### Một câu chốt
> **Group Telegram là nơi phát sinh và giữ ngữ cảnh; project/task là các object có cấu trúc được tạo ra từ ngữ cảnh đó.**

---

## 2. Những kiểu group phổ biến

## A. New Job / New Project Group
Ví dụ:
- `Job ABC - Proposal`
- `Dự án X - Kickoff`

### Đặc điểm
- nhóm được tạo riêng cho một cơ hội/dự án mới
- có brief, deadline, discussion tập trung

### Mapping chuẩn
- group có thể map **1 primary project**

---

## B. Ongoing Project Group
Ví dụ:
- `Project EOS Core`
- `Team triển khai CRM`

### Đặc điểm
- bàn nhiều task phát sinh quanh một project đang chạy

### Mapping chuẩn
- group map trực tiếp **1 primary project đang active**
- có thể sinh nhiều task/clarification/notebook liên quan project đó

---

## C. Functional / Team Group
Ví dụ:
- `Team Finance`
- `CRM Ops`
- `Research Squad`

### Đặc điểm
- không chỉ phục vụ một project
- bàn nhiều việc khác nhau

### Mapping chuẩn
- group **không có 1 primary project cố định**
- có thể spawn nhiều project/task references theo từng thread/chủ đề con

---

## D. Incident / Issue Group
Ví dụ:
- `Bug website khách A`
- `Xử lý sự cố server`

### Đặc điểm
- mục tiêu tập trung vào một vấn đề cụ thể
- thường cần action nhanh, follow-up rõ

### Mapping chuẩn
- có thể map primary object là:
  - `task`
  - hoặc `incident-like thread`
- về sau có thể attach vào project nếu cần

---

## 3. Mapping levels

## Level 1 — Group level
Group có metadata/workspace mode riêng.

## Level 2 — Thread/subject level
Trong cùng một group có thể có nhiều chủ đề làm việc khác nhau.

## Level 3 — Object level
Từ group/thread có thể tạo ra:
- project
- task
- clarification
- notebook

---

## 4. Group-level schema đề xuất

```ts
interface GroupWorkMapping {
  group_id: string;
  channel: 'telegram';
  title: string;

  group_type: 'new_job' | 'project_group' | 'team_group' | 'incident_group' | 'general';
  workspace_id?: string;
  team_id?: string;

  primary_project_id?: string;
  allow_multi_project_context: boolean;

  default_mode: 'mention_only' | 'suggest_only' | 'assisted_execution' | 'high_automation';
  allowed_specialists: string[];

  created_at: string;
  updated_at: string;
}
```

---

## 5. Khi nào nên tạo project từ group chat

## Nên tạo project khi
- nhóm đang bàn một job/dự án có objective rõ
- đã có enough context như:
  - tên job / tên khách / tên initiative
  - outcome mong muốn
  - deadline hoặc timeframe sơ bộ
- discussion không còn là chat ngẫu hứng nữa mà đã thành effort có cấu trúc

### Trigger ví dụ
- `@Dẹo tạo project cho job này`
- `@Dẹo biến group này thành project`
- group có brief + deadline + clear deliverable

---

## 6. Khi nào KHÔNG nên tạo project

- chỉ mới trao đổi ý tưởng sơ bộ
- chỉ hỏi đáp ngắn
- issue quá nhỏ, chỉ cần 1 task
- nhóm là team group chung, không gắn vào một project đơn lẻ

### Khi đó nên làm gì
- giữ thread ở mức discussion container
- nếu cần thì tạo task hoặc note thôi

---

## 7. Khi nào nên tạo task từ group chat

## Nên tạo task khi
- có đầu việc cụ thể
- có owner hoặc có thể assign
- có expected outcome rõ
- có thể theo dõi độc lập khỏi message gốc

### Trigger ví dụ
- `@Dẹo tạo task follow-up khách này`
- `@Dẹo giao research phần này`
- `@Dẹo note lại 3 việc cần làm`

### Task có thể gắn vào
- project hiện tại của group
- project được mention gần nhất
- hoặc để `project_id = null` nếu chưa có project

---

## 8. Khi nào nên mở clarification

## Nên tạo clarification khi
- nhóm đang kẹt vì điểm mơ hồ
- có câu hỏi cần hỏi lại khách/đối tác/nội bộ
- chưa đủ dữ liệu để tách task hoặc chốt scope

### Trigger ví dụ
- `@Dẹo chỗ nào còn mơ hồ?`
- `@Dẹo mở clarification cho điểm này`
- discussion lặp đi lặp lại vì thiếu dữ kiện

### Mapping
Clarification nên link tới:
- task nếu ambiguity gắn với task cụ thể
- project nếu ambiguity ở cấp tổng thể
- group/thread origin để trace ngược lại source discussion

---

## 9. Khi nào nên tạo notebook / decision note

## Nên tạo note khi
- vừa chốt một quyết định quan trọng
- có brief/summary đáng lưu lâu dài
- có research/result cần tái sử dụng

### Trigger ví dụ
- `@Dẹo lưu phần chốt này vào note`
- `@Dẹo tạo decision note`
- `@Dẹo gom brief này thành notebook entry`

### Mapping
Notebook entry nên gắn được với:
- project
- task (nếu có)
- group/thread source
- related files

---

## 10. Mapping rules theo loại group

## A. New Job Group
### Mặc định
- chưa có project lúc đầu
- có thể tạo `project` sớm khi đủ brief

### Sau khi project được tạo
- group.primary_project_id = new project
- task/clarification/note mới ưu tiên attach vào project đó

---

## B. Project Group
### Mặc định
- group.primary_project_id đã tồn tại
- mọi task/clarification/note mặc định gắn vào project này trừ khi user chỉ định khác

---

## C. Team Group
### Mặc định
- không auto-gắn vào một project duy nhất
- cần explicit mention hoặc context inference nhẹ

### Best practice
Dùng group chung để thảo luận, nhưng object writes phải gắn rõ project/task nào.

---

## D. Incident Group
### Mặc định
- có thể tạo `task` hoặc `incident thread state` đầu tiên
- chỉ tạo project nếu issue phát triển thành effort lớn hơn

---

## 11. Mapping heuristic cho V1

Nếu build V1 thực dụng, có thể dùng heuristic này:

### Rule 1
Nếu group type = `project_group` và có `primary_project_id`
→ task/clarification/note mặc định attach vào project đó.

### Rule 2
Nếu group type = `new_job` và chưa có project
→ main coordinator gợi ý tạo project khi đủ brief + objective.

### Rule 3
Nếu discussion chỉ sinh ra 1 actionable item nhỏ
→ tạo task trước, chưa cần project.

### Rule 4
Nếu ambiguity block decision
→ mở clarification trước khi tạo nhiều task.

### Rule 5
Nếu vừa chốt decision có giá trị lâu dài
→ tạo notebook/decision note.

---

## 12. Suggested user flows

## Flow A — New project from group
1. User tạo group Telegram mới cho job
2. Mọi người thảo luận bình thường
3. Main coordinator theo dõi context
4. User gọi `@Dẹo tạo project`
5. Hệ tạo project
6. Group được gắn primary project
7. Các task/clarification sau đó attach vào project này

---

## Flow B — Tasks from project group
1. Group đã gắn project sẵn
2. Mọi người bàn issue cụ thể
3. User gọi `@Dẹo bóc task từ đoạn trên`
4. Hệ tạo 2-5 task drafts
5. Task attach vào primary project của group

---

## Flow C — Clarification from blocker discussion
1. Mọi người tranh luận scope mãi chưa rõ
2. User hỏi `@Dẹo chỗ nào còn mơ hồ?`
3. Hệ list open questions
4. User bảo `@Dẹo mở clarification`
5. Clarification được tạo và link lại group/task/project

---

## Flow D — Notebook from decision
1. Nhóm vừa chốt hướng làm
2. User bảo `@Dẹo lưu phần này thành decision note`
3. Hệ tạo notebook entry
4. Notebook gắn project + source thread + related files

---

## 13. Source linking là bắt buộc

Mọi object sinh ra từ chat group nên giữ traceability.

### Nên có các field kiểu
- `source_channel`
- `source_chat_id`
- `source_thread_id`
- `source_message_ids`

### Vì sao cần
- quay lại đúng đoạn trao đổi gốc
- audit quyết định
- hiểu tại sao task/project/note được tạo ra
- support follow-up tốt hơn

---

## 14. Khi nào nên map group vào project, khi nào chỉ map thread/message

## Map cả group → project khi
- group được tạo chuyên cho một project/job
- project là bối cảnh chi phối hầu hết message

## Chỉ map thread/message → object khi
- group là team group chung
- nhiều job/project chạy lẫn nhau trong cùng group
- cần granularity cao hơn

---

## 15. UI/Admin implications

Back office/web admin nên cho phép:
- xem group mappings
- đổi group type
- set/unset primary project
- xem các object sinh từ group
- xem linked tasks/clarifications/notebooks
- override mapping nếu coordinator suy ra sai

---

## 16. Cái không nên làm

- không coi mọi group chat là project
- không auto tạo project quá sớm chỉ vì có vài message hứng thú
- không tạo task cho mọi message lẻ
- không bỏ trace từ object quay về source chat
- không để team group chung auto-attach nhầm sang một project duy nhất

---

## 17. Definition of Done cho V1

Mô hình mapping được coi là usable khi:
- group Telegram có metadata group type
- group có thể gắn primary project nếu phù hợp
- task có thể tạo từ chat và attach đúng context
- clarification có thể tạo từ ambiguity trong discussion
- notebook/decision note có thể sinh từ đoạn chat đã chốt
- object nào sinh từ chat cũng trace được về source

---

## 18. One-line conclusion

**Telegram group không nên bị ép thành project theo kiểu 1-1; đúng hơn, group là work thread container có thể map sang project khi đủ điều kiện, đồng thời sinh task, clarification và notebook như các object có cấu trúc được trích ra từ cuộc trao đổi tự nhiên.**
