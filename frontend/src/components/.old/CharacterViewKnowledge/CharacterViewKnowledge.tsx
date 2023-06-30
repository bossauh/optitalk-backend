/* eslint-disable react-hooks/exhaustive-deps */
import { Loading, Pagination, Text } from "@nextui-org/react";
import { FC, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CharacterViewOutletContextType, KnowledgeType } from "../../common/types";

// Components
import { deserializeKnowledge } from "../../common/utils";
import Box from "../Box";

const CharacterViewKnowledge: FC = () => {
  const context: CharacterViewOutletContextType = useOutletContext();

  const [knowledge, setKnowledge] = useState<KnowledgeType[]>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/characters/knowledge?character_id=${context.details?.id}&page_size=5&page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        setLoading(false);
        if (d.status_code !== 200) {
          return;
        }

        setTotalPages(d.payload.pages);
        const deserialized = d.payload.data.map((i: any) => {
          return deserializeKnowledge(i);
        });
        if (page === 1 && deserialized.length === 0) {
          setKnowledge(undefined);
        } else {
          setKnowledge(deserialized);
        }
      })
      .catch((e) => {
        console.error("Error trying to fetch knowledge base.", e);
        setLoading(false);
      });
  }, [page]);

  return (
    <Box
      css={{
        mt: "20px",
      }}
    >
      {!loading && knowledge === undefined ? (
        <Box>
          <Text h3>No Data</Text>
          <Text color="$accents8">The author of this character did not provide a knowledge base.</Text>
        </Box>
      ) : (
        <Box
          css={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <Pagination
            total={totalPages}
            page={page}
            onChange={(p) => {
              setPage(p);
            }}
          />
          {loading ? (
            <Box
              css={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "20vh",
              }}
            >
              <Box
                css={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center,",
                }}
              >
                <Text h3>Fetching Knowledge</Text>
                <Loading />
              </Box>
            </Box>
          ) : (
            <Box css={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {knowledge?.map((i, idx) => {
                return (
                  <Box
                    css={{
                      display: "flex",
                      alignItems: "start",
                      gap: "7px",
                    }}
                  >
                    <Box
                      css={{
                        p: "10px",
                        br: "$sm",
                        bg: "$accents0",
                      }}
                      key={i.id}
                    >
                      <Text>{i.content}</Text>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CharacterViewKnowledge;
