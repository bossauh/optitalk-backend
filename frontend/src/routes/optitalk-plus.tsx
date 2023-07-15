/* eslint-disable react-hooks/exhaustive-deps */
import { Accordion, ActionIcon, Badge, Box, Container, Flex, List, MediaQuery, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { FC, useContext, useEffect } from "react";
import { MdArrowBack } from "react-icons/md";
import { useNavigate } from "react-router";
import StoreContext from "../contexts/store";

const OptiTalkPlus: FC = () => {
  const navigate = useNavigate();
  const store = useContext(StoreContext);

  const addingSubscriptionIdFailed = () => {
    notifications.show({
      color: "red",
      title: "Error while processing your PayPal payment.",
      message: "Please contact philmattdev@gmail.com for immediate assistance.",
    });
  };

  useEffect(() => {
    store?.setColorScheme("light");

    return () => {
      store?.setColorScheme("dark");
    };
  }, []);

  return (
    <MediaQuery
      largerThan="lg"
      styles={(theme) => ({
        paddingLeft: "40px",
      })}
    >
      <Box
        sx={(theme) => ({
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
            <Flex wrap="wrap" gap="xl" direction="column">
              <Flex
                direction="column"
                gap={45}
                sx={{
                  flex: 1,
                  // width: "700px",
                }}
              >
                <Flex direction="column" gap={4} maw="700px">
                  <Title size={55} color="black">
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
                    , plus users will gain the ability to all the following features:
                  </Text>

                  <List
                    sx={{
                      ".mantine-List-item": {
                        fontWeight: 500,
                      },
                    }}
                  >
                    <List.Item>Unlimited Messages per hour</List.Item>
                    <List.Item>Unlimited Characters</List.Item>
                    <List.Item>
                      Access to the story mode feature{" "}
                      <Badge color="teal" variant="gradient" size="sm">
                        New
                      </Badge>{" "}
                    </List.Item>
                    <List.Item>Early access to upcoming features</List.Item>
                    <List.Item>Prioritized Support</List.Item>
                  </List>
                  <Accordion variant="separated" mt="xs">
                    <Accordion.Item value="what">
                      <Accordion.Control>Where will my money be spent if I buy OptiTalk+?</Accordion.Control>
                      <Accordion.Panel>
                        By purchasing OptiTalk+, you will contribute to the sustainable operation of the OptiTalk.
                        Currently, we are utilizing our own funds to maintain the platform, but with the support of
                        OptiTalk+ users, we can ensure its continued functioning. Your purchase will help cover the
                        costs involved in running the platform and enable us to invest in essential upgrades, innovative
                        features, and ongoing improvements.
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                </Flex>
              </Flex>
              <Flex>
                <Box
                  sx={(theme) => ({
                    padding: "40px",
                    paddingBottom: "20px",
                    borderRadius: "7px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    boxShadow: theme.shadows.sm,
                    alignItems: "center",
                    border: "1px solid",
                    borderColor: theme.colors.gray[3],
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
                              addingSubscriptionIdFailed();
                            } else {
                              window.location.href = "/";
                            }
                          })
                          .catch(() => {
                            addingSubscriptionIdFailed();
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
