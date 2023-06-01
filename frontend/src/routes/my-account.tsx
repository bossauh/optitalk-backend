/* eslint-disable react-hooks/exhaustive-deps */
import { Container, Progress, Spacer, Text } from "@nextui-org/react";
import { FC, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StoreContext from "../contexts/store";

// Components
import Box from "../components/Box";
import TopBarSecondary from "../components/TopBarSecondary";

const MyAccount: FC = () => {
  const store = useContext(StoreContext);

  const navigate = useNavigate();

  useEffect(() => {
    if (!store?.authenticated && !store?.isAuthenticating) {
      navigate("/");
    }
  }, [store?.isAuthenticating]);

  return (
    <Container
      css={{
        mt: "30px",
        pb: "80px",
      }}
    >
      <TopBarSecondary title="My Account" />
      <Box>
        <Text
          css={{
            color: "$accents8",
          }}
        >
          Username: {store?.displayName}
        </Text>
      </Box>
      <Spacer y={1.5} />
      <Box>
        <Text h2>{store?.userPlanDetails?.name} Plan</Text>
        <Box
          css={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Box>
            <Text size={18} b>
              Messages
            </Text>
            <Text>
              {store?.userPlanDetails?.requests} / {store?.userPlanDetails?.maxRequests}
            </Text>
          </Box>
          <Progress
            size="md"
            max={store?.userPlanDetails?.maxRequests}
            value={store?.userPlanDetails?.requests}
            css={{
              maxWidth: "500px",
            }}
          />
        </Box>
        <Box
          css={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            mt: "20px",
          }}
        >
          <Box>
            <Text size={18} b>
              Characters
            </Text>
            <Text>
              {store?.userPlanDetails?.characters} / {store?.userPlanDetails?.maxCharacters}
            </Text>
            <Text size={14}>
              <a href="/characters/my-characters">View Characters</a>
            </Text>
          </Box>
          <Progress
            size="md"
            max={store?.userPlanDetails?.maxCharacters}
            value={store?.userPlanDetails?.characters}
            css={{
              maxWidth: "500px",
            }}
            color="secondary"
          />
        </Box>
      </Box>
      <Box
        css={{
          mt: "20px",
        }}
      >
        <Text h2>Subscription Plans</Text>
        <Text
          css={{
            maxWidth: "700px",
          }}
        >
          You can subscribe to plans to increase your limit, it is also a way for users to support the development of
          this platform. To subscribe to a plan, simply go to{" "}
          <a href="https://www.buymeacoffee.com/philippemathew/membership">this page</a> and select your plan. Don't
          forget to include the email you used for optitalk on the message box.
        </Text>
        <Box
          css={{
            bg: "$accents0",
            p: "15px",
            border: "0px solid $primary",
            borderLeftWidth: "3px",
            mt: "20px",
            maxWidth: "700px",
          }}
        >
          <Text color="$accents8">
            I am currently working on a stripe integration so that users can purchase subscriptions from the site
            itself. Everyone who purchased via buy me a coffee will have their subscription transferred to stripe once
            it is integrated.
          </Text>
        </Box>
      </Box>
    </Container>
  );
};

export default MyAccount;
