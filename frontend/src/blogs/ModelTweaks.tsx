import { Anchor, Box, Divider, List, Text, Title } from "@mantine/core";
import { FC } from "react";
import { useNavigate } from "react-router-dom";

const ModelTweaks: FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Title order={3}>What is model tweaking?</Title>
      <Text fz="sm">
        Model tweaking gives you the ability to tweak the model's parameters, which tweaks how long and how creative a
        character's response is.
        <br />
        The values for model tweaking are different across chats. This means when you switch to a new chat, you can
        modify the model's parameters on that chat without affecting other chats.
      </Text>
      <Divider my="lg" />
      <Title order={3}>Notes</Title>
      <List maw="90%" mt="xs">
        <List.Item>
          <Text fz="sm">
            When you tweak the model's parameters when there's already a chat, it will still affect the responses but
            not as much. This means, it's best to adjust the parameters before you send your first chat.
          </Text>
        </List.Item>
        <List.Item>
          <Text fz="sm">
            Model tweaking is currently at beta and is therefore <b>FREE</b> for everyone for now as we're still testing
            and improving the feature and require feedback from everyone. Once the feature is out of its beta stage, it
            will only be exclusive to{" "}
            <Anchor
              onClick={() => {
                navigate("/optitalk-plus");
              }}
            >
              OptiTalk+
            </Anchor>{" "}
            users.
          </Text>
        </List.Item>
      </List>
      <Divider my="lg" />
      <Title order={3}>Parameters</Title>
      <Title order={4} mt="md">
        Length
      </Title>
      <Text fz="sm">
        This tweaks how long a model's response is. A{" "}
        <Text fw="bold" span>
          very short
        </Text>{" "}
        length means responses will usually only be a word or a few words long. However, if you have your creativity at{" "}
        <b>extreme</b>, responses tends to be a few words longer than what the length's setting is.
      </Text>
      <Title order={4} mt="md">
        Creativity
      </Title>
      <Text fz="sm">
        This tweak specifies how creative a character's response is. Creative in this context means how varied each word
        in a character's response is. A <b>extreme</b> creativity value will often lead to wild and unpredictable
        responses. While a <b>predictable</b> creativity value leads to simple predictable (according to the character's
        persona) responses.
      </Text>
    </Box>
  );
};

export default ModelTweaks;
