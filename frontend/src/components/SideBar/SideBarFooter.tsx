import { Anchor, Flex, Loader, Menu, NavLink, Text, Tooltip } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { Button, Card, Loading } from "@nextui-org/react";
import { FC, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Store from "../../contexts/store";

// Icons
import { BiLogOut, BiUser } from "react-icons/bi";
import { BsChevronRight, BsRobot } from "react-icons/bs";
import { FiLogIn } from "react-icons/fi";
import { GiCancel, GiUpgrade } from "react-icons/gi";

const SideBarFooter: FC = () => {
  const storeCtx = useContext(Store);

  const navigate = useNavigate();

  const openCancelSubscriptionModal = () =>
    modals.openConfirmModal({
      title: "Are you sure you want to cancel your subscription?",
      children: (
        <Text fz="sm">
          By cancelling, you will loose access to your OptiTalk+ benefits such as unlimited messages, unlimited
          characters, and more.
        </Text>
      ),
      labels: {
        confirm: "Confirm Cancellation",
        cancel: "Never mind",
      },
      onConfirm: () => {
        fetch("/api/payments/paypal/cancel", {
          method: "POST",
          body: JSON.stringify({ reason: "User cancelled." }),
          headers: { "Content-Type": "application/json" },
        })
          .then((r) => r.json())
          .then((d) => {
            notifications.show({
              title: "Subscription will be canceled.",
              message: "Thanks for trying out OptiTalk+",
              autoClose: 2000,
              onClose: () => {
                window.location.href = "/";
              },
            });
          });
      },
      confirmProps: { color: "red" },
    });

  return (
    <Card.Footer
      css={{
        flexDirection: "column",
        minHeight:
          storeCtx?.authenticated && storeCtx.userPlanDetails?.subscriptionStatus !== "activated"
            ? "140px"
            : storeCtx?.userPlanDetails?.subscriptionStatus === "activated"
            ? "120px"
            : "95px",
      }}
    >
      {storeCtx === null ? (
        <Button disabled auto css={{ width: "100%" }}>
          <Loading color="currentColor" size="sm" />
        </Button>
      ) : storeCtx.authenticated ? (
        <>
          {storeCtx.userPlanDetails?.subscriptionStatus !== "activated" && (
            <Tooltip
              label={
                storeCtx.userPlanDetails?.subscriptionStatus === "pending"
                  ? "Subscription being activated..."
                  : undefined
              }
              sx={{
                zIndex: 1000,
              }}
              opened={
                [null, undefined, "activated"].includes(storeCtx.userPlanDetails?.subscriptionStatus)
                  ? false
                  : undefined
              }
            >
              <NavLink
                label={
                  storeCtx.userPlanDetails?.subscriptionStatus === "pending" ? "Activating OptiTalk+" : "OptiTalk+"
                }
                icon={
                  storeCtx.userPlanDetails?.subscriptionStatus === "pending" ? (
                    <Loader size="xs" color="teal" />
                  ) : (
                    <GiUpgrade />
                  )
                }
                variant="subtle"
                active
                color="teal"
                onClick={() => {
                  if (storeCtx.userPlanDetails?.subscriptionStatus != null) {
                    navigate("/my-subscription");
                  } else {
                    navigate("/optitalk-plus");
                  }
                }}
                disabled={storeCtx.userPlanDetails?.subscriptionStatus === "pending"}
              />
            </Tooltip>
          )}
          <Menu shadow="md">
            <Menu.Target>
              <NavLink
                label="My Account"
                icon={<BiUser />}
                rightSection={<BsChevronRight />}
                description={storeCtx.userPlanDetails?.subscriptionStatus === "activated" && "OptiTalk+ User"}
              />
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{storeCtx.displayName}</Menu.Label>
              <Menu.Item
                icon={<BsRobot />}
                onClick={() => {
                  navigate("/my-characters");
                }}
              >
                My Characters
              </Menu.Item>
              {storeCtx.userPlanDetails?.subscriptionStatus === "activated" && (
                <Menu.Item icon={<GiCancel />} color="red" onClick={() => openCancelSubscriptionModal()}>
                  Cancel Subscription
                </Menu.Item>
              )}
              <Menu.Item
                icon={<BiLogOut />}
                onClick={() => {
                  fetch("/api/users/logout")
                    .then((r) => r.json())
                    .then((d) => {
                      if (d.status_code === 200) {
                        window.location.href = "/";
                      }
                    });
                }}
                color="red"
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </>
      ) : (
        <NavLink
          label="Sign Up"
          icon={<FiLogIn />}
          onClick={() => {
            navigate("/oauth/google-oauth");
          }}
        />
      )}

      <Flex mt="xs" gap="xs" align="center">
        <Text
          fz="xs"
          sx={(theme) => ({
            color: theme.colors.dark[2],
          })}
        >
          MothLabs © 2023
        </Text>
        <Anchor
          fz="xs"
          href="https://docs.google.com/forms/d/e/1FAIpQLSciRo_XWFTlm6MN4Ex__e2Da9UlHDG4osgJKGB5qVWsh5j96w/viewform?usp=sf_link"
        >
          Contact Us
        </Anchor>
      </Flex>
    </Card.Footer>
  );
};

export default SideBarFooter;
