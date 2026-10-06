import prisma from "../lib/prisma.js";
import { createConversation } from "../agent/conversationStore.js";
import { runAgent } from "../agent/agent.js";
import { EvaluationScenario } from "./scenarios.js";

export interface EvaluationResult {
  scenarioId: string;
  scenarioName: string;
  setupConversation: string[];
  testConversation: string[];
  setupCompleted: boolean;
  response: string;
}

async function resetDatabaseState() {
  // Remove existing appointments first because AppointmentSlot
  // references Appointment through a foreign key.
  await prisma.appointment.deleteMany();

  // Make every existing slot available again.
  await prisma.appointmentSlot.updateMany({
    data: {
      isAvailable: true,
    },
  });
}

async function runMessages(
  conversation: ReturnType<typeof createConversation>,
  messages: string[],
  log: string[],
): Promise<string> {
  let lastResponse = "";

  for (const message of messages) {
    log.push(`Patient: ${message}`);

    lastResponse = await runAgent(conversation, message);

    log.push(`Agent: ${lastResponse}`);
  }

  return lastResponse;
}

export async function runScenario(
  scenario: EvaluationScenario,
): Promise<EvaluationResult> {
  // Reset PostgreSQL appointment state before every scenario.
  await resetDatabaseState();

  // Setup and test use the SAME conversation.
  const conversation = createConversation("patient-1");

  const setupConversation: string[] = [];
  const testConversation: string[] = [];

  let setupCompleted = true;

  // Establish the state required by the scenario.
  if (scenario.setupMessages && scenario.setupMessages.length > 0) {
    try {
      await runMessages(
        conversation,
        scenario.setupMessages,
        setupConversation,
      );
    } catch (error) {
      setupCompleted = false;

      console.error(`Setup error in scenario "${scenario.name}":`, error);

      const errorMessage =
        error instanceof Error ? error.message : "Setup failed.";

      setupConversation.push(`Setup Error: ${errorMessage}`);
    }
  }

  // Run the actual scenario.
  let response = "";

  try {
    response = await runMessages(
      conversation,
      scenario.messages,
      testConversation,
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Scenario execution failed.";

    console.error(`Execution error in scenario "${scenario.name}":`, error);

    testConversation.push(`Execution Error: ${errorMessage}`);

    response = `Execution Error: ${errorMessage}`;
  }

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    setupConversation,
    testConversation,
    setupCompleted,
    response,
  };
}

export async function runAllScenarios(
  scenarios: EvaluationScenario[],
): Promise<EvaluationResult[]> {
  const results: EvaluationResult[] = [];

  for (const scenario of scenarios) {
    console.log(`\nRunning scenario: ${scenario.name}`);

    const result = await runScenario(scenario);

    results.push(result);

    console.log(`Completed: ${scenario.name}`);
  }

  return results;
}
