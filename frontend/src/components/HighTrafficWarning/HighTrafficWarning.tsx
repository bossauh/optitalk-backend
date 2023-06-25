import { Text } from "@nextui-org/react";
import { FC, useState } from "react";
import { AiFillWarning, AiOutlineClose } from "react-icons/ai";
import Box from "../Box";

const HighTrafficWarning: FC = () => {
  const [active, setActive] = useState(true);

  return (
    <Box
      css={{
        bg: "$warningShadow",
        display: active ? "flex" : "none",
        justifyContent: "space-between",
        alignItems: "center",
        p: "4px",
        px: "20px",
      }}
    >
      <Box
        css={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <AiFillWarning fontSize="18px" />
        <Text>
          <Text span b>
            High Traffic:
          </Text>{" "}
          We are upgrading our systems to speed up the site due to a spike in traffic.
        </Text>
      </Box>
      <Box
        css={{
          cursor: "pointer",
        }}
        onClick={() => {
          setActive(false);
        }}
      >
        <AiOutlineClose />
      </Box>
    </Box>
  );
};

export default HighTrafficWarning;
