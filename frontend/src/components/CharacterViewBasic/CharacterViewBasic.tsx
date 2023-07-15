/* eslint-disable react/jsx-no-undef */
import { Box, Flex, MediaQuery, Skeleton, Text, Title } from "@mantine/core";
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
                {props.character?.publicDescription || props.character?.description}
              </Text>
            </>
          )}
        </Flex>
        {/* <Flex
          gap="xs"
          direction="column"
          sx={{
            flex: 1,
          }}
        >
          <Title order={2}>Comments</Title>
          <Box
            sx={(theme) => ({
              background: theme.colors.dark[6],
              width: "100%",
              height: "300px",
              borderRadius: theme.radius.md,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Title
              order={4}
              sx={{
                userSelect: "none",
              }}
            >
              Coming Soon...
            </Title>
          </Box>
        </Flex> */}
      </Flex>
    </MediaQuery>
  );
};

export default CharacterViewBasic;
