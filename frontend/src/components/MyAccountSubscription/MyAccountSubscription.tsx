import { Box, Title } from "@mantine/core";
import { FC } from "react";
import SubscriptionCard from "../SubscriptionCard";

export const MyAccountSubscription: FC = () => {
  return (
    <Box>
      <Title order={3}>Plan</Title>
      <SubscriptionCard />
    </Box>
  );
};
