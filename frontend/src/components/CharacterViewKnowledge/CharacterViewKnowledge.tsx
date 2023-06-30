import { Card, Flex, Loader, Pagination, Text, Title } from "@mantine/core";
import { FC } from "react";
import { CharacterType } from "../../common/types";
import { useKnowledge } from "../../common/utils";

const CharacterViewKnowledge: FC<{ character?: CharacterType; loading?: boolean }> = (props) => {
  const [loading, totalPages, page, setPage, knowledge, ,] = useKnowledge(props.character?.id);

  if (loading) {
    return (
      <Flex direction="column" gap="sm" align="center" mt="xl">
        <Flex direction="column" align="center">
          <Title order={2}>Fetching Knowledge Base</Title>
          <Text fz="sm" align="center">
            This might take a while...
          </Text>
        </Flex>
        <Loader />
      </Flex>
    );
  }

  if ((knowledge.length || 0) === 0) {
    return (
      <Flex mt="xl" direction="column">
        <Title order={2}>No Data</Title>
        <Text>The author of this character did not provide a knowledge base.</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" mt="xl" gap="sm">
      <Pagination value={page} onChange={setPage} total={totalPages} />
      <Flex direction="column" gap="xs">
        {knowledge.map((item) => {
          return (
            <Card key={item.id}>
              <Text fz="sm">{item.content}</Text>
            </Card>
          );
        })}
      </Flex>
    </Flex>
  );
};

export default CharacterViewKnowledge;
