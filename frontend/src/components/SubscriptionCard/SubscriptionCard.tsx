import { Button, Card, Flex, Group, List, Text, TextInput, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { FC, useState } from "react";
import { MdOutlineFreeCancellation } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../../common/utils";

const CancelModal: FC = () => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const onSubmit = () => {
    setError("");

    if (!reason.trim()) {
      return setError("Please provide a reason as to why you want to cancel your subscription.");
    }

    fetch("/api/payments/paypal/cancel", {
      method: "POST",
      body: JSON.stringify({ reason: reason }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.status_code === 200) {
          modals.closeAll();
          notifications.show({
            title: "Subscription cancelled",
            message:
              "Thank you for trying out OptiTalk+. Your subscription has now been cancelled. The page will refresh in a few seconds.",
            color: "teal",
          });
          setTimeout(() => {
            window.location.href = "/";
          }, 5000);
        } else {
          notifications.show({
            title: "Unknown error",
            message:
              "A unknown error occurred while trying to cancel your subscription. Please try again. If the problem persists, contact us.",
            color: "red",
          });
        }
      })
      .catch((e) => {
        console.error(e);
        notifications.show({
          title: "Network Error",
          message:
            "A network error has occurred while trying to cancel your subscription. Please refresh the page and try again. If the problem persists, contact us.",
          color: "red",
        });
      });
  };

  return (
    <Flex direction="column">
      <Text fz="sm">
        Are you sure you want to cancel your subscription? You will immediately loose access to your benefits if you do
        so.
      </Text>

      <TextInput
        label="Reason"
        placeholder="Please provide a reason for cancellation."
        mt="sm"
        value={reason}
        onChange={(e) => {
          setReason(e.target.value);
        }}
        error={error}
        maxLength={1024}
      />

      <Group grow mt="lg">
        <Button
          onClick={() => {
            modals.closeAll();
          }}
          color="gray"
        >
          Never mind
        </Button>
        <Button
          onClick={() => {
            onSubmit();
          }}
          color="red"
        >
          Confirm
        </Button>
      </Group>
    </Flex>
  );
};

const SubscriptionCard: FC = () => {
  const { status, loading } = useSubscription();
  const navigate = useNavigate();

  return (
    <Card
      mt="xs"
      maw="400px"
      withBorder
      shadow="lg"
      sx={(theme) => ({
        borderColor: status === null ? undefined : `${theme.primaryColor} !important`,
      })}
    >
      <Flex direction="column" align="start" gap="sm">
        <Group align="start" position="apart" w="100%">
          <Flex direction="column">
            <Title order={4}>OptiTalk+</Title>
          </Flex>
          <Text fz="lg">
            <Text span fw="bold">
              $4.99/
            </Text>
            month
          </Text>
        </Group>
        <Flex direction="column" gap="xs">
          <List size="sm">
            <List.Item>Unlimited Messages</List.Item>
            <List.Item>Unlimited Characters</List.Item>
            <List.Item>Prioritized Support</List.Item>
          </List>
        </Flex>
        <Group position="apart" w="100%" align="flex-end">
          {status === "activated" ? (
            <Button
              color="red"
              variant="light"
              leftIcon={<MdOutlineFreeCancellation />}
              size="xs"
              onClick={() => {
                modals.open({
                  title: "Cancel Subscription",
                  children: <CancelModal />,
                });
              }}
            >
              Cancel
            </Button>
          ) : (
            <Button
              variant={loading ? "default" : "gradient"}
              loading={status === "pending" || loading}
              onClick={() => {
                navigate("/optitalk-plus");
              }}
            >
              {status === "pending" ? "Activating" : "Upgrade Now"}
            </Button>
          )}
        </Group>
      </Flex>
    </Card>
  );
};

export default SubscriptionCard;
