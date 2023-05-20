/* eslint-disable react-hooks/exhaustive-deps */
import { Loading } from "@nextui-org/react";
import { FC, useContext, useEffect, useState } from "react";
import { MessageType, MessageViewProps } from "../../common/types";
import { deserializeMessageData } from "../../common/utils";
import StoreContext from "../../contexts/store";

// Components
import Box from "../Box";
import Introduction from "./Introduction";
import Message from "./Message";

const MessagesView: FC<MessageViewProps> = (props) => {
  const storeCtx = useContext(StoreContext);

  const [page, setPage] = useState(1);
  const [isEnd, setIsEnd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!isEnd && !isLoading) {
      setPage((prev) => prev + 1);
    }
  }, [props.loadMore]);

  useEffect(() => {
    setPage(1);
    setIsEnd(false);

    if (!storeCtx?.activeSession?.new) {
      props.setMessages([]);
    }
  }, [storeCtx?.activeSession]);

  useEffect(() => {
    if (props.messages.length > 0 && page === 1) {
      props.scrollToBottom();
    }
  }, [props.messages, page]);

  useEffect(() => {
    if (storeCtx?.activeSession && storeCtx.activeCharacter) {
      setActive(true);

      setIsLoading(true);
      fetch(
        `/api/chat?character_id=${storeCtx.activeCharacter.id}&session_id=${storeCtx.activeSession.id}&sort=-1&page_size=25&page=${page}`
      )
        .then((r) => r.json())
        .then((d) => {
          const deserialized: MessageType[] = d.payload.data.map((item: any) => {
            return deserializeMessageData(item);
          });
          deserialized.reverse();

          props.setMessages((prev) => {
            return prev ? [...deserialized, ...prev] : deserialized;
          });
          setIsLoading(false);

          if (deserialized.length === 0 || deserialized.length < 25) {
            setIsEnd(true);
          }
        });
    } else {
      setActive(false);
    }
  }, [storeCtx?.activeSession, page]);

  return (
    <Box>
      {active ? (
        <Box
          css={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            py: "30px",
            pr: "15px",
          }}
        >
          {isLoading && <Loading size="lg" />}
          {props.messages.map((i, idx) => {
            let joined = false;

            if (idx > 0) {
              const before = props.messages[idx - 1];
              if (before.role === i.role) {
                joined = true;
              }
            }

            return <Message key={i.id} joined={joined} {...i} />;
          })}

          {props.showTyping && <Message typing characterId="" content="" createdAt="" id="" role="assistant" />}

          {props.error !== undefined && (
            <Message
              retry={props.retry}
              error
              characterId=""
              content={props.error.message}
              createdAt=""
              id=""
              role="assistant"
            />
          )}
        </Box>
      ) : (
        <Introduction />
      )}
    </Box>
  );
};

export default MessagesView;
