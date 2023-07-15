import { Anchor, Avatar, Button, Card, Flex, Group, Text, ThemeIcon, Title } from "@mantine/core";
import { FC } from "react";
import { BsFillChatDotsFill, BsRobot } from "react-icons/bs";
import { formatNumber, useActiveCharacter } from "../../common/utils";

const ActiveCharacterItem: FC = () => {
  const [character, setActiveCharacter] = useActiveCharacter();

  if (!character) {
    return <></>;
  }

  return (
    <Flex direction="column" gap="xs" mb="xl">
      <Title order={2}>Active Character</Title>
      <Card>
        <Card.Section inheritPadding py="xs" withBorder mb="xs">
          <Group>
            <Avatar src={`/api/characters/render-character-avatar?character_id=${character.id}`} color="default">
              <BsRobot size="25px" />
            </Avatar>
            <Flex direction="column" gap={2}>
              <Title order={4}>{character.name}</Title>
              <Group spacing={1}>
                <ThemeIcon variant="light" color="dark.1" size="sm">
                  <BsFillChatDotsFill size={13} />
                </ThemeIcon>
                <Text fz="sm">{formatNumber(character.uses)}</Text>
              </Group>
            </Flex>
          </Group>
        </Card.Section>
        <Text
          fz="sm"
          sx={{
            whiteSpace: "pre-wrap",
          }}
          lineClamp={4}
        >
          {character.publicDescription || character.description}
        </Text>
        <Card.Section inheritPadding py="xs" mt="xs" withBorder>
          <Group align="center" position="apart">
            <Anchor href={`/character/${character.id}`}>See More</Anchor>
            <Button
              size="xs"
              variant="light"
              color="red"
              onClick={() => {
                setActiveCharacter(undefined);
              }}
            >
              Deselect Character
            </Button>
          </Group>
        </Card.Section>
      </Card>
    </Flex>
  );
};

export default ActiveCharacterItem;
