# Self-Improving Appointment Scheduling Agent

A patient appointment scheduling agent built as a take-home assessment for an AI / Agents Software Engineer role.

The system combines a multi-turn LLM agent, tool calling, PostgreSQL persistence, deterministic evaluation, and a self-improvement loop that converts evaluation failures into structured improvements and reruns the same scenarios to verify that the score improves without regression.

---

## 1. Overview

The agent helps patients:

- Find available appointment slots
- Book appointments
- View existing appointments
- Reschedule appointments
- Cancel appointments with explicit confirmation
- Handle unavailable or conflicting slots
- Maintain context across multiple turns

The system also includes an evaluation harness that:

1. Runs predefined scenarios.
2. Scores the agent deterministically.
3. Identifies failed behaviors.
4. Converts failures into structured improvements.
5. Injects those improvements into subsequent agent runs.
6. Reruns the same scenarios.
7. Detects regressions.
8. Accepts an improvement only when the overall score increases and previously passing scenarios do not regress.

---

## 2. Architecture

```text
                    ┌──────────────────────┐
                    │   React + TypeScript  │
                    │      Frontend         │
                    └──────────┬───────────┘
                               │
                               │ HTTP
                               ▼
                    ┌──────────────────────┐
                    │   Express + Node.js   │
                    │       Backend         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Agent Loop      │
                    │                      │
                    │ Groq GPT-OSS 120B    │
                    │ Tool Calling         │
                    │ Conversation State   │
                    └──────────┬───────────┘
                               │
                         Tool Executor
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       Search Slots         Booking        Reschedule /
                                           Cancel /
                                           Appointments
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │       Prisma         │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │     PostgreSQL       │
                    └──────────────────────┘


                    Evaluation System
                           │
                           ▼
              ┌─────────────────────────┐
              │ Evaluation Scenarios    │
              └────────────┬────────────┘
                           ▼
              ┌─────────────────────────┐
              │ Deterministic Scoring   │
              └────────────┬────────────┘
                           ▼
              ┌─────────────────────────┐
              │ Structured Improvement │
              └────────────┬────────────┘
                           ▼
              ┌─────────────────────────┐
              │ Learned Rules injected  │
              │ into Agent Prompt       │
              └────────────┬────────────┘
                           ▼
                     Rerun Scenarios
                           │
                           ▼
                Score + Regression Check
```

---

## 3. Tech Stack

**Frontend**

- React
- TypeScript
- Vite
- React Markdown

**Backend**

- Node.js
- Express
- TypeScript
- Groq SDK

**AI**

- Groq API
- `openai/gpt-oss-120b`
- Native function/tool calling
- Custom agent loop

**Database**

- PostgreSQL
- Prisma ORM

**Testing**

- Vitest
- Prisma-backed integration tests

---

## 4. Project Structure

```text
self-improving-agent/
│
├── client/
│   ├── src/
│   │   ├── App.tsx
│   │   └── App.css
│   └── vite.config.ts
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── agent/
│   │   │   ├── agent.ts
│   │   │   ├── conversationStore.ts
│   │   │   ├── improvementPrompt.ts
│   │   │   ├── systemPrompt.ts
│   │   │   ├── toolExecutor.ts
│   │   │   ├── tools.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── config/
│   │   │   └── env.ts
│   │   │
│   │   ├── eval/
│   │   │   ├── improvements.json
│   │   │   ├── improvements.ts
│   │   │   ├── resetDatabase.ts
│   │   │   ├── resetImprovements.ts
│   │   │   ├── runEval.ts
│   │   │   ├── runner.ts
│   │   │   ├── scenarios.ts
│   │   │   ├── scorer.ts
│   │   │   ├── selfImprovement.ts
│   │   │   └── selfImprovementLoop.test.ts
│   │   │
│   │   ├── lib/
│   │   │   └── prisma.ts
│   │   │
│   │   ├── services/
│   │   │   ├── appointmentRepository.ts
│   │   │   ├── appointmentService.ts
│   │   │   └── appointmentService.test.ts
│   │   │
│   │   └── index.ts
│   │
│   └── package.json
│
└── README.md
```

---

## 5. Prerequisites

Install:

- Node.js 20+
- PostgreSQL
- npm

Verify Node:

```bash
node --version
```

Verify PostgreSQL is running.

---

## 6. Environment Variables

Create `server/.env` with:

```env
GROQ_API_KEY=your_groq_api_key
PORT=5000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/appointment_agent"
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

---

## 7. Install Dependencies

**Backend**

```bash
cd server
npm install
```

**Frontend**

Open another terminal:

```bash
cd client
npm install
```

---

## 8. Database Setup

Create the PostgreSQL database:

```text
appointment_agent
```

Then from the `server` directory run:

```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

The seed creates:

- One patient
- Three doctors
- Multiple appointment slots for the following day

Example doctors:

- Dr. Sarah Smith – Cardiology
- Dr. Michael Brown – Dermatology
- Dr. Emily Wilson – General Medicine

---

## 9. Run the Application

**Backend**

From `server/`:

```bash
npm run dev
```

The API starts on:

- http://localhost:5000
- Health check: http://localhost:5000/health

**Frontend**

From `client/`:

```bash
npm run dev
```

Open:

- http://localhost:5173

---

## 10. Example Conversation

**Patient**

> I need a cardiologist tomorrow.

**Agent**

> I found several available cardiology appointments for tomorrow:
>
> - 9:00 AM – 9:30 AM
> - 10:00 AM – 10:30 AM
> - 11:00 AM – 11:30 AM
> - 2:00 PM – 2:30 PM
> - 3:00 PM – 3:30 PM
>
> Which time would you prefer?

**Patient**

> 10 AM please.

**Agent**

> Your appointment has been booked successfully.
>
> - Doctor: Dr. Sarah Smith
> - Specialty: Cardiology
> - Date: October 6, 2026
> - Time: 10:00 AM – 10:30 AM
> - Timezone: Asia/Kolkata

The agent does not expose internal appointment IDs, slot IDs, or tool-call IDs.

---

## 11. Agent Tools

The agent has access to the following tools:

- `search_available_slots`  
  Searches PostgreSQL for matching available appointment slots.  
  Supports: doctor, specialty, date, exact start time, morning/afternoon/evening preference.

- `book_appointment`  
  Books a specific available slot.  
  The database transaction prevents a slot from being booked when it is already unavailable.

- `get_appointment`  
  Retrieves appointment information.

- `get_my_appointments`  
  Retrieves appointments belonging to the current patient.

- `reschedule_appointment`  
  Moves an existing appointment to another available slot.  
  The original slot becomes available again.

- `cancel_appointment`  
  Cancels an appointment and releases its slot.  
  Cancellation requires explicit patient confirmation through the agent.

---

## 12. Safety and Behavioral Rules

The system prompt enforces several important rules:

- **No invented availability**  
  The agent must use the availability tool instead of inventing slots.

- **No random booking**  
  When multiple slots match, the agent asks the patient to choose.

- **Explicit cancellation confirmation**  
  The agent must identify the appointment and obtain confirmation before cancellation.

- **No false success**  
  The agent cannot claim that an appointment was booked, cancelled, or rescheduled unless the corresponding operation succeeds.

- **No internal IDs**  
  The agent never exposes: patient IDs, doctor IDs, slot IDs, appointment IDs, tool-call IDs.

- **Time handling**  
  Appointment times are presented using the clinic timezone: `Asia/Kolkata`.  
  Natural-language times such as `10 AM` are interpreted as an appointment starting at `10:00`.

---

## 13. Evaluation Harness

The evaluation harness contains five scenarios:

1. Ambiguous Booking
2. Specific Time Booking
3. Double Booking Protection
4. Rescheduling
5. Cancellation

Each scenario contains:

- Setup messages
- Test messages
- Expected behavior

Example:

> Patient: I need a cardiologist tomorrow morning.  
> Patient: 10 AM please.

The evaluator verifies that the agent:

- Finds the correct availability
- Interprets `10 AM` correctly
- Books the correct slot
- Confirms the booking

---

## 14. Deterministic Scoring

The evaluator scores the final conversation against expected behaviors.

Each scenario receives:

- `PASS`
- `FAIL`
- `SKIPPED`

`SKIPPED` is used when an external execution problem (e.g., unavailable LLM API) prevents meaningful evaluation. Skipped scenarios are not included in the overall score.

The evaluation loop also prevents incomplete evaluations from being treated as successful self-improvement runs.

---

## 15. Self-Improvement Loop

The core loop is:

```text
Baseline Evaluation
        │
        ▼
Identify Failures
        │
        ▼
Create Structured Improvement
        │
        ▼
Persist Improvement
        │
        ▼
Inject Learned Rule
        │
        ▼
Rerun Same Scenarios
        │
        ▼
Compare Scores
        │
        ▼
Regression Check
        │
        ├── Regression → Reject improvement
        │
        └── No regression + higher score
                         ↓
                    Accept improvement
```

Example structured improvement:

```json
{
  "id": "cancellation-guardrail",
  "scenarioId": "cancellation",
  "category": "guardrail",
  "rule": "Always ask for explicit confirmation before cancelling an appointment.",
  "source": "evaluation failure"
}
```

The improvement is stored in:

```text
server/src/eval/improvements.json
```

The agent loads these improvements dynamically and adds them to its system prompt.

---

## 16. Evaluation Commands

**Reset learned improvements:**

```bash
npm run eval:reset
```

**Reset appointment state:**

```bash
npm run eval:db-reset
```

**Run the evaluation:**

```bash
npm run eval
```

The evaluation reports:

- Baseline Score
- Improved Score
- Score Change
- Regression Detected
- Improvement Accepted

Example target output:

```text
Baseline Score: 80%
Improved Score: 100%
Score Change: +20%
Regression Detected: NO
Improvement Accepted: YES
```

---

## 17. Testing

Run all automated tests:

```bash
npm test -- --run
```

Current test coverage includes:

- Available slot search
- Successful booking
- Double-booking protection
- Appointment retrieval
- Successful rescheduling
- Rescheduling to an unavailable slot
- Cancellation
- Duplicate cancellation protection
- Appointment time formatting
- Self-improvement acceptance and regression logic

Expected result:

```text
Test Files  2 passed
Tests       10 passed
```

---

## 18. Build

Compile the backend:

```bash
npm run build
```

Or run the TypeScript check directly:

```bash
npx tsc --noEmit
```

---

## 19. Design Decisions

**Custom Agent Loop**  
A custom tool-calling loop was used instead of LangChain/LangGraph to keep the implementation explicit and easy to reason about within the assessment scope.

The loop:

1. Sends conversation + tools to the LLM.
2. Detects tool calls.
3. Executes tools against the application service layer.
4. Sends tool results back to the LLM.
5. Repeats until the agent produces a final response.

**Service / Repository Separation**  
Appointment business logic is separated from database access:

```text
Agent
  ↓
Tool Executor
  ↓
Appointment Service
  ↓
Appointment Repository
  ↓
Prisma
  ↓
PostgreSQL
```

This makes the system easier to test and extend.

**Database Transactions**  
Booking, rescheduling, and cancellation use PostgreSQL transactions so appointment and slot state remain consistent.

**Deterministic Evaluation**  
The evaluator does not ask an LLM to decide whether the agent passed. Instead, important behaviors are checked deterministically so that evaluation results are reproducible.

**Regression Protection**  
An improvement is accepted only when:

- `Improved Score > Baseline Score`
- and no scenario that previously passed becomes a failure.

---

## 20. Known Limitations

- Conversation state is currently stored in application memory rather than Redis.
- The evaluation harness uses predefined scenarios rather than production traffic.
- Learned improvements are stored in a local JSON file.
- The current implementation assumes a single clinic timezone.
- Authentication and authorization are outside the assessment scope.
- The frontend is intentionally lightweight because the focus is on agent behavior and evaluation.

---

## 21. Future Improvements

Possible production extensions include:

- Redis-backed conversation/session persistence
- Authentication and patient authorization
- Multiple clinics and timezones
- Persistent improvement storage in PostgreSQL
- More comprehensive semantic evaluation
- LLM-as-judge evaluation for response quality
- Distributed agent execution
- Observability and tracing
- Metrics for tool failures and booking conversion
- Human review of generated improvements

---

## 22. Assessment Demo Flow

The recommended demo flow is:

1. Start the application
2. Show the appointment chat UI
3. Ask for a cardiologist tomorrow
4. Show multiple available options
5. Select a specific time
6. Show successful booking
7. Show the evaluation scenarios
8. Run baseline evaluation
9. Show a failed scenario
10. Show the structured improvement
11. Show the learned rule being injected
12. Rerun the same scenarios
13. Show score improvement
14. Show `Regression Detected: NO`
15. Show `Improvement Accepted: YES`

---

## 23. One-Command Summary

**Start backend**

```bash
cd server
npm run dev
```

**Start frontend**

```bash
cd client
npm run dev
```

**Run tests**

```bash
cd server
npm test -- --run
```

**Reset evaluation state**

```bash
cd server
npm run eval:reset
npm run eval:db-reset
```

**Run evaluation**

```bash
cd server
npm run eval
```

---

## 24. Summary

This project demonstrates an appointment scheduling agent that is not only capable of performing real tool-based actions, but also has an evaluation-driven feedback loop.

The key design principle is:

> Failures should produce concrete, testable improvements rather than simply being logged.

The system therefore evaluates behavior, converts failures into structured rules, applies those rules to future agent runs, and accepts changes only when they improve the score without introducing regressions.
