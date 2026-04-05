# LOW-TOKEN CHAT ORCHESTRATION STRATEGY

**Ngày:** 2026-04-05  
**Mục tiêu:** Định nghĩa chiến lược vận hành chat-based Work OS theo hướng **ít đốt token nhưng vẫn giữ được sự tự nhiên, continuity và khả năng follow-up hữu ích**.

---

## 1. Bài toán lõi

Nếu làm sai, chat domain sẽ trở thành lò đốt token vì:
- agent phải reread full history liên tục
- message nào cũng trigger reasoning
- specialist agents bị summon quá dễ
- context gửi vào quá dày
- summary không được nén đúng cách

### Một câu chốt
> **Mục tiêu không phải để agent đọc mọi thứ; mục tiêu là để hệ chỉ reason khi thật sự cần.**

---

## 2. Nguyên tắc nền tảng

## Nguyên tắc 1 — Không follow bằng full reread
Không để main coordinator hoặc specialist phải đọc lại toàn bộ thread mỗi lần có message mới.

## Nguyên tắc 2 — Summary first
Thread phải có summary layers đủ tốt để dùng thay cho raw history trong phần lớn trường hợp.

## Nguyên tắc 3 — Trigger before reasoning
Không phải message nào cũng đáng gọi LLM reasoning.

## Nguyên tắc 4 — Context on demand
Chỉ assemble đúng phần context cần cho action hiện tại.

## Nguyên tắc 5 — Specialist on demand
Specialist agents không được phép đứng reasoning mode liên tục cho mọi thread.

---

## 3. Kiến trúc 2 tầng để tiết kiệm token

## A. Watch Mode (lightweight)
### Mục tiêu
Theo dõi thread với chi phí thấp.

### Nhiệm vụ
- ingest message mới
- detect mentions / commands / strong triggers
- update lightweight state
- refresh summary khi cần
- decide có cần escalate sang reasoning mode hay không

### Đặc điểm
- rẻ
- nhanh
- không cần reasoning sâu mỗi lần
- nên là default mode của hầu hết thread

---

## B. Reason Mode (heavy)
### Mục tiêu
Chỉ bật khi thực sự cần suy luận, lập kế hoạch, phân tích, draft, triage.

### Nhiệm vụ
- tạo summary sâu
- đề xuất action phức tạp
- gọi specialist
- xử lý ambiguity/blockers
- lập task breakdown
- research planning

### Đặc điểm
- tốn token hơn
- chỉ chạy khi trigger đủ mạnh
- không nên chạy cho mọi message

---

## 4. Trigger policy: khi nào đáng gọi reasoning

## Gọi reasoning khi
- user tag agent rõ ràng
- user yêu cầu summary / recap / planning / analyze
- user yêu cầu tạo project/task/clarification/note
- có ambiguity mạnh cần clarification
- có file/brief mới và user muốn agent xử
- có state change lớn trong thread
- có specialist summon

## Không gọi reasoning khi
- chào hỏi
- casual banter
- ack ngắn kiểu “ok”, “đã rõ”, “ừ”, “oke”
- message không tạo ý định mới
- con người đang tự trao đổi bình thường và không cần agent

---

## 5. Trigger severity model

Nên phân cấp trigger để quyết định mức xử lý.

## Level 0 — Ignore / passive ingest
- no action
- chỉ lưu message + maybe update stats nhẹ

## Level 1 — Summary refresh candidate
- chưa cần reason sâu
- chỉ mark thread là cần refresh summary nếu tích lũy đủ thay đổi

## Level 2 — Lightweight assistant response
- reply ngắn, rule-based hoặc context-light
- ví dụ: xác nhận đang theo dõi, liệt kê pending actions có sẵn

## Level 3 — Full reasoning by coordinator
- cần đọc summary + recent messages + linked context
- ví dụ: tóm tắt, xác định unresolved points, đề xuất action

## Level 4 — Specialist invocation
- khi cần domain-specific output
- ví dụ: research, draft proposal, finance review, project breakdown

---

## 6. Summary strategy nhiều lớp

## A. Message cache
- giữ raw last N messages
- đề xuất: `last_20_messages`
- dùng cho recall gần

## B. Short summary
- 1-5 câu
- dùng cho quick orientation

## C. Working summary
- summary vận hành
- gồm:
  - objective
  - current state
  - decisions
  - unresolved points
  - related files/entities

## D. Decision snippets / open loops
- lưu riêng các mảnh quan trọng:
  - quyết định đã chốt
  - câu hỏi còn mở
  - pending actions

### Tại sao phải tách lớp
Vì không phải action nào cũng cần full working summary.

---

## 7. Khi nào cập nhật summary

Không nên cập nhật deep summary sau mỗi message.

### Nên refresh summary khi
- có mốc chốt quyết định
- có file/brief mới quan trọng
- có trigger summary explicit
- message count vượt ngưỡng (ví dụ +10 hoặc +20 message)
- thread objective đổi rõ rệt
- agent vừa tạo structured output quan trọng

### Không nên refresh ngay khi
- chỉ có 1 message ngắn không đổi context
- group đang chat casual
- chưa có state change đáng kể

---

## 8. Context packaging strategy

## Chỉ gửi agent những gì cần
Ví dụ nếu user hỏi về task blocker:
- recent messages liên quan blocker
- task summary
- assigned owner
- due date
- open clarifications

### Không nên gửi thêm
- full CRM state
- toàn bộ finance data
- toàn bộ notebook history
- mọi file trong group từ trước đến nay

### Quy tắc
> **Message context là theo nhu cầu hành động, không phải dump toàn bộ bối cảnh.**

---

## 9. Specialist summon policy

## Specialist chỉ nên được gọi khi
- explicit summon từ user/admin
- coordinator confidence cao rằng specialist là cần thiết
- thread mode cho phép auto-suggest hoặc assisted execution

## Specialist không nên được gọi khi
- task đủ đơn giản để coordinator xử
- message chỉ cần recap nhẹ
- chưa có objective rõ
- context còn quá mơ hồ để specialist tạo output meaningful

---

## 10. Proposed token budget mindset

Không cần số tuyệt đối ngay, nhưng nên có tư duy budget theo action class.

## A. Passive ingest
- cực rẻ
- gần như metadata + lightweight classify

## B. Summary refresh
- trung bình
- chỉ làm theo batch/event threshold

## C. Coordinator reasoning
- cao hơn
- dùng cho decision support / orchestration reasoning

## D. Specialist reasoning
- đắt nhất
- reserve cho value-dense actions

### Nguyên tắc
Một thread bình thường nên sống lâu nhất ở lớp A và B.  
Chỉ thỉnh thoảng mới bật C hoặc D.

---

## 11. Watch mode implementation ideas

Watch mode có thể dùng:
- rule engine
- cheap classifier
- lightweight LLM pass ngắn
- mention detection
- keyword/intent signals

### Nó nên làm được
- detect mention của agent
- detect command patterns
- detect candidate new project/task/clarification moments
- mark thread dirty for summary refresh
- update counters/open loops

### Nó không nên cố làm
- planning sâu
- reasoning nhiều bước
- domain analysis phức tạp

---

## 12. Reason mode implementation ideas

Reason mode nên dùng khi:
- user rõ ràng muốn output có giá trị
- watch mode escalate
- thread đang ở điểm decision/blocker quan trọng

### Inputs cho reason mode
- short summary
- working summary
- recent relevant messages
- context package theo domain
- action goal rõ ràng

### Outputs nên là
- concise reply
- task draft
- clarification draft
- note draft
- next step recommendations

---

## 13. Human-natural behavior guardrails

Muốn chat domain tự nhiên thì agent không được lạm dụng follow-up.

### Chỉ xen vào khi
- được gọi
- có giá trị rõ ràng
- hoặc policy nhóm cho phép proactive assist

### Tránh
- reply mọi message
- nhắc nhở quá dày
- summary vô nghĩa khi group đang nói chuyện mượt
- “tôi đang theo dõi…” spam

---

## 14. Good examples

## Ví dụ tốt 1
Group vừa chốt xong 3 việc, user tag:
- `@Dẹo recap giúp`

### Hợp lý
- coordinator dùng summary + recent messages
- trả 3 bullet + 2 pending items
- không cần gọi specialist

---

## Ví dụ tốt 2
User nói:
- `@Dẹo research đối thủ cho brief này`

### Hợp lý
- coordinator assemble context vừa đủ
- gọi research specialist
- specialist trả output structured

---

## Ví dụ tốt 3
Group tranh luận mãi về scope

### Hợp lý
- watch mode detect ambiguity repeated
- nếu mode cho phép, coordinator gợi ý:
  - “Có 3 điểm đang mơ hồ, muốn em mở clarification không?”

---

## 15. Bad examples

## Ví dụ dở 1
Mỗi tin nhắn trong group đều gọi LLM reasoning một lần.

## Ví dụ dở 2
Mỗi specialist agent đều phải đọc toàn bộ lịch sử thread để hiểu bối cảnh.

## Ví dụ dở 3
Coordinator cứ 5 phút tự summary lại dù group không cần.

## Ví dụ dở 4
Agent chen vào cả lúc con người đang banter hoặc đã tự giải xong.

---

## 16. Minimal V1 implementation strategy

Nếu build V1 thực dụng, chỉ cần:
- message ingest
- mention detection
- rolling short summary
- working summary refresh theo batch
- simple trigger severity levels
- coordinator reason mode
- summon 1-2 specialist phổ biến

### Chưa cần ngay
- quá nhiều specialist
- memory retrieval phức tạp
- semantic ranking quá nặng
- proactive mode cực thông minh cho mọi nhóm

---

## 17. Policy recommendation cho rollout ban đầu

### Default cho group mới
- `mention_only` + `watch_mode`

### Khi nhóm quen dần
- mở `suggest_only`

### Khi đã trust hệ hơn
- cho `assisted_execution`

### Không nên rollout ngay
- `high_automation` cho tất cả group

---

## 18. One-line conclusion

**Chat-based Work OS chỉ sống được nếu follow-up được thiết kế theo kiểu watch mode rẻ + reason mode có chọn lọc, dùng rolling summary và context packaging đúng nhu cầu thay vì để agent reread full thread liên tục.**
