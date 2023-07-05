import {
  ActionIcon,
  Avatar,
  Button,
  Flex,
  Group,
  MediaQuery,
  Overlay,
  Text,
  TextInput,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { nprogress } from "@mantine/nprogress";
import { FC, useContext, useState } from "react";
import { AiFillDelete, AiFillEdit } from "react-icons/ai";
import { BsRobot } from "react-icons/bs";
import { FaUser } from "react-icons/fa";
import { IoSaveSharp } from "react-icons/io5";
import { MdReportProblem } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useActiveCharacter } from "../../common/utils";
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

        {store?.activeSession && (
          <Flex direction="column" mt="xl" gap="xs">
            <Title order={4}>Session Settings</Title>
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
          </Flex>
        )}
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
