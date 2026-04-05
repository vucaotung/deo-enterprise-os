# TELEGRAM GROUP AS WORK OS V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Chốt mô hình dùng **group chat Telegram** như mặt tiền tự nhiên của hệ làm việc, nơi con người trao đổi bình thường còn OS/agent đứng sau để theo dõi ngữ cảnh, tóm tắt, trigger hành động và gọi specialist agents khi cần.

---

## 1. Tư duy lõi

Không ép user rời Telegram để vào một chat app mới chỉ để làm việc với agent.

Thay vào đó:
- user vẫn tạo group Telegram như bình thường
- mọi người vẫn chat, tag nhau, gửi file, ảnh, voice, dữ liệu
- agent/OS được add vào group như một participant thông minh
- group chat đó trở thành **human-native front end** của hệ làm việc

### Một câu chốt
> **Telegram group là mặt tiền tự nhiên của workflow; OS đứng sau để nhớ, tóm tắt, điều phối và kích hoạt agents.**

---

## 2. Bài toán thực tế cần giải

Quy trình tự nhiên ngoài đời hiện tại thường là:
- có dự án/job mới hoặc vấn đề mới
- user tạo group Telegram/Zalo
- kéo người liên quan vào
- mọi người thảo luận
- tag nhau hỏi đáp
- gửi file, PDF, ảnh, voice, dữ liệu
- chốt việc ngay trong thread/group

### Vấn đề của flow thuần chat
- ý quan trọng bị trôi
- không có trạng thái công việc rõ
- khó biết đã chốt gì, còn gì mở
- task/clarification/note không được sinh ra có cấu trúc
- khó summon đúng specialist đúng lúc
- agent nếu đứng ngoài group thì không có context tự nhiên

---

## 3. Giải pháp đề xuất

Trong mỗi group Telegram phục vụ công việc sẽ có:

### A. Main coordinator agent
Một agent chính theo dõi group ở mức điều phối.

### B. Specialist agents on-demand
Các agent chuyên môn không đứng thường trực, chỉ được summon khi cần.

### C. Work OS backend
Hệ phía sau lưu:
- thread context
- summaries
- linked projects/tasks
- clarifications
- notebooks
- agent invocation state

---

## 4. Vai trò của main coordinator agent

Main coordinator **không phải** là agent làm hết mọi thứ.

### Nhiệm vụ chính
- theo dõi ngữ cảnh cuộc trao đổi
- giữ continuity của thread/group
- tạo/duy trì summary ngắn và summary làm việc
- detect trigger/action opportunities
- đề xuất step tiếp theo
- summon specialist khi được gọi hoặc khi policy cho phép

### Không nên làm
- spam trả lời mọi tin nhắn
- can thiệp vào casual banter
- reread full chat liên tục bằng reasoning mode
- thay con người chốt mọi quyết định

---

## 5. Chế độ hoạt động của main coordinator

## A. Silent Watch Mode
### Mục tiêu
Theo dõi context nhưng không xen vào vô duyên.

### Hành vi
- đọc message mới
- update thread summary nhẹ
- track open loops/pending actions
- không chủ động reply trừ khi có trigger mạnh

### Dùng khi
- group đang trao đổi bình thường
- chưa cần assistant bật mode mạnh

---

## B. Mention / Summon Mode
### Mục tiêu
Chỉ phản hồi khi được gọi rõ ràng.

### Trigger ví dụ
- tag bot/agent
- reply vào message rồi gọi bot
- command rõ ràng như `/summon research`

### Ví dụ
- `@Dẹo tóm tắt lại giúp`
- `@Dẹo tạo project cho job này`
- `@Dẹo bóc các đầu việc`
- `@Dẹo gọi finance agent`

---

## C. Proactive Assist Mode
### Mục tiêu
Xen vào đúng lúc khi giá trị rõ ràng.

### Chỉ nên làm khi
- có decision vừa chốt xong
- có 3-5 pending items rõ ràng
- thiếu deadline/owner nghiêm trọng
- có ambiguity/blocker nổi bật
- có file/brief mới đủ để gợi ý step tiếp theo

### Ví dụ output phù hợp
- “Dẹo thấy nhóm đã chốt 3 ý chính, cần em tóm lại thành brief không?”
- “Hiện còn 2 điểm chưa rõ, có muốn em mở clarification không?”
- “Job này đã đủ dữ liệu để tạo project và tách task sơ bộ.”

---

## 6. Specialist agents nên hoạt động thế nào

Specialist agents **không nên** đứng canh thường trực trong group.

### Chúng nên được gọi theo nhu cầu
Ví dụ:
- `Research Agent`
- `Project Agent`
- `Task Agent`
- `Finance Agent`
- `CRM Agent`
- `Writer Agent`
- `Knowledge Agent`
- `Clarification Agent`

### Nguồn summon
- user trong group
- admin nhóm
- main coordinator nếu policy cho phép

### Ví dụ summon tự nhiên
- `@Dẹo gọi research agent bóc đối thủ cho brief này`
- `@Dẹo nhờ writer draft proposal`
- `@Dẹo project agent chia task giúp`
- `@Dẹo finance check estimate này`

---

## 7. Tại sao không để nhiều agent đứng thường trực trong group

Nếu để nhiều agent luôn hiện diện thì sẽ:
- loạn luồng giao tiếp
- khó biết ai đang chịu trách nhiệm
- đốt token nặng
- specialist đọc quá nhiều context không cần thiết
- giảm cảm giác tự nhiên của nhóm chat

### Hướng đúng
- **1 main coordinator** thường trực
- specialist **attach/summon on-demand**

---

## 8. Telegram group như một thread làm việc

Mỗi group chat công việc nên được coi là một **work thread** có state.

### Thread/workspace state nên có
- `thread_id`
- `channel` = telegram
- `chat_id`
- `title`
- `primary_context_type`
  - `project`
  - `task`
  - `client`
  - `general_job`
  - `incident`
- `primary_context_id` (nullable)
- `participants`
- `active_agents`
- `watcher_agents`
- `thread_summary_short`
- `thread_summary_working`
- `pending_actions`
- `open_questions`
- `linked_files`
- `linked_projects`
- `linked_tasks`
- `linked_notebooks`
- `open_clarifications_count`
- `last_decision_summary`

---

## 9. Những hành động tự nhiên user nên làm được trong group

## A. Summary / memory actions
- `@Dẹo tóm tắt lại giúp`
- `@Dẹo recap từ đầu tới giờ`
- `@Dẹo phần nào đã chốt rồi?`

## B. Project / task actions
- `@Dẹo tạo project cho job này`
- `@Dẹo bóc thành task`
- `@Dẹo list các việc đang mở`
- `@Dẹo assign việc này cho agent phù hợp`

## C. Clarification actions
- `@Dẹo chỗ nào còn mơ hồ?`
- `@Dẹo mở clarification cho điểm này`
- `@Dẹo tổng hợp câu hỏi cần hỏi lại khách`

## D. Knowledge actions
- `@Dẹo lưu phần chốt này vào note`
- `@Dẹo tạo decision note giúp`
- `@Dẹo gom tài liệu liên quan job này`

## E. Specialist summon actions
- `@Dẹo gọi research agent`
- `@Dẹo gọi finance agent check`
- `@Dẹo gọi writer draft proposal`

---

## 10. Trách nhiệm của admin nhóm chat

Admin không cần can thiệp vào từng task nhỏ, nhưng nên có quyền cấu hình work mode cho group.

### Admin có thể làm
- add bot/main coordinator vào group
- bật/tắt proactive mode
- chọn group này map vào workspace/team nào
- chỉ định group này gắn với project hay để general
- cấu hình specialist nào được summon trong group
- set policy mention-only hay suggestion-enabled

### Admin không nên phải làm
- viết prompt tay mỗi lần
- điều khiển agent bằng command kỹ thuật phức tạp
- quản lý context thủ công cho mỗi cuộc trao đổi

---

## 11. Group modes đề xuất

## Mode 1 — Mention Only
### Dùng khi
Muốn bot chỉ phản hồi khi được gọi.

### Hợp với
- group đông người
- nhóm nhạy cảm
- giai đoạn đầu rollout

---

## Mode 2 — Suggest Only
### Dùng khi
Bot được phép đề xuất action nhưng không tự tạo object mạnh.

### Ví dụ
- đề xuất tạo project
- đề xuất mở clarification
- đề xuất summon specialist

---

## Mode 3 — Assisted Execution
### Dùng khi
Bot có thể thực hiện một số action khi được gọi rõ hoặc sau xác nhận.

### Ví dụ
- tạo task
- tạo project
- lưu note
- summon specialist

---

## Mode 4 — High Automation (chọn lọc)
### Dùng khi
Nhóm đã tin hệ và muốn tăng tốc.

### Cho phép
- auto-summary theo nhịp
- auto-open clarification theo trigger rõ
- auto-draft task list từ brief mới

### Cần cẩn thận
Không bật mode này quá sớm cho mọi group.

---

## 12. Token strategy để tránh đốt vô ích

Chat domain rất dễ thành lò đốt token nếu agent phải follow full history liên tục.

### Nguyên tắc
- không reread toàn bộ lịch sử chat mỗi lần
- dùng rolling summary
- chỉ gọi heavy reasoning khi có trigger mạnh
- specialist chỉ nhận context đã đóng gói

### Nên có 2 lớp follow-up
#### Lightweight watch layer
- rẻ
- chỉ monitor event mới
- update summary/state
- quyết định có cần gọi agent reasoning hay không

#### Heavy reasoning layer
- chỉ dùng khi thật sự cần
- phân tích, lập kế hoạch, research, draft, quyết định

### Context gửi cho agent nên gồm
- vài message gần nhất liên quan
- thread summary ngắn
- current goal
- pending actions
- linked entities cần thiết

### Không nên gửi
- toàn bộ lịch sử chat từ đầu
- toàn bộ CRM/finance/notebook nếu không liên quan
- data thô không cần thiết cho action hiện tại

---

## 13. Ví dụ flow thực tế: job mới

## Bối cảnh
User tạo group Telegram: `Job ABC - Proposal`

### Mọi người trao đổi bình thường
- gửi brief PDF
- gửi hình tham khảo
- chốt deadline sơ bộ
- hỏi scope
- phân vai sơ khởi

### Main coordinator âm thầm làm
- nhận ra đây là `new job discussion`
- lưu file/brief links
- tạo thread summary working
- nhận diện unresolved questions
- không cần trả lời liên tục

### Khi được gọi
User nói:
- `@Dẹo tóm tắt job này`
- `@Dẹo tạo project giúp`
- `@Dẹo tách sơ bộ các đầu việc`

### System phản ứng
- tạo `project`
- tạo `task draft`
- post summary ngắn vào group
- nếu cần, gợi ý summon `Research Agent` hoặc `Writer Agent`

---

## 14. Ví dụ flow thực tế: blocker / issue discussion

## Bối cảnh
Nhóm đang bàn một task bị kẹt.

### Mọi người chat
- khách chưa confirm ngân sách
- scope chưa rõ
- chưa biết ai follow

### Main coordinator thấy gì
- đây là blocker + clarification candidate
- thread có unresolved points

### Khi user gọi
- `@Dẹo chỗ nào còn mơ hồ?`
- `@Dẹo mở clarification cho điểm này`
- `@Dẹo tạo follow-up task`

### Kết quả
- bot list ra câu hỏi còn mở
- mở clarification object
- tạo task follow-up cho owner phù hợp

---

## 15. Vai trò của web app khi đã có Telegram group front end

Web app vẫn cần, nhưng không phải để thay thế group chat tự nhiên.

### Web app nên đóng vai trò
- back office / admin
- object views có cấu trúc
- project/task dashboards
- agent admin / runtime inspection
- notebook / finance / CRM structured views

### Telegram group đóng vai trò
- frontstage
- nơi con người nói chuyện tự nhiên
- nơi khởi phát ý định và workflow

---

## 16. Kiến trúc đúng

## Frontstage
- Telegram group chat
- people talk naturally
- coordinator agent hiện diện nhẹ

## Mid-layer
- conversation orchestrator
- thread state
- summary memory
- trigger detection
- action suggestion

## Specialist layer
- research
- project
- task
- finance
- CRM
- writing
- knowledge
- clarification

## Backstage / admin
- web app
- project/task structured views
- agent admin
- execution state
- debug/retry/logs

---

## 17. Điều không nên làm

- không bắt user bỏ Telegram để vào app mới chỉ để chat với agent
- không để bot reply mọi message
- không để 5-10 specialist cùng ngồi canh một group
- không để agent reread full history liên tục
- không trộn lẫn chat frontstage với admin/debug control plane

---

## 18. Definition of Done cho V1

Mô hình này được coi là usable khi:
- add được main coordinator vào group Telegram
- bot follow context ở chế độ silent watch
- bot tóm tắt được khi được gọi
- bot detect được các action cơ bản
- bot có thể tạo project/task/note/clarification từ chat
- bot summon được specialist theo yêu cầu
- admin cấu hình được mode của group

---

## 19. One-line conclusion

**Telegram group nên được dùng như mặt tiền tự nhiên của Work OS: con người vẫn trao đổi như bình thường, main coordinator agent theo dõi ngữ cảnh và specialist agents được summon theo nhu cầu để biến hội thoại thành hành động có cấu trúc.**
