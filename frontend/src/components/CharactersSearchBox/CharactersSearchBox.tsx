import {
  ActionIcon,
  Badge,
  Box,
  Center,
  Flex,
  Group,
  Indicator,
  MediaQuery,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FC, useEffect, useState } from "react";
import { AiOutlineClose, AiOutlineDown, AiOutlineSearch, AiOutlineUp } from "react-icons/ai";
import { TbRating18Plus } from "react-icons/tb";
import { useSearchParams } from "react-router-dom";
import { TagFilterType } from "../../common/types";
import { formatNumber, useMediaQuery } from "../../common/utils";

const sortData = [
  { value: "uses", label: "Most Popular" },
  { value: "latest", label: "Latest" },
];

const CharactersSearchBox: FC = () => {
  const theme = useMantineTheme();
  const isLg = useMediaQuery(`(max-width: ${theme.breakpoints.lg})`);
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const [searchParams, setSearchParams] = useSearchParams({
    q: "",
    page: "1",
    sort: "uses",
    nsfw: "disabled",
    tab: "featured",
    tag: "",
  });
  const [tags, setTags] = useState<TagFilterType[]>([]);

  const [showAllTags, showAllTagsHandler] = useDisclosure(false);

  // Fields
  const [searchInput, setSearchInput] = useState(searchParams.get("q") as string);

  useEffect(() => {
    fetch("/api/characters/tags")
      .then((r) => r.json())
      .then((d) => {
        if (d.status_code === 200) {
          setTags(d.payload);
        }
      });
  }, []);

  const onSearch = (q: string) => {
    let newParams = new URLSearchParams(searchParams);
    newParams.set("q", q);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const onSortChange = (value: string) => {
    let newParams = new URLSearchParams(searchParams);
    newParams.set("sort", value);
    setSearchParams(newParams);
  };

  const onNsfwChange = (value: string) => {
    let newParams = new URLSearchParams(searchParams);
    newParams.set("nsfw", value);
    setSearchParams(newParams);
  };

  return (
    <Stack>
      <MediaQuery
        largerThan="sm"
        styles={{
          flexDirection: "row",
        }}
      >
        <Flex direction="column" gap="xs">
          <MediaQuery
            largerThan="sm"
            styles={{
              flex: 1,
            }}
          >
            <TextInput
              placeholder="Search"
              label="Search Characters"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearch(searchInput);
                }
              }}
              rightSection={
                <ActionIcon
                  color="primary"
                  variant="filled"
                  onClick={() => {
                    onSearch(searchInput);
                  }}
                >
                  <AiOutlineSearch />
                </ActionIcon>
              }
            />
          </MediaQuery>
          <Select
            label="Sort By"
            data={sortData}
            value={searchParams.get("sort")}
            onChange={(v) => {
              if (v) {
                onSortChange(v);
              }
            }}
          />
        </Flex>
      </MediaQuery>

      <Group
        spacing="xl"
        align="flex-start"
        sx={{
          flexWrap: isLg ? "wrap" : "nowrap",
        }}
      >
        <Stack spacing={4}>
          <Text fz="xs" fw="bold">
            NSFW Control
          </Text>
          <Indicator label="New" disabled size={16}>
            <SegmentedControl
              size="xs"
              color={
                searchParams.get("nsfw") === "only" ? "red" : searchParams.get("nsfw") === "include" ? "yellow" : "teal"
              }
              value={searchParams.get("nsfw") || "disabled"}
              onChange={onNsfwChange}
              data={[
                { label: "Hidden", value: "disabled" },
                { label: "Included", value: "include" },
                {
                  label: (
                    <Center>
                      <TbRating18Plus size={18} /> <Box ml={5}>Only NSFW</Box>
                    </Center>
                  ),
                  value: "only",
                },
              ]}
            />
          </Indicator>
        </Stack>

        {(searchParams.get("tab") || "featured") === "public" && (
          <Stack spacing={4}>
            <Text fz="xs" fw="bold">
              Tags
            </Text>
            <Group spacing={6}>
              {tags
                .sort((a, b) => b.characters - a.characters)
                .slice(0, !showAllTags ? (isSm ? 7 : isLg ? 9 : 12) : undefined)
                .map((item) => {
                  return (
                    <Badge
                      size={isSm ? "lg" : "md"}
                      key={item.name}
                      leftSection={
                        <Box>
                          <Text fz="xs">{formatNumber(item.characters)}</Text>
                        </Box>
                      }
                      variant={searchParams.get("tag") === item.name ? "outline" : "filled"}
                      color={searchParams.get("tag") === item.name ? "teal" : "gray"}
                      component="button"
                      sx={(theme) => ({
                        borderRadius: theme.radius.sm,
                        background: searchParams.get("tag") === item.name ? undefined : theme.colors.dark[5],
                        textTransform: "initial",
                        fontWeight: 500,
                        cursor: "pointer",
                        alignItems: "center",
                        display: "flex",
                        flexDirection: "row",
                      })}
                      onClick={() => {
                        let newParams = new URLSearchParams(searchParams);
                        if (searchParams.get("tag") === item.name) {
                          newParams.delete("tag");
                          newParams.delete("nsfw");
                        } else {
                          newParams.set("tag", item.name);
                          newParams.set("nsfw", "include");
                        }
                        setSearchParams(newParams);
                      }}
                      rightSection={
                        searchParams.get("tag") === item.name ? (
                          <ActionIcon color="teal.5" size="xs" variant="transparent">
                            <AiOutlineClose size={11} />
                          </ActionIcon>
                        ) : undefined
                      }
                    >
                      {item.name}
                    </Badge>
                  );
                })}
              <Badge
                component="button"
                color="gray"
                size={isSm ? "lg" : "md"}
                rightSection={
                  <ActionIcon size="xs" radius="xl" variant="transparent">
                    {showAllTags ? <AiOutlineUp size={12} /> : <AiOutlineDown size={12} />}
                  </ActionIcon>
                }
                variant="outline"
                sx={(theme) => ({
                  borderRadius: theme.radius.sm,
                  background: theme.colors.dark[6],
                  textTransform: "initial",
                  fontWeight: 500,
                  cursor: "pointer",
                })}
                onClick={() => {
                  showAllTagsHandler.toggle();
                }}
              >
                {showAllTags ? "Show Less" : "Show All"}
              </Badge>
            </Group>
          </Stack>
        )}
      </Group>
    </Stack>
  );
};

export default CharactersSearchBox;
