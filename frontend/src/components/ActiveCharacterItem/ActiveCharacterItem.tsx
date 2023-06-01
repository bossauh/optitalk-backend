import { Button, Text } from "@nextui-org/react";
import { FC, useContext, useEffect, useState } from "react";
import { AiFillEdit } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { CharacterType } from "../../common/types";
import StoreContext from "../../contexts/store";

// Components
import { truncateText } from "../../common/utils";
import Box from "../Box";

const ActiveCharacterItem: FC<CharacterType> = (props) => {
  const [sessionsCount, setSessionsCount] = useState(0);

  const storeCtx = useContext(StoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/chat/sessions/count?character_id=" + props.id)
      .then((r) => r.json())
      .then((d) => {
        setSessionsCount(d.payload);
      });
  }, [props.id]);

  return (
    <Box
      css={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <Box
        css={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Text h3>Active Character</Text>

        {storeCtx?.userId === props.createdBy && (
          <Button
            css={{
              maxW: "40px",
              minWidth: "40px",
            }}
            size="sm"
            icon={<AiFillEdit size={17} />}
            onPress={() => {
              navigate("/create-character?characterId=" + props.id);
            }}
          />
        )}
      </Box>
      <Box
        css={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          "@mdMax": {
            gap: "25px",
          },
        }}
      >
        <Box
          css={{
            background: "$accents0",
            borderRadius: "10px",
            p: "15px",
            px: "20px",
            gap: "10px",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: "$xs",
            "&:hover": {
              transform: "translateY(-5px)",
              boxShadow: "$md",
            },
          }}
          onClick={() => {
            navigate("/character/" + props.id);
          }}
        >
          <Box
            css={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <img
              src={props.image || "/images/character-icon.png"}
              alt="Character Avatar"
              width={60}
              height={60}
              style={{
                borderRadius: "100px",
                objectFit: "cover",
              }}
            />
            <Box>
              <Text h3>{props.name}</Text>
              <Text
                css={{
                  color: "$accents8",
                }}
              >
                {sessionsCount} Session(s)
              </Text>
            </Box>
          </Box>
          <Text>{truncateText(props.description, 700)}</Text>
        </Box>

        {/* {!(
          props.personalities.length === 0 &&
          props.favoriteWords.length === 0 &&
          props.responseStyles.length === 0 &&
          props.knowledge.length === 0 &&
          props.exampleExchanges.length === 0
        ) && (
          <Box
            css={{
              background: "$accents0",
              borderRadius: "10px",
              p: "15px",
              px: "20px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              maxHeight: "370px",
              overflowY: "auto",
              minWidth: "250px",
            }}
          >
            <Box
              css={{
                display: "flex",
                flexWrap: "wrap",
                gap: "30px",
              }}
            >
              {props.personalities.length > 0 && <ListField title="Personalities" items={props.personalities} />}
              {props.favoriteWords.length > 0 && <ListField title="Favorite Words" items={props.favoriteWords} />}
              {props.responseStyles.length > 0 && <ListField title="Response Styles" items={props.responseStyles} />}
            </Box>

            {props.knowledge.length > 0 && <ListField title="Knowledge" items={props.knowledge} />}
            {props.exampleExchanges.length > 0 && (
              <ListField
                title="Example Conversation"
                items={(function () {
                  let items = props.exampleExchanges.map((i) => {
                    return `${i.role === "assistant" ? props.name : "User"}: ${i.content}`;
                  });

                  return items;
                })()}
              />
            )}
          </Box>
        )} */}
      </Box>
    </Box>
  );
};

export default ActiveCharacterItem;
