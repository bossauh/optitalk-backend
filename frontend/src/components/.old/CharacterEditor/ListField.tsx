import { Button, Spacer, Text, Tooltip } from "@nextui-org/react";
import { FC } from "react";
import { AiOutlineClose, AiOutlinePlus } from "react-icons/ai";
import { ListFieldProps } from "../../common/types";

// Components
import Box from "../Box";
import InputField from "./InputField";

const ListField: FC<ListFieldProps> = (props) => {
  return (
    <Box
      css={{
        maxWidth: props.maxWidth || "600px",
      }}
    >
      <Text h3>{props.title}</Text>
      {props.description && (
        <Text
          css={{
            color: "$accents8",
          }}
        >
          {props.description}
        </Text>
      )}

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
        {props.fields[props.targetField]?.map((i: string, idx: number) => {
          return (
            <Box
              css={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <InputField
                bordered
                value={i}
                minLength={props.minLength}
                maxLength={props.maxLength}
                onChange={(e: any) => {
                  props.setFields((prev) => {
                    let newList = [...(prev[props.targetField] || [])];
                    newList[idx] = e.target.value;
                    return { ...prev, [props.targetField]: newList };
                  });
                }}
                placeholder={props.inputPlaceholder}
                css={{
                  flex: 1,
                }}
                required
              />
              <Button
                css={{
                  maxWidth: "30px",
                  minWidth: "30px",
                }}
                light
                icon={<AiOutlineClose />}
                color="error"
                onPress={() => {
                  props.setFields((prev) => {
                    let newList = [...(prev[props.targetField] || [])];
                    newList.splice(idx, 1);
                    return { ...prev, [props.targetField]: newList };
                  });
                }}
              />
            </Box>
          );
        })}
        <Tooltip
          content={
            (props.fields[props.targetField]?.length || 0) >= props.limit ? props.disabledButtonMessage : undefined
          }
          placement="right"
        >
          <Button
            css={{
              mt: "10px",
            }}
            icon={<AiOutlinePlus />}
            auto
            disabled={(props.fields[props.targetField]?.length || 0) >= props.limit}
            color="gradient"
            onPress={() => {
              props.setFields((prev) => {
                let newList = [...(prev[props.targetField] || [])];
                newList.push("");
                return { ...prev, [props.targetField]: newList };
              });
            }}
          >
            {props.buttonTitle}
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ListField;
