"use client";

import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import type { ChatMessage as ChatMessageType } from "@/lib/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { role, content } = message;

  return (
    <Message from={role}>
      <MessageContent>
        {role === "assistant" ? (
          <Response>{content}</Response>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
      </MessageContent>
    </Message>
  );
}
