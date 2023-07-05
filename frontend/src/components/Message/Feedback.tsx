/* eslint-disable react-hooks/exhaustive-deps */
import { Button, Flex, Rating, Text, Textarea } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { FC, useContext, useEffect, useState } from "react";
import { useActiveCharacter } from "../../common/utils";
import StoreContext from "../../contexts/store";

const FeedbackModal: FC<{ onSubmit: (content: string) => void }> = (props) => {
  const [content, setContent] = useState("");

  return (
    <Flex direction="column" gap="xs">
      <Text>Please tell us more about your rating. We would highly appreciate it.</Text>
      <Textarea
        placeholder="Optional"
        maxLength={2048}
        aria-label="Tell us more (Optional)"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
        }}
      />
      <Button
        onClick={() => {
          props.onSubmit(content);
        }}
      >
        Submit Rating
      </Button>
    </Flex>
  );
};

const Feedback: FC<{ messageId: string }> = (props) => {
  const [rating, setRating] = useState(0);
  const [activeCharacter] = useActiveCharacter();
  const store = useContext(StoreContext);

  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (content: string) => {
    fetch("/api/feedbacks/inline", {
      method: "POST",
      body: JSON.stringify({
        rating: rating,
        source: "chat",
        content: content,
        session_id: store?.activeSession?.id,
        character_id: activeCharacter?.id,
        message_id: props.messageId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.status_code === 200) {
          notifications.show({
            title: "Feedback submitted",
            message:
              "Thank you for your feedback. We listen to our community a lot in order to provide the best platform possible.",
            color: "teal",
          });
          setSubmitted(true);
          modals.closeAll();
        } else if (d.status_code === 403) {
          notifications.show({
            title: "User ID not found",
            message:
              "You are currently not signed in because of it, we collect your IP address as an identifier, but your IP address cannot be found. Please sign in and try again.",
            color: "red",
          });
        }
      })
      .catch((e) => {
        console.error(e);
        notifications.show({
          title: "Network Error",
          message:
            "A network error has occurred while trying to submit your feedback. Please refresh the page and try again. Usually this is because the website restarted right after you clicked the submit button.",
          color: "red",
        });
      });
  };

  useEffect(() => {
    if (rating !== 0) {
      modals.open({
        title: "Submit Rating",
        children: <FeedbackModal onSubmit={onSubmit} />,
      });
    }
  }, [rating]);

  return (
    <Rating
      value={rating}
      onChange={setRating}
      sx={{
        display: !submitted ? "flex" : "none",
      }}
    />
  );
};

export default Feedback;
