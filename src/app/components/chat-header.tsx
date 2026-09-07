"use client";

import { Button } from "@/components/ui/button";
import { UI_TEXT } from "@/lib/consts";
import { Bot, RotateCcw } from "lucide-react";
import { ModelSelector } from "./model-selector";

interface ChatHeaderProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onClearChat: () => void;
  hasMessages: boolean;
  isLoading: boolean;
}

export function ChatHeader({
  selectedModel,
  onModelChange,
  onClearChat,
  hasMessages,
  isLoading,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-md px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Bot className="size-4.5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight leading-none">
              {UI_TEXT.APP_NAME}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {UI_TEXT.APP_DESCRIPTION}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            disabled={isLoading}
          />

          {hasMessages && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearChat}
              disabled={isLoading}
              title={UI_TEXT.BUTTON_CLEAR}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5 mr-1" />
              <span className="hidden sm:inline">Limpiar</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
