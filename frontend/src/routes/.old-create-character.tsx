/* eslint-disable react-hooks/exhaustive-deps */
import { Container, Loading, NextUIProvider, Text, createTheme } from "@nextui-org/react";
import { FC, useContext, useEffect, useState } from "react";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { CharacterEditorFields, KnowledgePatchType } from "../common/types";
import CharacterEditorContext from "../contexts/character-editor";
import StoreContext from "../contexts/store";

// Components
import { Anchor, Flex } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { deserializeCharacterFields, serializeCharacterFields } from "../common/utils";
import Box from "../components/Box";
import CharacterCreationNavBar from "../components/CharacterCreationNavBar/CharacterCreationNavBar";
import CharacterEditorLoading from "../components/CharacterEditorLoading";
import TopBarSecondary from "../components/TopBarSecondary";

const theme = createTheme({
  type: "dark",
  theme: {
    colors: {
      primaryTextGradient: "90deg, rgba(1,130,108,1) 0%, rgba(82,160,229,1) 100%",
      primaryContainerBackground: "#141517",

      background: "#1A1B1E",

      primary: "#01826C",
      primaryShadow: "#016856",
      primaryLight: "#016856",
      primaryLightHover: "#016856",
      primaryLightActive: "#014e41",

      secondary: "#175873",
      error: "#c63536",
      gradient: "linear-gradient(90deg, rgba(1,130,108,1) 0%, rgba(82,160,229,1) 100%)",
    },
  },
});

const CreateCharacter: FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const characterId = searchParams.get("characterId");

  const storeCtx = useContext(StoreContext);

  // Character Details
  const [loading, setLoading] = useState(true);
  const [httpMethod, setHttpMethod] = useState("POST");
  const [characterFields, setCharacterFields] = useState<CharacterEditorFields>({
    name: "",
    description: "",
  });
  const [knowledge, setKnowledge] = useState<KnowledgePatchType[]>([]);

  const [loadingOpen, setLoadingOpen] = useState(false);

  // Callback function used when the form is submitted
  const onSubmit = () => {
    let fields: CharacterEditorFields = {
      name: characterFields.name,
      description: characterFields.description,
      private: characterFields.private,
      image: characterFields.image || undefined,
      personalities: characterFields.personalities,
      favoriteWords: characterFields.favoriteWords,
      responseStyles: characterFields.responseStyles,
      exampleExchanges: characterFields.exampleExchanges || [],
    };
    fields = serializeCharacterFields(fields);

    if (httpMethod === "POST") {
      fields.knowledge = knowledge.map((i) => i.content);
    }

    const onError = (description: string, value: string) => {
      storeCtx?.openModal(
        <Box
          css={{
            display: "flex",
            flexDirection: "column",
            alignItems: "start",
            gap: "5px",
          }}
        >
          <Text>{description}</Text>
          <code>{value}</code>
        </Box>,
        "error",
        "Unknown Error",
        45_000
      );
    };

    const onSuccess = () => {
      setLoadingOpen(false);

      if (httpMethod === "POST") {
        navigate("/?tab=my-characters&sort=latest");
      } else {
        navigate(`/character/${characterId}`);
      }
      notifications.show({
        title: "Character saved",
        message:
          httpMethod === "POST"
            ? "Your character has been created! Check the My Characters tab to find your character."
            : "Changes to your character has been saved successfully.",
        color: "teal",
        autoClose: 5000,
      });
    };

    const updateKnowledge = () => {
      fetch(`/api/characters/knowledge`, {
        body: JSON.stringify({ knowledge_base: knowledge, character_id: characterId }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.status_code === 200) {
            onSuccess();
          } else {
            setLoadingOpen(false);
            onError(
              "An error has occurred while trying to get embeddings for the knowledge base.",
              JSON.stringify(d, null, 2)
            );
          }
        })
        .catch((e) => {
          setLoadingOpen(false);
          onError("A unknown error has occurred while trying to get embeddings for the knowledge base.", e);
        });
    };

    setLoadingOpen(true);
    fetch(`/api/characters${characterId ? "?character_id=" + characterId : ""}`, {
      method: httpMethod,
      body: JSON.stringify(fields),
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.status_code === 200) {
          if (httpMethod !== "PATCH") {
            onSuccess();
            return;
          }

          updateKnowledge();
        } else if (d.status_code === 409) {
          setLoadingOpen(false);
          onError(d.payload.message as string, "character limit reached");
        } else {
          setLoadingOpen(false);
          onError("An error has ocurred while trying to save the character.", JSON.stringify(d, null, 2));
        }
      });
  };

  useEffect(() => {
    if (!storeCtx?.authenticated && !storeCtx?.isAuthenticating) {
      navigate("/oauth/google-oauth");
    }
  }, [storeCtx?.isAuthenticating]);

  useEffect(() => {
    if (characterId) {
      setHttpMethod("PATCH");

      fetch("/api/characters/details?character_id=" + characterId)
        .then((r) => r.json())
        .then((d) => {
          const deserialized = deserializeCharacterFields(d.payload);
          setCharacterFields(deserialized);

          fetch("/api/characters/knowledge?page_size=99999&character_id=" + characterId)
            .then((r) => r.json())
            .then((d) => {
              const deserialized: KnowledgePatchType[] = d.payload.data.map((i: any) => {
                return { id: i.id, content: i.content };
              });
              setKnowledge(deserialized);
              setTimeout(() => {
                setLoading(false);
              }, 200);
            });
        });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    storeCtx?.fetchUserData();

    document.body.classList.add("legacy-bg");

    return () => {
      document.body.classList.remove("legacy-bg");
    };
  }, []);

  useEffect(() => {
    console.info("Character Fields", characterFields);
  }, [characterFields]);

  useEffect(() => {
    console.info("Knowledge", knowledge);
  }, [knowledge]);

  return (
    <Container
      fluid
      responsive={false}
      css={{
        pt: "30px",
        // pb: "60px",
        // background: "rgb(15, 15, 15)",
        // h: "100vh",
        // w: "100wh",
      }}
    >
      <TopBarSecondary title={characterId ? "Edit Character" : "Create a Character"} />
      <Box>
        {(storeCtx?.userPlanDetails?.characters || 0) >= (storeCtx?.userPlanDetails?.maxCharacters || 0) ? (
          <Flex direction="column" gap={2}>
            <Text color="warning">
              You have already reached or exceeded your maximum characters of {storeCtx?.userPlanDetails?.maxCharacters}
            </Text>
            <Text size="$sm">
              You can subscribe to <Anchor href="/optitalk-plus">OptiTalk+</Anchor> to get unlimited characters and
              messages.
            </Text>
          </Flex>
        ) : storeCtx?.userPlanDetails?.id === "basic" ? (
          <Text>
            You are using{" "}
            <Text span color="primary">
              OptiTalk+
            </Text>
            . You can create unlimited characters.
          </Text>
        ) : (
          <Flex direction="column" gap={2}>
            <Text>
              You have created {storeCtx?.userPlanDetails?.characters} out of {storeCtx?.userPlanDetails?.maxCharacters}{" "}
              characters.
            </Text>
            <Text size="$sm">
              You can subscribe to <Anchor href="/optitalk-plus">OptiTalk+</Anchor> to get unlimited characters and
              messages.
            </Text>
          </Flex>
        )}
      </Box>

      <CharacterEditorContext.Provider
        value={{
          onSubmit: onSubmit,
          fields: characterFields,
          id: characterId,
          setFields: setCharacterFields,
          method: httpMethod,
          knowledge: knowledge,
          setKnowledge: setKnowledge,
          setLoadingOpen: setLoadingOpen,
        }}
      >
        <Box
          css={{
            display: "flex",
            alignItems: "start",
            gap: "30px",
            mt: "50px",
            "@smMax": {
              flexDirection: "column",
              alignItems: "center",
            },
          }}
        >
          <CharacterCreationNavBar />
          <CharacterEditorLoading shown={loadingOpen} modifying={httpMethod === "PATCH"} />
          {!loading ? (
            <Outlet />
          ) : (
            <Box
              css={{
                mx: "auto",
                mt: "100px",
              }}
            >
              <Loading size="lg" />
            </Box>
          )}
        </Box>
      </CharacterEditorContext.Provider>
    </Container>
  );
};

export default CreateCharacter;
