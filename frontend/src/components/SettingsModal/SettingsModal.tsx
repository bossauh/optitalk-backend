import { ActionIcon, Anchor, Divider, Flex, Group, Tabs, Text, Title, useMantineTheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { FC, useContext, useEffect, useRef, useState } from "react";
import { AiFillEdit } from "react-icons/ai";
import { GiUpgrade } from "react-icons/gi";
import { MdAccountCircle } from "react-icons/md";
import StoreContext from "../../contexts/store";

const SettingsModal: FC = () => {
  const store = useContext(StoreContext);
  const theme = useMantineTheme();

  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const [nameEditable, setNameEditable] = useState(false);
  const nameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (nameRef.current) {
      nameRef.current.focus();
    }
  }, [nameEditable, nameRef]);

  const onNameChangeUnknownError = () => {
    notifications.show({
      title: "Unknown Error",
      message:
        "A unknown error has occurred while trying to change your name. Please try again. If the problem persists, contact us.",
      color: "red",
    });
  };

  const onCancelSubscriptionError = () => {
    notifications.show({
      title: "Error cancelling your subscription",
      message: "Try cancelling it from PayPal's page, or you can contact us for assistance.",
      color: "red",
    });
  };

  return (
    <Tabs orientation={isSm ? "horizontal" : "vertical"} variant="default" color="primary" defaultValue="account">
      <Tabs.List>
        <Tabs.Tab value="account" icon={<MdAccountCircle />}>
          My Account
        </Tabs.Tab>
        <Tabs.Tab value="subscription" icon={<GiUpgrade />}>
          OptiTalk+
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="account" p="sm">
        <Title order={6}>Display Name</Title>
        <Group spacing="xs">
          <Text
            contentEditable={nameEditable}
            fw={500}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
                e.preventDefault();
              }
            }}
            onBlur={(e) => {
              setNameEditable(false);
              let name = e.currentTarget.textContent;

              if (!name) {
                return;
              }

              name = name.trim();

              if (name.length < 1) {
                notifications.show({ title: "Error", message: "Name must have at least 1 character.", color: "red" });
                return;
              }

              if (name.length > 45) {
                notifications.show({
                  title: "Error",
                  message: "Name must be less than or equal to 45 characters.",
                  color: "red",
                });
                return;
              }

              console.log(e.currentTarget.textContent);
              fetch("/api/users/display-name", {
                method: "PATCH",
                body: JSON.stringify({ name: e.currentTarget.textContent }),
                headers: { "Content-Type": "application/json" },
              })
                .then((r) => r.json())
                .then((d) => {
                  if (d.status_code === 200) {
                    notifications.show({
                      title: "Name change success",
                      message: "Your name has been changed and should now reflect across the site.",
                      color: "teal",
                    });
                    store?.fetchUserData();
                  } else {
                    onNameChangeUnknownError();
                  }
                })
                .catch((e) => {
                  console.error(e);
                  onNameChangeUnknownError();
                });
            }}
            ref={nameRef}
          >
            {store?.displayName}
          </Text>
          <ActionIcon
            onClick={() => {
              setNameEditable(true);
            }}
            color="teal"
            variant="filled"
            size="sm"
          >
            <AiFillEdit />
          </ActionIcon>
        </Group>
        <Text fz="xs">
          Characters can refer to your display name so choose a name that your characters should call you.
        </Text>
        <Divider my="xs" />
        <Text fz="xs">More options coming soon</Text>
      </Tabs.Panel>
      <Tabs.Panel value="subscription" p="sm">
        {store?.userPlanDetails?.subscriptionStatus === "pending" ? (
          <Flex direction="column" gap="xs">
            <Title order={3}>Thank you for purchasing OptiTalk+</Title>
            <Text fz="sm">
              Your OptiTalk+ account is currently being activated. This should take no more than a minute. If your
              account is stuck in this state or have any other billing issues, please{" "}
              <Anchor href="https://docs.google.com/forms/d/e/1FAIpQLSciRo_XWFTlm6MN4Ex__e2Da9UlHDG4osgJKGB5qVWsh5j96w/viewform">
                contact us
              </Anchor>{" "}
              and we will take care of it.
            </Text>
          </Flex>
        ) : (
          <>
            {store?.userPlanDetails?.subscriptionStatus === "activated" ? (
              <Flex direction="column" gap="xs">
                <Title order={3}>You are using OptiTalk+</Title>
                <Text fz="sm">
                  Thank you for supporting us. OptiTalk is made by a small group of passionate developers and your
                  support will go towards developing and improving OptiTalk.
                </Text>
                <Text fz="sm">
                  If you need to cancel your OptiTalk subscription,{" "}
                  <Anchor
                    onClick={() => {
                      modals.openConfirmModal({
                        title: "Please confirm that you want to cancel your subscription",
                        children: (
                          <Text fz="sm">Once cancelled, you will loose access to your OptiTalk+ benefits.</Text>
                        ),
                        labels: { confirm: "Confirm", cancel: "Nevermind" },
                        confirmProps: { color: "red" },
                        onConfirm: () => {
                          fetch("/api/payments/paypal/cancel", {
                            method: "POST",
                            body: JSON.stringify({ reason: "User cancelled from OptiTalk." }),
                            headers: { "Content-Type": "application/json" },
                          })
                            .then((r) => r.json())
                            .then((d) => {
                              if (d.status_code === 200) {
                                notifications.show({
                                  title: "Subscription cancelled",
                                  message: "We will refresh the page shortly. Thank you for trying out OptiTalk+.",
                                  color: "teal",
                                  onClose: () => {
                                    window.location.href = "/";
                                  },
                                  autoClose: 3000,
                                });
                              } else {
                                onCancelSubscriptionError();
                              }
                            })
                            .catch((e) => {
                              console.error(e);
                              onCancelSubscriptionError();
                            });
                        },
                      });
                    }}
                  >
                    click here.
                  </Anchor>{" "}
                  We would also appreciate it if you would give us{" "}
                  <Anchor href="https://docs.google.com/forms/d/e/1FAIpQLSciRo_XWFTlm6MN4Ex__e2Da9UlHDG4osgJKGB5qVWsh5j96w/viewform">
                    feedback
                  </Anchor>{" "}
                  before canceling so that we know what can improve.
                </Text>
              </Flex>
            ) : (
              <Flex direction="column" gap="xs">
                <Title order={3}>OptiTalk+</Title>
                <Text fz="sm">
                  OptiTalk+ is our solution to keep the platform up and running. For just 4.99$/month, you gain access
                  to the benefits listed below. You can <Anchor href="/optitalk-plus">click here</Anchor> to subscribe.{" "}
                </Text>
              </Flex>
            )}

            <Flex direction="column" gap="sm" mt="lg">
              <Title order={3}>OptiTalk+ Benefits</Title>
              <Flex direction="column" gap={2}>
                <Text fz="sm">- Unlimited messages and characters</Text>
                <Text fz="sm">- Early access to upcoming features</Text>
                <Text fz="sm">- Prioritized support</Text>
              </Flex>
            </Flex>
          </>
        )}
      </Tabs.Panel>
    </Tabs>
  );
};

export default SettingsModal;
