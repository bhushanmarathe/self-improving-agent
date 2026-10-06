import { randomUUID } from "crypto";
import { Conversation } from "./types.js";

const conversations = new Map<string, Conversation>();

export function createConversation(patientId: string): Conversation {
  const conversation: Conversation = {
    id: randomUUID(),
    patientId,
    messages: [],
  };

  conversations.set(conversation.id, conversation);

  return conversation;
}

export function getConversation(
  conversationId: string,
): Conversation | undefined {
  return conversations.get(conversationId);
}

export function saveConversation(conversation: Conversation) {
  conversations.set(conversation.id, conversation);
}
