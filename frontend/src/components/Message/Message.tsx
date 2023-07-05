import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Group,
  Loader,
  MediaQuery,
  ThemeIcon,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { FC, useEffect, useState } from "react";
import { BiRefresh } from "react-icons/bi";
import { BsRobot } from "react-icons/bs";
import { FaBrain, FaEllipsisV } from "react-icons/fa";
import socket from "../../common/socket";
import { MessageProps, RealtimeResponseStreamType } from "../../common/types";
import MessageMarkdownRenderer from "../MessageMarkdownRenderer";
import Details from "./Details";
import Feedback from "./Feedback";

const Message: FC<MessageProps> = (props) => {
  const [commentsOpen, commentsOpenHandlers] = useDisclosure(false);
  const [realtimeResponse, setRealtimeResponse] = useState<RealtimeResponseStreamType>();
  const [hovered, setHovered] = useState(false);

  const theme = useMantineTheme();
  const isMd = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);

  useEffect(() => {
    const realtimeResponseCallback = (data: RealtimeResponseStreamType) => {
      setRealtimeResponse(data);
    };

    if (props.typing) {
      socket.on("realtime-response", realtimeResponseCallback);
    } else {
      socket.off("realtime-response", realtimeResponseCallback);
    }

    return () => {
      socket.off("realtime-response", realtimeResponseCallback);
    };
  }, [props.typing]);

  return (
    <MediaQuery
      smallerThan="sm"
      styles={{
        flexDirection: "column",
      }}
    >
      <Group
        spacing="sm"
        sx={{
          alignSelf: props.role === "assistant" ? "flex-start" : "flex-end",
        }}
        align="start"
        my={props.followup ? 3 : 6}
        noWrap
        onMouseEnter={() => {
          setHovered(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
        }}
      >
        {props.role === "assistant" && (
          <MediaQuery
            smallerThan="sm"
            styles={{
              display: props.followup ? "none" : "block",
            }}
          >
            <Avatar src={props.avatar} alt="Avatar" opacity={props.followup ? 0 : 1}>
              <BsRobot />
            </Avatar>
          </MediaQuery>
        )}
        <Flex direction="column" gap={6} align="start">
          {!props.followup && (
            <Group
              spacing="xs"
              position="apart"
              align="center"
              w="100%"
              sx={{
                flexDirection: props.role === "assistant" ? "row" : "row-reverse",
              }}
            >
              <Group
                spacing="xs"
                sx={{
                  alignSelf: props.role === "assistant" ? "flex-start" : "flex-end",
                }}
              >
                {props.name && (
                  <Title
                    order={6}
                    fw={600}
                    sx={{
                      opacity: props.role === "assistant" || hovered ? 1 : 0,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {props.name}
                  </Title>
                )}
                {props.role === "assistant" && <Badge size="xs">OptiTalk</Badge>}

                {(props.comments || (props.typing && realtimeResponse?.comments)) && (
                  <Tooltip
                    label={props.typing ? realtimeResponse?.comments : props.comments}
                    maw="400px"
                    multiline
                    opened={commentsOpen}
                    onClick={() => {
                      commentsOpenHandlers.toggle();
                    }}
                    onMouseEnter={() => {
                      commentsOpenHandlers.open();
                    }}
                    onMouseLeave={() => {
                      commentsOpenHandlers.close();
                    }}
                  >
                    <ThemeIcon color="gray" size="sm">
                      <FaBrain size={14} />
                    </ThemeIcon>
                  </Tooltip>
                )}
              </Group>
            </Group>
          )}
          <Flex align="center" gap={isMd ? "xs" : "sm"} direction={props.role === "assistant" ? "row" : "row-reverse"}>
            <Box
              sx={(theme) => ({
                padding: theme.spacing.xs,
                background: props.error
                  ? "rgba(160, 45, 0, 0.15)"
                  : props.role === "user"
                  ? theme.colors.teal[9]
                  : theme.colors.dark[6],
                borderRadius: theme.radius.sm,
                borderTopLeftRadius: props.role === "assistant" && !props.followup ? 0 : undefined,
                borderTopRightRadius: props.role === "user" && !props.followup ? 0 : undefined,
                maxWidth: "700px",
                border: props.error ? "1px solid red" : undefined,
                borderColor: props.error ? theme.colors.red[5] : undefined,
                alignSelf: props.role === "assistant" ? "flex-start" : "flex-end",
              })}
            >
              {props.typing && !realtimeResponse?.response ? (
                <Loader variant="dots" size="sm" />
              ) : (
                props.errorContents || (
                  <MessageMarkdownRenderer>
                    {props.typing ? (realtimeResponse?.response as string) : props.content}
                  </MessageMarkdownRenderer>
                )
              )}
            </Box>
            <MediaQuery
              largerThan="md"
              styles={{
                transition: "opacity 0.1s",
                opacity: hovered && props.contextMenuButton ? 1 : 0,
              }}
            >
              <ActionIcon
                color="gray.6"
                onClick={() => {
                  modals.open({
                    title: "Message Details",
                    children: (
                      <Details
                        delete={() => {
                          if (props.deleteFunction) {
                            props.deleteFunction(props.id);
                          }
                        }}
                        processingTime={props.processingTime}
                        knowledgeHint={props.knowledgeHint}
                      />
                    ),
                    centered: true,
                  });
                }}
                sx={{
                  display: props.errorContents == null && props.contextMenuButton ? "flex" : "none",
                }}
                size={isMd ? "xs" : "sm"}
              >
                <FaEllipsisV size={isMd ? 14 : 16} />
              </ActionIcon>
            </MediaQuery>
          </Flex>
          {props.regenerateButton && (
            <Group>
              <Button
                color="gray"
                variant="light"
                size="xs"
                leftIcon={<BiRefresh size={16} />}
                onClick={() => {
                  if (props.regenerateFunction) {
                    props.regenerateFunction();
                  }
                }}
              >
                Regenerate
              </Button>
              <Feedback messageId={props.id} />
            </Group>
          )}
          {props.retryButton && (
            <Button
              variant="light"
              size="xs"
              leftIcon={<BiRefresh size={16} />}
              onClick={() => {
                if (props.retryFunction) {
                  props.retryFunction();
                }
              }}
            >
              Retry
            </Button>
          )}
        </Flex>
      </Group>
    </MediaQuery>
  );
};

export default Message;
