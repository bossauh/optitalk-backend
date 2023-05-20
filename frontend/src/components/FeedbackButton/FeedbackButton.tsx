import { Button, Tooltip } from "@nextui-org/react";
import { FC } from "react";
import { FcFeedback } from "react-icons/fc";

// Components
import Box from "../Box";

const FeedbackButton: FC = () => {
  return (
    <Box
      css={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 100,
        "@smMax": {
          top: "100px",
          bottom: undefined,
        },
      }}
    >
      <Tooltip content={"Leave a feedback"} placement="leftStart">
        <Button
          icon={<FcFeedback size={20} />}
          rounded
          css={{
            maxW: "48px",
            minWidth: "48px",
          }}
          size="lg"
          onPress={() => {
            window.open(
              "https://docs.google.com/forms/d/e/1FAIpQLSciRo_XWFTlm6MN4Ex__e2Da9UlHDG4osgJKGB5qVWsh5j96w/viewform?usp=sf_link",
              "_blank"
            );
          }}
        />
      </Tooltip>
    </Box>
  );
};

export default FeedbackButton;
