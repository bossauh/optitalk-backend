import {
  ActionIcon,
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
} from "@mantine/core";
import { FC, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { TbRating18Plus } from "react-icons/tb";
import { useSearchParams } from "react-router-dom";

const sortData = [
  { value: "uses", label: "Most Popular" },
  { value: "latest", label: "Latest" },
];

const CharactersSearchBox: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams({ q: "", page: "1", sort: "uses", nsfw: "disabled" });

  // Fields
  const [searchInput, setSearchInput] = useState(searchParams.get("q") as string);

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

      <Group>
        <Stack spacing={4}>
          <Text fz="xs" fw="bold">
            NSFW Control
          </Text>
          <Indicator label="New" size={16}>
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
      </Group>
    </Stack>
  );
};

export default CharactersSearchBox;
