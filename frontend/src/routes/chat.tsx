/* eslint-disable react-hooks/exhaustive-deps */
import {
  ActionIcon,
  Anchor,
  Box,
  Flex,
  Loader,
  ScrollArea,
  Text,
  Textarea,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { nprogress } from "@mantine/nprogress";
import { FC, useCallback, useContext, useEffect, useRef, useState } from "react";
import { BsFillSendFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { MessageType } from "../common/types";
import { useActiveCharacter, useMessages, useSendMessage } from "../common/utils";
import Message from "../components/Message";
import MessagesAside from "../components/MessagesAside";
import MessagesHeader from "../components/MessagesHeader/MessagesHeader";
import MessagesRenderer from "../components/MessagesRenderer";
import StoreContext from "../contexts/store";

const Chat: FC = () => {
  const theme = useMantineTheme();
  const [character] = useActiveCharacter();
  const navigate = useNavigate();
  const store = useContext(StoreContext);

  const [role, setRole] = useState("user");

  const isMd = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const [asideOpened, setAsideOpened] = useState(false);

  const [messageError, setMessageError] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    if (isMd != null) {
      setAsideOpened(!isMd);
    }
  }, [isMd]);

  // Refs
  const chatboxRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  // Hook for managing messages
  const { messages, setMessages, loading, loadingMore, loadMore } = useMessages(
    character?.id,
    store?.activeSession?.id,
    store?.activeSession?.new
  );

  // Function whenever the messages area scroll position changes
  const onMessagesScrollChange = useCallback((position: { x: number; y: number }) => {
    if (position.y < 1) {
      loadMore();
    }
  }, []);

  // Function that gets called whenever there's an error sending a message
  const onChatError = useCallback((children: React.ReactNode) => {
    setMessageError(children);
  }, []);

  // Hook for sending messages
  const { sendMessage, sending, regenerate, setSending } = useSendMessage(
    onChatError,
    character?.id,
    store?.activeSession?.id
  );

  // Scroll to the bottom
  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({ top: messagesRef.current.scrollHeight });
    }
  };

  const deleteMessage = (id: string) => {
    fetch("/api/chat?id=" + id, {
      method: "DELETE",
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.status_code === 200) {
          setMessages((prev) => {
            let filtered = prev.filter((i) => i.id !== id);
            return filtered;
          });
        } else if (d.status_code === 404) {
          notifications.show({
            title: "Message not found",
            message: "Cannot delete a message that does not exist",
            color: "red",
          });
        } else {
          notifications.show({
            title: "Server error while trying to delete a message",
            message: "Please try again. If the problem persists, contact us.",
            color: "red",
          });
        }
      })
      .catch((e) => {
        console.error(e);
        notifications.show({
          title: "Network Error",
          message:
            "Failed to reach out to OptiTalk's server for a message deletion attempt. Please try again. If the problem persists, contact us.",
          color: "red",
        });
      });
  };

  const retry = () => {
    let previousMessage = messages[messages.length - 1];
    setMessages((prev) => prev.slice(0, -1));
    onSubmit(previousMessage.content);
  };

  const regenerateResponse = () => {
    if (sending) {
      return;
    }

    setMessages((prev) => prev.slice(0, -1));
    regenerate().then((data) => {
      if (data.message) {
        let message = data.message;
        message.new = true;
        setMessages((prev) => [...prev, message]);
      }
    });
  };

  // Submit message handler
  const onSubmit = (value: string) => {
    if (!value.trim()) {
      return;
    }

    setMessageError(null);

    let userName: string | undefined | null = store?.displayName;
    if (role === "assistant") {
      userName = null;
    }

    // Append the message if the user is the sender
    let id: string | undefined = undefined;
    if (role === "user") {
      let temporaryMessageObject: MessageType = {
        characterId: character?.id as string,
        content: value,
        createdAt: new Date().toUTCString(),
        id: uuidv4(),
        role: "user",
        createdBy: store?.userId || "unknown",
      };
      id = temporaryMessageObject.id;
      setMessages((prev) => [...prev, temporaryMessageObject]);
    }

    sendMessage(value, userName, role, id).then((data) => {
      if (data.message) {
        let message = data.message;
        message.new = true;
        setMessages((prev) => [...prev, message]);
      }
    });
  };

  // useEffect for showing the navigation loading at the top
  useEffect(() => {
    if (loading) {
      nprogress.start();
    } else {
      nprogress.complete();
      setTimeout(() => {
        scrollToBottom();
      }, 10);
      setTimeout(() => {
        nprogress.reset();
      }, 800);
    }
  }, [loading]);

  useEffect(() => {
    if (sending) {
      scrollToBottom();
    }
  }, [sending]);

  if (!character) {
    return (
      <Flex direction="column" h="100%" align="center" justify="center" p="lg">
        <Flex direction="column" gap="xs" align="center">
          <Title align="center" order={2}>
            No Character Selected
          </Title>
          <Text align="center" fz="sm">
            Select a character by going to the Characters page or{" "}
            <Anchor
              onClick={() => {
                navigate("/");
              }}
            >
              clicking here
            </Anchor>
          </Text>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex h="100%">
      <Flex
        direction="column"
        gap={0}
        sx={{
          flex: 1,
        }}
      >
        <MessagesHeader
          role={role}
          setRole={setRole}
          asideOpened={asideOpened}
          setAsideOpened={setAsideOpened}
          sending={sending}
        />
        {messages.length > 0 ? (
          <ScrollArea
            sx={{
              flex: 1,
              overflowY: "auto",
              marginTop: isSm ? "80px" : undefined,
            }}
            viewportRef={messagesRef}
            onScrollPositionChange={onMessagesScrollChange}
            px="lg"
          >
            <Flex direction="column">
              {loadingMore && (
                <Box
                  sx={{
                    alignSelf: "center",
                  }}
                >
                  <Loader size="sm" />
                </Box>
              )}

              <MessagesRenderer
                sending={sending}
                delete={deleteMessage}
                messages={messages}
                regenerate={regenerateResponse}
                newMessageSent={() => {
                  setSending(false);
                  scrollToBottom();
                  if (!isMd) {
                    chatboxRef.current?.focus();
                  }
                }}
              />

              {messageError && (
                <Message
                  authorId={character.id}
                  content=""
                  createdAt={new Date().toUTCString()}
                  id={uuidv4()}
                  role="assistant"
                  avatar={`/api/characters/render-character-avatar?character_id=${character.id}`}
                  name={character.name}
                  error
                  errorContents={messageError}
                  retryButton
                  retryFunction={retry}
                />
              )}

              {sending && role === "user" && (
                <Message
                  authorId={character.id}
                  content=""
                  createdAt={new Date().toUTCString()}
                  id={uuidv4()}
                  role="assistant"
                  avatar={`/api/characters/render-character-avatar?character_id=${character.id}`}
                  name={character.name}
                  typing
                />
              )}
              <Box h="30px"></Box>
            </Flex>
          </ScrollArea>
        ) : loading ? (
          // Shown when loading
          <Flex
            sx={{
              flex: 1,
            }}
            direction="column"
            align="center"
            justify="center"
            gap="md"
            p="lg"
          >
            <Title order={2}>Loading Messages...</Title>
            <Loader />
          </Flex>
        ) : (
          // Shown when a character is selected but there's no messages
          <Flex
            direction="column"
            align="center"
            justify="center"
            sx={{
              flex: 1,
            }}
            p="lg"
          >
            <Title align="center" order={2}>
              You are chatting with {character.name}
            </Title>
            <Text fz="sm" align="center">
              Send a message to begin your conversation with{" "}
              <Anchor href={`/character/${character.id}`}>{character.name}</Anchor>.
            </Text>
          </Flex>
        )}
        <Flex
          direction="column"
          gap="xs"
          px="lg"
          pb={!store?.authenticated || store.userPlanDetails?.subscriptionStatus === "activated" ? "lg" : undefined}
          sx={{
            boxShadow: "0px -31px 41px 8px rgba(26,27,30,1);",
            zIndex: 1,
          }}
        >
          <Textarea
            placeholder="Enter Chat"
            autosize
            maxRows={6}
            minRows={1}
            ref={chatboxRef}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.keyCode === 13 || e.which === 13) && !e.shiftKey) {
                if (!isSm) {
                  e.preventDefault();
                  onSubmit(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }
            }}
            onFocus={() => {
              if (isMd) {
                setTimeout(() => {
                  scrollToBottom();
                }, 100);
              }
            }}
            rightSection={
              sending ? (
                <Loader size="xs" />
              ) : (
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
              )
            }
            disabled={character === undefined || sending || messageError !== null}
          />
        </Flex>

        {store?.authenticated && store?.userPlanDetails?.subscriptionStatus !== "activated" && (
          <Flex direction="column" px="lg" align="center" py="sm">
            <Text fz="xs" align="center">
              {store?.userPlanDetails?.subscriptionStatus === "pending" ? (
                <>Your subscription is currently being activated. This should take just a few seconds.</>
              ) : (
                <>
                  You are currently limited to 15 messages per 3 hours.{" "}
                  <Anchor
                    onClick={() => {
                      navigate("/optitalk-plus");
                    }}
                  >
                    Upgrade to OptiTalk+
                  </Anchor>{" "}
                  to enjoy unlimited messages and more benefits.{" "}
                </>
              )}
            </Text>
          </Flex>
        )}
      </Flex>

      <MessagesAside key={store?.activeSession?.id} opened={asideOpened} setOpened={setAsideOpened} />
    </Flex>
  );
};

export default Chat;
