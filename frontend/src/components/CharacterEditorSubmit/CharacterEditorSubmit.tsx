import { Button } from "@nextui-org/react";
import { FC, useContext } from "react";
import { AiOutlineArrowRight, AiTwotoneSave } from "react-icons/ai";
import CharacterEditorContext from "../../contexts/character-editor";

const CharacterEditorSubmit: FC = () => {
  const context = useContext(CharacterEditorContext);

  return (
    <Button iconRight={context?.method === "POST" ? <AiOutlineArrowRight /> : <AiTwotoneSave />} auto type="submit">
      {context?.method === "POST" ? "Create Character" : "Save Character"}
    </Button>
  );
};

export default CharacterEditorSubmit;
