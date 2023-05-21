import { Card, Spacer, Text } from "@nextui-org/react";
import { FC, useContext, useEffect, useState } from "react";
import { CharacterType } from "../../common/types";
import { useMediaQuery, useScrollbarWidth } from "../../common/utils";
import LayoutContext from "../../contexts/layout";

// Components
import Box from "../Box";

interface ActiveCharacterProps extends CharacterType {
  sticky?: boolean;
}

const ActiveCharacter: FC<ActiveCharacterProps> = (props) => {
  const layoutCtx = useContext(LayoutContext);

  const [sessionsCount, setSessionsCount] = useState(0);

  const scrollBarWidth = useScrollbarWidth();

  const smMaxQuery = useMediaQuery(`(max-width: 960px)`);

  useEffect(() => {
    fetch("/api/chat/sessions/count?character_id=" + props.id)
      .then((r) => r.json())
      .then((data) => {
        setSessionsCount(data.payload);
      });
  }, [props.id]);

  return (
    <Card
      variant={props.sticky && !smMaxQuery ? "shadow" : "bordered"}
      css={{
        "@sm": {
          position: props.sticky ? "fixed" : "static",
          zIndex: 100,
          top: 75,
          left: layoutCtx?.sideBarWidth,
          right: 0,
          borderRadius: props.sticky ? "0px" : undefined,
          px: props.sticky ? "25px" : undefined,
          transition: "all 0.2s",
          maxWidth: `calc(100vw - ${
            layoutCtx?.sideBarWidth === undefined ? 0 : layoutCtx.sideBarWidth + scrollBarWidth
          }px)`,
        },
      }}
    >
      <Card.Header
        css={{
          gap: "10px",
          flexDirection: "column",
          alignItems: "start",
        }}
      >
        <Text
          size={20}
          b
          css={{
            transition: "max-height 0.3s ease 0.2s, opacity 0.2s ease",
            opacity: props.sticky && !smMaxQuery ? "100%" : "0%",
            maxHeight: props.sticky && !smMaxQuery ? "50px" : "0px",
            overflowY: "hidden",
          }}
        >
          Active Character
        </Text>
        <Box
          css={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <img
            src={props.image || "/images/character-icon.png"}
            alt="Character"
            width={50}
            height={50}
            style={{
              borderRadius: "100px",
              objectFit: "cover",
            }}
          />
          <Box
            css={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
            }}
          >
            <Text size={23} b>
              {props.name}
            </Text>
            <Text
              size={13}
              css={{
                color: "$accents8",
              }}
            >
              {sessionsCount} {sessionsCount > 1 || sessionsCount === 0 ? "Sessions" : "Session"}
            </Text>
          </Box>
        </Box>
      </Card.Header>
      <Card.Body
        css={{
          transition: "transform 0.2s",
          transform: props.sticky ? "translateY(-20px)" : "translateY(0px)",
        }}
      >
        <Box
          css={{
            overflowY: "auto",
            maxHeight: "200px",
          }}
        >
          <Text
            css={{
              color: "$accents9",
              whiteSpace: "pre-wrap",
            }}
          >
            {props.description}
          </Text>
        </Box>
        <Spacer
          css={{
            "@sm": {
              display: props.sticky ? "none" : "block",
            },
          }}
        />
        <Box
          css={{
            display: "flex",
            flexWrap: "wrap",
            gap: "50px",
            "@sm": {
              display: props.sticky ? "none" : "flex",
            },
          }}
        >
          {props.favoriteWords.length > 0 && (
            <Box
              css={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
            >
              <Text size={20} b>
                Favorite Words
              </Text>
              <Box
                css={{
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
                {props.favoriteWords.map((i) => {
                  return (
                    <Text
                      css={{
                        color: "$accents8",
                      }}
                      key={i}
                    >
                      - {i}
                    </Text>
                  );
                })}
              </Box>
            </Box>
          )}
          {props.personalities.length > 0 && (
            <Box
              css={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
            >
              <Text size={20} b>
                Personalities
              </Text>
              <Box
                css={{
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
                {props.personalities.map((i) => {
                  return (
                    <Text
                      css={{
                        color: "$accents8",
                      }}
                      key={i}
                    >
                      - {i}
                    </Text>
                  );
                })}
              </Box>
            </Box>
          )}
          {props.knowledge.length > 0 && (
            <Box
              css={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
            >
              <Text size={20} b>
                Knowledge
              </Text>
              <Box
                css={{
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
                {props.knowledge.map((i) => {
                  return (
                    <Text
                      css={{
                        color: "$accents8",
                      }}
                      key={i}
                    >
                      - {i}
                    </Text>
                  );
                })}
              </Box>
            </Box>
          )}

          {props.exampleExchanges.length > 0 && (
            <Box
              css={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
            >
              <Text size={20} b>
                Example Exchanges
              </Text>
              <Box
                css={{
                  maxHeight: "220px",
                  overflowY: "auto",
                  maxWidth: "700px",
                }}
              >
                {props.exampleExchanges.map((i) => {
                  return (
                    <Text
                      css={{
                        color: "$accents9",
                      }}
                      key={JSON.stringify(i)}
                    >
                      <Text b>{i.role === "user" ? "User" : "Bot"}</Text>: {i.content}
                    </Text>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      </Card.Body>
    </Card>
  );
};

export default ActiveCharacter;
