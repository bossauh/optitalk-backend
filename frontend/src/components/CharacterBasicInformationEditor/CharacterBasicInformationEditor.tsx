import { Input, Textarea } from "@nextui-org/react";
import { FC, FormEvent, useContext } from "react";
import CharacterEditorContext from "../../contexts/character-editor";

// Components
import Box from "../Box";
import CharacterEditorSubmit from "../CharacterEditorSubmit/CharacterEditorSubmit";
import ListField from "./ListField";
import Visibility from "./Visibility";

const CharacterBasicInformationEditor: FC = () => {
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
          flexWrap: "wrap",
          // border: "1px solid red",
        }}
      >
        <Box
          css={{
            display: "flex",
            flexDirection: "column",
            gap: "25px",
            // border: "1px solid pink",
          }}
        >
          <Box
            css={{
              display: "flex",
              gap: "25px",
              flexWrap: "wrap",
            }}
          >
            <Input
              initialValue={context?.fields.name}
              label="Character Name*"
              placeholder="Creative sounding name"
              required
              maxLength={64}
              type="text"
              css={{
                width: "240px",
              }}
              helperText="1 to 64 Characters"
              aria-label="Character Name*"
              onBlur={(e) => {
                const value = e.currentTarget.value;
                context?.setFields((prev) => {
                  return { ...prev, name: value };
                });
              }}
            />
            <Input
              label="Image URL"
              type="url"
              placeholder="http://..."
              initialValue={context?.fields.image}
              onBlur={(e) => {
                const value = e.currentTarget.value;
                context?.setFields((prev) => {
                  return { ...prev, image: value };
                });
              }}
            />
          </Box>

          <Textarea
            css={{
              mt: "20px",
            }}
            initialValue={context?.fields.description}
            label="Description*"
            placeholder="Tip: Refer to your character in third person and get as detailed as possible. Maximum of 2048 characters."
            minRows={200}
            maxRows={15}
            onBlur={(e) => {
              const value = e.currentTarget.value;
              context?.setFields((prev) => {
                return { ...prev, description: value };
              });
            }}
            minLength={1}
            maxLength={2048}
            required
          />
          <ListField
            title="Favorite Words"
            placeholder="Word / Phrase"
            description="Maximum of 20 words/phrases that the character should say more often."
            field="favoriteWords"
            maxLength={100}
            maxItems={20}
          />
        </Box>
        <Box
          css={{
            display: "flex",
            flexDirection: "column",
            gap: "25px",
          }}
        >
          <ListField
            title="Personalities / Traits"
            placeholder="Personality / Trait"
            description="Maximum of 10 personalities/traits that the character should adapt."
            field="personalities"
            maxLength={100}
            maxItems={10}
          />
          <ListField
            title="Response Styles"
            placeholder="Response Style"
            description="Maximum of 10 response styles. (e.g., Sarcastic, Professional, etc)."
            field="responseStyles"
            maxLength={100}
            maxItems={10}
          />
          <Visibility />
        </Box>
      </Box>
      {/* <Box css={{ mt: "20px", display: "flex", flexWrap: "wrap", gap: "20px" }}>

      </Box> */}
      <Box
        css={{
          mt: "20px",
        }}
      >
        <CharacterEditorSubmit />
      </Box>
    </form>
  );
};

export default CharacterBasicInformationEditor;
