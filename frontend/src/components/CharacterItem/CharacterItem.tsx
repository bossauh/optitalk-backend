/* eslint-disable react-hooks/exhaustive-deps */
import { notifications } from "@mantine/notifications";
import { Button, Card, Text, Tooltip } from "@nextui-org/react";
import { FC, useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { AiFillDelete, AiFillEdit, AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { CharacterItemProps } from "../../common/types";
import { truncateText } from "../../common/utils";
import StoreContext from "../../contexts/store";

// Components
import Box from "../Box";
import DeleteCharacter from "./DeleteCharacter";

const CharacterItem: FC<CharacterItemProps> = (props) => {
  const store = useContext(StoreContext);

  const [descriptionLength, setDescriptionLength] = useState(110);
  const [isOwner, setIsOwner] = useState(false);
  const [favorite, setFavorite] = useState(props.favorite);

  const [, setCookie, removeCookie] = useCookies(["activeCharacterId"]);

  const navigate = useNavigate();

  useEffect(() => {
    let newState = 110;
    if (props.personalities.length === 0) {
      newState += 40;
    }
    if (props.favoriteWords.length === 0) {
      newState += 40;
    }
    setDescriptionLength(newState);
  }, []);

  useEffect(() => {
    if (store?.userId) {
      if (props.createdBy === store.userId) {
        setIsOwner(true);
        return;
      }
    }
    setIsOwner(false);
  }, [store?.userId]);

  return (
    <Card
      css={{
        w: "300px",
        h: "400px",
        "@smMax": {
          w: "280px",
        },
      }}
      isHoverable
      isPressable
      variant="shadow"
      onPress={() => {
        navigate("/character/" + props.id);
      }}
    >
      <Card.Header
        css={{
          gap: "10px",
          justifyContent: "space-between",
        }}
      >
        <Box
          css={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <img
            src={props.image || "/images/character-icon.png"}
            alt="Character"
            width={40}
            height={40}
            style={{
              borderRadius: "100px",
              objectFit: "cover",
            }}
          />
          <Text size={18} b>
            {props.name}
          </Text>
        </Box>
        <Tooltip content={!store?.authenticated ? "Please login to favorite characters" : undefined}>
          <Box>
            <Button
              icon={favorite ? <AiFillHeart size={18} /> : <AiOutlineHeart size={18} />}
              size="sm"
              css={{
                maxW: "30px",
                minWidth: "30px",
              }}
              // light
              disabled={!store?.authenticated}
              onPress={() => {
                if (favorite) {
                  fetch("/api/characters/remove-from-favorites?id=" + props.id, { method: "DELETE" })
                    .then((r) => r.json())
                    .then((d) => {
                      if (d.status_code !== 200) {
                        notifications.show({
                          title: "Error removing character from favorites",
                          message: "Please try again. If the problem persists, contact us.",
                          color: "red",
                        });
                      } else {
                        setFavorite(false);
                      }
                    });
                } else {
                  fetch("/api/characters/add-to-favorites?id=" + props.id, { method: "POST" })
                    .then((r) => r.json())
                    .then((d) => {
                      if (d.status_code !== 200) {
                        notifications.show({
                          title: "Error adding character to favorites",
                          message: "Please try again. If the problem persists, contact us.",
                          color: "red",
                        });
                      } else {
                        setFavorite(true);
                      }
                    });
                }
              }}
            />
          </Box>
        </Tooltip>
      </Card.Header>
      <Card.Divider />
      <Card.Body
        css={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <Box
          css={{
            display: "flex",
            gap: "2px",
            flexDirection: "column",
          }}
        >
          <Text h5>Description</Text>
          <Text
            css={{
              color: "$accents8",
            }}
          >
            {truncateText(props.description, descriptionLength)}
          </Text>
        </Box>
        <Box>
          {props.favoriteWords.length > 0 && (
            <Box
              css={{
                display: "flex",
                gap: "7px",
              }}
            >
              <Text h5>Favorite Words:</Text>
              <Text
                css={{
                  color: "$accents8",
                }}
              >
                {(function () {
                  let joined = props.favoriteWords.join(", ");
                  return truncateText(joined, 20);
                })()}
              </Text>
            </Box>
          )}
          {props.personalities.length > 0 && (
            <Box
              css={{
                display: "flex",
                gap: "7px",
              }}
            >
              <Text h5>Personalities:</Text>
              <Text
                css={{
                  color: "$accents8",
                }}
              >
                {(function () {
                  let joined = props.personalities.join(", ");
                  return truncateText(joined, 23);
                })()}
              </Text>
            </Box>
          )}
        </Box>
      </Card.Body>
      <Card.Divider />
      <Card.Footer
        css={{
          display: "block",
        }}
      >
        <Box
          css={{
            display: "flex",
            justifyContent: isOwner ? "space-between" : "center",
            gap: "10px",
          }}
        >
          <Button
            onPress={() => {
              if (store?.activeCharacter?.id === props.id) {
                store?.setActiveCharacter(undefined);
                removeCookie("activeCharacterId", { path: "/" });
              } else {
                store?.setActiveCharacter(props);
                setCookie("activeCharacterId", props.id, { path: "/" });
                navigate("/chat");
              }
              store?.setActiveSession(undefined);
            }}
            shadow={store?.activeCharacter?.id === props.id}
            auto
            color={store?.activeCharacter?.id === props.id ? "error" : "primary"}
          >
            {store?.activeCharacter?.id === props.id ? "Unselect" : "Use Character"}
          </Button>
          {isOwner && (
            <Box
              css={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Tooltip trigger="click" content={<DeleteCharacter id={props.id} onDelete={props.onDelete} />}>
                <Button
                  icon={<AiFillDelete />}
                  color="error"
                  css={{
                    maxW: "40px",
                    minWidth: "40px",
                  }}
                />
              </Tooltip>
              <Button
                icon={<AiFillEdit />}
                color="primary"
                css={{
                  maxW: "40px",
                  minWidth: "40px",
                }}
                onPress={() => {
                  navigate("/create-character?characterId=" + props.id);
                }}
              />
            </Box>
          )}
        </Box>
      </Card.Footer>
    </Card>
  );
};

export default CharacterItem;
