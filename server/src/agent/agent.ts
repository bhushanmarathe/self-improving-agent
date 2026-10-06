import Groq from "groq-sdk";

import { env } from "../config/env.js";
import { SYSTEM_PROMPT } from "./systemPrompt.js";
import { tools } from "./tools.js";
import { executeTool } from "./toolExecutor.js";
import { Conversation } from "./types.js";
import { buildImprovementPrompt } from "./improvementPrompt.js";

const groq = new Groq({
  apiKey: env.groqApiKey,
});

const MODEL = "openai/gpt-oss-120b";

export async function runAgent(
  conversation: Conversation,
  userMessage: string,
) {
  conversation.messages.push({
    role: "user",
    content: userMessage,
  });

  const improvementPrompt = buildImprovementPrompt();

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `${SYSTEM_PROMPT}\n${improvementPrompt}`,
    },
    ...conversation.messages.map((message) => {
      if (message.role === "tool") {
        return {
          role: "tool" as const,
          content: message.content,
          tool_call_id: message.toolCallId!,
          name: message.name,
        };
      }

      return {
        role: message.role,
        content: message.content,
      };
    }),
  ];

  const MAX_ITERATIONS = 5;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: "auto",
      reasoning_effort: "low",
    });

    const assistantMessage = response.choices[0].message;

    // No tool call → final answer
    if (
      !assistantMessage.tool_calls ||
      assistantMessage.tool_calls.length === 0
    ) {
      const content = assistantMessage.content ?? "";

      conversation.messages.push({
        role: "assistant",
        content,
      });

      return content;
    }

    // IMPORTANT:
    // Preserve the complete assistant message,
    // including tool_calls.
    messages.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls) {
      if (toolCall.type !== "function") {
        continue;
      }

      try {
        const result = await executeTool(
          toolCall.function.name,
          toolCall.function.arguments,
          {
            patientId: conversation.patientId,
          },
        );

        const resultContent = JSON.stringify(result);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: resultContent,
        });

        conversation.messages.push({
          role: "tool",
          content: resultContent,
          toolCallId: toolCall.id,
          name: toolCall.function.name,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Tool execution failed.";

        const resultContent = JSON.stringify({
          error: errorMessage,
        });

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: resultContent,
        });

        conversation.messages.push({
          role: "tool",
          content: resultContent,
          toolCallId: toolCall.id,
          name: toolCall.function.name,
        });
      }
    }
  }

  throw new Error("Agent exceeded maximum tool-call iterations.");
}
