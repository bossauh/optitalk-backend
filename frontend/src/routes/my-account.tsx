/* eslint-disable react-hooks/exhaustive-deps */
import { Container, Loading, Spacer, Text } from "@nextui-org/react";
import { FC, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CharacterType } from "../common/types";
import { deserializeCharacterData } from "../common/utils";
import StoreContext from "../contexts/store";

// Components
import Box from "../components/Box";
import CharacterItem from "../components/CharacterItem";
import TopBarSecondary from "../components/TopBarSecondary";

const MyAccount: FC = () => {
  const store = useContext(StoreContext);

  const [myCharacters, setMyCharacters] = useState<CharacterType[]>();

  const navigate = useNavigate();

  useEffect(() => {
    if (!store?.authenticated && !store?.isAuthenticating) {
      navigate("/");
    } else {
      fetch("/api/characters?private=True&page_size=9999")
        .then((r) => r.json())
        .then((d) => {
          const deserialized = d.payload.data.map((i: any) => {
            return deserializeCharacterData(i);
          });

          setMyCharacters(deserialized);
        });
    }
  }, [store?.isAuthenticating]);

  return (
    <Container
      css={{
        mt: "30px",
        pb: "80px",
      }}
    >
      <TopBarSecondary title="My Account" />
      <Box>
        <Text
          css={{
            color: "$accents8",
          }}
        >
          Username: {store?.displayName}
        </Text>
      </Box>
      <Spacer y={0.5} />
      <Box>
        <Text>This page shows information about your account such as the characters you have created.</Text>
      </Box>
      <Spacer y={2} />
      <Box>
        <Text
          h2
          css={{
            "@smMax": {
              textAlign: "center",
            },
          }}
        >
          My Characters
        </Text>
        <Spacer />
        <Box
          css={{
            display: "flex",
            flexWrap: "wrap",
            gap: "25px",
            "@smMax": {
              justifyContent: "center",
            },
          }}
        >
          {myCharacters === undefined ? (
            <Loading
              size="xl"
              css={{
                mx: "auto",
                mt: "100px",
              }}
            />
          ) : (
            myCharacters.map((i) => {
              return (
                <CharacterItem
                  key={i.id}
                  {...i}
                  onDelete={(id) => {
                    const updatedCharacters = myCharacters.filter((i) => i.id !== id);
                    setMyCharacters(updatedCharacters);
                  }}
                />
              );
            })
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default MyAccount;
