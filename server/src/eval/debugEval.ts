import { runScenario } from "./runner.js";
import { evaluationScenarios } from "./scenarios.js";

async function main() {
  const scenario = evaluationScenarios.find(
    (scenario) => scenario.id === "specific-time-booking",
  );

  if (!scenario) {
    throw new Error("Scenario not found.");
  }

  console.log("Running:", scenario.name);

  const result = await runScenario(scenario);

  console.log("\nSETUP:");
  console.log(result.setupConversation);

  console.log("\nTEST:");
  console.log(result.testConversation);

  console.log("\nFINAL RESPONSE:");
  console.log(result.response);
}

main().catch((error) => {
  console.error("\nDEBUG ERROR:");
  console.error(error);
  process.exit(1);
});
