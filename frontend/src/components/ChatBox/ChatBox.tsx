import { Button, Textarea } from "@nextui-org/react";
import { FC, useRef, useState } from "react";
import { AiOutlineSend } from "react-icons/ai";
import { ChatBoxProps } from "../../common/types";

// Components
import Box from "../Box";

const ChatBox: FC<ChatBoxProps> = (props) => {
  const [value, setValue] = useState("");
  const [maxRows, setMaxRows] = useState(10);

  const ref = useRef<HTMLTextAreaElement | null>(null);

  const submit = () => {
    props.onSubmit(value);
    setValue("");
    setMaxRows(1);
    if (ref.current) {
      ref.current.value = "";
    }
  };

  return (
    <Box
      css={{
        display: "flex",
        alignItems: "end",
        gap: "10px",
      }}
    >
      <Textarea
        underlined
        placeholder={props.placeholder}
        size="lg"
        css={{
          flex: 1,
        }}
        color="primary"
        minRows={1}
        maxRows={maxRows}
        ref={ref}
        onChange={(e) => {
          setValue(e.target.value);
          setMaxRows(10);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        cacheMeasurements={false}
        aria-label="Chatbox"
        disabled={props.disabled}
      />
      <Button
        auto
        color="gradient"
        size="sm"
        onClick={() => {
          submit();
        }}
        disabled={props.disabled}
      >
        <AiOutlineSend size={18} />
      </Button>
    </Box>
  );
};

export default ChatBox;
