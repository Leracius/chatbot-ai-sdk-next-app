"use client";

import { useZombieGame } from "./hooks/use-zombie-game";
import { GameLoader } from "./components/game-loader";
import { Message } from "@/components/ai-elements/message";
import { MessageContent } from "@/components/ai-elements/message";
import { GameMessage } from "./components/game-message";
import { GameInput } from "./components/game-input";
import { Conversation } from "@/components/ai-elements/conversation";
import {
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";

export default function Home() {
  //
  const {
    messages,
    input,
    isLoading,
    startGame,
    handleSubmit,
    handleInputChange,
  } = useZombieGame();

  return (
    <div className="font-sans h-screen mx-auto overflow-hidden">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent className="max-w-xl mx-auto">
            {messages.map((message) => (
              <GameMessage key={message.id} message={message} />
            ))}
            {isLoading && <GameLoader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="max-w-2xl w-full mx-auto pb-4">
          <GameInput
            input={input}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
