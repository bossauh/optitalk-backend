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
      <Flex gap="xs" direction="column">
        <Title order={3}>Limits</Title>
        {subscriptionStatus == null ? (
          <Text fz="sm">
            You can increase your limits to{" "}
            <Text span fw="bold">
              UNLIMITED
            </Text>{" "}
            by subscribing to{" "}
            <Anchor
              onClick={() => {
                navigate("/optitalk-plus");
              }}
            >
              OptiTalk+
            </Anchor>{" "}
            for just $4.99/month.
          </Text>
        ) : subscriptionStatus === "activated" ? (
          <Text fz="sm">You are currently subscribed to OptiTalk+. You have no limits imposed.</Text>
        ) : (
          <>
            <Text fz="sm">
              Thank you for subscribing to OptiTalk+. Your subscription is currently being activated. This should take
              no more than a few seconds.
            </Text>
            <Progress value={100} color="gray" striped animate mt="xs" />
          </>
        )}

        {subscriptionStatus == null && (
          <Flex direction="column" gap="xl">
            <Flex direction="column" gap="xs">
              <Title order={4}>Max Messages per 3 Hours</Title>
              <Progress
                value={normalizeValue(details.limits.messages.current, 0, details.limits.messages.limit)}
                label={`${details.limits.messages.current}/${details.limits.messages.limit}`}
                size="xl"
                color={details.limits.messages.current >= details.limits.messages.limit ? "red" : "teal"}
              />
              {details.limits.messages.current >= details.limits.messages.limit && (
                <Text fz="xs">
                  You can wait until your limit resets or upgrade to OptiTalk+ for unlimited messages.
                </Text>
              )}
            </Flex>
            <Flex direction="column" gap="xs">
              <Title order={4}>Max Characters</Title>
              <Progress
                value={normalizeValue(details.limits.characters.current, 0, details.limits.characters.limit)}
                size="xl"
                label={`${details.limits.characters.current}/${details.limits.characters.limit}`}
                color={details.limits.characters.current >= details.limits.characters.limit ? "red" : "blue"}
              />
              {details.limits.characters.current >= details.limits.characters.limit && (
                <Text fz="xs">
                  Delete characters that you don't use anymore to be able to create more or upgrade to OptiTalk+ for
                  unlimited characters.
                </Text>
              )}
            </Flex>
          </Flex>
        )}
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
