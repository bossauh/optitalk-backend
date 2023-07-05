import { Button, Text, Tooltip } from "@nextui-org/react";
import { FC, useState } from "react";
import { AiFillQuestionCircle } from "react-icons/ai";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import { MessageDetailsProps } from "../../common/types";

// Components
import Box from "../Box";

const Details: FC<MessageDetailsProps> = (props) => {
  const [active, setActive] = useState(false);

  return (
    <Box
      css={{
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        alignItems: "start",
        transition: "opacity 0.15s",
        opacity: props.hovered || active ? 1 : 0,
      }}
    >
      <Button
        size="xs"
        auto
        css={{
          background: "none",
        }}
        icon={active ? <BsChevronUp size={16} /> : <BsChevronDown size={16} />}
        onPress={() => {
          setActive(!active);
        }}
      >
        Details
      </Button>

      {active && (
        <Box
          css={{
            background: "$accents0",
            borderRadius: "15px",
            padding: "10px",
            maxWidth: "700px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          <Text size={14}>
            <Text b>Processing Time:</Text> {props.message.processingTime?.toFixed(2)}s
          </Text>

          {props.message.knowledgeHint && <hr />}

          {props.message.knowledgeHint && (
            <Box
              css={{
                display: "flex",
                gap: "3px",
                alignItems: "start",
                flexDirection: "column",
              }}
            >
              <Box
                css={{
                  display: "flex",
                  gap: "5px",
                  alignItems: "center",
                }}
              >
                <Tooltip content="The character has pulled a knowledge from the knowledge base.">
                  <Text size={20}>
                    <AiFillQuestionCircle size={16} />
                  </Text>
                </Tooltip>
                <Text b size={20}>
                  Knowledge Used
                </Text>
              </Box>

              <Text
                css={{
                  whiteSpace: "pre-wrap",
                  // color: "$accents8",
                  opacity: 0.85,
                  maxHeight: "100px",
                  overflowY: "auto",
                  "@smMax": {
                    maxHeight: "170px",
                  },
                }}
                size={15}
              >
                {props.message.knowledgeHint}
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Details;
