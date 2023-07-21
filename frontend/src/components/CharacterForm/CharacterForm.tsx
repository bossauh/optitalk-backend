/* eslint-disable react-hooks/exhaustive-deps */
import {
  Button,
  Divider,
  Flex,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { hasLength } from "@mantine/form";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { nprogress } from "@mantine/nprogress";
import { FC, useCallback, useEffect } from "react";
import { AiFillDelete, AiOutlinePlus } from "react-icons/ai";
import { BiError, BiSave } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { deleteCharacter, deserializeCharacterData, useActiveCharacter, useCharacter } from "../../common/utils";
import { CharacterFormProvider, useCharacterForm } from "../../contexts/characterFormContext";
import BasicTab from "./BasicTab";
import ExampleConversations from "./ExampleConversations";
import KnowledgeBase from "./KnowledgeBase";

const CharacterForm: FC<{
  characterId?: string;
  previewMode?: boolean;
  tab?: string;
  onTabChange?: (tab: string) => void;
}> = (props) => {
  const form = useCharacterForm({
    initialValues: {
      name: "",
      avatar_id: null,
      public_description: "",
      description: "",
      personalities: [],
      response_styles: [],
      favorite_words: [],
      knowledge: [],
      example_exchanges: [],
      private: false,
      definition_visibility: true,
      nsfw: false,
      tags: [],

      // Non-submittable
      characterId: null,
      previewOnly: props.previewMode || false,
    },
    validate: {
      name: hasLength({ min: 1, max: 64 }, "Value must be 1 to 64 characters."),
      public_description: hasLength({ min: 1, max: 4096 }, "Value must be 1 to 4096 characters."),
      description: hasLength({ min: 1, max: 2048 }, "Description must be 1 to 2048 characters."),
      personalities: (values) => {
        for (let index = 0; index < values.length; index++) {
          const element = values[index];
          if (element.length > 100) {
            return "One or more personalities exceeds 100 characters.";
          }
        }

        if (values.length > 10) {
          return "There can only be 10 maximum personalities.";
        }
      },
      response_styles: (values) => {
        for (let index = 0; index < values.length; index++) {
          const element = values[index];
          if (element.length > 100) {
            return "One or more response styles exceeds 100 characters.";
          }
        }

        if (values.length > 10) {
          return "There can only be 10 maximum response styles.";
        }
      },
      favorite_words: (values) => {
        for (let index = 0; index < values.length; index++) {
          const element = values[index];
          if (element.length > 100) {
            return "One or more favorite words exceeds 100 characters.";
          }
        }

        if (values.length > 10) {
          return "There can only be 20 maximum favorite words.";
        }
      },
      knowledge: {
        content: hasLength({ min: 1, max: 1024 }, "Knowledge must be 1 to 1024 characters."),
      },
      example_exchanges: {
        content: hasLength({ min: 1, max: 2048 }, "Example message must be 1 to 2048 characters."),
      },
      tags: (values) => {
        if (values.length > 3) {
          return "There can only be 3 maximum tags.";
        }
      },
    },
  });

  const theme = useMantineTheme();
  const isMd = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);

  const [, , characterDetails] = useCharacter(props.characterId);
  const [, setActiveCharacter] = useActiveCharacter();
  const [loading, loadingHandler] = useDisclosure(true);
  const navigate = useNavigate();

  const onTabChange = useCallback((value: string) => {
    if (props.onTabChange) {
      props.onTabChange(value);
    }
  }, []);

  const openLoadingModal = useCallback((text: string) => {
    modals.open({
      centered: true,
      withCloseButton: false,
      closeOnClickOutside: false,
      children: (
        <Flex gap="md" direction="column" align="center">
          <Text fz="lg" fw="bold" align="center">
            {text}
          </Text>
          <Loader />
        </Flex>
      ),
    });
  }, []);

  const openMaxCharactersModal = useCallback(() => {
    modals.open({
      centered: true,
      title: "Maximum characters reached",
      children: (
        <Stack>
          <Flex gap="xs" align="flex-start">
            <ThemeIcon color="red" size="xl" variant="filled">
              <BiError size={26} />
            </ThemeIcon>
            <Text fz="sm">
              You have reached your maximum amount of 8 characters for a free account. Upgrade to OptiTalk+ for just
              $4.99/month to get unlimited characters and messages. Alternatively, you can delete your previous
              characters.
            </Text>
          </Flex>
          <Button
            variant="gradient"
            onClick={() => {
              navigate("/optitalk-plus");
              modals.closeAll();
            }}
          >
            Get OptiTalk+
          </Button>
        </Stack>
      ),
    });
  }, []);

  const onSubmit = useCallback(
    (values: typeof form.values) => {
      let method = props.characterId ? "PATCH" : "POST";
      let url = "/api/characters";

      if (method === "PATCH") {
        url = `/api/characters?character_id=${props.characterId}`;
      }

      const sendRequest = (data: object) => {
        openLoadingModal(method === "POST" ? "Posting character..." : "Saving character...");
        fetch(url, { method: method, body: JSON.stringify(data), headers: { "Content-Type": "application/json" } })
          .then((r) => r.json())
          .then((d) => {
            modals.closeAll();

            if (d.status_code === 200) {
              let deserialized = deserializeCharacterData(d.payload);
              if (method === "POST") {
                notifications.show({
                  title: "Character created",
                  message: "Your character has been successfully created and is now selected as the active character.",
                  color: "teal",
                });
                setActiveCharacter(deserialized);
              } else {
                notifications.show({
                  title: "Character edited",
                  message: "Your character has been successfully modified.",
                  color: "teal",
                });
              }
              nprogress.start();
              setTimeout(() => {
                window.location.href = `/character/${deserialized.id}`;
              }, 1000);
            } else if (d.status_code === 409) {
              openMaxCharactersModal();
            } else {
              notifications.show({
                title: "Unknown error",
                message: `A unknown error has occurred while trying to ${
                  method === "POST" ? "create" : "modify"
                } your character. Please try again by refreshing the page. If the problem persists, contact us.`,
                color: "red",
              });
            }
          })
          .catch((e) => {
            modals.closeAll();
            console.error(e);
            notifications.show({
              title: "Network error",
              message:
                "A unknown error has occurred. This should not happen unless the site is updating/down. Please try again by refreshing the page. If the problem persists, contact us.",
              color: "red",
            });
          });
      };

      let body: any = {
        name: values.name,
        public_description: values.public_description,
        description: values.description,
        personalities: values.personalities,
        favorite_words: values.favorite_words,
        example_exchanges: values.example_exchanges,
        response_styles: values.response_styles,
        private: values.private,
        avatar_id: values.avatar_id,
        definition_visibility: values.definition_visibility,
        knowledge: undefined,
        nsfw: values.nsfw,
        tags: values.tags,
      };

      if (method === "POST") {
        body.knowledge = [];
        for (let index = 0; index < values.knowledge.length; index++) {
          const element = values.knowledge[index];
          body.knowledge.push(element.content);
        }
        sendRequest(body);
      } else {
        openLoadingModal("Saving knowledge base...");
        fetch("/api/characters/knowledge", {
          method: "PATCH",
          body: JSON.stringify({ knowledge_base: values.knowledge, character_id: props.characterId }),
          headers: { "Content-Type": "application/json" },
        })
          .then((r) => r.json())
          .then(() => {
            sendRequest(body);
          })
          .catch((e) => {
            modals.closeAll();
            console.error(e);
            notifications.show({
              title: "Network error",
              message:
                "A unknown error has occurred. This should not happen unless the site is updating/down. Please try again by refreshing the page. If the problem persists, contact us.",
              color: "red",
            });
          });
      }
    },
    [props.characterId]
  );

  const onError = useCallback((errors: typeof form.errors) => {
    if (errors) {
      notifications.show({ title: "Errors found", message: "Please check all fields in all tabs.", color: "red" });
    }
  }, []);

  useEffect(() => {
    loadingHandler.open();

    if (characterDetails) {
      form.setValues({
        name: characterDetails.name,
        avatar_id: characterDetails.avatarId,
        public_description: characterDetails.publicDescription,
        description: characterDetails.description as string,
        example_exchanges: characterDetails.exampleExchanges,
        characterId: characterDetails.id,
        favorite_words: characterDetails.favoriteWords,
        definition_visibility: characterDetails.definitionVisibility,
        personalities: characterDetails.personalities,
        private: characterDetails.private,
        response_styles: characterDetails.responseStyles,
        nsfw: characterDetails.nsfw,
        tags: characterDetails.tags,
      });

      // Get knowledge base
      fetch("/api/characters/knowledge?page=1&page_size=500&character_id=" + characterDetails.id)
        .then((r) => r.json())
        .then((d) => {
          if (d.status_code === 200) {
            let converted = d.payload.data.map((i: any) => {
              return { id: i.id, content: i.content };
            });
            form.setFieldValue("knowledge", converted);
          }
          setTimeout(() => {
            loadingHandler.close();
          }, 100);
        })
        .catch((e) => {
          console.error(e);
          notifications.show({
            title: "Error fetching knowledge base",
            message:
              "A unknown error has occurred while fetching the character's knowledge base. Please refresh the page to try again. If the error persists, contact us.",
            color: "red",
          });
        });
    } else {
      form.reset();
    }
  }, [characterDetails]);

  useEffect(() => {
    if (!props.characterId) {
      loadingHandler.close();
    }
  }, [props.characterId]);

  useEffect(() => {
    console.log(form.values);
  }, [form]);

  return (
    <Stack>
      <Tabs
        defaultValue="basic"
        value={props.tab}
        onTabChange={onTabChange}
        orientation={isMd ? "horizontal" : "vertical"}
        sx={(theme) => ({
          ".mantine-Tabs-panel": {
            marginLeft: isMd ? undefined : theme.spacing.lg,
            marginTop: isMd ? theme.spacing.lg : undefined,
          },
        })}
      >
        <Tabs.List position={isMd ? "center" : "left"}>
          <Tabs.Tab value="basic">Basic Information</Tabs.Tab>
          <Tabs.Tab value="knowledge-base">Knowledge Base</Tabs.Tab>
          <Tabs.Tab value="example-conversations">Example Conversations</Tabs.Tab>
        </Tabs.List>

        {!loading ? (
          <CharacterFormProvider form={form}>
            <form
              style={{
                width: "100%",
              }}
              onSubmit={form.onSubmit(onSubmit, onError)}
            >
              <Tabs.Panel value="basic">
                <BasicTab />
              </Tabs.Panel>
              <Tabs.Panel value="knowledge-base">
                <KnowledgeBase />
              </Tabs.Panel>
              <Tabs.Panel value="example-conversations">
                <ExampleConversations />
              </Tabs.Panel>

              {!props.previewMode && (
                <>
                  <Divider ml={isMd ? undefined : theme.spacing.lg} mt="xl" />
                  <Group ml={isMd ? undefined : theme.spacing.lg} mt="xl">
                    <Button leftIcon={props.characterId ? <BiSave /> : <AiOutlinePlus />} type="submit">
                      {props.characterId ? "Save Character" : "Create Character"}
                    </Button>
                    {props.characterId && (
                      <Button
                        leftIcon={<AiFillDelete />}
                        color="red"
                        onClick={() => {
                          modals.openConfirmModal({
                            title: "Are you sure you want to delete this character?",
                            children: (
                              <Text>
                                This action cannot be undone. Once this character is deleted, you can no longer access
                                your chats with this character.
                              </Text>
                            ),
                            labels: { confirm: "Delete", cancel: "Never mind" },
                            confirmProps: { color: "red" },
                            onConfirm: () => {
                              deleteCharacter(props.characterId as string).then((s) => {
                                if (s) {
                                  notifications.show({
                                    title: "Character deleted",
                                    message: "The character has been successfully deleted.",
                                    color: "teal",
                                  });
                                  navigate("/");
                                  setActiveCharacter(undefined);
                                  modals.closeAll();
                                }
                              });
                            },
                          });
                        }}
                      >
                        Delete Character
                      </Button>
                    )}
                  </Group>
                </>
              )}
            </form>
          </CharacterFormProvider>
        ) : (
          <Flex direction="column" align="center" w="100%" gap="xs" mt="xl">
            <Title order={3}>Loading Form...</Title>
            <Loader />
          </Flex>
        )}
      </Tabs>
    </Stack>
  );
};

export default CharacterForm;
