/* eslint-disable react-hooks/exhaustive-deps */
import { Badge, Button, Loading, Text, Tooltip } from "@nextui-org/react";
import { FC, useContext, useEffect, useState } from "react";
import { AiOutlineReload } from "react-icons/ai";
import { HiLightBulb } from "react-icons/hi";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { nord } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import socket from "../../common/socket";
import { MessageProps, RealtimeResponseStreamType } from "../../common/types";
import StoreContext from "../../contexts/store";

// Components
import Box from "../Box";

const Message: FC<MessageProps> = (props) => {
  const storeCtx = useContext(StoreContext);
  const [name, setName] = useState<string>();
  const [avatar, setAvatar] = useState<string>();

  const [hovered, setHovered] = useState(false);

  // Realtime Response States
  const [realtimeResponse, setRealtimeResponse] = useState<RealtimeResponseStreamType>();

  useEffect(() => {
    if (props.role === "assistant") {
      setName(storeCtx?.activeCharacter?.name);
      setAvatar(storeCtx?.activeCharacter?.image || "/images/character-icon.png");
    } else {
      setName(storeCtx?.displayName || "You");
    }
  }, [storeCtx?.activeCharacter, storeCtx?.displayName]);

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
    <Box
      css={{
        marginLeft: props.role === "user" ? "auto" : undefined,
        marginRight: props.role === "assistant" ? "auto" : undefined,

        flexDirection: props.role === "user" ? "row-reverse" : "row",
        display: "flex",
        gap: "10px",
        alignItems: "start",
        width: "100%",
      }}
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
    >
      {props.role === "assistant" && (
        <img
          src={avatar}
          alt="Avatar"
          style={{
            borderRadius: "100px",
            width: "40px",
            height: "40px",
            objectFit: "cover",
            transform: "translateY(30px)",
            opacity: props.joined ? "0%" : "100%",
          }}
        />
      )}
      <Box
        css={{
          display: "flex",
          flexDirection: "column",
          gap: "7px",
          alignItems: props.role === "assistant" ? "start" : "end",
        }}
      >
        <Box
          css={{
            alignItems: "center",
            gap: "10px",
            display: props.joined ? "none" : "flex",
          }}
        >
          <Text
            size={14}
            css={{
              color: "$accents8",
              opacity: hovered || props.role === "assistant" ? "100%" : "0%",
              transition: "opacity 0.15s",
            }}
          >
            {name}
          </Text>

          {props.role === "assistant" && (
            <Box
              css={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Badge size="sm" color={props.error ? "error" : "primary"}>
                {props.error ? "Error" : "OptiTalk"}
              </Badge>
              {(props.comments || (props.typing && realtimeResponse?.comments)) && (
                <Tooltip content={props.typing ? realtimeResponse?.comments || "" : props.comments}>
                  <Text
                    size={18}
                    css={{
                      color: "$accents8",
                    }}
                  >
                    <HiLightBulb />
                  </Text>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>
        <Box
          css={{
            bg: props.role === "user" ? "$primary" : props.error ? "$error" : "$accents1",
            borderRadius: "15px",
            padding: "10px",
            maxWidth: "700px",
            minWidth: "0px",
          }}
        >
          {props.typing && !realtimeResponse?.response ? (
            <Loading type="points-opacity" />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline ? (
                    <SyntaxHighlighter
                      {...props}
                      children={String(children).replace(/\n$/, "")}
                      style={nord}
                      language={match ? match[1] : undefined}
                      PreTag="div"
                    />
                  ) : (
                    <code {...props} className={className}>
                      {children}
                    </code>
                  );
                },
              }}
              className="react-markdown"
            >
              {props.typing ? realtimeResponse?.response || "" : props.content}
            </ReactMarkdown>
          )}
        </Box>
        {props.error && (
          <Button
            icon={<AiOutlineReload size={18} />}
            auto
            onPress={() => {
              if (props.retry) {
                props.retry();
              }
            }}
          >
            Retry
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default Message;
