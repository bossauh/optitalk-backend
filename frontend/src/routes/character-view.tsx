import { Avatar, Button, Container, Loading, Text, Tooltip } from "@nextui-org/react";
import { FC, useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { BiArrowBack } from "react-icons/bi";
import { BsFillQuestionCircleFill } from "react-icons/bs";
import { useNavigate, useOutlet, useParams } from "react-router-dom";
import { CharacterType } from "../common/types";
import { deserializeCharacterData } from "../common/utils";
import Box from "../components/Box";
import CharacterViewTabs from "../components/CharacterViewTabs";
import StoreContext from "../contexts/store";

const CharacterView: FC = () => {
  const { characterId } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState<CharacterType>();
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState(0);
  const outlet = useOutlet({ details: details });

  const store = useContext(StoreContext);

  const [, setCookie, removeCookie] = useCookies(["activeCharacterId"]);

  useEffect(() => {
    fetch("/api/characters/details?character_id=" + characterId)
      .then((r) => r.json())
      .then((d) => {
        setLoading(false);
        if (d.status_code === 200) {
          const deserialized = deserializeCharacterData(d.payload);
          setDetails(deserialized);
          setFavorite(deserialized.favorite);
        }
      })
      .catch((e) => {
        console.error("An error has occurred while trying to fetch character details.", e);
        setLoading(false);
      });
  }, [characterId]);

  useEffect(() => {
    fetch("/api/chat/sessions/count?character_id=" + characterId)
      .then((r) => r.json())
      .then((d) => {
        setSessions(d.payload);
      });
  }, [characterId]);

  return (
    <Container
      css={{
        mt: "15px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        pb: "50px",
        "@smMax": {
          mt: "30px",
        },
      }}
    >
      <Box
        css={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <Button
          icon={<BiArrowBack size={18} />}
          css={{
            maxWidth: "40px",
            minWidth: "40px",
          }}
          size="sm"
          onPress={() => {
            navigate("/");
          }}
        />
      </Box>
      {details && !loading ? (
        <Box
          css={{
            mx: "10px",
            "@smMax": {
              mx: "0px",
            },
          }}
        >
          <Box
            css={{
              display: "flex",
              flexDirection: "row",
              alignItems: "start",
              gap: "10px",
              "@smMax": {
                flexDirection: "column",
                alignItems: "center",
              },
            }}
          >
            <Box
              css={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <Avatar
                src={details?.image || "/images/character-icon.png"}
                css={{
                  size: "120px",
                }}
                squared
                color="primary"
                bordered
                zoomed
              />
              <Box
                css={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  alignItems: "center",
                }}
              >
                <Button
                  size="xs"
                  color={store?.activeCharacter?.id === characterId ? "error" : "primary"}
                  onPress={() => {
                    if (store?.activeCharacter?.id === characterId) {
                      store?.setActiveCharacter(undefined);
                      removeCookie("activeCharacterId", { path: "/" });
                    } else {
                      store?.setActiveCharacter(details);
                      setCookie("activeCharacterId", characterId, { path: "/" });
                    }
                  }}
                >
                  {store?.activeCharacter?.id === characterId ? "Unselect" : "Use Character"}
                </Button>
                {store?.userId === details.createdBy && (
                  <Button
                    size="xs"
                    onPress={() => {
                      navigate("/create-character?characterId=" + characterId);
                    }}
                  >
                    Edit
                  </Button>
                )}
                <Tooltip content={!store?.authenticated ? "Please login to save characters" : undefined}>
                  <Button
                    size="xs"
                    disabled={!store?.authenticated}
                    onPress={() => {
                      let url = "/api/characters/add-to-favorites";
                      let method = "POST";

                      if (favorite) {
                        url = "/api/characters/remove-from-favorites";
                        method = "DELETE";
                      }

                      fetch(url + "?id=" + details.id, { method: method })
                        .then((r) => r.json())
                        .then((d) => {
                          if (favorite) {
                            setFavorite(false);
                          } else {
                            setFavorite(true);
                          }
                        });
                    }}
                  >
                    {favorite ? "Unfavorite" : "Add to Favorites"}
                  </Button>
                </Tooltip>
              </Box>
            </Box>
            <Box>
              <Text
                css={{
                  fontSize: "27px",
                }}
                b
              >
                {details?.name}
              </Text>
              <Box css={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Text color="$accents8">
                  <Text b color="inherit">
                    {details?.uses}
                  </Text>{" "}
                  Uses
                </Text>
                <Tooltip content="This is the amount of messages this character has received from all users.">
                  <Text
                    css={{
                      color: "$accents8",
                      mt: "3px",
                    }}
                  >
                    <BsFillQuestionCircleFill size={13} />
                  </Text>
                </Tooltip>
              </Box>
              <Box css={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Text color="$accents8">
                  <Text b color="inherit">
                    {sessions}
                  </Text>{" "}
                  Sessions
                </Text>
                <Tooltip content="This is the number of sessions you currently have with the character.">
                  <Text
                    css={{
                      color: "$accents8",
                      mt: "3px",
                    }}
                  >
                    <BsFillQuestionCircleFill size={13} />
                  </Text>
                </Tooltip>
              </Box>
            </Box>
          </Box>

          <CharacterViewTabs details={details as CharacterType} />

          {outlet ? (
            outlet
          ) : (
            <Box
              css={{
                mt: "20px",
                display: "flex",
                gap: "30px",
                flexWrap: "wrap",
              }}
            >
              <Box
                css={{
                  flexBasis: "65%",
                  "@smMax": {
                    flexBasis: "100%",
                  },
                }}
              >
                <Text h2>Description</Text>
                <Text
                  css={{
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {details?.description}
                </Text>
              </Box>
              <Box
                css={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                  flex: 1,
                  minWidth: "200px",
                }}
              >
                {(details?.personalities.length || 0) > 0 && (
                  <Box
                    css={{
                      bg: "$accents0",
                      p: "15px",
                      borderRadius: "$xs",
                      boxShadow: "$md",
                    }}
                  >
                    <Text h4>Personalities</Text>
                    <hr />
                    {details?.personalities.map((i) => {
                      return <Text key={i}>- {i}</Text>;
                    })}
                  </Box>
                )}
                {(details?.favoriteWords.length || 0) > 0 && (
                  <Box
                    css={{
                      bg: "$accents0",
                      p: "15px",
                      borderRadius: "$xs",
                      boxShadow: "$md",
                    }}
                  >
                    <Text h4>Favorite Words</Text>
                    <hr />
                    {details?.favoriteWords.map((i) => {
                      return <Text key={i}>- {i}</Text>;
                    })}
                  </Box>
                )}
                {(details?.responseStyles.length || 0) > 0 && (
                  <Box
                    css={{
                      bg: "$accents0",
                      p: "15px",
                      borderRadius: "$xs",
                      boxShadow: "$md",
                    }}
                  >
                    <Text h4>Response Styles</Text>
                    <hr />
                    {details?.responseStyles.map((i) => {
                      return <Text key={i}>- {i}</Text>;
                    })}
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      ) : loading ? (
        <Box
          css={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
          }}
        >
          <Box
            css={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <Text h3>Fetching Character</Text>
            <Loading size="lg" />
          </Box>
        </Box>
      ) : (
        <Box css={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <Box>
            <Text size={30} b>
              Not Found
            </Text>
            <Text size={16} color="$accents8">
              This character does not exist or has been deleted. <a href="/characters">Go back</a>
            </Text>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default CharacterView;
