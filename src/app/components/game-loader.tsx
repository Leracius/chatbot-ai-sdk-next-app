import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";

export const GameLoader = () => {
  return (
    <Message from="assistant">
      <MessageContent>
        <div className="flex items-center gap-2 p-2">
          <Loader />
          Cargando historia...
        </div>
      </MessageContent>
    </Message>
  );
};
