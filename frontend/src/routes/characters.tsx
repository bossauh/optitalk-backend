/* eslint-disable react-hooks/exhaustive-deps */
import { Container, Loading, Spacer, Text } from "@nextui-org/react";
import { FC, useContext, useEffect, useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useResizeDetector } from "react-resize-detector";
import { CharacterType } from "../common/types";
import { deserializeCharacterData } from "../common/utils";
import StoreContext from "../contexts/store";

// Components
import ActiveCharacter from "../components/ActiveCharacter";
import Box from "../components/Box";
import CharacterItem from "../components/CharacterItem";

const Characters: FC = () => {
  const store = useContext(StoreContext);

  const [characters, setCharacters] = useState<CharacterType[]>();
  const [charactersIsLoading, setCharactersIsLoading] = useState(false);

  const [endPage, setEndPage] = useState(false);
  const [page, setPage] = useState(1);

  const { height: activeCharacterHeight, ref: activeCharacterRef } = useResizeDetector();
  const [activeCharacterSticky, setActiveCharacterSticky] = useState(false);

  const scrollToBottomCallback = () => {
    if (!charactersIsLoading && !endPage) {
      setPage((prev) => prev + 1);
    }
  };

  const charactersRef = useBottomScrollListener(scrollToBottomCallback, {
    triggerOnNoScroll: true,
    offset: 20,
  });

  const fetchCharacters = (url: string, setter: (v: CharacterType[]) => void) => {
    setCharactersIsLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        // Deserialize the raw API responses into the proper JS format
        const deserialized: CharacterType[] = data.payload.data.map((item: any) => {
          return deserializeCharacterData(item);
        });

        // @ts-ignore
        setter((prevCharacters) => {
          return prevCharacters ? [...prevCharacters, ...deserialized] : deserialized;
        });
        setCharactersIsLoading(false);

        if (deserialized.length === 0) {
          setEndPage(true);
        }
      })
      .catch((error) => {
        console.error("Error fetching characters:", error);
        setCharactersIsLoading(false);
      });
  };

  useEffect(() => {
    fetchCharacters(`/api/characters?page_size=25&page=${page}`, setCharacters);
  }, [page]);

  return (
    <Box
      // @ts-expect-error
      ref={charactersRef}
      css={{
        maxHeight: "90vh",
        overflowY: "auto",
        position: "relative",
        pb: "100px",
      }}
      onScroll={() => {
        if (charactersRef.current) {
          const scroll = charactersRef.current.scrollTop;
          if (scroll > 100) {
            setActiveCharacterSticky(true);
          } else {
            setActiveCharacterSticky(false);
          }
        }
      }}
    >
      <Container
        css={{
          mt: "30px",
          display: "flex",
          flexDirection: "column",
          gap: store?.activeCharacter ? "40px" : "0px",
          transition: "gap 0.3s",
        }}
      >
        <Box
          css={{
            height: store?.activeCharacter
              ? `${activeCharacterHeight === undefined ? 0 : activeCharacterHeight + 80}px`
              : "0px",
            "@sm": {
              height: store?.activeCharacter
                ? `${
                    activeCharacterHeight === undefined
                      ? 0
                      : activeCharacterHeight + (activeCharacterSticky ? 310 : 100)
                  }px`
                : "0px",
            },
            overflowY: "hidden",
            transition: "height, 0.3s",
          }}
        >
          <Text
            h3
            css={{
              "@smMax": {
                textAlign: "center",
              },
            }}
          >
            Active Character
          </Text>
          <Spacer />
          {store?.activeCharacter && (
            <div ref={activeCharacterRef}>
              <ActiveCharacter sticky={activeCharacterSticky} {...store.activeCharacter} />
            </div>
          )}
        </Box>
        <Box>
          <Text
            h3
            css={{
              "@smMax": {
                textAlign: "center",
              },
            }}
          >
            Public Characters
          </Text>
          <Spacer />
          <Box
            css={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "start",
              gap: "30px",
              "@smMax": {
                justifyContent: "center",
              },
            }}
          >
            {characters === undefined ? (
              <Box
                css={{
                  display: "flex",
                  height: "200px",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Loading size="lg" />
              </Box>
            ) : (
              characters.map((i) => {
                return (
                  <CharacterItem
                    key={i.id}
                    {...i}
                    onDelete={(id) => {
                      const updatedCharacters = characters.filter((i) => i.id !== id);
                      setCharacters(updatedCharacters);
                    }}
                  />
                );
              })
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Characters;
