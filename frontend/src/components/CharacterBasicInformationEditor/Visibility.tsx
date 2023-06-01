import { Dropdown, Text } from "@nextui-org/react";
import { FC, useContext } from "react";
import CharacterEditorContext from "../../contexts/character-editor";

// Components
import Box from "../Box";

const Visibility: FC = () => {
  const context = useContext(CharacterEditorContext);

  return (
    <Box
      css={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <Box>
        <Text h5>Visibility</Text>
        <Text size={14} color="$accents8">
          Whether your character should be public or private.
        </Text>
      </Box>

      <Box>
        <Dropdown>
          <Dropdown.Button>{context?.fields.private ? "Private" : "Public"}</Dropdown.Button>
          <Dropdown.Menu
            disallowEmptySelection
            selectionMode="single"
            selectedKeys={[context?.fields.private ? "private" : "public"]}
            onSelectionChange={(selection: any) => {
              context?.setFields((prev) => {
                return { ...prev, private: selection.currentKey === "private" };
              });
            }}
          >
            <Dropdown.Item key="private">Private</Dropdown.Item>
            <Dropdown.Item key="public">Public</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Box>
    </Box>
  );
};

export default Visibility;
