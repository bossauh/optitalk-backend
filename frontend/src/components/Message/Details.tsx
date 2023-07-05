import { Box, Button, Flex, Group, ScrollArea, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { FC } from "react";

const Details: FC<{
  processingTime?: number | null;
  knowledgeHint?: string;
  delete?: () => void;
}> = (props) => {
  return (
    <Flex direction="column" gap="md">
      {props.processingTime != null && (
        <Group align="center">
          <Title order={5}>Processing Time</Title>
          <Text fz="sm">{props.processingTime.toFixed(2)}s</Text>
        </Group>
      )}
      {props.knowledgeHint && (
        <Flex direction="column" gap="xs">
          <Group
            align="start"
            sx={{
              flexDirection: "column",
            }}
            spacing={2}
          >
            <Title order={5}>Knowledge Hint</Title>
            <Text fz="xs">
              A knowledge hint is a piece of knowledge pulled from the knowledge base that the character can use to
              generate a response.
            </Text>
          </Group>
          <ScrollArea h={150}>
            <Box
              sx={(theme) => ({
                background: theme.colors.dark[6],
                borderRadius: theme.radius.sm,
                padding: theme.spacing.xs,
                whiteSpace: "pre-wrap",
              })}
            >
              <Text fz="sm">{props.knowledgeHint}</Text>
            </Box>
          </ScrollArea>
        </Flex>
      )}
      <Button
        color="red"
        onClick={() => {
          if (props.delete) {
            props.delete();
            modals.closeAll();
          }
        }}
      >
        Delete
      </Button>
    </Flex>
  );
};

export default Details;
