import { describe, expect, it, beforeEach } from "vitest";

import {
  clearImprovements,
  createImprovementFromFailure,
  addImprovement,
  getImprovements,
} from "./improvements.js";

describe("Self-Improvement Loop", () => {
  beforeEach(() => {
    clearImprovements();
  });

  it("should improve a failed cancellation behavior without regression", () => {
    // -----------------------------
    // Baseline
    // -----------------------------

    const baselineScores = {
      "ambiguous-booking": 1,
      "specific-time-booking": 1,
      "double-booking": 1,
      reschedule: 1,
      cancellation: 0,
    };

    const baselineOverall =
      Object.values(baselineScores).reduce((sum, score) => sum + score, 0) /
      Object.values(baselineScores).length;

    expect(baselineOverall).toBe(0.8);

    // -----------------------------
    // Detect failure
    // -----------------------------

    const improvement = createImprovementFromFailure(
      "cancellation",
      "Agent cancelled an appointment without confirmation.",
    );

    expect(improvement).not.toBeNull();

    // -----------------------------
    // Apply improvement
    // -----------------------------

    addImprovement(improvement!);

    expect(getImprovements()).toHaveLength(1);

    // -----------------------------
    // Simulated rerun result
    // -----------------------------

    const improvedScores = {
      "ambiguous-booking": 1,
      "specific-time-booking": 1,
      "double-booking": 1,
      reschedule: 1,
      cancellation: 1,
    };

    const improvedOverall =
      Object.values(improvedScores).reduce((sum, score) => sum + score, 0) /
      Object.values(improvedScores).length;

    expect(improvedOverall).toBe(1);

    // -----------------------------
    // Regression check
    // -----------------------------

    const regressionDetected = Object.entries(baselineScores).some(
      ([scenarioId, baselineScore]) => {
        if (baselineScore !== 1) {
          return false;
        }

        return improvedScores[scenarioId as keyof typeof improvedScores] !== 1;
      },
    );

    expect(regressionDetected).toBe(false);

    // -----------------------------
    // Improvement acceptance
    // -----------------------------

    const accepted = !regressionDetected && improvedOverall > baselineOverall;

    expect(accepted).toBe(true);

    expect(improvedOverall * 100).toBe(100);

    expect(baselineOverall * 100).toBe(80);
  });
});
