/* eslint-disable react-hooks/exhaustive-deps */
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { NextUIProvider, createTheme } from "@nextui-org/react";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { FC, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { AiFillCheckCircle, AiFillWarning } from "react-icons/ai";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import socket from "./common/socket";
import { CharacterType, GlobalModalPopupProps, SessionType, UserPlanDetails } from "./common/types";
import { deserializeCharacterData, deserializeUserPlanDetails } from "./common/utils";
import StoreContext from "./contexts/store";
import "./index.css";

// Components
import { Notifications, notifications } from "@mantine/notifications";
import CharacterBasicInformationEditor from "./components/CharacterBasicInformationEditor";
import CharacterConversationEditor from "./components/CharacterConversationEditor";
import CharacterKnowledgeEditor from "./components/CharacterKnowledgeEditor";
import CharacterViewConversation from "./components/CharacterViewConversation";
import CharacterViewKnowledge from "./components/CharacterViewKnowledge/CharacterViewKnowledge";
import CharactersView from "./components/CharactersView";
import GlobalModalPopup from "./components/GlobalModalPopup";
import HighTrafficWarning from "./components/HighTrafficWarning";

// Routes
import Index from "./routes";
import CharacterView from "./routes/character-view";
import Characters from "./routes/characters";
import Chat from "./routes/chat";
import CreateCharacter from "./routes/create-character";
import GoogleOAuth from "./routes/google-oauth";
import MyAccount from "./routes/my-account";
import OptitalkPlus from "./routes/optitalk-plus";

const paypalOptions = {
  clientId:
    process.env.NODE_ENV === "development"
      ? "ATWCvBPme3ENsidiBpqGCDWcNjB3pWygeA8vcTJ0hai1xWTM9UgOKo7eGbF8JVpXKMgpL6qmra4DanUM"
      : "AbJ6Nu-m0TPh5bnQd2EpezR2RUqglatKGXuJvJtIvhmR1zMG5haEVbRz68BRRn1VgtpEfChNzwySfdNz",
  intent: "subscription",
  vault: true,
  currency: "USD",
  components: "buttons",
};

const theme = createTheme({
  type: "dark",
  theme: {
    colors: {
      primaryTextGradient: "90deg, rgba(1,130,108,1) 0%, rgba(82,160,229,1) 100%",
      primaryContainerBackground: "#131516",

      background: "#0D0E10",

      primary: "#01826C",
      primaryShadow: "#016856",
      primaryLight: "#016856",
      primaryLightHover: "#016856",
      primaryLightActive: "#014e41",

      secondary: "#175873",
      error: "#c63536",
      gradient: "linear-gradient(90deg, rgba(1,130,108,1) 0%, rgba(82,160,229,1) 100%)",
    },
  },
});
const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    children: [
      {
        path: "",
        element: <Characters />,
        children: [
          {
            path: "/my-characters",
            element: <CharactersView key={"my-characters"} params={{ my_characters: "true" }} />,
          },
          {
            path: "/public",
            element: <CharactersView />,
          },
        ],
      },
      {
        path: "/chat",
        element: <Chat />,
        children: [
          {
            path: "/chat/s/:sessionId",
            element: <div>Session</div>,
          },
        ],
      },
      {
        path: "/character/:characterId",
        element: <CharacterView />,
        children: [
          {
            path: "example-conversation",
            element: <CharacterViewConversation />,
          },
          {
            path: "knowledge-base",
            element: <CharacterViewKnowledge />,
          },
        ],
      },
    ],
  },
  {
    path: "/ec/:characterId",
    element: <CreateCharacter />,
  },
  {
    path: "/oauth/google-oauth",
    element: <GoogleOAuth />,
  },
  {
    path: "/my-account",
    element: <MyAccount />,
  },
  {
    path: "/create-character",
    element: <CreateCharacter />,
    children: [
      {
        path: "",
        element: <CharacterBasicInformationEditor />,
      },
      {
        path: "knowledge",
        element: <CharacterKnowledgeEditor />,
      },
      {
        path: "example-conversation",
        element: <CharacterConversationEditor />,
      },
    ],
  },
  {
    path: "/optitalk-plus",
    element: <OptitalkPlus />,
  },
]);

const App: FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [userId, setUserId] = useState<string>();
  const [displayName, setDisplayName] = useState<string>();
  const [email, setEmail] = useState<string>();
  const [userPlanDetails, setUserPlanDetails] = useState<UserPlanDetails>();

  // Character related states
  const [activeCharacter, setActiveCharacter] = useState<CharacterType>();
  const [activeSession, setActiveSession] = useState<SessionType>();

  const [cookies, , ,] = useCookies(["activeCharacterId"]);

  const [globalModal, setGlobalModal] = useState<GlobalModalPopupProps>({
    content: "",
    showCounter: 0,
    variant: "info",
  });

  const fetchUserData = () => {
    setIsAuthenticating(true);
    fetch("/api/users/is-authenticated")
      .then((r) => r.json())
      .then((d) => {
        if (d.status_code !== 200) {
          setAuthenticated(false);
          setDisplayName(undefined);
          setEmail(undefined);
          setUserPlanDetails(undefined);

          fetch("/api/users/ip-address")
            .then((r) => r.json())
            .then((d) => {
              setUserId(d.payload);
            });
        } else {
          setAuthenticated(true);
          setDisplayName(d.payload.display_name);
          setEmail(d.payload.email);
          setUserId(d.payload.id);

          // Get plan details
          let plan = deserializeUserPlanDetails(d.payload.plan);
          setUserPlanDetails(plan);
          console.debug("User Plan", plan);
        }

        setIsAuthenticating(false);
      });
  };

  useEffect(() => {
    if (activeCharacter === undefined && cookies.activeCharacterId) {
      fetch(`/api/characters/details?character_id=${cookies.activeCharacterId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.status_code === 200) {
            setActiveCharacter(deserializeCharacterData(d.payload));
          }
        });
    }
  }, [cookies]);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      socket.emit("join-room", userId);
    }

    return () => {
      if (userId) {
        socket.emit("leave-room", userId);
      }
    };
  }, [userId]);

  useEffect(() => {
    const dataTransferred = () => {
      window.location.reload();
    };

    const subscriptionActivated = () => {
      notifications.show({
        color: "teal",
        title: "OptiTalk+ Activated!",
        message: "You are now using OptiTalk+. The page will reload in a few seconds.",
        icon: <AiFillCheckCircle />,
        onClose: () => {
          window.location.reload();
        },
      });
    };

    const subscriptionPaused = () => {
      notifications.show({
        color: "orange",
        title: "Subscription Paused",
        message:
          "Your subscription has been paused. This could be because PayPal has failed to charge your account. Please visit your PayPal page.",
        icon: <AiFillWarning />,
        onClose: () => {
          fetchUserData();
        },
      });
    };
    const subscriptionCancelled = () => {
      notifications.show({
        color: "red",
        title: "Subscription Cancelled",
        message: "Your subscription has been cancelled from within PayPal.",
        onClose: () => {
          fetchUserData();
        },
      });
    };

    socket.on("user-subscription-activated", subscriptionActivated);
    socket.on("user-subscription-paused", subscriptionPaused);
    socket.on("user-subscription-cancelled", subscriptionCancelled);
    socket.on("user-data-transferred", dataTransferred);

    return () => {
      socket.off("user-subscription-activated", subscriptionActivated);
      socket.off("user-subscription-paused", subscriptionPaused);
      socket.off("user-subscription-cancelled", subscriptionCancelled);
      socket.off("user-data-transferred", dataTransferred);
    };
  }, []);

  return (
    <NextUIProvider theme={theme}>
      <StoreContext.Provider
        value={{
          authenticated: authenticated,
          displayName: displayName,
          email: email,
          userId: userId,
          activeCharacter: activeCharacter,
          setActiveCharacter: setActiveCharacter,
          activeSession: activeSession,
          setActiveSession: setActiveSession,
          isAuthenticating: isAuthenticating,
          openModal(content, variant, title, hideIn) {
            setGlobalModal((prev) => {
              return {
                content: content,
                variant: variant,
                title: title,
                hideIn: hideIn,
                showCounter: prev.showCounter + 1,
              };
            });
          },
          userPlanDetails: userPlanDetails,
          fetchUserData: fetchUserData,
        }}
      >
        <div
          style={{
            zIndex: 1,
            position: "relative",
          }}
        >
          <MantineProvider
            theme={{
              colorScheme: "dark",
            }}
          >
            <ModalsProvider>
              <Notifications />
              {/* <HighTrafficWarning /> */}
              <GlobalModalPopup
                content={globalModal.content}
                showCounter={globalModal.showCounter}
                variant={globalModal.variant}
                hideIn={globalModal.hideIn}
                title={globalModal.title}
              />

              <PayPalScriptProvider options={paypalOptions}>
                <RouterProvider router={router} />
              </PayPalScriptProvider>
            </ModalsProvider>
          </MantineProvider>
        </div>
      </StoreContext.Provider>
    </NextUIProvider>
  );
};

export default App;
