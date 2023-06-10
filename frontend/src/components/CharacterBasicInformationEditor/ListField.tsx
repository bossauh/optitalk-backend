import { Button, Input, Text } from "@nextui-org/react";
import { FC, useContext } from "react";
import { AiFillCloseCircle } from "react-icons/ai";
import CharacterEditorContext from "../../contexts/character-editor";

// Components
import Box from "../Box";

const ListField: FC<{
  title: string;
  description: string;
  field: string;
  maxLength: number;
  placeholder: string;
  maxItems: number;
}> = (props) => {
  const context = useContext(CharacterEditorContext);

  const onNewItem = (value: string) => {
    context?.setFields((prev) => {
      let oldList = [...(prev[props.field] || [])];
      oldList.push(value);

      return { ...prev, [props.field]: oldList };
    });
  };

  return (
    <Box
      css={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <Box>
        <Text h5>{props.title}</Text>
        <Text size={14} color="$accents8">
          {props.description}
        </Text>
      </Box>
      <Box
        css={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          maxHeight: "300px",
          overflowY: "auto",
        }}
      >
        {context?.fields[props.field]?.map((i: string, idx: number) => {
          return (
            <Input
              initialValue={i}
              aria-label={props.placeholder}
              placeholder={props.placeholder}
              underlined
              required
              maxLength={props.maxLength}
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
                      let oldList = [...(prev[props.field] || [])];
                      oldList.splice(idx, 1);

                      return { ...prev, [props.field]: oldList };
                    });
                  }}
                />
              }
              onBlur={(e) => {
                const value = e.currentTarget.value;
                context.setFields((prev) => {
                  let oldList = [...(prev[props.field] || [])];
                  oldList[idx] = value;

                  return { ...prev, [props.field]: oldList };
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              key={`${i}-${idx}`}
            />
          );
        })}
        {(context?.fields[props.field]?.length || 0) < props.maxItems && (
          <Input
            placeholder="New Item"
            aria-label="New Item"
            underlined
            maxLength={props.maxLength}
            onKeyDown={(e) => {
              const value = e.currentTarget.value;
              if (e.key === "Enter") {
                onNewItem(value);
                e.currentTarget.value = "";
                e.preventDefault();
              }
            }}
            onBlur={(e) => {
              const value = e.currentTarget.value;
              if (value) {
                onNewItem(value);
                e.currentTarget.value = "";
              }
            }}
            color="primary"
          />
        )}
      </Box>
    </Box>
  );
};

export default ListField;
