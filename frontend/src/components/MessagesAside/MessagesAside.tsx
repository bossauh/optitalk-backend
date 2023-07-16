import {
  Accordion,
  ActionIcon,
  Anchor,
  Avatar,
  Button,
  Flex,
  Group,
  Loader,
  MediaQuery,
  Overlay,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useDebouncedState, useDidUpdate, useDisclosure, useMediaQuery } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { nprogress } from "@mantine/nprogress";
import { FC, useContext, useState } from "react";
import { AiFillDelete, AiFillEdit } from "react-icons/ai";
import { BsRobot } from "react-icons/bs";
import { FaLock, FaLockOpen, FaUser } from "react-icons/fa";
import { IoSaveSharp } from "react-icons/io5";
import { MdReportProblem } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import StoryMode from "../../blogs/StoryMode";
import { useActiveCharacter, useSubscription } from "../../common/utils";
import StoreContext from "../../contexts/store";

const RenameSession: FC = () => {
  const [name, setName] = useState("");
  const store = useContext(StoreContext);
  const [activeCharacter] = useActiveCharacter();

  const [error, setError] = useState("");

  const onSubmit = () => {
    if (name.trim().length === 0) {
      setError("Must be between 1 and 120 characters.");
      return;
    }

    nprogress.start();
    fetch(`/api/chat/sessions?session_id=${store?.activeSession?.id}&character_id=${activeCharacter?.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: name }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((r) => r.json())
      .then((d) => {
        nprogress.complete();
        setTimeout(() => {
          nprogress.reset();
        }, 800);

        if (d.status_code === 200) {
          notifications.show({
            title: "Successfully Renamed",
            message:
              "Your session has been renamed and should now reflect across the platform. If it doesn't, just refresh the page.",
            color: "teal",
          });
          modals.closeAll();
        } else if (d.status_code === 404) {
          notifications.show({
            title: "Session not found",
            message: "Cannot rename this session as it is not found. It might have been deleted.",
            color: "red",
          });
        } else {
          notifications.show({
            title: "Unknown error",
            message:
              "A unknown error has occurred while trying to rename the session. Please try again. If the problem persists, contact us.",
            color: "red",
          });
        }
      })
      .catch((e) => {
        nprogress.complete();
        console.error(e);
        notifications.show({
          title: "Network error",
          message:
            "A unknown network error has occurred while trying to rename the session. Please refresh the page and try again. If the problem persists, contact us.",
          color: "red",
        });
      });
  };

  return (
    <Flex direction="column" gap="sm">
      <TextInput
        label="New Name"
        value={name}
        onChange={(e) => {
          setError("");
          setName(e.currentTarget.value);
        }}
        maxLength={120}
        error={error}
      />
      <Button
        leftIcon={<IoSaveSharp />}
        onClick={() => {
          onSubmit();
        }}
      >
        Save Changes
      </Button>
    </Flex>
  );
};

const MessagesAside: FC<{
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}> = (props) => {
  const theme = useMantineTheme();
  const isMd = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  const isLg = useMediaQuery(`(max-width: ${theme.breakpoints.lg})`);

  const store = useContext(StoreContext);
  const [activeCharacter] = useActiveCharacter();

  const navigate = useNavigate();

  const [storyMode, storyModeHandler] = useDisclosure(store?.activeSession?.storyMode || store?.storyMode);
  const [storyModeContent, setStoryModeContent] = useDebouncedState(
    store?.activeSession?.story || store?.storyModeContent || "",
    500
  );
  const [storyModeError, setStoryModeError] = useState("");
  const [storyModeSaving, storyModeSavingHandler] = useDisclosure(false);

  const { status: subscriptionStatus, loading: subscriptionStatusLoading } = useSubscription();

  useDidUpdate(() => {
    if (!store?.activeSession || !activeCharacter) {
      if (store) {
        store.setStoryMode(storyMode);
      }
      return;
    }

    storyModeSavingHandler.open();
    fetch(`/api/chat/sessions?session_id=${store.activeSession.id}&character_id=${activeCharacter.id}`, {
      method: "PATCH",
      body: JSON.stringify({ story_mode: storyMode }),
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((d) => {
        storyModeSavingHandler.close();
        if (d.status_code !== 200) {
          notifications.show({
            title: "Unknown error",
            message:
              "A unknown error has occurred while attempting to enable/disable the story mode. Please try again. If the problem persists, contact us.",
            color: "red",
          });
        }
      })
      .catch((e) => {
        storyModeSavingHandler.close();
        console.error(e);
        notifications.show({
          title: "Network error",
          message:
            "A network error has occurred while trying to enable/disable the story mode. Please try again by refreshing the page. If the problem persists, contact us.",
          color: "red",
        });
      });
  }, [storyMode]);

  useDidUpdate(() => {
    if (storyModeContent.length > 2048) {
      setStoryModeError("Story must be less than or equal to 2048 characters.");
      return;
    } else {
      setStoryModeError("");
    }

    if (!store?.activeSession || !activeCharacter) {
      if (store) {
        store.setStoryModeContent(storyModeContent);
      }
      return;
    }

    storyModeSavingHandler.open();
    fetch(`/api/chat/sessions?session_id=${store.activeSession.id}&character_id=${activeCharacter.id}`, {
      method: "PATCH",
      body: JSON.stringify({ story: storyModeContent }),
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((d) => {
        storyModeSavingHandler.close();
        if (d.status_code !== 200) {
          notifications.show({
            title: "Unknown error",
            message:
              "A unknown error has occurred while trying to save your story. Please try again by editing the story field or refreshing the page. If the problem persists, contact us.",
            color: "red",
          });
        }
      })
      .catch((e) => {
        storyModeSavingHandler.close();
        console.error(e);
        notifications.show({
          title: "Network error",
          message:
            "A unknown network error has occurred while trying to save your story. Please try again by refreshing the page. If the problem persists, contact us.",
          color: "red",
        });
      });
  }, [storyModeContent]);

  return (
    <>
      <Flex
        direction="column"
        sx={(theme) => ({
          background: theme.colors.dark[8],
          width: isLg ? "240px" : "300px",
          borderWidth: "0px",
          borderLeftWidth: "2px",
          borderStyle: "solid",
          borderColor: theme.colors.dark[5],
          zIndex: isMd ? 500 : 10,
          position: isMd ? "fixed" : "static",
          right: 0,
          top: 0,
          bottom: 0,
          display: props.opened ? "block" : "none",
          overflowY: "auto",
        })}
        align="center"
        px="lg"
        py="xl"
      >
        <Flex direction="column" align="center" w="100%" gap="sm">
          <Avatar
            src={`/api/characters/render-character-avatar?character_id=${activeCharacter?.id} `}
            radius="1000px"
            size="xl"
            variant="outline"
            color="primary"
          >
            <BsRobot />
          </Avatar>
          <Flex direction="column" gap={3} align="center">
            <Title order={4} truncate>
              {activeCharacter?.name}
            </Title>
          </Flex>
          <Group align="center">
            <Flex direction="column" align="center" gap={1}>
              <ActionIcon
                variant="light"
                color="primary"
                onMouseDown={(e) => {
                  if (e.button === 1) {
                    window.open("/character/" + activeCharacter?.id, "_blank");
                  } else {
                    navigate("/character/" + activeCharacter?.id);
                  }
                }}
              >
                <FaUser />
              </ActionIcon>
              <Text fz="xs">View Profile</Text>
            </Flex>
            {/* <Flex direction="column" align="center" gap={1}>
              <ActionIcon variant="light" color="red">
                <MdReportProblem />
              </ActionIcon>
              <Text fz="xs">Report</Text>
            </Flex> */}
          </Group>
        </Flex>

        <Accordion
          variant="separated"
          mt="md"
          sx={(theme) => ({
            ".mantine-Accordion-control": {
              padding: theme.spacing.sm,
            },
            ".mantine-Accordion-label": {
              padding: "0",
            },
            ".mantine-Accordion-item": {
              marginTop: theme.spacing.xs,
            },
          })}
        >
          <Accordion.Item value="story-mode">
            <Accordion.Control>
              <Group spacing={7} align="center">
                <Title order={6}>Chat's Story Mode</Title>
                {subscriptionStatus === "pending" ? (
                  <Loader size="xs" />
                ) : subscriptionStatus === "activated" ? (
                  <FaLockOpen size={13} color={theme.colors.yellow[7]} />
                ) : (
                  <FaLock size={13} color={subscriptionStatusLoading ? theme.colors.dark[3] : theme.colors.yellow[7]} />
                )}
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack>
                <Stack spacing={8}>
                  <Text fz="xs">
                    Steer your conversation to a story you desire.{" "}
                    <Anchor
                      onClick={() => {
                        modals.open({ title: "StoryMode.tsx", children: <StoryMode /> });
                        if (isMd) {
                          props.setOpened(false);
                        }
                      }}
                    >
                      Learn more
                    </Anchor>
                  </Text>
                  {(!subscriptionStatusLoading || !store?.authenticated) && (
                    <>
                      {!store?.authenticated ? (
                        <Text fz="xs">To unlock story mode, you need to be logged in and subscribed to OptiTalk+</Text>
                      ) : subscriptionStatus === "pending" ? (
                        <Text fz="xs">
                          Your OptiTalk+ subscription is being activated. This should take no more than a few seconds.
                        </Text>
                      ) : subscriptionStatus === null ? (
                        <Text fz="xs">
                          To unlock story mode, you need to subscribe to{" "}
                          <Anchor
                            onClick={() => {
                              navigate("/optitalk-plus");
                            }}
                          >
                            OptiTalk+
                          </Anchor>
                        </Text>
                      ) : (
                        <></>
                      )}
                    </>
                  )}
                  <Switch
                    checked={subscriptionStatus !== "activated" ? false : storyMode}
                    disabled={subscriptionStatus !== "activated"}
                    onChange={() => {
                      storyModeHandler.toggle();
                    }}
                    size="xs"
                  />
                </Stack>
                <Stack spacing={12}>
                  <Textarea
                    placeholder="Example: You're first going to start with asking the user X. You're then going to forcefully switch the topic to Y..."
                    disabled={subscriptionStatus !== "activated" || !storyMode}
                    minRows={10}
                    defaultValue={storyModeContent}
                    error={storyModeError}
                    onChange={(e) => {
                      setStoryModeContent(e.target.value);
                    }}
                  />
                  <Group spacing={4} align="center" opacity={storyModeSaving ? 1 : 0}>
                    <Loader size="xs" />
                    <Text color="gray.5" fz="xs">
                      Saving...
                    </Text>
                  </Group>
                </Stack>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
          {store?.activeSession && (
            <Accordion.Item value="settings">
              <Accordion.Control>
                <Title order={6}>Chat Settings</Title>
              </Accordion.Control>
              <Accordion.Panel>
                <Group spacing="xs" grow>
                  <Button
                    onClick={() => {
                      modals.open({
                        title: "Rename Session",
                        children: <RenameSession />,
                      });

                      if (isMd) {
                        props.setOpened(false);
                      }
                    }}
                    color="primary"
                    variant="light"
                    size="xs"
                    leftIcon={<AiFillEdit />}
                  >
                    Rename
                  </Button>
                  <Button
                    size="xs"
                    color="red"
                    leftIcon={<AiFillDelete />}
                    onClick={() => {
                      if (isMd) {
                        props.setOpened(false);
                      }
                      modals.openConfirmModal({
                        title: "Delete this session?",
                        children: (
                          <Text>
                            Are you sure you want to delete this session? Once this session is deleted all messages from
                            this session is permanently deleted from our database.
                          </Text>
                        ),
                        labels: { cancel: "Never mind", confirm: "DELETE" },
                        confirmProps: { color: "red" },
                        onConfirm: () => {
                          nprogress.start();
                          fetch(
                            `/api/chat/sessions?session_id=${store.activeSession?.id}&character_id=${activeCharacter?.id}`,
                            {
                              method: "DELETE",
                            }
                          )
                            .then((r) => r.json())
                            .then((d) => {
                              nprogress.complete();
                              setTimeout(() => {
                                nprogress.reset();
                              }, 800);
                              if (d.status_code === 200) {
                                notifications.show({
                                  title: "Deleted successfully",
                                  message: "Session and its messages are now scheduled for deletion.",
                                  color: "teal",
                                });
                                store.setActiveSession(undefined);
                                navigate("/chat");
                              } else if (d.status_code === 404) {
                                notifications.show({
                                  title: "Session not found",
                                  message:
                                    "The session you're trying to delete probably does not exist. Try reloading the page and if the error persists, contact us.",
                                  color: "red",
                                });
                              } else {
                                notifications.show({
                                  title: "Unknown error",
                                  message:
                                    "A unknown error has occurred while trying to delete this session. Please try again. If the problem persists, contact us.",
                                  color: "red",
                                });
                              }
                            })
                            .catch((e) => {
                              nprogress.complete();
                              setTimeout(() => {
                                nprogress.reset();
                              }, 800);

                              console.error(e);
                              notifications.show({
                                title: "Network error",
                                message:
                                  "A network error has occurred. Please try refreshing the page. If the problem persists, contact us.",
                                color: "red",
                              });
                            });
                        },
                      });
                    }}
                    variant="light"
                  >
                    Delete
                  </Button>
                </Group>
              </Accordion.Panel>
            </Accordion.Item>
          )}
        </Accordion>
      </Flex>
      {props.opened && (
        <MediaQuery
          largerThan="md"
          styles={{
            display: "none",
          }}
        >
          <Overlay
            pos="fixed"
            onClick={() => {
              props.setOpened(false);
            }}
          />
        </MediaQuery>
      )}
    </>
  );
};

export default MessagesAside;
