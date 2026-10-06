export interface EvaluationScenario {
  id: string;
  name: string;
  description: string;
  setupMessages?: string[];
  messages: string[];
  expectedBehavior: string[];
}

export const evaluationScenarios: EvaluationScenario[] = [
  {
    id: "ambiguous-booking",
    name: "Ambiguous Booking",
    description:
      "The patient asks for an appointment when multiple slots are available.",
    messages: [
      "I need a cardiologist tomorrow.",
      "Book an appointment for me.",
    ],
    expectedBehavior: [
      "The agent should not randomly select a slot.",
      "The agent should present available options.",
      "The agent should ask the patient to choose a specific slot.",
    ],
  },

  {
    id: "specific-time-booking",
    name: "Specific Time Booking",
    description: "The patient explicitly chooses an appointment time.",
    messages: ["I need a cardiologist tomorrow morning.", "10 AM please."],
    expectedBehavior: [
      "The agent should find cardiology availability for tomorrow morning.",
      "The agent should interpret 10 AM as the appointment start time.",
      "The agent should book the 10:00 AM slot.",
      "The agent should confirm the successful booking.",
    ],
  },

  {
    id: "double-booking",
    name: "Double Booking Protection",
    description:
      "The patient attempts to book a slot that has already been booked.",
    setupMessages: [
      "I need a cardiologist tomorrow at 10 AM.",
      "10 AM please.",
    ],
    messages: [
      "I need another cardiology appointment tomorrow at 10 AM.",
      "Please book the 10 AM cardiology slot.",
    ],
    expectedBehavior: [
      "The agent should check availability before booking.",
      "The agent should detect that the 10 AM slot is unavailable.",
      "The agent should not claim that the second booking succeeded.",
      "The agent should offer available alternatives when possible.",
    ],
  },

  {
    id: "reschedule",
    name: "Rescheduling",
    description:
      "The patient changes an existing appointment to another available time.",
    setupMessages: [
      "I need a cardiologist tomorrow at 10 AM.",
      "10 AM please.",
    ],
    messages: ["I want to move my appointment to 3 PM tomorrow."],
    expectedBehavior: [
      "The agent should identify the patient's existing appointment.",
      "The agent should check availability for the requested new time.",
      "The agent should reschedule the appointment if the new slot is available.",
      "The agent should confirm the new appointment details.",
    ],
  },

  {
    id: "cancellation",
    name: "Cancellation",
    description: "The patient cancels an existing appointment.",
    setupMessages: [
      "I need a cardiologist tomorrow at 10 AM.",
      "10 AM please.",
    ],
    messages: ["I want to cancel my appointment.", "Yes, please cancel it."],
    expectedBehavior: [
      "The agent should identify the patient's appointment.",
      "The agent should ask for confirmation before cancellation.",
      "The agent should cancel the appointment after confirmation.",
      "The agent should confirm the cancellation.",
      "The agent should not claim success if cancellation fails.",
    ],
  },
];
