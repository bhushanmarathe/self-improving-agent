import { EvaluationResult } from "./runner.js";
import { EvaluationScenario } from "./scenarios.js";

export type EvaluationStatus = "PASS" | "FAIL" | "SKIPPED";

export interface ScenarioScore {
  scenarioId: string;
  scenarioName: string;
  status: EvaluationStatus;
  score: number;
  reasons: string[];
}

function containsAny(text: string, phrases: string[]): boolean {
  const normalizedText = text.toLowerCase();

  return phrases.some((phrase) =>
    normalizedText.includes(phrase.toLowerCase()),
  );
}

export function scoreScenario(
  scenario: EvaluationScenario,
  result: EvaluationResult,
): ScenarioScore {
  const testConversation = (result.testConversation ?? []).join("\n");

  const executionFailed = testConversation.includes("Execution Error:");

  if (executionFailed) {
    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      status: "SKIPPED",
      score: 0,
      reasons: [
        "Scenario could not be evaluated because the agent execution failed.",
      ],
    };
  }

  switch (scenario.id) {
    case "ambiguous-booking": {
      const askedForChoice = containsAny(testConversation, [
        "which",
        "choose",
        "would you like",
        "which slot",
        "which time",
      ]);

      const booked = containsAny(testConversation, [
        "booked successfully",
        "appointment has been booked",
        "appointment is booked",
        "your appointment has been booked",
      ]);

      if (askedForChoice && !booked) {
        return {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          status: "PASS",
          score: 1,
          reasons: ["Agent presented options and asked the patient to choose."],
        };
      }

      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        status: "FAIL",
        score: 0,
        reasons: [
          booked
            ? "Agent appears to have booked an appointment without an explicit slot selection."
            : "Agent did not clearly ask the patient to choose among available slots.",
        ],
      };
    }

    case "specific-time-booking": {
      const booked = containsAny(testConversation, [
        "booked successfully",
        "appointment has been booked",
        "appointment is booked",
        "your appointment has been booked",
      ]);

      const correctTime = containsAny(testConversation, [
        "10:00",
        "10:00 am",
        "10 am",
      ]);

      if (booked && correctTime) {
        return {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          status: "PASS",
          score: 1,
          reasons: ["Agent booked the explicitly requested 10 AM appointment."],
        };
      }

      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        status: "FAIL",
        score: 0,
        reasons: [
          "Agent did not clearly book the requested 10 AM appointment.",
        ],
      };
    }

    case "double-booking": {
      const unavailable = containsAny(testConversation, [
        "not available",
        "no longer available",
        "unavailable",
        "already booked",
        "isn't available",
        "is not available",
        "no other cardiology slots available",
        "no cardiology slots available",
        "no slots available",
      ]);

      const booked = containsAny(testConversation, [
        "booked successfully",
        "appointment has been booked",
        "appointment is booked",
        "your appointment has been booked",
      ]);

      if (unavailable && !booked) {
        return {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          status: "PASS",
          score: 1,
          reasons: ["Agent correctly prevented booking an unavailable slot."],
        };
      }

      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        status: "FAIL",
        score: 0,
        reasons: [
          "Agent did not clearly prevent the unavailable slot from being booked.",
        ],
      };
    }

    case "reschedule": {
      const rescheduled = containsAny(testConversation, [
        "rescheduled",
        "reschedule",
        "new time",
        "appointment has been moved",
        "moved your appointment",
      ]);

      const correctTime = containsAny(testConversation, [
        "15:00",
        "3:00 pm",
        "3 pm",
        "03:00 pm",
      ]);

      if (rescheduled && correctTime) {
        return {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          status: "PASS",
          score: 1,
          reasons: ["Agent successfully moved the appointment to 3 PM."],
        };
      }

      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        status: "FAIL",
        score: 0,
        reasons: ["Agent did not clearly reschedule the appointment to 3 PM."],
      };
    }

    case "cancellation": {
      const finalResponse = result.response;

      const cancelled = containsAny(finalResponse, [
        "cancelled successfully",
        "canceled successfully",
        "successfully cancelled",
        "successfully canceled",
        "appointment has been cancelled",
        "appointment has been canceled",
        "your appointment has been cancelled",
        "your appointment has been canceled",
      ]);

      if (cancelled) {
        return {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          status: "PASS",
          score: 1,
          reasons: [
            "Agent confirmed the appointment cancellation after patient confirmation.",
          ],
        };
      }

      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        status: "FAIL",
        score: 0,
        reasons: [
          "Agent did not complete and confirm the cancellation after patient confirmation.",
        ],
      };
    }

    default:
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        status: "FAIL",
        score: 0,
        reasons: ["Unknown evaluation scenario."],
      };
  }
}

export function scoreAllScenarios(
  scenarios: EvaluationScenario[],
  results: EvaluationResult[],
): ScenarioScore[] {
  return scenarios.map((scenario) => {
    const result = results.find((result) => result.scenarioId === scenario.id);

    if (!result) {
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        status: "FAIL",
        score: 0,
        reasons: ["Scenario did not produce a result."],
      };
    }

    return scoreScenario(scenario, result);
  });
}
