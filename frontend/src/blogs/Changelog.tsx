import { Accordion, Anchor, Box, Divider, Image, List, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import StoryMode from "./StoryMode";

const Changelog: FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Title order={2} variant="gradient">
        New Features
      </Title>
      <Title order={4} mt="xs">
        Story Mode
      </Title>
      <Text fz="sm">
        With story mode, you are given the ability to steer your conversation to a story line you desire.{" "}
        <Anchor
          onClick={() => {
            modals.open({ title: "StoryMode.tsx", children: <StoryMode /> });
          }}
        >
          Learn more
        </Anchor>
      </Text>
      <Text fz="xs" color="gray.5" mt={4}>
        Story mode is exclusive to{" "}
        <Anchor
          onClick={() => {
            navigate("/optitalk-plus");
          }}
        >
          OptiTalk+
        </Anchor>{" "}
        users only.
      </Text>
      <Accordion mt="xs">
        <Accordion.Item value="image">
          <Accordion.Control>View Example</Accordion.Control>
          <Accordion.Panel>
            <Image
              src="https://i.ibb.co/F6R4WMP/image.png"
              sx={(theme) => ({
                boxShadow: theme.shadows.md,
                border: "1px solid",
                borderColor: theme.colors.dark[6],
              })}
            />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
      <Title order={4} mt="md">
        NSFW Control
      </Title>
      <Text fz="sm">
        You can now easily filter out NSFW characters in the characters page. Our system will automatically mark any
        previously made NSFW characters as NSFW. However, it is recommended that you double check your characters for
        any false positives or negatives.
      </Text>
      <Image
        src="https://i.ibb.co/gFjMc2z/image.png"
        height={150}
        sx={(theme) => ({
          border: "2px solid",
          borderColor: theme.colors.dark[5],
          boxShadow: theme.shadows.md,
        })}
        mt="xs"
      />
      <Divider my="xl" />
      <Title order={2}>Improvements</Title>
      <List maw="90%">
        <List.Item>
          <Text fz="sm">
            <Text fw="bold" span>
              Option to make character definition private
            </Text>
            : Character creators now have the ability to hide the definition of their character from the public.
            Additionally, you can now view definitions without having to click "See more". Just click the three dotted
            lines beside a character and if a character's definition is a public, a "View definition" button will
            appear.
          </Text>
        </List.Item>
        <List.Item>
          <Text fz="sm">
            <Text fw="bold" span>
              Shortened responses
            </Text>
            : Character responses have been shortened based on user feedback and complaints. We have implemented
            post-processing techniques to achieve this improvement and are actively working on a "model tweaking"
            feature to give users more freedom on controlling how a character responds.
          </Text>
        </List.Item>
        <List.Item>
          <Text fz="sm">
            <Text fw="bold" span>
              Reworked character creation page
            </Text>
            : The character creation page has been reworked to address previous bugs and improve its overall experience.
          </Text>
        </List.Item>
        <List.Item>
          <Text fz="sm">
            On mobile devices, hitting "Enter" in the chat box will no longer send the message. Instead, a new line will
            be inserted, allowing you to easily compose multi-line messages. To send the message, simply click the send
            button.
          </Text>
        </List.Item>
      </List>
    </Box>
  );
};

export default Changelog;
