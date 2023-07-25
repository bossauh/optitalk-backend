import { Divider, Stack } from "@mantine/core";
import { FC } from "react";
import Announcement from "./Announcement";
import Version18 from "./versions/Version18";
import Version19 from "./versions/Version19";
import Version20 from "./versions/Version20";

const Changelog: FC = () => {
  return (
    <Stack spacing="xl">
      <Announcement />

      {/* <Version20 />
      <Divider my="lg" />
      <Version19 />
      <Divider my="lg" />
      <Version18 /> */}
    </Stack>
  );
};

export default Changelog;
