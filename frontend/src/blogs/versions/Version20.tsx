import { Anchor, Badge, Box, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { FC } from "react";
import ModelTweaks from "../ModelTweaks";

const Version20: FC = () => {
  return (
    <Box>
      <Badge>Version 2.0</Badge>
      <Title order={2}>Improved NSFW</Title>
      <Text fz="sm">
        We have made further tweaks to our backend to allow for more NSFW responses. In addition to this, characters are
        now more likely to follow their character descriptions.
      </Text>
      <Title order={2} mt="lg">
        Profile Description
      </Title>
      <Text fz="sm">
        You can now provide a description about yourself by going to <b>{"My Account -> Settings"}</b>. This description
        is fed to all characters that you interact with, giving characters the ability to know more about you.
      </Text>
      <Title order={2} mt="lg">
        Improved model tweaking
      </Title>
      <Text fz="sm">
        The{" "}
        <Anchor
          onClick={() => {
            modals.open({ title: "ModelTweaks.tsx", children: <ModelTweaks /> });
          }}
        >
          model tweaks
        </Anchor>{" "}
        feature should now be more responsive. We're still actively tweaking it based on user feedback. You can find the
        model tweaks feature at the right sidebar in the chat page. We will also be integrating Model Tweaks to the
        character creation page.
      </Text>
      <Title order={2} mt="lg">
        Tags System
      </Title>
      <Text fz="sm">
        You can now add tags to your characters. In addition to do this, you can now filter the <b>Public Characters</b>{" "}
        by tags.
        <br />
        <b>Note:</b> Characters that previously didn't have tags will automatically be tagged by our system. This may or
        may not be accurate so it is best to still modify your characters to include the proper tags.
      </Text>
    </Box>
  );
};

export default Version20;
