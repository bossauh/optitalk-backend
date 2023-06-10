import { Button, Text, Textarea } from "@nextui-org/react";
import { FC, FormEvent, useContext } from "react";
import CharacterEditorContext from "../../contexts/character-editor";

// Components
import { AiFillCloseCircle } from "react-icons/ai";
import Box from "../Box";
import CharacterEditorSubmit from "../CharacterEditorSubmit/CharacterEditorSubmit";

const CharacterKnowledgeEditor: FC = () => {
  const context = useContext(CharacterEditorContext);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    context?.onSubmit();
    e.preventDefault();
  };

  return (
    <form onSubmit={onSubmit} id="character-form">
      <Box
        css={{
          display: "flex",
          flexDirection: "column",
          gap: "25px",
        }}
      >
        <Box>
          <Text h3>Knowledge Base</Text>
          <Text
            color="$accents8"
            css={{
              maxWidth: "800px",
            }}
          >
            You can provide characters a bunch of knowledge that they can utilize to improve responses. These knowledge
            can be <b>backstories, directions, something that the character knows, a character's friends, etc.</b> Each
            line of knowledge must be independent from the rest of the knowledge base. You can add up to 500 knowledge.
          </Text>
        </Box>

        <Box
          css={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            maxHeight: "900px",
            overflowY: "auto",
            p: "10px",
            "@smMax": {
              maxHeight: "fit-content",
              p: "0px",
            },
          }}
        >
          {context?.knowledge.map((i, idx) => {
            return (
              <Box
                css={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
                key={`${idx}-${i.content}-${i.id || "un"}`}
              >
                <Text size={16} b>
                  {idx + 1}
                </Text>
                <Textarea
                  initialValue={i.content}
                  maxRows={25}
                  minRows={2}
                  fullWidth
                  onBlur={(e) => {
                    let value = e.currentTarget.value;
                    value = value.replace(/^\s+|\s+$/g, "");
                    context.setKnowledge((prev) => {
                      let list = [...prev];
                      list[idx].content = value;
                      return list;
                    });
                  }}
                  placeholder="Knowledge"
                  aria-label="Knowledge"
                  required
                  maxLength={1024}
                />
                <Button
                  light
                  icon={<AiFillCloseCircle size={17} />}
                  css={{
                    maxWidth: "20px",
                    minWidth: "20px",
                    opacity: 0.6,
                  }}
                  onPress={() => {
                    context.setKnowledge((prev) => {
                      let list = [...prev];
                      list.splice(idx, 1);
                      return list;
                    });
                    if (i.id) {
                      fetch("/api/characters/knowledge?id=" + i.id, { method: "DELETE" });
                    }
                  }}
                />
              </Box>
            );
          })}
          <Box>
            <Textarea
              placeholder="New Knowledge"
              underlined
              maxRows={25}
              minRows={1}
              fullWidth
              aria-label="New Knowledge"
              color="primary"
              onKeyUp={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  const value = e.currentTarget.value;
                  if (context) {
                    context.setKnowledge((prev) => {
                      let list = [...prev];
                      list.push({ content: value });
                      return list;
                    });
                  }
                  e.currentTarget.value = "";
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              disabled={(context?.knowledge.length || 0) >= 500}
              maxLength={1024}
            />
          </Box>
        </Box>

        <Box
          css={{
            mt: "20px",
          }}
        >
          <CharacterEditorSubmit />
        </Box>
      </Box>
    </form>
  );
};

export default CharacterKnowledgeEditor;
