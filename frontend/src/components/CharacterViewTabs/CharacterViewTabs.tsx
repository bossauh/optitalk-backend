/* eslint-disable react-hooks/exhaustive-deps */
import { Text } from "@nextui-org/react";
import { FC, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CharacterType } from "../../common/types";
import Box from "../Box";

const Item: FC<{ title: string; path: string; characterId: string }> = ({ title, path, characterId }) => {
  const [active, setActive] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const itemPath = "/character/" + characterId + path;

    // If the current path exactly matches the item's path
    if (location.pathname === itemPath) {
      setActive(true);
    } else {
      setActive(false);
    }
  }, [location.pathname]);

  return (
    <Box
      onClick={() => {
        navigate("/character/" + characterId + path);
      }}
      css={{
        border: "0px solid",
        borderColor: active ? "$primary" : "rgba(0,0,0,0)",
        transition: "border-color 0.2s",
        borderBottomWidth: "2px",
        "@xsMax": {
          borderBottomWidth: "0px",
          borderLeftWidth: "3px",
          px: "7px",
          py: "5px",
          bg: active ? "$accents0" : undefined,
        },
      }}
    >
      <Text
        color={active ? "white" : "$accents8"}
        css={{
          userSelect: "none",
          cursor: "pointer",
          transition: "font-style 0.2s",
        }}
      >
        {title}
      </Text>
    </Box>
  );
};

const CharacterViewTabs: FC<{ details: CharacterType }> = ({ details }) => {
  return (
    <Box
      css={{
        mt: "30px",
        display: "flex",
        alignItems: "center",
        gap: "25px",
        flexWrap: "wrap",
        "@smMax": {
          justifyContent: "center",
        },
        "@xsMax": {
          flexDirection: "column",
          justifyContent: "start",
          alignItems: "start",
          gap: "0px",
        },
      }}
    >
      <Item title="Basic Information" path="" characterId={details.id} />
      <Item title="Example Conversation" path="/example-conversation" characterId={details.id} />
      <Item title="Knowledge Base" path="/knowledge-base" characterId={details.id} />
    </Box>
  );
};

export default CharacterViewTabs;
