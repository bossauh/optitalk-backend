import { Anchor, Divider, Flex, Loader, Progress, Table, Text, Title } from "@mantine/core";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { formateDate, normalizeValue, useSubscription, useUserDetails } from "../../common/utils";

const MyAccountDetails: FC = () => {
  const { details, loading } = useUserDetails();
  const { status: subscriptionStatus, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();

  if (loading || !details || subscriptionLoading) {
    return (
      <Flex direction="column" align="center" gap="md">
        <Title order={2}>Loading</Title>
        <Loader />
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="md">
      <Flex gap="lg" wrap="wrap">
        <Flex direction="column" gap="xs">
          <Title order={3}>Email Used</Title>
          <Text fz="sm">{details?.basic.email}</Text>
        </Flex>
        <Flex direction="column" gap="xs">
          <Title order={3}>Created At</Title>
          <Text fz="sm">Your account was created at {formateDate(new Date(details.basic.created_at))}</Text>
        </Flex>
      </Flex>

      <Divider />
      <Flex direction="column" gap="xs">
        <Title order={3}>Statistics</Title>
        <Table striped withBorder>
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Messages sent and generated</td>
              <td>{details.statistics.messages}</td>
            </tr>
          </tbody>
        </Table>
      </Flex>
    </Flex>
  );
};

export default MyAccountDetails;
