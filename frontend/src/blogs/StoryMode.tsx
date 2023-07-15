import { Box, Button, Code, Divider, List, Space, Text, Title } from "@mantine/core";
import { Prism } from "@mantine/prism";
import { FC, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../common/utils";
import StoreContext from "../contexts/store";

const StoryMode: FC = () => {
  const store = useContext(StoreContext);
  const { status } = useSubscription();
  const navigate = useNavigate();

  return (
    <Box>
      <Title order={3}>What is Story Mode?</Title>
      <Text fz="sm">
        Story Mode empowers you to shape your conversations with characters into customized narratives. It is
        particularly valuable for creating structured conversations, such as simulating a Customer Support interaction,
        where the character can ask you predetermined questions provided within the story mode.
      </Text>
      <Space h="md" />
      <Text fz="sm">
        Imagine using Story Mode to create an interactive mystery game. As the player engages with the chatbot
        character, they can uncover clues, solve puzzles, and make choices that affect the outcome of the story. By
        leveraging Story Mode, the chatbot becomes a captivating storytelling tool, immersing users in an interactive
        narrative adventure.
      </Text>

      <Divider my="lg" />
      <Title order={3}>Tips on writing a story</Title>
      <Text fz="xs">
        Please take a look at the example in the next section as well for a better overview on how your story should be
        written.
      </Text>
      <List maw="90%" mt="xs">
        <List.Item>
          <Text fz="sm">
            It is important that you write your story in stages. Either separated by 2 spaces or in a numbered/list
            format.
          </Text>
        </List.Item>
        <List.Item>
          <Text fz="sm">
            When referring to the character, use the keyword <Code>you.</Code>
          </Text>
        </List.Item>
      </List>

      <Divider my="lg" />
      <Title order={3}>Example</Title>
      <Prism
        language="markdown"
        sx={{
          ".mantine-Prism-code": {
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
          },
        }}
      >
        {`
You wake up to the sound of your phone ringing. You check and it's a message from {user}.{user} is unaware of where they are, but you realize that both {user} and you are on an island that seemingly appeared out of
nowhere. It feels like a dream. 

You and {user} decide to meet up on the deck of the island to figure out where
you both are and to communicate in person instead of through messages. 

Finally, you meet with {user} and to your surprise, they look exactly like you. You are extremely confused and bring up the fact that you and {user} share the same appearance.

{user} then asks if you want something to eat. However, you hesitate as you don't trust someone offering you random food, especially when they look just like you.
`}
      </Prism>

      {store?.authenticated && (
        <>
          {status === null ? (
            <>
              <Divider my="lg" />
              <Text fz="sm">To use story mode, you must be subscribed to OptiTalk+</Text>
              <Button
                variant="gradient"
                mt="xs"
                fullWidth
                onClick={() => {
                  navigate("/optitalk-plus");
                }}
              >
                Get OptiTalk+
              </Button>
            </>
          ) : (
            <></>
          )}
        </>
      )}
    </Box>
  );
};

export default StoryMode;
