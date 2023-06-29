import { ActionIcon, Flex, MediaQuery, Select, TextInput } from "@mantine/core";
import { FC, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { useSearchParams } from "react-router-dom";

const sortData = [
  { value: "uses", label: "Most Popular" },
  { value: "latest", label: "Latest" },
];

const CharactersSearchBox: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams({ q: "", page: "1", sort: "uses" });

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

  return (
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
  );
};

export default CharactersSearchBox;
