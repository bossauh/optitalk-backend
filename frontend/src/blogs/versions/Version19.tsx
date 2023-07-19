import { Anchor, Badge, Box, Divider, Image, List, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { FC } from "react";
import ModelTweaks from "../ModelTweaks";

const Version19: FC = () => {
  return (
    <Box>
      <Badge>Version 1.9</Badge>
      <Title order={2} variant="gradient">
        New Features
      </Title>
      <Title mt="sm" order={4}>
        Model Tweaking
      </Title>
      <Text fz="sm">
        Model tweaking gives you the ability to tweak the model's parameters, which tweaks how long and how creative a
        character's response is. The feature is located at the right sidebar when you're in a chat.{" "}
        <Anchor
          onClick={() => {
            modals.open({ title: "ModelTweaks.tsx", children: <ModelTweaks /> });
          }}
        >
          Learn more
        </Anchor>
      </Text>
      <Image
        mt="xs"
        src="https://i.ibb.co/h7m3Nq0/image.png"
        sx={(theme) => ({
          border: "2px solid",
          borderColor: theme.colors.dark[5],
          boxShadow: theme.shadows.md,
        })}
      />
      <Divider my="xl" />
      <Title order={2}>Fixes</Title>
      <List maw="90%">
        <List.Item>Character's knowledge base not saving when editing</List.Item>
      </List>
    </Box>
  );
};

export default Version19;
