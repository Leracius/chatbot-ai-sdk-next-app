"use client";

import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@/components/ai-elements/prompt-input";
import { UI_TEXT } from "@/lib/consts";

interface ChatInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
}: ChatInputProps) {
  const isInputEmpty = input.trim().length === 0;

  return (
    <PromptInput onSubmit={onSubmit} className="border-border/60 shadow-lg">
      <PromptInputTextarea
        value={input}
        onChange={onInputChange}
        placeholder={UI_TEXT.PLACEHOLDER_INPUT}
        disabled={isLoading}
      />
      <PromptInputToolbar className="justify-between px-3 py-2 bg-muted/20">
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          Presiona <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Enter</kbd> para enviar, <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Shift + Enter</kbd> para salto de línea
        </span>
        <div className="ml-auto">
          <PromptInputSubmit
            disabled={isInputEmpty || isLoading}
            status={isLoading ? "submitted" : undefined}
            title={UI_TEXT.BUTTON_SEND}
          />
        </div>
      </PromptInputToolbar>
    </PromptInput>
  );
}
