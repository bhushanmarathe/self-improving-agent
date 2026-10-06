# Self-Improving Appointment Scheduling Agent — Design Note

## 1. Overview

This project implements a patient appointment scheduling agent that supports multi-turn conversations for finding, booking, rescheduling, and cancelling appointments. The agent uses an LLM for conversation understanding and tool selection, while deterministic backend services and PostgreSQL enforce appointment state and business rules.

The design intentionally keeps the agent loop custom and lightweight rather than depending on an agent framework.

## 2. Architecture

```text
React + TypeScript UI
        │
        ▼
Express + TypeScript API
        │
        ▼
Conversation / Agent Loop
        │
        ├── Groq LLM
        │
        └── Tool Executor
              │
              ├── Search available slots
              ├── Book appointment
              ├── Get appointment(s)
              ├── Reschedule appointment
              └── Cancel appointment
                       │
                       ▼
                  Prisma ORM
                       │
                       ▼
                  PostgreSQL
```

The frontend provides the chat interface. The backend maintains conversation state and executes the agent loop. Appointment operations are implemented as deterministic services backed by PostgreSQL through Prisma.

## 3. Agent Behavior

For each user message, the agent:

1. Adds the message to the conversation.
2. Sends the conversation and system instructions to the LLM.
3. Allows the LLM to select an appropriate appointment tool.
4. Executes the selected tool against PostgreSQL.
5. Returns the tool result to the LLM.
6. Continues the loop until the agent produces a final response.

The system prompt establishes scheduling rules such as using actual dates, interpreting times such as “10 AM” as appointment start times, presenting multiple matching slots instead of choosing randomly, and never claiming a booking succeeded unless the tool succeeds.

Destructive operations such as cancellation require explicit confirmation before the cancellation tool is called.

## 4. Data Integrity and Safety

Appointment state is persisted in PostgreSQL rather than process memory. Booking, cancellation, and rescheduling use database transactions so slot availability and appointment state remain consistent.

The booking service verifies that a requested slot exists and is available before creating an appointment. Booking a slot also marks it unavailable, preventing subsequent bookings from using the same slot.

The agent does not expose internal database IDs to patients and does not invent doctors, slots, availability, or successful operations.

## 5. Evaluation Harness

The evaluation harness tests five representative scenarios:

- Ambiguous booking
- Specific-time booking
- Double-booking protection
- Rescheduling
- Cancellation

Each scenario contains user messages and expected behaviors. A deterministic scorer evaluates the resulting conversation against those expectations and produces a `PASS`/`FAIL`/`SKIPPED` result.

The evaluation runner resets appointment state between scenarios so scenarios remain isolated.

## 6. Self-Improvement Loop

The self-improvement loop follows:

```text
Baseline Evaluation
       ↓
Detect Failures
       ↓
Create Structured Improvement
       ↓
Apply Improvement
       ↓
Rerun Same Scenarios
       ↓
Check for Regression
       ↓
Accept / Roll Back
```

When a scenario fails, the system converts the failure into a structured improvement containing:

- scenario ID
- failure description
- improvement type
- learned rule
- trigger
- action
- creation timestamp

These improvements are injected into subsequent agent prompts as learned behavioral rules.

An improvement is accepted only when the rerun improves the overall score and does not regress previously passing scenarios. If either condition is violated, newly created improvements are rolled back.

This prevents the system from treating a higher score caused by skipped or regressed scenarios as a successful improvement.

## 7. Design Trade-offs

The implementation prioritizes simplicity and observability for a take-home assessment. Appointment business logic remains deterministic instead of being delegated to the LLM, while the LLM is responsible for natural-language understanding and tool selection.

The evaluation scorer is intentionally deterministic so that changes to agent behavior can be measured consistently. The current improvement mechanism uses structured rules rather than automatically modifying source code, making improvements auditable and reversible.

## 8. Future Improvements

For production use, the system could add stronger schema validation around tool arguments, authentication and authorization, richer evaluation metrics, persistent conversation storage, distributed locking for high-concurrency booking, and more sophisticated automatic improvement generation.

---

_This design note is intentionally compact (≤1 page) for the assessment._

**Suggested location:**

```text
self-improving-agent/
├── client/
├── server/
├── README.md
└── DESIGN_NOTE.md
```
