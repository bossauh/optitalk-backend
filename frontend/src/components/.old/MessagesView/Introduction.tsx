import { Text } from "@nextui-org/react";
import { FC, useContext } from "react";
import StoreContext from "../../contexts/store";

// Components
import Box from "../Box";

const Introduction: FC = () => {
  const storeCtx = useContext(StoreContext);

  return (
    <Box
      css={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mt: "200px",
      }}
    >
      <Box>
        <Text
          h2
          css={{
            textAlign: "center",
          }}
        >
          Send a message to begin on a new session
        </Text>
        <Text
          css={{
            maxWidth: "600px",
            textAlign: "center",
          }}
        >
          You are chatting with {storeCtx?.activeCharacter && storeCtx.activeCharacter.name}.
        </Text>
      </Box>
    </Box>
  );
};

export default Introduction;
