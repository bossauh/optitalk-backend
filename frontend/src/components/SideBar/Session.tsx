/* eslint-disable react-hooks/exhaustive-deps */
import { Text } from "@nextui-org/react";
import { FC, useContext, useEffect, useState } from "react";
import { MdOutlineChatBubbleOutline } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import socket from "../../common/socket";
import { SessionType } from "../../common/types";
import StoreContext from "../../contexts/store";

// Components
import Box from "../Box";

const Session: FC<SessionType> = (props) => {
  const [active, setActive] = useState(false);
  const [name, setName] = useState(props.name);
  const navigate = useNavigate();

  const storeCtx = useContext(StoreContext);

  useEffect(() => {
    if (!storeCtx?.activeSession) {
      setActive(false);
      return;
    }

    if (storeCtx.activeSession.id === props.id) {
      setActive(true);
    } else {
      setActive(false);
    }
  }, [storeCtx?.activeSession]);

  useEffect(() => {
    const onAutoLabeled = (data: any) => {
      if (data.id === props.id) {
        setName(data.new_name);
        // if (storeCtx?.activeSession) {
        //   if (data.id === storeCtx.activeSession.id) {
        //     // storeCtx.setActiveSession({ ...storeCtx.activeSession, name: data.new_name });
        //   }
        // }
      }
    };
    socket.on("session-auto-labeled", onAutoLabeled);

    return () => {
      socket.off("session-auto-labeled", onAutoLabeled);
    };
  }, []);

  return (
    <Box
      css={{
        // border: "1px solid red",
        display: "flex",
        alignItems: "center",
        py: "15px",
        px: "20px",
        bg: active ? "$accents1" : "none",
        cursor: "pointer",
        transition: "background 0.1s",
        "&:hover": {
          bg: !active ? "$accents1" : undefined,
        },
        gap: "7px",
        position: "relative",
      }}
      onClick={() => {
        navigate(`/chat/s/${props.id}`);

        if (!props.new) {
          storeCtx?.setActiveSession(props);
        }
      }}
    >
      <Box
        css={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: active ? "5px" : "0px",
          bg: "$primary",
          transition: "width 0.1s",
        }}
      ></Box>
      <Box
        css={{
          transform: "translateY(5px)",
        }}
      >
        <MdOutlineChatBubbleOutline size={20} />
      </Box>
      <Text
        size={15}
        b
        css={{
          truncateText: "100%",
          color: active ? "$accents9" : "$accents9",
          userSelect: "none",
        }}
      >
        {name}
      </Text>
    </Box>
  );
};

export default Session;
