import {
  createImprovementFromFailure,
  addImprovement,
  removeImprovement,
} from "./improvements.js";

import { runAllScenarios, EvaluationResult } from "./runner.js";

import { scoreAllScenarios, ScenarioScore } from "./scorer.js";

import { EvaluationScenario } from "./scenarios.js";

export interface ImprovementRunResult {
  baselineResults: EvaluationResult[];
  baselineScores: ScenarioScore[];

  improvements: ReturnType<typeof createImprovementFromFailure>[];

  improvedResults: EvaluationResult[];
  improvedScores: ScenarioScore[];

  baselineOverallScore: number;
  improvedOverallScore: number;

  regressionDetected: boolean;
  improvementAccepted: boolean;
}

function calculateScore(scores: ScenarioScore[]): number {
  const evaluatedScores = scores.filter((score) => score.status !== "SKIPPED");

  if (evaluatedScores.length === 0) {
    return 0;
  }

  const total = evaluatedScores.reduce((sum, score) => sum + score.score, 0);

  return (total / evaluatedScores.length) * 100;
}

function findFailures(scores: ScenarioScore[]): ScenarioScore[] {
  return scores.filter((score) => score.status === "FAIL");
}

function hasRegression(
  baselineScores: ScenarioScore[],
  improvedScores: ScenarioScore[],
): boolean {
  for (const baseline of baselineScores) {
    if (baseline.status !== "PASS") {
      continue;
    }

    const improved = improvedScores.find(
      (score) => score.scenarioId === baseline.scenarioId,
    );

    if (!improved) {
      continue;
    }

    if (improved.status !== "PASS") {
      return true;
    }
  }

  return false;
}

export async function runSelfImprovementLoop(
  scenarios: EvaluationScenario[],
): Promise<ImprovementRunResult> {
  console.log("\n=================================");
  console.log("BASELINE EVALUATION");
  console.log("=================================\n");

  const baselineResults = await runAllScenarios(scenarios);

  const baselineScores = scoreAllScenarios(scenarios, baselineResults);

  const baselineOverallScore = calculateScore(baselineScores);

  console.log(`Baseline Score: ${baselineOverallScore.toFixed(0)}%`);

  const failures = findFailures(baselineScores);

  const skippedCount = baselineScores.filter(
    (score) => score.status === "SKIPPED",
  ).length;

  if (skippedCount === baselineScores.length) {
    throw new Error(
      "Evaluation could not run: all scenarios were skipped. Check the LLM/API rate limit or execution errors.",
    );
  }

  const improvements: ReturnType<typeof createImprovementFromFailure>[] = [];

  for (const failure of failures) {
    const improvement = createImprovementFromFailure(
      failure.scenarioId,
      failure.reasons.join(" "),
    );

    if (!improvement) {
      continue;
    }

    improvements.push(improvement);

    console.log("\n=================================");
    console.log("STRUCTURED IMPROVEMENT");
    console.log("=================================");

    console.log(JSON.stringify(improvement, null, 2));

    addImprovement(improvement);
  }

  if (improvements.length === 0) {
    console.log("\nNo failures detected. No new improvements were created.");

    return {
      baselineResults,
      baselineScores,
      improvements,
      improvedResults: baselineResults,
      improvedScores: baselineScores,
      baselineOverallScore,
      improvedOverallScore: baselineOverallScore,
      regressionDetected: false,
      improvementAccepted: false,
    };
  }

  console.log("\n=================================");
  console.log("RERUN AFTER IMPROVEMENT");
  console.log("=================================\n");

  const improvedResults = await runAllScenarios(scenarios);

  const improvedScores = scoreAllScenarios(scenarios, improvedResults);

  const improvedOverallScore = calculateScore(improvedScores);

  const regressionDetected = hasRegression(baselineScores, improvedScores);

  const improvementAccepted =
    !regressionDetected && improvedOverallScore > baselineOverallScore;

  if (!improvementAccepted) {
    console.log("\nImprovement was NOT accepted.");

    console.log("Rolling back newly-created improvements...");

    for (const improvement of improvements) {
      if (improvement) {
        removeImprovement(improvement.id);
      }
    }
  }

  console.log(`\nBaseline Score: ${baselineOverallScore.toFixed(0)}%`);

  console.log(`Improved Score: ${improvedOverallScore.toFixed(0)}%`);

  console.log(`Regression Detected: ${regressionDetected ? "YES" : "NO"}`);

  console.log(`Improvement Accepted: ${improvementAccepted ? "YES" : "NO"}`);

  return {
    baselineResults,
    baselineScores,
    improvements,
    improvedResults,
    improvedScores,
    baselineOverallScore,
    improvedOverallScore,
    regressionDetected,
    improvementAccepted,
  };
}
