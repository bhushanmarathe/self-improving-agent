import { evaluationScenarios } from "./scenarios.js";
import { runSelfImprovementLoop } from "./selfImprovement.js";

async function main() {
  console.log("=================================");
  console.log("Self-Improving Agent");
  console.log("=================================");

  const result = await runSelfImprovementLoop(evaluationScenarios);

  console.log("\n=================================");
  console.log("FINAL RESULT");
  console.log("=================================\n");

  for (const score of result.baselineScores) {
    console.log(
      `Baseline ${
        score.status === "PASS" ? "✓" : score.status === "SKIPPED" ? "⚠" : "✗"
      } ${score.scenarioName} - ${
        score.status === "SKIPPED"
          ? "SKIPPED"
          : `${Math.round(score.score * 100)}%`
      }`,
    );
  }

  console.log("");

  for (const score of result.improvedScores) {
    console.log(
      `Improved ${
        score.status === "PASS" ? "✓" : score.status === "SKIPPED" ? "⚠" : "✗"
      } ${score.scenarioName} - ${
        score.status === "SKIPPED"
          ? "SKIPPED"
          : `${Math.round(score.score * 100)}%`
      }`,
    );
  }

  console.log("\n---------------------------------");

  const baselineEvaluated = result.baselineScores.filter(
    (score) => score.status !== "SKIPPED",
  ).length;

  const improvedEvaluated = result.improvedScores.filter(
    (score) => score.status !== "SKIPPED",
  ).length;

  console.log(
    `Baseline Score: ${result.baselineOverallScore.toFixed(0)}% (${baselineEvaluated}/${result.baselineScores.length} evaluated)`,
  );

  console.log(
    `Improved Score: ${result.improvedOverallScore.toFixed(0)}% (${improvedEvaluated}/${result.improvedScores.length} evaluated)`,
  );

  //   console.log(`Improved Score: ${result.improvedOverallScore.toFixed(0)}%`);

  const scoreChange = result.improvedOverallScore - result.baselineOverallScore;

  console.log(
    `Score Change: ${scoreChange >= 0 ? "+" : ""}${scoreChange.toFixed(0)}%`,
  );

  console.log(
    `Regression Detected: ${result.regressionDetected ? "YES" : "NO"}`,
  );

  console.log(
    `Improvement Accepted: ${result.improvementAccepted ? "YES" : "NO"}`,
  );

  console.log("\n=================================");
}

main().catch((error) => {
  console.error("\nEvaluation failed:");
  console.error(error);

  process.exit(1);
});
