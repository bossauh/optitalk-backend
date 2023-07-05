/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useContext, useEffect, useState } from "react";
import { MessageProps, MessageType } from "../../common/types";
import { useActiveCharacter } from "../../common/utils";
import StoreContext from "../../contexts/store";
import Message from "../Message";

const MessagesRenderer: FC<{
  messages: MessageType[];
  delete: (id: string) => void;
  regenerate: () => void;
  newMessageSent: () => void;
  sending?: boolean;
}> = (props) => {
  const [activeCharacter] = useActiveCharacter();
  const [renderedMessages, setRenderedMessages] = useState<MessageProps[]>([]);

  const store = useContext(StoreContext);

  useEffect(() => {
    let preparedMessages = props.messages.map((message, i) => {
      // Get the name
      let name = message.name;
      if (!name) {
        if (message.role === "assistant") {
          if (message.characterId === activeCharacter?.id) {
            name = activeCharacter.name;
          } else {
            name = "Unknown";
          }
        } else {
          name = store?.displayName || "Anonymous";
        }
      }

      // Get the avatar
      let avatar: string | undefined = undefined;
      if (message.role === "assistant") {
        avatar = `/api/characters/render-character-avatar?character_id=${message.characterId}`;
      }

      let messageProps: MessageProps = {
        content: message.content,
        createdAt: message.createdAt,
        id: message.id,
        name: name,
        role: message.role,
        authorId: message.role === "assistant" ? message.characterId : message.createdBy,
        avatar: avatar,
        comments: message.comments || undefined,
        knowledgeHint: message.knowledgeHint || undefined,
        regenerateButton: false,
        processingTime: message.processingTime,
        deleteFunction: props.delete,
        contextMenuButton: true,
        new: message.new,
      };

      const previous = i === 0 ? null : props.messages[i - 1];
      if (previous) {
        if (previous.role === message.role) {
          messageProps.followup = true;
        } else {
          messageProps.followup = false;
        }
      }

      if (i === props.messages.length - 1 && message.role === "assistant" && message.generated) {
        if (previous && !props.sending) {
          if (previous.role === "user") {
            messageProps.regenerateButton = true;
            messageProps.regenerateFunction = props.regenerate;
          }
        }
      }

      return messageProps;
    });

    setRenderedMessages(preparedMessages);
    const latest = preparedMessages[preparedMessages.length - 1];
    if (latest && latest.new) {
      props.newMessageSent();
    }
  }, [props.messages, activeCharacter, props.sending]);

  return (
    <>
      {renderedMessages.map((i) => {
        return <Message key={i.id} {...i} />;
      })}
    </>
  );
};

export default MessagesRenderer;
