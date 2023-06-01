import { Text } from "@nextui-org/react";
import { FC } from "react";

// Components
import Box from "../Box";

const Footer: FC = () => {
  return (
    <Box
      css={{
        display: "flex",
        alignItems: "center",
        gap: "30px",
      }}
    >
      <Text
        css={{
          cursor: "pointer",
        }}
        size={14}
        color="$accents8"
        onClick={() => {
          window.open(
            "https://docs.google.com/forms/d/e/1FAIpQLSciRo_XWFTlm6MN4Ex__e2Da9UlHDG4osgJKGB5qVWsh5j96w/viewform",
            "_blank"
          );
        }}
      >
        Contact
      </Text>
      <Text
        size={14}
        color="$accents8"
        css={{
          display: "flex",
        }}
      >
        Made by{" "}
        <Text
          onClick={() => {
            window.open("https://github.com/bossauh", "_blank");
          }}
          size={"inherit"}
          color="$primary"
          span
          css={{
            cursor: "pointer",
            ml: "4px",
          }}
        >
          Philippe Mathew
        </Text>
      </Text>
    </Box>
  );
};

export default Footer;
