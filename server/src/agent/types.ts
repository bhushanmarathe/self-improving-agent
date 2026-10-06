export interface ChatMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface Conversation {
  id: string;
  patientId: string;
  messages: ChatMessage[];
}
