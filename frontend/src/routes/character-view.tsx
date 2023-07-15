import {
  ActionIcon,
  Avatar,
  Button,
  Flex,
  Group,
  Indicator,
  Popover,
  Skeleton,
  Tabs,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { FC, useContext, useEffect, useState } from "react";
import { AiFillDelete, AiFillEye, AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { BsRobot } from "react-icons/bs";
import { MdModeEditOutline } from "react-icons/md";
import { TbRating18Plus } from "react-icons/tb";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { deleteCharacter, formatNumber, toggleFavorite, useActiveCharacter, useCharacter } from "../common/utils";
import CharacterForm from "../components/CharacterForm";
import CharacterViewBasic from "../components/CharacterViewBasic";
import StoreContext from "../contexts/store";

const CharacterView: FC = () => {
  const { characterId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams({ tab: "basic" });
  const navigate = useNavigate();

  const [activeCharacter, setActiveCharacter] = useActiveCharacter();
  const [notFound, loading, character] = useCharacter(characterId || undefined, false);
  const [favorite, setFavorite] = useState(false);
  const store = useContext(StoreContext);

  const theme = useMantineTheme();
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  useEffect(() => {
    setFavorite(character?.favorite || false);
  }, [character]);

  return (
    <Flex
      direction="column"
      gap="sm"
      justify={notFound ? "center" : "start"}
      h={notFound ? "90%" : undefined}
      pb="100px"
      m="lg"
    >
      {notFound && character ? (
        <Flex direction="column" gap="sm" align="center">
          <Title order={2}>Character not found</Title>
          <Text fz="sm" maw="400px" align="center">
            Either this character has been deleted, does not exist, or is currently private.
          </Text>
        </Flex>
      ) : (
        <>
          <Group spacing="sm">
            {loading ? (
              <Skeleton height={90} width={90} />
            ) : (
              <Avatar size="xl" src={`/api/characters/render-character-avatar?character_id=${character?.id}`}>
                <BsRobot size="25px" />
              </Avatar>
            )}
            <Flex direction="column" gap="xs">
              {loading ? (
                <Skeleton height={20} width={180} />
              ) : (
                <Group spacing={4} align="center">
                  <Title order={3}>{character?.name}</Title>
                  {character?.nsfw && (
                    <Tooltip label="NSFW Character">
                      <ThemeIcon color="red">
                        <TbRating18Plus size={21} />
                      </ThemeIcon>
                    </Tooltip>
                  )}
                </Group>
              )}
              {loading ? (
                <Skeleton height={15} width={120} />
              ) : (
                <Text
                  fz="sm"
                  sx={(theme) => ({
                    color: theme.colors.dark[1],
                  })}
                >
                  {formatNumber(character?.uses as number)} Messages sent
                </Text>
              )}
            </Flex>
          </Group>
          <Group spacing="xs" align="flex-start">
            <Button
              loading={loading}
              color={activeCharacter?.id === character?.id ? "red" : "primary"}
              disabled={loading}
              size="xs"
              variant="light"
              onClick={() => {
                if (activeCharacter?.id === character?.id) {
                  setActiveCharacter(undefined);
                } else {
                  setActiveCharacter(character);
                }
              }}
            >
              {activeCharacter?.id === character?.id ? "Deselect Character" : "Use Character"}
            </Button>
            <Tooltip
              label={!store?.authenticated ? "Please login to favorite characters" : undefined}
              hidden={store?.authenticated}
            >
              <ActionIcon
                loading={loading}
                color="primary"
                variant={loading ? "filled" : favorite ? "filled" : "outline"}
                onClick={() => {
                  if (character) {
                    toggleFavorite(character.id, character.name, favorite, setFavorite);
                  }
                }}
                disabled={loading || !store?.authenticated}
              >
                {favorite ? <AiFillHeart /> : <AiOutlineHeart />}
              </ActionIcon>
            </Tooltip>
            {store?.userId === character?.createdBy && (
              <>
                <ActionIcon
                  loading={loading}
                  disabled={loading}
                  color="blue"
                  variant="filled"
                  onClick={() => {
                    modals.open({
                      title: "Edit Character",
                      children: <CharacterForm characterId={character?.id} />,
                      size: "xl",
                      closeOnClickOutside: false,
                      centered: true,
                    });
                  }}
                >
                  <MdModeEditOutline />
                </ActionIcon>
                <Popover width={250}>
                  <Popover.Target>
                    <ActionIcon loading={loading} disabled={loading} color="red" variant="filled">
                      <AiFillDelete />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Text fz="sm">Are you sure you want to delete this character?</Text>
                    <Group grow mt="sm">
                      <Button
                        color="red"
                        onClick={() => {
                          deleteCharacter(character?.id as string).then((status) => {
                            if (status) {
                              navigate("/");
                              notifications.show({ message: "Character deleted successfully", color: "red" });
                            }
                          });
                        }}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Popover.Dropdown>
                </Popover>
              </>
            )}
            {character?.definitionVisibility && (
              <Indicator label="New" size={16} color="teal">
                <Button
                  onClick={() => {
                    if (!character) {
                      return;
                    }
                    modals.open({
                      title: "Preview Character's Definition",
                      children: <CharacterForm characterId={character.id} previewMode />,
                      size: "xl",
                      centered: true,
                    });
                  }}
                  loading={loading}
                  size="xs"
                  variant="light"
                  leftIcon={<AiFillEye />}
                >
                  View Definition
                </Button>
              </Indicator>
            )}
          </Group>
          <Tabs
            value={searchParams.get("tab") || "basic"}
            onTabChange={(v) => {
              if (v) {
                let newParams = new URLSearchParams(searchParams);
                newParams.set("tab", v.toString());
                setSearchParams(newParams);
              }
            }}
            variant={isSm ? "pills" : "default"}
          >
            <Tabs.List>
              <Tabs.Tab value="basic">Homepage</Tabs.Tab>
              {/* <Tabs.Tab value="example-conversation">Comments</Tabs.Tab> */}
            </Tabs.List>

            <Tabs.Panel value="basic">
              <CharacterViewBasic character={character} loading={loading} />
            </Tabs.Panel>
          </Tabs>
        </>
      )}
    </Flex>
  );
};

export default CharacterView;
