import fs from "fs";
import path from "path";

export interface Improvement {
  id: string;
  scenarioId: string;
  type: "guardrail" | "clarification" | "tool_usage";
  failure: string;
  rule: string;
  trigger: string;
  action: string;
  createdAt: string;
}

const improvementsFile = path.resolve(
  process.cwd(),
  "src/eval/improvements.json",
);

function loadImprovements(): Improvement[] {
  try {
    if (!fs.existsSync(improvementsFile)) {
      fs.writeFileSync(improvementsFile, JSON.stringify([], null, 2));

      return [];
    }

    const content = fs.readFileSync(improvementsFile, "utf-8");

    return JSON.parse(content) as Improvement[];
  } catch (error) {
    console.error("Failed to load improvements:", error);

    return [];
  }
}

function saveImprovements(improvements: Improvement[]): void {
  fs.writeFileSync(improvementsFile, JSON.stringify(improvements, null, 2));
}

const improvements: Improvement[] = loadImprovements();

export function getImprovements(): Improvement[] {
  return [...improvements];
}

export function addImprovement(improvement: Improvement): void {
  const exists = improvements.some(
    (item) =>
      item.scenarioId === improvement.scenarioId &&
      item.rule === improvement.rule,
  );

  if (exists) {
    return;
  }

  improvements.push(improvement);
  saveImprovements(improvements);
}

export function removeImprovement(improvementId: string): void {
  const index = improvements.findIndex((item) => item.id === improvementId);

  if (index === -1) {
    return;
  }

  improvements.splice(index, 1);
  saveImprovements(improvements);
}

export function clearImprovements(): void {
  improvements.length = 0;
  saveImprovements(improvements);
}

export function createImprovementFromFailure(
  scenarioId: string,
  failure: string,
): Improvement | null {
  const improvementDefinitions: Record<
    string,
    Omit<Improvement, "id" | "scenarioId" | "failure" | "createdAt">
  > = {
    "ambiguous-booking": {
      type: "guardrail",
      rule: "Never select an appointment slot when multiple slots satisfy the patient's request unless the patient explicitly chooses a specific slot.",
      trigger: "multiple_matching_slots",
      action: "ask_clarifying_question",
    },

    "specific-time-booking": {
      type: "clarification",
      rule: "When a patient specifies an exact time such as 10 AM, interpret it as the appointment start time and select the matching slot.",
      trigger: "explicit_appointment_time",
      action: "match_exact_start_time",
    },

    "double-booking": {
      type: "tool_usage",
      rule: "Before booking an appointment, check availability for the exact requested doctor, specialty, date, and start time. Never book a slot that is unavailable.",
      trigger: "requested_slot_unavailable",
      action: "reject_booking_and_offer_alternatives",
    },

    reschedule: {
      type: "tool_usage",
      rule: "When rescheduling to an explicitly requested time and exactly one available slot matches that time, reschedule directly without unnecessary confirmation.",
      trigger: "exact_reschedule_time",
      action: "reschedule_matching_slot",
    },

    cancellation: {
      type: "guardrail",
      rule: "Cancellation is destructive. Always identify the appointment and obtain explicit patient confirmation before calling the cancellation tool.",
      trigger: "cancellation_request",
      action: "ask_for_confirmation_before_cancellation",
    },
  };

  const definition = improvementDefinitions[scenarioId];

  if (!definition) {
    return null;
  }

  return {
    id: `improvement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    scenarioId,
    failure,
    ...definition,
    createdAt: new Date().toISOString(),
  };
}
