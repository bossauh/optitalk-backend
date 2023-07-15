import { ActionIcon, Box, Button, Flex, Group, Select, Stack, Text, TextInput, Title } from "@mantine/core";
import { FC } from "react";
import { AiFillDelete, AiOutlinePlus } from "react-icons/ai";
import { useCharacterFormContext } from "../../contexts/characterFormContext";

const ExampleConversations: FC = () => {
  const form = useCharacterFormContext();

  return (
    <Flex direction="column" gap="lg">
      <Stack spacing={4}>
        <Title order={3}>Example Conversation</Title>
        <Text fz="sm">
          You can provide an example conversation to better improve the character's responses. Feel free to add up to 10
          messages.
        </Text>
      </Stack>

      {!form.values.previewOnly && (
        <Box>
          <Button
            leftIcon={<AiOutlinePlus />}
            disabled={form.values.example_exchanges.length >= 10}
            onClick={() => {
              form.insertListItem("example_exchanges", { role: "user", content: "" });
            }}
          >
            Add Message
          </Button>
        </Box>
      )}

      <Stack spacing="xs">
        {form.values.example_exchanges.map((item, index) => {
          return (
            <Group spacing={8} noWrap>
              <Select
                size="xs"
                placeholder="Role"
                w="115px"
                data={[
                  {
                    value: "user",
                    label: "User",
                  },
                  {
                    value: "assistant",
                    label: "Character",
                  },
                ]}
                disabled={form.values.previewOnly}
                {...form.getInputProps(`example_exchanges.${index}.role`)}
              />
              <TextInput
                sx={{
                  width: "100%",
                }}
                placeholder="Content"
                size="xs"
                defaultValue={form.values.example_exchanges[index].content}
                onBlur={(e) => {
                  form.setFieldValue(`example_exchanges.${index}.content`, e.currentTarget.value);
                }}
                error={form.getInputProps(`example_exchanges.${index}.content`).error}
                onChange={form.values.previewOnly ? () => {} : undefined}
              />
              {!form.values.previewOnly && (
                <ActionIcon
                  color="red"
                  variant="light"
                  onClick={() => {
                    form.removeListItem("example_exchanges", index);
                  }}
                >
                  <AiFillDelete />
                </ActionIcon>
              )}
            </Group>
          );
        })}
      </Stack>
    </Flex>
  );
};

export default ExampleConversations;
