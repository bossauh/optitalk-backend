/* eslint-disable react-hooks/exhaustive-deps */
import { Accordion, Container, List, Space, Text, Title } from "@mantine/core";
import { FC, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CharacterForm from "../components/CharacterForm";
import StoreContext from "../contexts/store";

const CreateCharacter: FC = () => {
  const store = useContext(StoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!store?.authenticated && !store?.isAuthenticating) {
      navigate("/oauth/google-oauth");
    }
  }, [store?.isAuthenticating]);

  return (
    <Container mt="lg" pb="xl">
      <Title>Create a Character</Title>
      <Text>In this page, you can create your very own character from scratch.</Text>
      <Accordion mt="lg" variant="separated">
        <Accordion.Item value="tips">
          <Accordion.Control>
            <Text>Here are a few tips to ensure that your character follows your vision.</Text>
          </Accordion.Control>
          <Accordion.Panel pr="sm">
            <List size="sm">
              <List.Item>
                If you'd like to have the character strictly follow a response style, make sure to not only provide the
                response style but also a example conversation that shows how the character should act.
              </List.Item>
              <List.Item>
                For the best results in describing your character in the Model Description, use the word "You". (e.g.,
                You are deadpool, a character from ...)
              </List.Item>
              <List.Item>
                Include short but crucial details in the Model Description. These could be things like the character's
                supposed appearance.
              </List.Item>
              <List.Item>
                Include long but crucial details in the Knowledge Base. These could be things like a long backstory,
                things the character has done in the past, etc.
              </List.Item>
            </List>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Space h="lg" />

      <CharacterForm />
      {/* <CharacterForm characterId="3b24e451-37df-468a-8f7e-188b0330f315" /> */}
    </Container>
  );
};

export default CreateCharacter;
