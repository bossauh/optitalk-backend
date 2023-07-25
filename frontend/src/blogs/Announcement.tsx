import { Box, Text, Title } from "@mantine/core";
import { FC } from "react";

const Announcement: FC = () => {
  return (
    <Box>
      <Title order={3}>Announcement</Title>
      <Text fz="sm">
        We have some news to share regarding our platform. Due to financial considerations, we'll be making a few
        changes to ensure its sustainability. Starting soon, users will be required to provide their OWN OpenAI key to
        access the platform. Don't worry, the website will remain active as long as we have a steady and growing user
        base. In light of these changes, we've decided to make all features free for everyone. To support the site,
        we'll rely on donations and display non-intrusive ads. Thank you for your understanding and continued support.
      </Text>
    </Box>
  );
};

export default Announcement;
