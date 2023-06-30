import { Box, Flex, Text, Title } from "@mantine/core";
import { FC } from "react";
import { CharacterType } from "../../common/types";

const CharacterViewConversation: FC<{ character?: CharacterType; loading?: boolean }> = (props) => {
  if ((props.character?.exampleExchanges.length || 0) > 0) {
    return (
      <Flex mt="xl" direction="column" gap="lg">
        {props.character?.exampleExchanges.map((i) => {
          return (
            <Box
              sx={(theme) => ({
                backgroundColor: i.role === "assistant" ? theme.colors.dark[5] : theme.colors.teal,
                padding: theme.spacing.sm,
                borderRadius: theme.radius.md,
                alignSelf: i.role === "assistant" ? "start" : "end",
                maxWidth: "500px",
              })}
            >
              {i.content}
            </Box>
          );
        })}
      </Flex>
    );
  }
  return (
    <Flex mt="xl" direction="column">
      <Title order={2}>No Data</Title>
      <Text>The author of this character did not provide a example conversation.</Text>
    </Flex>
  );
};

export default CharacterViewConversation;
