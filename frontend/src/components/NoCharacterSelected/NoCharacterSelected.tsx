import { Text } from "@nextui-org/react";
import { FC } from "react";

// Components
import Box from "../Box";

const NoCharacterSelected: FC = () => {
  return (
    <Box>
      <Text
        h2
        css={{
          color: "$accents8",
          textAlign: "center",
        }}
      >
        No Character Selected
      </Text>
      <Text
        css={{
          textAlign: "center",
          color: "$accents8",
        }}
      >
        Please select a character to chat with in the Characters tab to begin.
      </Text>
    </Box>
  );
};

export default NoCharacterSelected;
