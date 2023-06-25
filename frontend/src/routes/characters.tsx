import { Container, Dropdown } from "@nextui-org/react";
import { FC, useContext, useEffect, useState } from "react";
import { useOutlet, useSearchParams } from "react-router-dom";
import CharactersContext from "../contexts/characters";

// Components
import ActiveCharacterItem from "../components/ActiveCharacterItem";
import Box from "../components/Box";
import CharactersCategoryBar from "../components/CharactersCategoryBar";
import CharactersView from "../components/CharactersView";
import Footer from "../components/Footer";
import SearchInput from "../components/SearchInput";
import StoreContext from "../contexts/store";

const Characters: FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>();
  const [sort, setSort] = useState<"uses" | "latest">("uses");

  const outlet = useOutlet();
  const [searchParams] = useSearchParams();

  const storeCtx = useContext(StoreContext);

  // Function to handle searches
  const onSearch = (q: string) => {
    setSearchQuery(q);
  };

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  return (
    <Container
      css={{
        mt: "50px",
        display: "flex",
        flexDirection: "column",
        gap: "30px",
        pb: "15px",
      }}
    >
      {storeCtx?.activeCharacter && <ActiveCharacterItem {...storeCtx.activeCharacter} />}

      <Box
        css={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <SearchInput placeholder="Search Character" onSearch={onSearch} defaultValue={searchParams.get("q") || ""} />
        <Dropdown>
          <Dropdown.Button size="sm">Sort By</Dropdown.Button>
          <Dropdown.Menu
            disallowEmptySelection
            selectedKeys={[sort]}
            selectionMode="single"
            onSelectionChange={(e: any) => {
              setSort(e.currentKey);
            }}
          >
            <Dropdown.Item key="latest">Latest</Dropdown.Item>
            <Dropdown.Item key="uses">Most Popular</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Box>

      <Box
        css={{
          display: "flex",
          alignItems: "start",
          gap: "20px",
          "@mdMax": {
            flexDirection: "column",
          },
        }}
      >
        <CharactersCategoryBar />

        <CharactersContext.Provider
          value={{
            query: searchQuery,
            setQuery: setSearchQuery,
            sort: sort,
          }}
        >
          {outlet || <CharactersView key={"featured"} params={{ featured: "true" }} />}
        </CharactersContext.Provider>
      </Box>
      <Box
        css={{
          mx: "auto",
        }}
      >
        <Footer />
      </Box>
    </Container>
  );
};

export default Characters;
