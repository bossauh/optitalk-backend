import { Container } from "@nextui-org/react";
import { FC } from "react";
import { useParams } from "react-router-dom";

// Components
import CharacterEditor from "../components/CharacterEditor/CharacterEditor";
import TopBarSecondary from "../components/TopBarSecondary";

const CreateCharacter: FC = () => {
  const { characterId } = useParams();

  return (
    <Container
      css={{
        mt: "30px",
        pb: "60px",
      }}
    >
      <TopBarSecondary title={characterId ? "Edit Character" : "Create a Character"} />
      <CharacterEditor createMode characterId={characterId} />
    </Container>
  );
};

export default CreateCharacter;
