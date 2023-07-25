/* eslint-disable react-hooks/exhaustive-deps */
import {
  Container,
  Flex,
  Loader,
  MediaQuery,
  Pagination,
  Tabs,
  TabsValue,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { FC, useEffect, useState } from "react";
import { FaUserAlt } from "react-icons/fa";
import { MdFavorite, MdFeaturedPlayList, MdPublic } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import { CharacterType } from "../common/types";
import { deserializeCharacterData } from "../common/utils";
import ActiveCharacterItem from "../components/ActiveCharacterItem";
import AdComponent from "../components/AdComponent";
import CharacterItem from "../components/CharacterItem";
import CharactersSearchBox from "../components/CharactersSearchBox";

const Characters: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams({
    tab: "featured",
    page: "1",
    sort: "uses",
    q: "",
    nsfw: "disabled",
    tag: "",
  });

  const [characters, setCharacters] = useState<CharacterType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [maxPages, setMaxPages] = useState(1);

  // Theme and layout states
  const theme = useMantineTheme();
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const onPageChange = (page: number) => {
    let newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
  };

  const onTabsChange = (value: TabsValue) => {
    let v = value?.toString();
    if (v) {
      let newParams = new URLSearchParams(searchParams);
      newParams.set("tab", v);
      newParams.set("page", "1");

      if (["my-characters", "favorites"].includes(v)) {
        newParams.set("nsfw", "include");
      } else {
        newParams.set("nsfw", "disabled");
      }
      setSearchParams(newParams);
    }
  };

  const deconstructTab = (value: string) => {
    let params: { [key: string]: string } = {};
    if (value === "featured") {
      params.featured = "true";
    } else if (value === "my-characters") {
      params.my_characters = "true";
    } else if (value === "favorites") {
      params.favorites = "true";
    }

    return params;
  };

  const constructQueryUrl = () => {
    let params: { [key: string]: string } = {
      page: searchParams.get("page") || "1",
      page_size: "21",
      sort: searchParams.get("sort") || "uses",
      nsfw: searchParams.get("nsfw") || "hidden",
      tag: searchParams.get("tag") || "",
      ...deconstructTab(searchParams.get("tab") || "featured"),
    };

    if (searchParams.get("q")) {
      params.q = searchParams.get("q") as string;
    }

    console.debug("Query Params", params);

    // Create the query URL itself
    const urlParams = new URLSearchParams(params);
    const queryString = "?" + urlParams.toString();
    const url = "/api/characters" + queryString;

    return url;
  };

  const fetchCharacters = () => {
    const url = constructQueryUrl();

    const onError = () => {
      notifications.show({
        title: "An error has occurred while trying to fetch characters.",
        message: "Please try again by reloading the page. If the error persists, contact us.",
        color: "red",
      });
    };

    setIsLoading(true);

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        console.debug("Results", data);
        if (data.status_code !== 200) {
          onError();
        } else {
          const deserialized = data.payload.data.map((item: any) => deserializeCharacterData(item));

          setCharacters(deserialized);
          setMaxPages(data.payload.pages);
          setIsLoading(false);
        }
      });
  };

  const paginationBox = (
    <Pagination
      value={parseInt(searchParams.get("page") as string)}
      total={maxPages}
      size="sm"
      onChange={onPageChange}
    />
  );

  useEffect(() => {
    fetchCharacters();
  }, [searchParams]);

  return (
    <Container fluid mt="lg" mx="xs" pb="90px">
      <ActiveCharacterItem />
      <CharactersSearchBox />
      <MediaQuery
        largerThan="sm"
        styles={{
          flexDirection: "row",
        }}
      >
        <Flex direction="column" gap="md" mt="lg">
          <Tabs
            value={searchParams.get("tab") || "featured"}
            orientation={isSm ? "horizontal" : "vertical"}
            onTabChange={onTabsChange}
          >
            <Tabs.List>
              <Tabs.Tab value="featured" icon={<MdFeaturedPlayList />}>
                Featured
              </Tabs.Tab>
              <Tabs.Tab value="public" icon={<MdPublic />}>
                Public
              </Tabs.Tab>
              <Tabs.Tab value="my-characters" icon={<FaUserAlt />}>
                My Characters
              </Tabs.Tab>
              <Tabs.Tab value="favorites" icon={<MdFavorite color="red" />}>
                Favorites
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
          <Container
            fluid
            sx={{
              flex: 1,
            }}
          >
            <Flex direction="column" gap="sm">
              {paginationBox}
              {isLoading ? (
                <Flex
                  direction="column"
                  gap="sm"
                  mt="lg"
                  sx={{
                    alignSelf: "center",
                  }}
                  align="center"
                >
                  <Title
                    order={3}
                    sx={(theme) => ({
                      color: theme.colors.dark[1],
                    })}
                  >
                    Fetching Characters...
                  </Title>
                  <Loader size="md" />
                </Flex>
              ) : characters.length > 0 ? (
                <MediaQuery
                  largerThan="xs"
                  styles={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    // justifyContent: "space-evenly",
                  }}
                >
                  <Flex direction="column" gap="sm">
                    {characters.map((i) => {
                      return <CharacterItem key={i.id} {...i} />;
                    })}
                  </Flex>
                </MediaQuery>
              ) : (
                <Flex
                  direction="column"
                  gap="xs"
                  mt="xl"
                  sx={{
                    alignSelf: "center",
                  }}
                  align="center"
                >
                  <Title order={3}>
                    {searchParams.get("q") && searchParams.get("tab") !== "favorites"
                      ? "No results"
                      : searchParams.get("tab") === "featured"
                      ? "No featured characters"
                      : searchParams.get("tab") === "my-characters"
                      ? "You don't have any characters yet"
                      : "No Favorite Characters"}
                  </Title>
                  <Text fz="sm" maw="350px" align="center">
                    {searchParams.get("q") && searchParams.get("tab") !== "favorites"
                      ? "Try a different search term instead."
                      : searchParams.get("tab") === "featured"
                      ? "This should NEVER happen. Please reload the site."
                      : searchParams.get("tab") === "my-characters"
                      ? `Create your first character by clicking the Create Character button at the top (or sidebar if you're in mobile).`
                      : "You have no favorite characters yet. You can favorite a character by clicking on the heart icon beside the character's name."}
                  </Text>
                </Flex>
              )}
              {paginationBox}
            </Flex>
          </Container>
        </Flex>
      </MediaQuery>

      <Flex direction="column" align="center" mt="xl">
        <AdComponent client="ca-pub-3336177471309301" slot="5172839273" format="auto" />
      </Flex>
    </Container>
  );
};

export default Characters;
