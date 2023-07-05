/* eslint-disable react-hooks/exhaustive-deps */
import { Text } from "@nextui-org/react";
import { FC, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CharacterEditorContext from "../../contexts/character-editor";

// Components
import Box from "../Box";

const Item: FC<{ name: string; path: string }> = (props) => {
  const [active, setActive] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const context = useContext(CharacterEditorContext);

  useEffect(() => {
    setActive(location.pathname === "/create-character" + props.path);
  }, [location.pathname]);

  return (
    <Box
      css={{
        cursor: "pointer",
        px: "10px",
        py: "0px",
        border: "0px solid",
        borderColor: active ? "$primary" : "rgba(0,0,0,0)",
        bg: active ? "$accents1" : "none",
        transition: "border-color 0.15s",
        "@sm": {
          borderLeftWidth: "5px",
        },
        "@smMax": {
          borderBottomWidth: "5px",
        },
      }}
      onClick={() => {
        let form = document.getElementById("character-form") as HTMLFormElement;
        let isValid = form.reportValidity();
        if (!isValid) {
          return;
        }

        let params = "";
        if (context?.id) {
          params = "?characterId=" + context.id;
        }

        navigate("/create-character" + props.path + params);
      }}
    >
      <Text
        css={{
          color: active ? "white" : "$accents8",
        }}
      >
        {props.name}
      </Text>
    </Box>
  );
};

const CharacterCreationNavBar: FC = () => {
  return (
    <Box
      css={{
        display: "flex",
        boxShadow: "$sm",
        flexDirection: "column",
        bg: "$accents0",
        "@smMax": {
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
        },
      }}
    >
      <Item name="Basic Information" path="" />
      <Item name="Knowledge Base" path="/knowledge" />
      <Item name="Example Conversation" path="/example-conversation" />
    </Box>
  );
};

export default CharacterCreationNavBar;
