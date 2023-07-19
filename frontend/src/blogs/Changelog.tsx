import { Divider, Stack } from "@mantine/core";
import { FC } from "react";
import Version18 from "./versions/Version18";
import Version19 from "./versions/Version19";

const Changelog: FC = () => {
  return (
    <Stack spacing="xl">
      <Version19 />
      <Divider my="lg" />
      <Version18 />
    </Stack>
  );
};

export default Changelog;
