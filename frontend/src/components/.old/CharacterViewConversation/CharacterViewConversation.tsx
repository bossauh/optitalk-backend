import { Text } from "@nextui-org/react";
import { FC } from "react";
import { useOutletContext } from "react-router-dom";
import { CharacterViewOutletContextType } from "../../common/types";

// Components
import Box from "../Box";

const CharacterViewConversation: FC = () => {
  const context: CharacterViewOutletContextType = useOutletContext();

  return (
    <Box
      css={{
        mt: "20px",
      }}
    >
      {(context.details?.exampleExchanges.length || 0) > 0 ? (
        <Box>
          <Text h3>Example Conversation</Text>
          <Text color="$accents8">
            Below is an example of what a conversation with this character should look like.
          </Text>
          <Box
            css={{
              display: "flex",
              flexDirection: "column",
              gap: "25px",
              maxWidth: "700px",
              mt: "30px",
            }}
          >
            {context.details.exampleExchanges.map((i) => {
              return (
                <Box
                  css={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: i.role === "assistant" ? "start" : "end",
                    gap: "5px",
                  }}
                >
                  <Text size={14} color="$accents8">
                    {i.role === "assistant" ? context.details.name : "User"}
                  </Text>
                  <Box
                    key={`${i.content}+${i}+${i.role}`}
                    css={{
                      bg: i.role === "assistant" ? "$accents1" : "$primary",
                      p: "10px",
                      borderRadius: "$sm",
                      maxWidth: "500px",
                      alignSelf: i.role === "assistant" ? "start" : "end",
                    }}
                  >
                    <Text>{i.content}</Text>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      ) : (
        <Box>
          <Text h3>No Data</Text>
          <Text color="$accents8">The author of this character did not provide a example conversation.</Text>
        </Box>
      )}
    </Box>
  );
};

export default CharacterViewConversation;
