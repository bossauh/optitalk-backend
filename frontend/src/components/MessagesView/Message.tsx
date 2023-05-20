/* eslint-disable react-hooks/exhaustive-deps */
import { Badge, Button, Loading, Text, Tooltip } from "@nextui-org/react";
import { FC, useContext, useEffect, useState } from "react";
import { AiOutlineReload } from "react-icons/ai";
import { HiLightBulb } from "react-icons/hi";
import { MessageProps } from "../../common/types";
import StoreContext from "../../contexts/store";

// Components
import Box from "../Box";

const Message: FC<MessageProps> = (props) => {
  const storeCtx = useContext(StoreContext);
  const [name, setName] = useState<string>();
  const [avatar, setAvatar] = useState<string>();

  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (props.role === "assistant") {
      setName(storeCtx?.activeCharacter?.name);
      setAvatar(storeCtx?.activeCharacter?.image || "/images/character-icon.png");
    } else {
      setName(storeCtx?.displayName || "You");
    }
  }, [storeCtx?.activeCharacter, storeCtx?.displayName]);

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
              {props.comments && (
                <Tooltip content={props.comments}>
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
          {props.typing ? (
            <Loading type="points-opacity" />
          ) : (
            <Text
              css={{
                whiteSpace: "pre-wrap",
              }}
            >
              {props.content}
            </Text>
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
