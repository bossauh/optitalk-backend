import { Button, Dropdown, Input, Text } from "@nextui-org/react";
import { FC, FormEvent, useContext } from "react";
import { AiFillCloseCircle, AiOutlinePlus } from "react-icons/ai";
import CharacterEditorContext from "../../contexts/character-editor";

// Components
import Box from "../Box";
import CharacterEditorSubmit from "../CharacterEditorSubmit/CharacterEditorSubmit";

const CharacterConversationEditor: FC = () => {
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
          gap: "25px",
          flexDirection: "column",
        }}
      >
        <Box>
          <Text h3>Example Conversation</Text>
          <Text
            color="$accents8"
            css={{
              maxWidth: "600px",
            }}
          >
            Providing an example conversation with the character gives the character more chance to adapt to the
            speaking style you want it to adapt. You can add up to 10 messages.
          </Text>
        </Box>

        <Box
          css={{
            display: "flex",
            gap: "10px",
            flexDirection: "column",
          }}
        >
          {context?.fields.exampleExchanges?.map((item, idx) => {
            return (
              <Box
                key={`${item.role}+${item.content}+${idx}`}
                css={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Dropdown>
                  <Dropdown.Button
                    css={{
                      minWidth: "120px",
                      maxWidth: "120px",
                    }}
                  >
                    {item.role === "assistant" ? "Character" : "User"}
                  </Dropdown.Button>
                  <Dropdown.Menu
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={[item.role]}
                    onSelectionChange={(selection: any) => {
                      const value = selection.currentKey;

                      context.setFields((prev) => {
                        let list = [...(prev.exampleExchanges || [])];
                        list[idx].role = value;
                        return { ...prev, exampleExchanges: list };
                      });
                    }}
                  >
                    <Dropdown.Item key="user">User</Dropdown.Item>
                    <Dropdown.Item key="assistant">Character</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Input
                  initialValue={item.content}
                  underlined
                  fullWidth
                  placeholder="Content"
                  aria-label="Message Content"
                  onBlur={(e) => {
                    const value = e.currentTarget.value;
                    context.setFields((prev) => {
                      let list = [...(prev.exampleExchanges || [])];
                      list[idx].content = value;
                      return { ...prev, exampleExchanges: list };
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                  required
                  maxLength={2048}
                  contentRight={
                    <Button
                      light
                      animated={false}
                      css={{
                        minWidth: "10px",
                        opacity: 0.5,
                      }}
                      icon={<AiFillCloseCircle size={17} />}
                      onPress={() => {
                        context.setFields((prev) => {
                          let list = [...(prev.exampleExchanges || [])];
                          list.splice(idx, 1);
                          return { ...prev, exampleExchanges: list };
                        });
                      }}
                    />
                  }
                />
              </Box>
            );
          })}
          <Button
            icon={<AiOutlinePlus />}
            auto
            color="secondary"
            disabled={(context?.fields.exampleExchanges || []).length >= 10}
            onPress={() => {
              context?.setFields((prev) => {
                let list = [...(prev.exampleExchanges || [])];
                let role = "user";
                if (list.length > 0) {
                  if (list[list.length - 1].role === "user") {
                    role = "assistant";
                  }
                }

                list.push({ content: "", role: role });

                return { ...prev, exampleExchanges: list };
              });
            }}
          >
            Add Message
          </Button>
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

export default CharacterConversationEditor;
