import { Text } from "@nextui-org/react";
import { FC } from "react";

// Components
import Box from "../Box";

const ListField: FC<{ title: string; items: string[] }> = (props) => {
  return (
    <Box>
      <Text h3>{props.title}</Text>
      <Box css={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        {props.items.map((i) => {
          return <Text key={i}>• {i}</Text>;
        })}
      </Box>
    </Box>
  );
};

export default ListField;
