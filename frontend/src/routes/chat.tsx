/* eslint-disable react-hooks/exhaustive-deps */
import { ActionIcon, Flex, Textarea } from "@mantine/core";
import { FC, useContext, useEffect, useRef, useState } from "react";
import { BsFillSendFill } from "react-icons/bs";
import { useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { ChatErrorType, MessageType, SessionType } from "../common/types";
import { deserializeMessageData, deserializeSessionData } from "../common/utils";
import Box from "../components/Box";
import Footer from "../components/Footer";
import MessagesView from "../components/MessagesView";
import NoCharacterSelected from "../components/NoCharacterSelected";
import StoreContext from "../contexts/store";

const Chat: FC = () => {
  const storeCtx = useContext(StoreContext);

  const { sessionId } = useParams();

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loadMore, setLoadMore] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [error, setError] = useState<ChatErrorType>();

  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  };
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const chatboxRef = useRef<HTMLTextAreaElement | null>(null);

  const getMessagePayload = (message: MessageType, session: SessionType) => {
    let payload = {
      character_id: message.characterId,
      content: message.content,
      session_id: session.id,
    };

    if (storeCtx?.authenticated && storeCtx.displayName) {
      if (storeCtx.displayName.length < 100 && storeCtx.displayName.length > 0) {
        // @ts-expect-error
        payload.user_name = storeCtx.displayName;
      }
    }

    return payload;
  };

  const postMessage = (message: MessageType, session: SessionType) => {
    setShowTyping(true);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(getMessagePayload(message, session)),
    })
      .then((r) => r.json())
      .then((d) => {
        setShowTyping(false);

        if (d.status_code === 200) {
          const message = deserializeMessageData(d.payload);
          setMessages((prev) => {
            return [...prev, message];
          });
        }

        if (d.status_code === 403) {
          let message: string;
          if (!storeCtx?.authenticated) {
            message =
              "Oops! It seems like you've hit the limit of 5 messages per hour on non-registered accounts. Please register your account by clicking the Sign Up button at the sidebar to continue.";
          } else {
            message = `Oh no! It seems you've reached the 15 messages per 3 hours limit. You can either wait for 3 hours or [upgrade to OptiTalk+](/optitalk-plus) to enjoy unlimited messages, characters, and many more benefits for just 4.99$.`;
          }

          setError({ message: message });
        }

        if (d.status_code === 500) {
          setError({
            message: "A unknown server error has occurred while trying to generate a response. Please try again.",
          });
        }
      })
      .catch((error) => {
        setShowTyping(false);
        setError({
          message:
            "Too much traffic. Please retry. This is a temporary problem that we are working on solving as soon as possible.",
        });
        console.error(error);
      });
  };

  const retry = () => {
    const message = messages[messages.length - 1];
    const session = storeCtx?.activeSession;

    if (session !== undefined) {
      setError(undefined);
      postMessage(message, session);
    }
  };

  const onSubmit = (text: string) => {
    scrollToBottom();
    setError(undefined);

    if (text.trim().length === 0) {
      return;
    }

    if (storeCtx?.activeCharacter === undefined || storeCtx.userId === undefined) {
      return;
    }

    let session: SessionType;
    if (storeCtx.activeSession === undefined) {
      session = {
        id: uuidv4(),
        characterId: storeCtx.activeCharacter.id,
        createdBy: storeCtx.userId,
        name: "Generated Session",
        new: true,
      };
      storeCtx.setActiveSession(session);
    } else {
      session = storeCtx.activeSession;
    }

    const message: MessageType = {
      characterId: storeCtx.activeCharacter.id,
      content: text,
      createdAt: new Date().toISOString(),
      id: uuidv4(),
      role: "user",
    };

    setMessages((prev) => {
      return [...prev, message];
    });

    postMessage(message, session);
  };

  useEffect(() => {
    if (sessionId !== undefined && storeCtx?.activeCharacter) {
      fetch(`/api/chat/session?character_id=${storeCtx.activeCharacter.id}&session_id=${sessionId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.status_code === 200) {
            if (storeCtx.activeSession && storeCtx.activeSession.id === d.payload.id) {
              return;
            }
            storeCtx.setActiveSession(deserializeSessionData(d.payload));
          }
        });
    }
  }, [sessionId, storeCtx?.activeCharacter]);

  return (
    <Flex direction="column" gap="sm" h="100%">
      {storeCtx?.activeCharacter === undefined ? (
        <Flex
          direction="column"
          gap="xs"
          align="center"
          sx={{
            flex: 1,
            marginTop: "200px",
          }}
        >
          <NoCharacterSelected />
        </Flex>
      ) : (
        <Box
          css={{
            overflowY: "auto",
            flex: 1,
          }}
          ref={messagesRef}
          onScroll={() => {
            if (messagesRef.current) {
              if (messagesRef.current.scrollTop < 50) {
                return setLoadMore(true);
              }
            }
            setLoadMore(false);
          }}
        >
          <MessagesView
            scrollToBottom={scrollToBottom}
            loadMore={loadMore}
            messages={messages}
            setMessages={setMessages}
            showTyping={showTyping}
            error={error}
            retry={retry}
          />
        </Box>
      )}
      <Flex direction="column" gap="xs">
        <Textarea
          placeholder="Enter Chat"
          autosize
          maxRows={6}
          minRows={1}
          ref={chatboxRef}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e.currentTarget.value);
              e.currentTarget.value = "";
            }
          }}
          rightSection={
            <ActionIcon
              variant="filled"
              color="primary"
              mr="sm"
              onClick={() => {
                if (chatboxRef.current) {
                  onSubmit(chatboxRef.current.value);
                  chatboxRef.current.value = "";
                }
              }}
            >
              <BsFillSendFill />
            </ActionIcon>
          }
          disabled={storeCtx?.activeCharacter === undefined || showTyping}
        />
        <Box
          css={{
            alignSelf: "center",
          }}
        >
          <Footer />
        </Box>
      </Flex>
    </Flex>
  );
};

export default Chat;
