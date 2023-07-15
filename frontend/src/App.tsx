/* eslint-disable react-hooks/exhaustive-deps */
import { MantineProvider } from "@mantine/core";
import { Notifications, notifications } from "@mantine/notifications";
import { NavigationProgress } from "@mantine/nprogress";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { FC, useCallback, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { AiFillCheckCircle, AiFillWarning } from "react-icons/ai";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import socket from "./common/socket";
import { CharacterType, SessionType, UserPlanDetails } from "./common/types";
import { deserializeCharacterData, deserializeUserPlanDetails } from "./common/utils";
import GlobalModalPopup from "./components/GlobalModalPopup";
import HighTrafficWarning from "./components/HighTrafficWarning";
import StoreContext from "./contexts/store";
import "./index.css";
import Index from "./routes";
import CharacterView from "./routes/character-view";
import Characters from "./routes/characters";
import Chat from "./routes/chat";
import CreateCharacter from "./routes/create-character";
import GoogleOAuth from "./routes/google-oauth";
import Logout from "./routes/logout";
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

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    children: [
      {
        path: "",
        element: <Characters />,
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
      },
      {
        path: "/my-account",
        element: <MyAccount />,
      },
      {
        path: "/create-character",
        element: <CreateCharacter />,
      },
    ],
  },
  {
    path: "/oauth/google-oauth",
    element: <GoogleOAuth />,
  },
  {
    path: "/logout",
    element: <Logout />,
  },
  {
    path: "/optitalk-plus",
    element: <OptitalkPlus />,
  },
]);

const App: FC = () => {
  const [colorScheme, setColorScheme] = useState<"dark" | "light">("dark");

  // States related to user's information
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

  // Temporary data for story mode
  const [storyMode, setStoryMode] = useState(false);
  const [storyModeContent, setStoryModeContent] = useState<string | null>("");

  const fetchUserData = useCallback(() => {
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
  }, []);

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
        userPlanDetails: userPlanDetails,
        fetchUserData: fetchUserData,
        storyMode: storyMode,
        storyModeContent: storyModeContent,
        setStoryMode: setStoryMode,
        setStoryModeContent: setStoryModeContent,
        setColorScheme: setColorScheme,
      }}
    >
      <MantineProvider
        theme={{
          colorScheme: colorScheme,
          primaryColor: "teal",
          defaultGradient: { deg: 45, from: "teal", to: "blue.5" },
        }}
        withNormalizeCSS
        withGlobalStyles
      >
        <NavigationProgress />
        <Notifications zIndex={500} />

        <PayPalScriptProvider options={paypalOptions}>
          <RouterProvider router={router} />
        </PayPalScriptProvider>
      </MantineProvider>
    </StoreContext.Provider>
  );
};

export default App;
