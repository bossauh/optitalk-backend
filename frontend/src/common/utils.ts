import { useEffect, useRef, useState } from "react";

import { CharacterEditorFields, CharacterType, MessageType, SessionType } from "./types";

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

export function serializeCharacterFields(data: CharacterEditorFields) {
  return {
    name: data.name,
    description: data.description,
    knowledge: data.knowledge,
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
