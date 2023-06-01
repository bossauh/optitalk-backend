/* eslint-disable react-hooks/exhaustive-deps */
import { NextUIProvider, createTheme } from "@nextui-org/react";
import { FC, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import socket from "./common/socket";
import { CharacterType, GlobalModalPopupProps, SessionType, UserPlanDetails } from "./common/types";
import { deserializeCharacterData, deserializeUserPlanDetails } from "./common/utils";
import StoreContext from "./contexts/store";
import "./index.css";

// Components
import CharacterBasicInformationEditor from "./components/CharacterBasicInformationEditor";
import CharacterConversationEditor from "./components/CharacterConversationEditor";
import CharacterKnowledgeEditor from "./components/CharacterKnowledgeEditor";
import CharacterViewConversation from "./components/CharacterViewConversation";
import CharacterViewKnowledge from "./components/CharacterViewKnowledge/CharacterViewKnowledge";
import CharactersView from "./components/CharactersView";
import GlobalModalPopup from "./components/GlobalModalPopup";

// Routes
import Index from "./routes";
import CharacterView from "./routes/character-view";
import Characters from "./routes/characters";
import Chat from "./routes/chat";
import CreateCharacter from "./routes/create-character";
import GoogleOAuth from "./routes/google-oauth";
import MyAccount from "./routes/my-account";

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
        children: [
          {
            path: "/characters/my-characters",
            element: <CharactersView key={"my-characters"} params={{ my_characters: "true" }} />,
          },
          {
            path: "/characters/featured",
            element: <CharactersView key={"featured"} params={{ featured: "true" }} />,
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
          setUserPlanDetails(deserializeUserPlanDetails(d.payload.plan));
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
        }}
      >
        <div
          style={{
            zIndex: 1,
            position: "relative",
          }}
        >
          <GlobalModalPopup
            content={globalModal.content}
            showCounter={globalModal.showCounter}
            variant={globalModal.variant}
            hideIn={globalModal.hideIn}
            title={globalModal.title}
          />
          {/* <FeedbackButton /> */}
          <RouterProvider router={router} />
        </div>
      </StoreContext.Provider>
    </NextUIProvider>
  );
};

export default App;
