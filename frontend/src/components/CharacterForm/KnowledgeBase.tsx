import { ActionIcon, Box, Button, Flex, Group, Stack, Text, Textarea, Title } from "@mantine/core";
import { randomId } from "@mantine/hooks";
import { FC } from "react";
import { AiFillDelete, AiOutlinePlus } from "react-icons/ai";
import { useCharacterFormContext } from "../../contexts/characterFormContext";

const KnowledgeBase: FC = () => {
  const form = useCharacterFormContext();

  return (
    <Flex direction="column" gap="lg">
      <Stack spacing={4}>
        <Title order={3}>Knowledge Base</Title>
        <Text fz="sm">
          You can add up to 500 knowledge items. This is where you put long and crucial details about a character. This
          can be a character's list of friends with a description on each friend, a long backstory, events that happened
          to the character, etc.
        </Text>
      </Stack>

      {!form.values.previewOnly && (
        <Box>
          <Button
            leftIcon={<AiOutlinePlus />}
            disabled={form.values.knowledge.length >= 500}
            onClick={() => {
              form.insertListItem("knowledge", { content: "" });
            }}
          >
            Add Knowledge
          </Button>
        </Box>
      )}
      <Stack>
        {form.values.knowledge
          .map((item, index) => {
            return (
              <Group spacing={8} noWrap key={item.id || randomId()}>
                <Textarea
                  sx={{
                    width: "100%",
                  }}
                  placeholder="Knowledge item"
                  autosize
                  minRows={1}
                  defaultValue={form.values.knowledge[index].content}
                  onBlur={(e) => {
                    form.setFieldValue(`knowledge.${index}.content`, e.currentTarget.value);
                  }}
                  error={form.getInputProps(`knowledge.${index}.content`).error}
                  onChange={form.values.previewOnly ? () => {} : undefined}
                />
                {!form.values.previewOnly && (
                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() => {
                      form.removeListItem("knowledge", index);
                      if (item.id) {
                        fetch("/api/characters/knowledge?id=" + item.id, { method: "DELETE" });
                      }
                    }}
                  >
                    <AiFillDelete />
                  </ActionIcon>
                )}
              </Group>
            );
          })
          .reverse()}
      </Stack>
    </Flex>
  );
};

export default KnowledgeBase;
