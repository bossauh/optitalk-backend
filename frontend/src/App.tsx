/* eslint-disable react-hooks/exhaustive-deps */
import { NextUIProvider, createTheme } from "@nextui-org/react";
import { FC, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import socket from "./common/socket";
import { CharacterType, SessionType } from "./common/types";
import { deserializeCharacterData } from "./common/utils";
import StoreContext from "./contexts/store";
import "./index.css";

// Components
import FeedbackButton from "./components/FeedbackButton";

// Routes
import Index from "./routes";
import Characters from "./routes/characters";
import Chat from "./routes/chat";
import CreateCharacter from "./routes/create-character";
import GoogleOAuth from "./routes/google-oauth";
import MyAccount from "./routes/my-account";
import MyCharacters from "./routes/my-characters";

const theme = createTheme({
  type: "dark",
  theme: {
    colors: {
      primaryTextGradient: "90deg, rgba(1,130,108,1) 0%, rgba(82,160,229,1) 100%",
      primaryContainerBackground: "#131516",

      background: "#0D0E10",
      primary: "#01826C",
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
        element: <Chat />,
        children: [
          {
            path: "/s/:sessionId",
            element: <div>Session</div>,
          },
        ],
      },
      {
        path: "characters",
        element: <Characters />,
      },
      {
        path: "my-characters",
        element: <MyCharacters />,
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
  },
]);

const App: FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [userId, setUserId] = useState<string>();
  const [displayName, setDisplayName] = useState<string>();
  const [email, setEmail] = useState<string>();

  // Character related states
  const [activeCharacter, setActiveCharacter] = useState<CharacterType>();
  const [activeSession, setActiveSession] = useState<SessionType>();

  const [cookies, , ,] = useCookies(["activeCharacterId"]);

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
    setIsAuthenticating(true);
    fetch("/api/users/is-authenticated")
      .then((r) => r.json())
      .then((d) => {
        if (d.status_code !== 200) {
          setAuthenticated(false);
          setDisplayName(undefined);
          setEmail(undefined);

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
        }

        setIsAuthenticating(false);
      });
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
    const listener = () => {
      window.location.reload();
    };

    socket.on("user-data-transferred", listener);

    return () => {
      socket.off("user-data-transferred", listener);
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
        }}
      >
        <div
          style={{
            zIndex: 1,
            position: "relative",
          }}
        >
          <FeedbackButton />
          <RouterProvider router={router} />
        </div>
      </StoreContext.Provider>
    </NextUIProvider>
  );
};

export default App;
