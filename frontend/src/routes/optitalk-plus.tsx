import { ActionIcon, Box, Container, Flex, MediaQuery, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { FC } from "react";
import { MdArrowBack } from "react-icons/md";
import { useNavigate } from "react-router";

const OptiTalkPlus: FC = () => {
  const navigate = useNavigate();

  return (
    <MediaQuery
      largerThan="lg"
      styles={(theme) => ({
        paddingLeft: "40px",
      })}
    >
      <Box
        sx={(theme) => ({
          background: "#FAFAFA",
          paddingTop: "40px",
          minHeight: "100vh",
        })}
      >
        <ActionIcon
          color="dark"
          size="lg"
          variant="filled"
          sx={(theme) => ({
            marginLeft: theme.spacing.xl,
          })}
          onClick={() => {
            navigate(-1);
          }}
        >
          <MdArrowBack size={21} />
        </ActionIcon>
        <Container
          fluid
          sx={(theme) => ({
            paddingTop: theme.spacing.xl,
            paddingLeft: theme.spacing.xl,
          })}
        >
          <MediaQuery
            smallerThan="md"
            styles={{
              flexDirection: "column",
              paddingBottom: "100px",
            }}
          >
            <Flex align="center" wrap="wrap" gap="xl">
              <Flex
                direction="column"
                gap={45}
                sx={{
                  flex: 1,
                  // width: "700px",
                }}
              >
                <Flex direction="column" gap={4}>
                  <Title order={1} size={65} color="black">
                    Introducing{" "}
                    <Text
                      span
                      sx={(theme) => ({
                        background: "linear-gradient(to right, #30CFD0 0%, #5F6EBA 100%)",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      })}
                    >
                      OptiTalk+
                    </Text>
                  </Title>
                  <Text color="rgba(0,0,0,0.9)" fz="md" fw={500}>
                    We're thrilled to unveil OptiTalk+, a solution designed to support the growth of our platform and
                    ensure a stable user experience while delivering constant new features. <br /> <br />
                    For only{" "}
                    <Text span fw="bold">
                      4.99$/month
                    </Text>
                    , plus users will gain the ability to send{" "}
                    <Text span fw="bold">
                      UNLIMITED
                    </Text>{" "}
                    messages per hour and create as many characters as they want as a thank you for supporting us.
                    Additionally, plus users are entitled to receiving extra benefits such as, but not limited to, early
                    access to new features, prioritized support, and much more.
                  </Text>
                </Flex>
                <Flex direction="column" gap={4}>
                  <Title order={1} color="black">
                    Why?
                  </Title>
                  <Text color="rgba(0,0,0,0.9)" fz="md" fw={500}>
                    OptiTalk is a small team of passionate developers struggling to keep up with demand. In the last few
                    weeks, we have seen a{" "}
                    <Text span fw="bold">
                      25,000%
                    </Text>{" "}
                    increase in new users. This surge has caused major issues within our servers as they try to handle
                    the traffic. To address this, we have upgraded to a better infrastructure and made optimizations
                    within our codebase. However, to sustain our infrastructure and deliver new features consistently
                    with high quality, we need additional funding. Hence,{" "}
                    <Text span fw="bold">
                      OptiTalk+
                    </Text>{" "}
                    was born. <br /> <br />
                    We understand that users want a free platform, and OptiTalk will continue to be free, albeit with
                    certain limitations to ensure server stability. By showing your support to us, you will receive
                    extra benefits such as unlimited messages, characters, and more
                  </Text>
                </Flex>
                <Flex direction="column" gap={4}>
                  <Title order={1} color="black">
                    OptiTalk+ Benefits
                  </Title>
                  <Flex direction="column" gap={2}>
                    <Text color="rgba(0,0,0,0.9)" fz="md" fw={500}>
                      - Unlimited Messages per Hour
                    </Text>
                    <Text color="rgba(0,0,0,0.9)" fz="md" fw={500}>
                      - Unlimited Characters
                    </Text>
                    <Text color="rgba(0,0,0,0.9)" fz="md" fw={500}>
                      - Early access to upcoming features
                    </Text>
                    <Text color="rgba(0,0,0,0.9)" fz="md" fw={500}>
                      - Prioritized Support
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
              <Flex
                sx={{
                  flex: 1,
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={(theme) => ({
                    padding: "40px",
                    paddingBottom: "20px",
                    background: "white",
                    borderRadius: "7px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    boxShadow: theme.shadows.xl,
                    alignItems: "center",
                  })}
                >
                  <Flex gap="xs" direction="column" align="center">
                    <Title order={2} color="#2E2E2E" fw={500}>
                      Subscribe with PayPal
                    </Title>
                    <Text fz="sm" color="rgba(0,0,0,0.7)" fw={500}>
                      4.99$/month
                    </Text>
                  </Flex>
                  <PayPalButtons
                    createSubscription={(data, actions) => {
                      return actions.subscription.create({
                        plan_id:
                          process.env.NODE_ENV === "production"
                            ? "P-2LP44214MM274835VMSMPV6I"
                            : "P-5MD47883J4123924AMSMP5EY",
                      });
                    }}
                    // @ts-expect-error
                    onApprove={(data, actions) => {
                      let subscription = actions.subscription;
                      subscription?.get().then((details: any) => {
                        fetch("/api/payments/add-subscription-id", {
                          method: "POST",
                          body: JSON.stringify({ id: details["id"] }),
                          headers: { "Content-Type": "application/json" },
                        })
                          .then((r) => r.json())
                          .then((d) => {
                            if (d.status_code !== 200) {
                              notifications.show({
                                color: "red",
                                title: "Error while processing your PayPal payment.",
                                message: "Please contact philmattdev@gmail.com for immediate assistance.",
                              });
                            } else {
                              window.location.href = "/";
                            }
                          });
                      });
                    }}
                  />
                </Box>
              </Flex>
            </Flex>
          </MediaQuery>
        </Container>
      </Box>
    </MediaQuery>
  );
};

export default OptiTalkPlus;
