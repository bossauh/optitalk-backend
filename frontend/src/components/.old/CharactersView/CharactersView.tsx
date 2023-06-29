/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useContext, useEffect, useState } from "react";
import { CharacterType, CharactersViewProps } from "../../common/types";
import { deserializeCharacterData } from "../../common/utils";
import CharactersContext from "../../contexts/characters";

// Components
import { Loading, Pagination, Text } from "@nextui-org/react";
import Box from "../Box";
import CharacterItem from "../CharacterItem";

const CharactersView: FC<CharactersViewProps> = (props) => {
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [characters, setCharacters] = useState<CharacterType[]>([]);

  const charactersCtx = useContext(CharactersContext);

  // Callback for the pagination bar
  const onPageChange = (page: number) => {
    setPage(page);
  };

  // Function to construct the API URL
  const constructUrl = () => {
    let params: { [key: string]: string } = {
      page: String(page),
      page_size: "6",
      sort: charactersCtx?.sort || "uses",
      ...props.params,
    };

    // Add query to params if it exists
    if (charactersCtx?.query) {
      params = { ...params, q: charactersCtx.query };
    }

    // Construct the URLSearchParams object that contains the parameters
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });

    // Create the query string
    const queryString = "?" + searchParams.toString();
    const url = "/api/characters" + queryString;
    return url;
  };

  // Function to deserialize the API response into a better format for typescript
  const deserializeApiResponse = (data: any): CharacterType[] => {
    const deserialized: CharacterType[] = data.payload.data.map((item: any) => {
      return deserializeCharacterData(item);
    });

    return deserialized;
  };

  const fetchCharacters = (clear: boolean = false) => {
    setIsLoading(true);

    const url = constructUrl();
    console.debug("URL", url);

    if (clear) {
      setCharacters([]);
      setPage(1);
      if (charactersCtx?.query === "") {
        charactersCtx.setQuery(undefined);
      }
    }

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setPages(data.payload.pages);

        const items = deserializeApiResponse(data);
        console.debug("Items", items);

        setCharacters(items);
        setIsLoading(false);
      })
      .catch((error) => {
        alert(
          "An error has occurred trying to fetch characters. Please check the console and report it to the developer."
        );
        console.error("Error fetching characters", error);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (charactersCtx?.query !== undefined) fetchCharacters(true);
  }, [charactersCtx?.query]);

  useEffect(() => {
    fetchCharacters(false);
  }, [page, charactersCtx?.sort]);

  useEffect(() => {
    charactersCtx?.setQuery(undefined);
  }, [props.params]);

  return (
    <Box
      css={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        pb: "50px",
        width: "100%",
        "@mdMax": {
          alignItems: "center",
        },
      }}
    >
      {characters.length > 0 && <Pagination total={pages} page={page} onChange={onPageChange} noMargin />}
      <Box
        css={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "start",
          gap: "30px",
          width: "100%",
          "@mdMax": {
            justifyContent: "center",
          },
        }}
      >
        {characters.length === 0 && !isLoading && (
          <Box
            css={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              width: "100%",
            }}
          >
            <Text>No Items</Text>
          </Box>
        )}
        {isLoading ? (
          <Box
            css={{
              mx: "auto",
              mt: "100px",
              height: "100vh",
            }}
          >
            <Loading size="xl" />
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
      {characters.length > 0 && !isLoading && <Pagination total={pages} page={page} onChange={onPageChange} noMargin />}
    </Box>
  );
};

export default CharactersView;
