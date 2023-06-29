/* eslint-disable react-hooks/exhaustive-deps */
import {
  ActionIcon,
  Anchor,
  Avatar,
  Button,
  Card,
  Flex,
  Group,
  MediaQuery,
  Menu,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { FC, useContext, useEffect, useState } from "react";
import { AiFillDelete, AiFillEdit } from "react-icons/ai";
import { BsFillChatDotsFill, BsRobot } from "react-icons/bs";
import { HiEllipsisVertical } from "react-icons/hi2";
import { IoCopy } from "react-icons/io5";
import { MdFavorite, MdOutlineFavoriteBorder } from "react-icons/md";
import { CharacterType } from "../../common/types";
import { deleteCharacter, formatNumber, toggleFavorite, useActiveCharacter } from "../../common/utils";
import StoreContext from "../../contexts/store";

const CharacterItem: FC<CharacterType> = (props) => {
  const clipboard = useClipboard();
  const store = useContext(StoreContext);
  const [activeCharacter, setActiveCharacter] = useActiveCharacter();

  const [favorite, setFavorite] = useState(props.favorite);
  const [isOwner, setIsOwner] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (store?.authenticated && !store.isAuthenticating) {
      if (props.createdBy === store.userId) {
        setIsOwner(true);
        return;
      }
    }
    setIsOwner(false);
  }, [store?.authenticated, store?.isAuthenticating]);

  return (
    <MediaQuery
      largerThan="xs"
      styles={{
        width: "300px",
      }}
    >
      <Card
        shadow="xs"
        padding="xs"
        radius="sm"
        sx={{
          overflow: "visible",
          transition: "filter 0.2s",
          position: "relative",
          cursor: deleted ? "not-allowed" : "unset",
          filter: deleted ? "grayscale(90%) opacity(0.8)" : "unset",
          display: "flex",
          flexDirection: "column",
        }}
        withBorder={store?.activeCharacter?.id === props.id}
      >
        {deleted && (
          <Title
            order={4}
            sx={(theme) => ({
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: theme.colors.dark[8],
              padding: theme.spacing.md,
              borderRadius: theme.radius.md,
              zIndex: 400,
            })}
          >
            Character Deleted
          </Title>
        )}
        <Card.Section withBorder inheritPadding py="xs">
          <Group spacing="sm" position="apart" noWrap>
            <Group spacing="xs" noWrap>
              <Avatar src={props.image} color="default">
                <BsRobot size="25px" />
              </Avatar>
              <Flex direction="column" gap={2}>
                <MediaQuery
                  largerThan="sm"
                  styles={{
                    maxWidth: "150px",
                  }}
                >
                  <Text truncate fz="sm">
                    {props.name}
                  </Text>
                </MediaQuery>
                <Group spacing={1}>
                  <ThemeIcon variant="light" color="dark.1" size="xs">
                    <BsFillChatDotsFill size={12} />
                  </ThemeIcon>
                  <Text fz="xs">{formatNumber(props.uses)}</Text>
                </Group>
              </Flex>
            </Group>
            <Group spacing="xs" noWrap>
              <Tooltip
                label={store?.authenticated ? undefined : "Please login to favorite characters."}
                hidden={store?.authenticated}
              >
                <span>
                  <ActionIcon
                    color="teal"
                    variant={favorite ? "filled" : "outline"}
                    onClick={() => {
                      toggleFavorite(props.id, props.name, favorite, setFavorite);
                    }}
                    disabled={!store?.authenticated}
                  >
                    {favorite ? <MdFavorite /> : <MdOutlineFavoriteBorder />}
                  </ActionIcon>
                </span>
              </Tooltip>
              <Menu>
                <Menu.Target>
                  <ActionIcon variant="light">
                    <HiEllipsisVertical size={20} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    icon={<IoCopy />}
                    onClick={(e) => {
                      clipboard.copy(`https://optitalk.net/character/${props.id}`);
                      notifications.show({
                        title: "URL Copied",
                        message: <Anchor href={`/character/${props.id}`}>{props.name}</Anchor>,
                        color: "blue",
                      });
                    }}
                  >
                    Copy URL
                  </Menu.Item>

                  {isOwner && (
                    <>
                      <Menu.Divider />
                      <Menu.Label>Actions</Menu.Label>
                      <Menu.Item icon={<AiFillEdit />} component="a" href={`/create-character?characterId=${props.id}`}>
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        icon={<AiFillDelete />}
                        color="red"
                        onClick={() => {
                          modals.openConfirmModal({
                            title: "Are you sure you want to delete this character?",
                            centered: true,
                            children: (
                              <Text size="sm">
                                You cannot undo this action. Once the character is deleted, all messages and sessions
                                related to it will be gone{" "}
                                <Text span fw="bold">
                                  PERMANENTLY
                                </Text>
                              </Text>
                            ),
                            labels: { confirm: "Delete", cancel: "Cancel" },
                            confirmProps: { color: "red" },
                            onConfirm: () =>
                              deleteCharacter(props.id).then((s) => {
                                if (s) setDeleted(true);
                              }),
                          });
                        }}
                      >
                        Delete
                      </Menu.Item>
                    </>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </Card.Section>
        <Flex
          direction="column"
          mt="xs"
          gap="xs"
          sx={{
            flexGrow: 1,
          }}
        >
          <Flex direction="column" gap={2}>
            <Text fz="sm" lineClamp={3}>
              {props.description}
            </Text>
          </Flex>
        </Flex>
        <Card.Section withBorder inheritPadding py="xs" mt="xs">
          <Group position="apart">
            <Anchor fz="sm" underline href={`/character/${props.id}`}>
              See More
            </Anchor>
            <Button
              size="xs"
              variant="light"
              color={activeCharacter?.id === props.id ? "red" : "teal"}
              onClick={() => {
                if (activeCharacter?.id === props.id) {
                  setActiveCharacter();
                } else {
                  setActiveCharacter(props);
                }
              }}
            >
              {activeCharacter?.id === props.id ? "Deselect Character" : "Use Character"}
            </Button>
          </Group>
        </Card.Section>
      </Card>
    </MediaQuery>
  );
};

export default CharacterItem;
