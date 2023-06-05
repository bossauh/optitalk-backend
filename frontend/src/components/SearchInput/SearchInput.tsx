import { Button, Input } from "@nextui-org/react";
import { FC, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { SearchInputProps } from "../../common/types";

const SearchInput: FC<SearchInputProps> = (props) => {
  const [value, setValue] = useState("");

  return (
    <Input
      placeholder={props.placeholder}
      size="md"
      contentRightStyling={false}
      initialValue={props.defaultValue}
      contentRight={
        <Button
          css={{
            maxW: "50px",
            minWidth: "50px",
          }}
          onPress={() => {
            props.onSearch(value);
          }}
          icon={<AiOutlineSearch size={20} />}
          size="md"
        />
      }
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          props.onSearch(e.currentTarget.value);
        }
      }}
      onChange={(e) => {
        setValue(e.currentTarget.value);
      }}
      css={{
        flex: 1,
      }}
    />
  );
};

export default SearchInput;
