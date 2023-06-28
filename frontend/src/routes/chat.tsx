/* eslint-disable react-hooks/exhaustive-deps */
import { Container } from "@nextui-org/react";
import { FC, useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { ChatErrorType, MessageType, SessionType } from "../common/types";
import { deserializeMessageData, deserializeSessionData } from "../common/utils";
import LayoutContext from "../contexts/layout";
import StoreContext from "../contexts/store";

// Components
import Box from "../components/Box";
import ChatBox from "../components/ChatBox";
import Footer from "../components/Footer";
import MessagesView from "../components/MessagesView";
import NoCharacterSelected from "../components/NoCharacterSelected";

const Chat: FC = () => {
  const storeCtx = useContext(StoreContext);
  const layoutCtx = useContext(LayoutContext);

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

  const postMessage = (message: MessageType, session: SessionType) => {
    setShowTyping(true);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        character_id: message.characterId,
        content: message.content,
        session_id: session.id,
      }),
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
    <Container
      css={{
        mt: "30px",
        position: "relative",
        height: `calc(100vh - ${(layoutCtx?.topBarHeight === undefined ? 0 : layoutCtx.topBarHeight) + 30}px)`,
        display: "flex",
        flexDirection: "column",
        // pb: "30px",
        flexWrap: "nowrap",
        gap: "10px",
      }}
      fluid
      responsive={false}
    >
      {storeCtx?.activeCharacter === undefined ? (
        <>
          <NoCharacterSelected />
          <Box css={{ flex: 1 }}></Box>
        </>
      ) : (
        <Box
          css={{
            flex: 1,
            overflowY: "auto",
            mx: "100px",
            "@mdMax": {
              mx: "70px",
            },
            "@smMax": {
              mx: "10px",
            },
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
      <Box
        css={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          mx: "100px",
          "@mdMax": {
            mx: "70px",
          },
          "@smMax": {
            mx: "10px",
          },
        }}
      >
        <ChatBox
          onSubmit={onSubmit}
          placeholder="Enter Chat"
          disabled={storeCtx?.activeCharacter === undefined || showTyping}
        />
        <Box
          css={{
            pb: "10px",
            alignSelf: "center",
          }}
        >
          <Footer />
        </Box>
      </Box>
    </Container>
  );
};

export default Chat;
