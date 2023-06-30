/* eslint-disable react-hooks/exhaustive-deps */
import { notifications } from "@mantine/notifications";
import { useContext, useEffect, useRef, useState } from "react";

import { useCookies } from "react-cookie";
import StoreContext from "../contexts/store";
import {
  CharacterEditorFields,
  CharacterType,
  KnowledgeType,
  MessageType,
  SessionType,
  UserPlanDetails,
} from "./types";

export function deserializeCharacterData(data: any): CharacterType {
  return {
    createdAt: data.created_at,
    createdBy: data.created_by,
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
  };
}

export function deserializeSessionData(data: any): SessionType {
  return {
    characterId: data.character_id,
    createdBy: data.created_by,
    id: data.id,
    name: data.name,
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
      store?.setActiveCharacter(character);
      setCookie("activeCharacterId", character.id, { path: "/" });
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
      setSessions((prev) => [store.activeSession as SessionType, ...prev]);
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
  }, [page]);

  return [loading, totalPages, page, setPage, data, setData];
};
