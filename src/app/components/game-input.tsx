import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { UI_MESSAGES } from "@/lib/consts";

interface GameInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function GameInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
}: GameInputProps) {
  const inputTrimmed = input.trim();
  const inputDisabled = isLoading || inputTrimmed.length === 0;

  return (
    <PromptInput onSubmit={onSubmit} className="flex">
      <PromptInputTextarea
        value={input}
        onChange={onInputChange}
        rows={1}
        placeholder={UI_MESSAGES.PLACEHOLDERS.INPUT}
        disabled={isLoading}
      />
      <PromptInputSubmit disabled={inputDisabled} className="m-4" />
    </PromptInput>
  );
}
