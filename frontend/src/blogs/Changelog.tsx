import { Accordion, Anchor, Box, Divider, Image, List, Stack, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import StoryMode from "./StoryMode";
import Version18 from "./versions/Version18";
import Version19 from "./versions/Version19";

const Changelog: FC = () => {
  const navigate = useNavigate();

  return (
    <Stack spacing="xl">
      <Version19 />
      <Divider my="lg" />
      <Version18 />
    </Stack>
  );
};

export default Changelog;
