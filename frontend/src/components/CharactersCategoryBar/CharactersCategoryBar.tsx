import { FC } from "react";

// Components
import Box from "../Box";
import Item from "./Item";

const CharactersCategoryBar: FC = () => {
  return (
    <Box
      css={{
        display: "flex",
        flexDirection: "column",
        background: "$accents0",
        borderRadius: "10px",
        dropShadow: "$md",

        "@mdMax": {
          width: "100%",
          flexDirection: "row",
        },
      }}
    >
      <Item title="Featured" path="/characters/featured" top />
      <Item title="Public" path="/characters" />
      <Item title="My Characters" path="/characters/my-characters" bottom />
    </Box>
  );
};

export default CharactersCategoryBar;
