export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt?: string;
}

export interface ChatRequest {
  messages: Array<{
    role: MessageRole;
    content: string;
  }>;
  model?: string;
}

export interface ChatResponse {
  message: string;
  model: string;
}
