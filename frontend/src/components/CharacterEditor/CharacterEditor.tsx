import { Badge, Button, Checkbox, Dropdown, Spacer, Text, Tooltip } from "@nextui-org/react";
import { FC, FormEvent, useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { AiOutlineClose, AiOutlinePlus } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { CharacterEditorFields, CharacterEditorProps } from "../../common/types";
import { deserializeCharacterData, deserializeCharacterFields, serializeCharacterFields } from "../../common/utils";
import StoreContext from "../../contexts/store";

// Components
import Box from "../Box";
import InputField from "./InputField";
import ListField from "./ListField";
import TextareaField from "./TextareaField";

const CharacterEditor: FC<CharacterEditorProps> = (props) => {
  const storeCtx = useContext(StoreContext);
  const [, setCookie, ,] = useCookies(["activeCharacterId"]);

  const [fields, setFields] = useState<CharacterEditorFields>({
    name: "",
    description: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    console.log(fields);
  }, [fields]);

  useEffect(() => {
    if (props.characterId) {
      fetch("/api/characters/details?character_id=" + props.characterId)
        .then((r) => r.json())
        .then((d) => {
          const deserialized = deserializeCharacterFields(d.payload);
          setFields(deserialized);
        });
    }
  }, [props.characterId]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const onError = (e: any) => {
      console.error(e);
      alert("A unknown error has occurred. Please check the form and try again.");
    };

    fetch(`/api/characters${props.characterId ? "?character_id=" + props.characterId : ""}`, {
      method: props.characterId ? "PATCH" : "POST",
      body: JSON.stringify(serializeCharacterFields(fields)),
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.status_code === 409) {
          alert(
            "You have reached your characters limit. You can donate to show support and get past the 8 character limit or you can delete your older characters."
          );
        } else if (d.status_code !== 200) {
          onError(d);
        } else {
          if (props.characterId === undefined) {
            fetch(`/api/characters/details?character_id=${d.payload.id}`)
              .then((r) => r.json())
              .then((d) => {
                storeCtx?.setActiveCharacter(deserializeCharacterData(d.payload));
                storeCtx?.setActiveSession(undefined);
                setCookie("activeCharacterId", d.payload.id, { path: "/" });
              });
          }
          navigate("/characters");
        }
      })
      .catch((e) => {
        onError(e);
      });
    e.preventDefault();
  };

  return (
    <form onSubmit={onSubmit}>
      <Tooltip
        content={"This character creation page is in its beta phase. It'll be further improved in the future."}
        placement="right"
      >
        <Badge color="error">Beta Interface</Badge>
      </Tooltip>
      <Spacer y={1.5} />

      <Box
        css={{
          maxWidth: "600px",
        }}
      >
        <Text h3>Basic Information</Text>
        <Text
          css={{
            color: "$accents8",
          }}
        >
          This is the basic information about the character.
        </Text>
        <Spacer y={0.5} />
        <Box css={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <InputField
            value={fields?.name}
            bordered
            placeholder="Name"
            clearable
            maxLength={24}
            minLength={2}
            required
            onChange={(e: any) => {
              setFields((prev) => {
                return { ...prev, name: e.target.value };
              });
            }}
          />
          <InputField
            bordered
            placeholder="Avatar URL"
            clearable
            type="url"
            css={{
              flex: 1,
            }}
            value={fields?.image}
            onChange={(e: any) => {
              setFields((prev) => {
                return { ...prev, image: e.target.value };
              });
            }}
          />
        </Box>
        <Spacer y={1} />
        <TextareaField
          bordered
          required
          placeholder="Description"
          css={{
            width: "100%",
          }}
          value={fields?.description}
          onChange={(e: any) => {
            setFields((prev) => {
              return { ...prev, description: e.target.value };
            });
          }}
          minLength={10}
          maxLength={1024}
        />
        <Text
          css={{
            color: "$accents8",
          }}
          size={14}
        >
          Be descriptive on who the character is and what it is capable of responding with
        </Text>

        <Spacer y={0.5} />
        <Tooltip content="By making the character private, only you are capable of accessing it." placement="right">
          <Checkbox
            isSelected={fields.private}
            onChange={(v) => {
              return setFields((prev) => {
                return { ...prev, private: v };
              });
            }}
            size="sm"
            aria-label="Private"
          >
            Private
          </Checkbox>
        </Tooltip>
      </Box>
      <Spacer y={1.5} />
      <Box
        css={{
          display: "flex",
          alignItems: "start",
          flexWrap: "wrap",
          gap: "50px",
        }}
      >
        <ListField
          buttonTitle="Add Knowledge"
          fields={fields}
          setFields={setFields}
          inputPlaceholder="Knowledge"
          targetField="knowledge"
          title="Knowledge"
          description="A list of knowledge that the character has access to. This can range from simple words to full blown sentences. Right now it is limited to 10 items but in the future if this projects gets continuous support, we will implement a new knowledge system that scales this up to thousands."
          limit={10}
          minLength={1}
          maxLength={250}
        />
        <ListField
          buttonTitle="Add Personality"
          fields={fields}
          setFields={setFields}
          inputPlaceholder="Personality"
          targetField="personalities"
          title="Personality"
          description="A list of personalities/traits the character should adapt."
          limit={5}
          minLength={1}
          maxLength={24}
          maxWidth="250px"
        />
        <ListField
          buttonTitle="Add Word"
          fields={fields}
          setFields={setFields}
          inputPlaceholder="Word"
          targetField="favoriteWords"
          title="Favorite Words"
          description="A list of words or short phrases that the character should use more often."
          limit={20}
          minLength={1}
          maxLength={24}
          maxWidth="300px"
        />
        <ListField
          buttonTitle="Add Style"
          fields={fields}
          setFields={setFields}
          inputPlaceholder="Style"
          targetField="responseStyles"
          title="Response Styles"
          description="A list of response styles that the character should respond in. Ex: Casual, Sarcastic, etc."
          limit={5}
          minLength={1}
          maxLength={24}
          maxWidth="300px"
        />
        <Box
          css={{
            maxWidth: "600px",
          }}
        >
          <Text h3>Example Conversation</Text>
          <Text
            css={{
              color: "$accents8",
            }}
          >
            You can provide an example conversation to better guide the character on how it should respond. Maximum of
            10 messages.
          </Text>

          <Spacer y={0.5} />
          <Box
            css={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              overflowY: "auto",
              maxHeight: "500px",
              p: "3px",
            }}
          >
            {fields.exampleExchanges?.map((i, idx) => {
              return (
                <Box
                  css={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <Dropdown>
                    <Dropdown.Button
                      css={{
                        maxWidth: "120px",
                        minWidth: "120px",
                      }}
                      size="sm"
                    >
                      {i.role === "assistant" ? "Character" : "User"}
                    </Dropdown.Button>
                    <Dropdown.Menu
                      selectedKeys={[i.role]}
                      selectionMode="single"
                      onSelectionChange={(v: any) => {
                        if (v.currentKey) {
                          setFields((prev) => {
                            let newList = [...(prev.exampleExchanges || [])];
                            newList[idx].role = v.currentKey;
                            return { ...prev, exampleExchanges: newList };
                          });
                        }
                      }}
                    >
                      <Dropdown.Item key="user">
                        <Text>User</Text>
                      </Dropdown.Item>
                      <Dropdown.Item key="assistant">
                        <Text>Character</Text>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  <InputField
                    bordered
                    value={i.content}
                    css={{
                      flex: 1,
                    }}
                    minLength={1}
                    maxLength={2000}
                    placeholder="Message"
                    onChange={(e: any) => {
                      setFields((prev) => {
                        let oldList = [...(prev.exampleExchanges || [])];
                        oldList[idx].content = e.target.value;
                        return { ...prev, exampleExchanges: oldList };
                      });
                    }}
                    required
                  />
                  <Button
                    css={{
                      maxW: "30px",
                      minWidth: "30px",
                    }}
                    light
                    icon={<AiOutlineClose />}
                    color="error"
                    onPress={() => {
                      setFields((prev) => {
                        let newList = [...(prev.exampleExchanges || [])];
                        newList.splice(idx, 1);
                        return { ...prev, exampleExchanges: newList };
                      });
                    }}
                  />
                </Box>
              );
            })}
            <Tooltip content={(fields.exampleExchanges?.length || 0) >= 10 ? "Maximum messages reached" : undefined}>
              <Button
                css={{
                  mt: "10px",
                }}
                icon={<AiOutlinePlus />}
                auto
                disabled={(fields.exampleExchanges?.length || 0) >= 10}
                color="gradient"
                onPress={() => {
                  setFields((prev) => {
                    let newList = [...(fields.exampleExchanges || [])];
                    newList.push({ content: "", role: "user" });
                    return { ...prev, exampleExchanges: newList };
                  });
                }}
              >
                Add Message
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Spacer y={2} />
      <Box
        css={{
          display: "flex",
          justifyContent: "end",
        }}
      >
        <Button type="submit">Submit</Button>
      </Box>
    </form>
  );
};

export default CharacterEditor;
