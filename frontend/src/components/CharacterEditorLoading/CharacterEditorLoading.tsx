import { Loading, Modal, Text } from "@nextui-org/react";
import { FC } from "react";

const CharacterEditorLoading: FC<{ shown: boolean; modifying: boolean }> = ({ shown, modifying }) => {
  return (
    <Modal open={shown} preventClose>
      <Modal.Header>
        <Text size={20} b>
          {modifying ? "Saving" : "Creating"} Character
        </Text>
      </Modal.Header>
      <Modal.Body>
        <Text
          color="$accents8"
          css={{
            textAlign: "center",
          }}
          size={14}
        >
          Creating knowledge embeddings... This might take a while...
        </Text>
        <Loading />
      </Modal.Body>
    </Modal>
  );
};

export default CharacterEditorLoading;
