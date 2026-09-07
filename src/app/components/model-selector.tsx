"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_MODELS } from "@/lib/models";
import { Sparkles } from "lucide-react";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  disabled,
}: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedModel}
        onValueChange={onModelChange}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 gap-2 px-2.5 text-xs font-medium border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors">
          <Sparkles className="size-3.5 text-amber-500 shrink-0" />
          <SelectValue placeholder="Seleccionar motor" />
        </SelectTrigger>
        <SelectContent align="end" className="w-64">
          {AVAILABLE_MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id} className="cursor-pointer py-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 font-medium text-sm">
                  <span>{model.name}</span>
                  {model.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                      {model.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground leading-tight">
                  {model.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
