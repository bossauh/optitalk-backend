/* eslint-disable react/jsx-no-undef */
import { Accordion, Badge, Flex, MediaQuery, Skeleton, Text, Title } from "@mantine/core";
import { FC } from "react";
import { CharacterType } from "../../common/types";

const CharacterViewBasic: FC<{ character?: CharacterType; loading?: boolean }> = (props) => {
  return (
    <MediaQuery
      smallerThan="md"
      styles={{
        flexDirection: "column",
      }}
    >
      <Flex gap="xl" mt="xl" wrap="wrap">
        <Flex
          direction="column"
          gap="xs"
          sx={{
            flex: 1,
          }}
        >
          {props.loading ? (
            <>
              <Skeleton h={32} w={180} />
              <Skeleton h={15} w={300} />
              <Skeleton h={15} w={280} />
              <Skeleton h={15} w={320} />
            </>
          ) : (
            <>
              <Title order={2}>Description</Title>
              <Text
                sx={{
                  whiteSpace: "pre-wrap",
                }}
                color="gray.4"
              >
                {props.character?.description}
              </Text>
            </>
          )}
        </Flex>

        {props.loading ? (
          <>
            <Skeleton h={300} w={400} />
          </>
        ) : (
          <Accordion
            variant="contained"
            sx={{
              flex: 0.7,
            }}
          >
            {(props.character?.personalities.length || 0) > 0 && (
              <Accordion.Item value="personalities">
                <Accordion.Control>Personalities</Accordion.Control>
                <Accordion.Panel>
                  <Flex gap="xs" wrap="wrap">
                    {props.character?.personalities.map((i) => {
                      return <Badge>{i}</Badge>;
                    })}
                  </Flex>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {(props.character?.responseStyles.length || 0) > 0 && (
              <Accordion.Item value="response-styles">
                <Accordion.Control>Response Styles</Accordion.Control>
                <Accordion.Panel>
                  <Flex gap="xs" wrap="wrap">
                    {props.character?.responseStyles.map((i) => {
                      return <Badge color="blue">{i}</Badge>;
                    })}
                  </Flex>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {(props.character?.favoriteWords.length || 0) > 0 && (
              <Accordion.Item value="favorite-words">
                <Accordion.Control>Favorite Words</Accordion.Control>
                <Accordion.Panel>
                  <Flex gap="xs" wrap="wrap">
                    {props.character?.favoriteWords.map((i) => {
                      return <Badge color="pink">{i}</Badge>;
                    })}
                  </Flex>
                </Accordion.Panel>
              </Accordion.Item>
            )}
          </Accordion>
        )}
      </Flex>
    </MediaQuery>
  );
};

export default CharacterViewBasic;
