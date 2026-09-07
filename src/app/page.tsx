"use client";

import { AlertCircle, Sparkles } from "lucide-react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { UI_TEXT } from "@/lib/consts";
import { ChatHeader } from "./components/chat-header";
import { ChatInput } from "./components/chat-input";
import { ChatMessage } from "./components/chat-message";
import { useChat } from "./hooks/use-chat";

export default function Home() {
  const {
    messages,
    input,
    isLoading,
    error,
    selectedModel,
    setSelectedModel,
    handleInputChange,
    handleSubmit,
    clearChat,
  } = useChat();

  return (
    <div className="flex flex-col h-screen bg-background font-sans">
      <ChatHeader
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onClearChat={clearChat}
        hasMessages={messages.length > 0}
        isLoading={isLoading}
      />

      <main className="flex-1 overflow-hidden relative flex flex-col">
        <Conversation className="flex-1 h-full">
          <ConversationContent className="max-w-2xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 select-none">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary border border-primary/20 shadow-xs">
                  <Sparkles className="size-6" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground mb-1">
                  {UI_TEXT.EMPTY_STATE_TITLE}
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {UI_TEXT.EMPTY_STATE_SUBTITLE}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}

            {isLoading && (
              <Message from="assistant">
                <MessageContent>
                  <div className="flex items-center gap-2.5 py-1 text-muted-foreground text-xs">
                    <Loader size={14} />
                    <span>{UI_TEXT.LOADING_TEXT}</span>
                  </div>
                </MessageContent>
              </Message>
            )}

            {error && (
              <div className="my-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-medium">Atención:</p>
                  <p className="text-destructive/90">{error}</p>
                </div>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="max-w-2xl w-full mx-auto px-4 pb-4 pt-2">
          <ChatInput
            input={input}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
