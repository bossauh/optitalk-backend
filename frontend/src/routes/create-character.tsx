/* eslint-disable react-hooks/exhaustive-deps */
import { Container } from "@nextui-org/react";
import { FC, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StoreContext from "../contexts/store";

// Components
import CharacterEditor from "../components/CharacterEditor/CharacterEditor";
import TopBarSecondary from "../components/TopBarSecondary";

const CreateCharacter: FC = () => {
  const { characterId } = useParams();

  const storeCtx = useContext(StoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!storeCtx?.authenticated && !storeCtx?.isAuthenticating) {
      navigate("/oauth/google-oauth");
    }
  }, [storeCtx?.isAuthenticating]);

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
