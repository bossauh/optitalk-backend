import { Button, Text } from "@nextui-org/react";
import { FC, useContext } from "react";
import StoreContext from "../../contexts/store";

// Components
import Box from "../Box";

const DeleteCharacter: FC<{ id: string; onDelete: (id: string) => void }> = ({ id, onDelete }) => {
  const storeCtx = useContext(StoreContext);

  const deleteCharacter = () => {
    fetch(`/api/characters?character_id=${id}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((d) => {
        console.info("Delete Character", d);

        if (storeCtx?.activeCharacter && storeCtx.activeCharacter.id === id) {
          storeCtx.setActiveCharacter(undefined);
        }
        onDelete(id);
      })
      .catch((e) => {
        console.error("Error deleting a character", e);
      });
  };

  return (
    <Box
      css={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxW: "200px",
      }}
    >
      <Text>Are you sure you want to delete this character?</Text>
      <Box
        css={{
          display: "flex",
          justifyContent: "space-between",
          gap: "5px",
        }}
      >
        <Button auto color="error" onPress={deleteCharacter}>
          Delete
        </Button>
        <Button auto light>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default DeleteCharacter;
