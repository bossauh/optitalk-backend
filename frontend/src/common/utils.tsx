/* eslint-disable react-hooks/exhaustive-deps */
import { Anchor, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useContext, useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import { v4 as uuidv4 } from "uuid";
import StoreContext from "../contexts/store";
import {
  CharacterEditorFields,
  CharacterType,
  KnowledgeType,
  MessageType,
  SessionType,
  UserDetails,
  UserPlanDetails,
} from "./types";

export function deserializeCharacterData(data: any): CharacterType {
  return {
    createdAt: data.created_at,
    createdBy: data.created_by,
    publicDescription: data.public_description,
    description: data.description,
    exampleExchanges: data.example_exchanges,
    favoriteWords: data.favorite_words,
    id: data.id,
    image: data.image,
    knowledge: data.knowledge,
    name: data.name,
    personalities: data.personalities,
    private: data.private,
    uses: data.uses,
    responseStyles: data.response_styles,
    favorite: data.favorite,
    avatarId: data.avatar_id,
    definitionVisibility: data.definition_visibility,
    nsfw: data.nsfw,
    tags: data.tags,
    tagsSimilarity: data.tags_similarity,
  };
}

export function deserializeSessionData(data: any): SessionType {
  return {
    characterId: data.character_id,
    createdBy: data.created_by,
    id: data.id,
    name: data.name,
    messagesCount: data.messages_count,
    lastUsed: data.last_used,
    storyMode: data.story_mode,
    story: data.story,
    tweaks: data.tweaks,
  };
}

export function deserializeMessageData(data: any): MessageType {
  return {
    characterId: data.character_id,
    content: data.content,
    createdAt: data.created_at,
    role: data.role,
    id: data.id,
    comments: data.comments,
    contradictions: data.contradictions,
    knowledgeHint: data.knowledge_hint,
    processingTime: data.processing_time,
    createdBy: data.created_by,
    name: data.name,
    generated: data.generated,
    regenerated: data.regenerated,
  };
}

export function deserializeCharacterFields(data: any): CharacterEditorFields {
  return {
    name: data.name,
    description: data.description,
    knowledge: data.knowledge,
    personalities: data.personalities,
    favoriteWords: data.favorite_words,
    responseStyles: data.response_styles,
    exampleExchanges: data.example_exchanges,
    private: data.private,
    image: data.image,
  };
}

export function deserializeKnowledge(data: any): KnowledgeType {
  return {
    characterId: data.character_id,
    content: data.content,
    createdBy: data.created_by,
    id: data.id,
  };
}

export function deserializeUserPlanDetails(data: any): UserPlanDetails {
  let status: "pending" | "activated" | null = null;

  if (data.subscription_id) {
    if (data.id === "free") {
      status = "pending";
    } else if (data.id === "basic") {
      status = "activated";
    }
  }

  return {
    characters: data.characters,
    id: data.id,
    maxCharacters: data.max_characters,
    maxRequests: data.max_requests,
    name: data.name,
    requests: data.requests,
    verified: data.verified,
    subscriptionId: data.subscription_id,
    subscriptionStatus: status,
  };
}

export function serializeCharacterFields(data: CharacterEditorFields) {
  return {
    name: data.name,
    description: data.description,
    personalities: data.personalities,
    favorite_words: data.favoriteWords,
    response_styles: data.responseStyles,
    example_exchanges: data.exampleExchanges,
    private: data.private,
    image: data.image === undefined || data.image === null || data.image.trim() === "" ? undefined : data.image,
  };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  } else {
    return text.slice(0, maxLength) + "...";
  }
}

export const useScrollbarWidth = (): number => {
  const didCompute = useRef<boolean>(false);
  const widthRef = useRef<number>(0);

  if (didCompute.current) return widthRef.current;

  // Creating invisible container
  const outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.overflow = "scroll"; // forcing scrollbar to appear
  document.body.appendChild(outer);

  // Creating inner element and placing it in the container
  const inner = document.createElement("div");
  outer.appendChild(inner);

  // Calculating difference between container's full width and the child width
  const scrollbarWidth: number = outer.offsetWidth - inner.offsetWidth;

  // Removing temporary elements from the DOM
  outer.parentNode?.removeChild(outer);

  didCompute.current = true;
  widthRef.current = scrollbarWidth;

  return scrollbarWidth;
};

export function useMediaQuery(query: string): boolean {
  const getMatches = (query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  function handleChange() {
    setMatches(getMatches(query));
  }

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Triggered at the first client-side load and if query changes
    handleChange();

    // Listen matchMedia
    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange);
    } else {
      matchMedia.addEventListener("change", handleChange);
    }

    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange);
      } else {
        matchMedia.removeEventListener("change", handleChange);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return matches;
}

export function useRenderTrigger() {
  const [renderCount, setRenderCount] = useState(0);

  const triggerRender = () => {
    setRenderCount((prevCount) => prevCount + 1);
  };

  return [renderCount, triggerRender];
}

export function getAvatar(url?: string | null) {
  if (!url) {
    return "/images/character-icon.png";
  }
  return url;
}

export function getBanner(url?: string | null) {
  if (!url) {
    return "/images/character-icon.png";
  }
  return url;
}

export function formatNumber(num: number) {
  if (isNaN(num)) {
    return "Input is not a number";
  }

  let sign = num >= 0 ? "" : "-"; // check if the number is negative
  num = Math.abs(num);

  if (num >= 1000000000) {
    return sign + (num / 1000000000).toFixed(1) + "B"; // convert billions to "B"
  } else if (num >= 1000000) {
    return sign + (num / 1000000).toFixed(1) + "M"; // convert millions to "M"
  } else if (num >= 1000) {
    return sign + (num / 1000).toFixed(1) + "k"; // convert thousands to "k"
  } else {
    return sign + num; // if less than 1000, default to normal formatting
  }
}

export const toggleFavorite = (
  id: string,
  name: string,
  value: boolean,
  setter: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const onError = () => {
    notifications.show({
      title: "A error has occurred while trying to favorite a character.",
      message: "Please try again. If the error persists, contact us.",
      color: "red",
    });
  };

  let url = "/api/characters/add-to-favorites";
  let method = "POST";
  if (value) {
    url = "/api/characters/remove-from-favorites";
    method = "DELETE";
  }

  fetch(url + "?id=" + id, { method: method })
    .then((r) => r.json())
    .then((d) => {
      if (d.status_code !== 200) {
        onError();
      } else {
        if (value) {
          notifications.show({
            title: "Removed from favorites.",
            message: `Character "${name}" has been removed from your favorites.`,
            color: "teal",
          });
        } else {
          notifications.show({
            title: "Added to favorites.",
            message: `Character "${name}" has been added to your favorites.`,
            color: "teal",
          });
        }
        setter(!value);
      }
    })
    .catch((e) => {
      console.error(e);
      onError();
    });
};

export const deleteCharacter = (id: string) => {
  let url = "/api/characters?character_id=" + id;

  const onUnknownError = () => {
    notifications.show({
      title: "A unknown error has occurred",
      message:
        "A unknown error has occurred while trying to delete the character. Please try again. If the problem persists, contact us.",
      color: "red",
    });
  };

  return fetch(url, { method: "DELETE" })
    .then((r) => r.json())
    .then((d) => {
      if (d.status_code === 404) {
        notifications.show({
          title: "Character not found",
          message: "The character you're trying to delete either does not exist or you don't own it.",
          color: "red",
        });
        return false;
      } else if (d.status_code === 200) {
        return true;
      } else {
        onUnknownError();
        return false;
      }
    })
    .catch((e) => {
      onUnknownError();
      console.error(e);
      return false;
    });
};

export const useActiveCharacter = (): [CharacterType | undefined, (character?: CharacterType) => void] => {
  const [, setCookie, removeCookie] = useCookies(["activeCharacterId"]);
  const store = useContext(StoreContext);

  const setter = (character?: CharacterType) => {
    if (!character) {
      store?.setActiveCharacter(undefined);
      removeCookie("activeCharacterId", { path: "/" });
    } else {
      const newDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(newDate.getDate() + 100);

      store?.setActiveCharacter(character);
      setCookie("activeCharacterId", character.id, { path: "/", secure: false, expires: expiryDate });
      notifications.show({
        title: "Character selectd",
        message: "You can now chat with the character by going to the Chat page and sending a message.",
        color: "blue",
      });
    }
    store?.setActiveSession(undefined);
  };

  return [store?.activeCharacter, setter];
};

export const useSessions = (): [SessionType[], React.Dispatch<React.SetStateAction<SessionType[]>>, boolean] => {
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(false);

  const store = useContext(StoreContext);

  const onUnknownError = () => {
    notifications.show({
      title: `Error fetching sessions for character ${store?.activeCharacter?.name}`,
      message:
        "A unknown error has occurred. Please try again by reloading the page. If the error persists, contact us.",
      color: "red",
    });
  };

  useEffect(() => {
    if (store?.activeSession?.new) {
      let copy = { ...store.activeSession };
      copy.new = false;
      setSessions((prev) => [copy as SessionType, ...prev]);
    }
  }, [store?.activeSession]);

  useEffect(() => {
    setLoading(true);

    if (store?.activeCharacter) {
      fetch("/api/chat/sessions?page=1&page_size=2000&character_id=" + store.activeCharacter.id)
        .then((r) => r.json())
        .then((d) => {
          if (d.status_code !== 200) {
            onUnknownError();
            setLoading(false);
          } else {
            const deserialized = d.payload.data.map((i: any) => deserializeSessionData(i));
            setSessions(deserialized);
            setLoading(false);
          }
        })
        .catch((e) => {
          console.error(e);
          onUnknownError();
          setLoading(false);
        });
    } else {
      setLoading(false);
      setSessions([]);
    }
  }, [store?.activeCharacter]);

  return [sessions, setSessions, loading];
};

export const useCharacter = (id?: string, forceLoadingState?: boolean): [boolean, boolean, CharacterType?] => {
  const [character, setCharacter] = useState<CharacterType>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const onUnknownError = () => {
    notifications.show({
      title: "A unknown error has occurred while trying to load the character.",
      message: "Please retry by refreshing the page, if the problem persists, contact us.",
      color: "red",
    });
  };

  useEffect(() => {
    if (!id) {
      setCharacter(undefined);
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("/api/characters/details?character_id=" + id)
      .then((r) => r.json())
      .then((d) => {
        setLoading(false);
        if (d.status_code === 200) {
          const deserialized = deserializeCharacterData(d.payload);
          setNotFound(false);
          setCharacter(deserialized);
        } else if (d.status_code === 404) {
          setNotFound(true);
          setCharacter(undefined);
        } else {
          onUnknownError();
          setNotFound(false);
          setCharacter(undefined);
        }
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
        setNotFound(false);
        setCharacter(undefined);
        onUnknownError();
      });
  }, [id]);

  return [notFound, forceLoadingState || loading, character];
};

export const useKnowledge = (
  characterId?: string,
  pageSize?: number
): [
  boolean,
  number,
  number,
  React.Dispatch<React.SetStateAction<number>>,
  KnowledgeType[],
  React.Dispatch<React.SetStateAction<KnowledgeType[]>>
] => {
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [data, setData] = useState<KnowledgeType[]>([]);

  const onUnknownError = () => {
    notifications.show({
      title: "Error trying to fetch knowledge base.",
      message:
        "A unknown error has occurred while trying to fetch this character's knowledge base. Please try again, if the problem persists, contact us.",
    });
  };

  useEffect(() => {
    if (!characterId) {
      return;
    }

    setLoading(true);
    fetch(`/api/characters/knowledge?character_id=${characterId}&page_size=${pageSize || 5}&page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status_code === 200) {
          setTotalPages(d.payload.pages);
          const deserialized = d.payload.data.map((i: any) => deserializeKnowledge(i));
          if (page === 1 && deserialized.length === 0) {
            setData([]);
          } else {
            setData(deserialized);
          }
        } else {
          onUnknownError();
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
        onUnknownError();
      });
  }, [page, characterId]);

  return [loading, totalPages, page, setPage, data, setData];
};

export const useMessages = (characterId?: string, sessionId?: string, sessionNew?: boolean) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Page related states
  const [maxMessages, setMaxMessages] = useState(40);
  const [page, setPage] = useState(1);
  const [endPage, setEndPage] = useState(false);

  // When called, more messages are loaded
  const loadMore = () => {
    if (!endPage && !loading && !loadingMore) {
      setLoadingMore(true);
      setPage((p) => p + 1);
    }
  };

  // Reset all values to their default state
  const resetValues = () => {
    setMessages([]);
    setLoading(false);
    setPage(1);
    setEndPage(false);
  };

  // Reset whenever the session or character changes
  useEffect(() => {
    if (!sessionNew) {
      resetValues();
    }
  }, [sessionId]);

  useEffect(() => {
    if (!characterId || !sessionId) {
      resetValues();
      return;
    }

    if (sessionNew) {
      setLoadingMore(false);
      return;
    }

    if (!loadingMore) {
      setLoading(true);
    }

    fetch(`/api/chat?character_id=${characterId}&session_id=${sessionId}&sort=-1&page_size=${maxMessages}&page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        setLoading(false);
        setLoadingMore(false);
        if (d.status_code !== 200) {
          notifications.show({
            title: "A unknown server error has occurred while trying to fetch the messages.",
            message: "Please try again. If the problem persists, contact us.",
            color: "red",
          });
          return;
        }

        // Deserialize the messages into a TypeScript interface
        let deserialized: MessageType[] = d.payload.data.map((item: any) => {
          return deserializeMessageData(item);
        });
        deserialized.reverse();

        setMessages((prev) => {
          return prev ? [...deserialized, ...prev] : deserialized;
        });

        if (deserialized.length === 0 || deserialized.length < maxMessages) {
          setEndPage(true);
        }
      })
      .catch((e) => {
        setLoading(false);
        console.error(e);
        notifications.show({
          title: "A unknown error has occurred while trying to fetch the messages.",
          message: "The website might be down. Try and refresh the page.",
          color: "red",
        });
      });
  }, [page, characterId, sessionId]);

  return {
    messages,
    setMessages,
    loading,
    loadingMore,
    setMaxMessages,
    page,
    loadMore,
  };
};

export const useSendMessage = (
  onChatError: (children: React.ReactNode) => void,
  characterId?: string,
  sessionId?: string
) => {
  const [sending, setSending] = useState(false);
  const store = useContext(StoreContext);

  const [cookies, ,] = useCookies(["openai-api-key"]);

  // const limitUnauthenticatedReachedError = (
  //   <Text>
  //     Oops! It seems like you've hit the limit of 5 messages per hour on non-registered accounts. Please{" "}
  //     <Anchor href="/oauth/google-oauth">sign up</Anchor> to continue.{" "}
  //   </Text>
  // );

  const apiKeyRequiredError = (
    <Text>
      OpenAI API Key not provided. Please go the chat's side bar (three vertical dots at the top inside a chat) and put
      your OpenAI API key.
    </Text>
  );

  const unauthenticatedError = (
    <Text>
      Oops! It seems like you're not registered. From now on, we require users to register and provide their own OpenAI
      API key. Please click Sign Up at the top. Once signed in, go the chat's side bar and put your OpenAI API key.
    </Text>
  );

  const limitAuthenticatedReachedError = (
    <Text>
      You have reached the{" "}
      <Text span fw="bold">
        15 Messages/3 hours
      </Text>{" "}
      limit on a free account. You can subscribe to <Anchor href="/optitalk-plus">OptiTalk+</Anchor> to get unlimited
      access for just 4.99$.
    </Text>
  );

  const tooMuchTrafficError = (
    <Text>
      OpenAI Error. Please try again. Either your OpenAI API Key has reached its limits, incorrect API Key, or you're
      just being rate limited. Try again in a minute.
    </Text>
  );

  const rateLimitError = (
    <Text>Rate limit error. You are sending too much requests. Please try again in a few minutes.</Text>
  );

  const regenerate = (): Promise<{ status: boolean; message: MessageType | null }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        setSending(true);
      }, 15);
      fetch(`/api/chat/regenerate`, {
        method: "POST",
        body: JSON.stringify({
          character_id: characterId,
          session_id: sessionId,
          api_key: cookies["openai-api-key"],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((r) => r.json())
        .then((d) => {
          setTimeout(() => {
            setSending(false);
          }, 50);
          if (d.status_code === 200) {
            const message = deserializeMessageData(d.payload);
            return resolve({ status: true, message: message });
          }

          if (d.status_code === 403) {
            if (!store?.authenticated) {
              onChatError(unauthenticatedError);
            } else {
              onChatError(limitAuthenticatedReachedError);
            }
          } else if (d.status_code === 500) {
            onChatError(tooMuchTrafficError);
          } else if (d.status_code === 429) {
            onChatError(rateLimitError);
          } else if (d.status_code === 400) {
            onChatError(apiKeyRequiredError);
          } else {
            onChatError(
              <Text>
                A unknown error has occurred while trying to regenerate the response. Please check as the session, user,
                or character might have been deleted.
              </Text>
            );
          }
          resolve({ status: false, message: null });
        })
        .catch((e) => {
          setSending(false);
          console.error(e);
          onChatError(
            <Text>A unknown error has occurred. The website might be down. Please try and refresh the page.</Text>
          );
          reject(e);
        });
    });
  };

  const sendMessage = (
    content: string,
    userName: string | undefined | null,
    role: string = "user",
    id?: string
  ): Promise<{ status: boolean; message: MessageType | null }> => {
    return new Promise((resolve, reject) => {
      if (!characterId) {
        return resolve({ status: false, message: null });
      }

      userName = userName === undefined ? store?.displayName : userName === null ? undefined : userName;

      // Create a brand new session if no session was provided.
      // This will also set the active session to the newly created session.
      let storyMode = false;
      let story = null;
      let tweaks = null;
      if (!sessionId) {
        let session = {
          id: uuidv4(),
          characterId: characterId,
          createdBy: store?.userId as string,
          name: "New Session",
          new: true,
          storyMode: store?.storyMode || false,
          story: store?.storyModeContent || null,
          tweaks: store?.tweaks || null,
        };
        sessionId = session.id;
        storyMode = session.storyMode;
        story = session.story;
        tweaks = store?.tweaks;
        store?.setStoryMode(false);
        store?.setStoryModeContent(null);
        store?.setActiveSession(session);
        store?.setTweaks(null);
      }

      setTimeout(() => {
        setSending(true);
      }, 15);

      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_id: characterId,
          content: content,
          user_name: userName,
          role: role,
          session_id: sessionId,
          story_mode: storyMode,
          story: story,
          id: id,
          tweaks: tweaks,
          api_key: cookies["openai-api-key"],
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          setTimeout(() => {
            setSending(false);
          }, 50);

          if (d.status_code === 200) {
            const message = deserializeMessageData(d.payload);
            return resolve({ status: true, message: message });
          }

          if (d.status_code === 403) {
            if (!store?.authenticated) {
              onChatError(unauthenticatedError);
            } else {
              onChatError(limitAuthenticatedReachedError);
            }
          } else if (d.status_code === 500) {
            onChatError(tooMuchTrafficError);
          } else if (d.status_code === 429) {
            onChatError(rateLimitError);
          } else if (d.status_code === 400) {
            onChatError(apiKeyRequiredError);
          } else {
            onChatError(
              <Text>A unknown error has occurred while trying to generate a response. Please try again.</Text>
            );
          }
          resolve({ status: false, message: null });
        })
        .catch((e) => {
          setSending(false);
          onChatError(
            <Text>
              A unknown error has occurred while trying to generate a response. This shouldn't happen unless the server
              is down. Please try and refresh the page.
            </Text>
          );
          reject(e);
          console.error(e);
        });
    });
  };

  return { sendMessage, sending, setSending, regenerate };
};

export const useUserDetails = () => {
  const [details, setDetails] = useState<UserDetails>();
  const [loading, setLoading] = useState(true);
  const store = useContext(StoreContext);

  useEffect(() => {
    if (!store?.authenticated) {
      return;
    }

    setLoading(true);
    fetch("/api/users/details")
      .then((r) => r.json())
      .then((d) => {
        setLoading(false);

        if (d.status_code === 200) {
          setDetails(d.payload);
        } else if (d.status_code === 429) {
          notifications.show({
            title: "Rate limit error",
            message:
              "You have hit a rate limit. This shouldn't happen unless you're sending too many requests at once. Please wait for a minute and refresh the page. If the problem persists, contact us.",
            color: "red",
          });
        } else {
          notifications.show({
            title: "Unknown server error",
            message:
              "A unknown error has occurred while trying to fetch the user's details. Please try again. If the problem persists, please contact us.",
            color: "red",
          });
        }
      })
      .catch((e) => {
        setLoading(false);
        console.error(e);
        notifications.show({
          title: "Network error",
          message:
            "A unknown network error has occurred while trying to fetch the user's details. Please refresh the page to try again.",
          color: "red",
        });
      });
  }, [store?.authenticated]);

  return { details, setDetails, loading, authenticated: store?.authenticated };
};

export const formateDate = (date: Date) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  let hour = date.getHours();
  let period = "AM";

  if (hour === 0) {
    hour = 12;
  } else if (hour === 12) {
    period = "PM";
  } else if (hour > 12) {
    hour -= 12;
    period = "PM";
  }

  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${month} ${day}, ${year} at ${hour}:${minute} ${period}`;
};

export function normalizeValue(value: number, min: number, max: number): number {
  if (min === max) {
    throw new Error("Minimum and maximum values cannot be the same.");
  }

  const normalized = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

export const useSubscription = (forceStatus?: "pending" | "activated" | null) => {
  const [status, setStatus] = useState<"pending" | "activated" | null>(null);
  const [loading, setLoading] = useState(true);

  const store = useContext(StoreContext);

  useEffect(() => {
    setLoading(true);

    if (!store?.authenticated || store.isAuthenticating) {
      return;
    }

    if (forceStatus !== undefined) {
      setStatus(forceStatus);
    } else if (store.userPlanDetails?.id === "basic") {
      setStatus("activated");
    } else if (store.userPlanDetails?.subscriptionStatus === "pending") {
      setStatus("pending");
    } else {
      setStatus(null);
    }

    setLoading(false);
  }, [store]);

  return { status, loading };
};

export const useUploadAvatar = (
  file: File | null,
  defaultId?: string | null,
  previewOnly?: boolean
): [string | null, boolean] => {
  const [id, setId] = useState<string | null>(defaultId || null);
  const [uploading, setUploading] = useState(false);

  const uploadFile = () => {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file, file.name);

    fetch("/api/files/upload-avatar", { method: "POST", body: formData })
      .then((r) => r.json())
      .then((d) => {
        if (d.status_code === 400) {
          notifications.show({
            title: "Malformed file",
            message:
              "The avatar you uploaded might be malformed or not a valid image file. Please choose a different file.",
            color: "red",
          });
        } else if (d.status_code === 500) {
          notifications.show({
            title: "Uploading failed",
            message: "Uploading your avatar failed. Please try again. If the problem persists, contact us.",
            color: "red",
          });
        } else if (d.status_code === 200) {
          setId(d.payload.id);
        } else {
          notifications.show({
            title: "Unknown error",
            message:
              "A unknown error has occurred while trying to upload your avatar. Please try again. If the problem persists, contact us.",
            color: "red",
          });
        }
      })
      .catch((e) => {
        console.error(e);
        notifications.show({
          title: "Unknown error uploading avatar",
          message: "Please try again. If the problem persists, contact us.",
          color: "red",
        });
      });
  };

  useEffect(() => {
    setUploading(false);

    if (file) {
      uploadFile();
    }
  }, [file]);

  return [id, uploading];
};

export const getTweaksLengthValue = (value: number) => {
  const mappings = {
    0: "very short",
    1: "short",
    2: "medium",
    3: "long",
    4: "very long",
  };

  // @ts-expect-error
  return mappings[value];
};

export const getTweaksCreativityValue = (value: number) => {
  const mappings = {
    0: "predictable",
    1: "consistent",
    2: "normal",
    3: "creative",
    4: "extreme",
  };

  // @ts-expect-error
  return mappings[value];
};
