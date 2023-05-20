import { Button, Text } from "@nextui-org/react";
import { FC } from "react";
import { AiFillHome } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { TopBarSecondaryProps } from "../../common/types";

// Components
import Box from "../Box";

const TopBarSecondary: FC<TopBarSecondaryProps> = (props) => {
  const navigate = useNavigate();

  return (
    <Box
      css={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text h2>{props.title}</Text>
      <Box>
        <Button
          color="primary"
          icon={<AiFillHome size={20} />}
          onPress={() => {
            navigate("/");
          }}
          css={{
            maxWidth: "40px",
            minWidth: "40px",
          }}
        />
      </Box>
    </Box>
  );
};

export default TopBarSecondary;
