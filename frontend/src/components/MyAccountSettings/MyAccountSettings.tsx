/* eslint-disable react-hooks/exhaustive-deps */
import { ActionIcon, Badge, Button, Flex, Group, Stack, Text, TextInput, Textarea, Title } from "@mantine/core";
import { useDebouncedValue, useDidUpdate } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { FC, useCallback, useContext, useEffect, useState } from "react";
import { AiFillSave } from "react-icons/ai";
import { BiLogOut } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import StoreContext from "../../contexts/store";

const MyAccountSettings: FC = () => {
  const [name, setName] = useState("");
  const [previousName, setPreviousName] = useState("");

  const [descriptionError, setDescriptionError] = useState("");
  const [description, setDescription] = useState("");
  const [debouncedDescription] = useDebouncedValue(description, 200);

  const [nameError, setNameError] = useState("");
  const store = useContext(StoreContext);

  const navigate = useNavigate();

  const validateDescription = useCallback((value: string) => {
    if (value.length > 500) {
      return "Description cannot be longer than 500 characters.";
    }
    return "";
  }, []);

  useDidUpdate(() => {
    if (validateDescription(debouncedDescription) !== "") {
      console.info("Invalid description", debouncedDescription);
      return;
    }

    fetch("/api/users/description", {
      method: "PATCH",
      body: JSON.stringify({ content: debouncedDescription }),
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.status_code !== 200) {
          notifications.show({
            title: "Unknown error",
            message:
              "A unknown error has occurred while trying to save your description. Try again by editing the description. If the problem persists, contact us.",
            color: "red",
          });
        }
      })
      .catch((e) => {
        console.error(e);
        notifications.show({
          title: "Network error",
          message:
            "A unknown network error has occurred while trying to save your description. Refresh the page and try again. If the problem persists, contact us.",
          color: "red",
        });
      });
  }, [debouncedDescription]);

  useEffect(() => {
    store?.fetchUserData();
  }, []);

  useEffect(() => {
    if (store?.isAuthenticating) {
      return;
    }

    if (store?.authenticated) {
      setName(store.displayName || "");
      setPreviousName(store.displayName || "");
      setDescription(store.description || "");
    }
  }, [store?.isAuthenticating]);

  const changeName = () => {
    let cleaned = name.trim();
    if (cleaned.length === 0) {
      return setNameError("Name must be 1 to 45 characters long.");
    }

    if (name === previousName) {
      return;
    }

    fetch("/api/users/display-name", {
      method: "PATCH",
      body: JSON.stringify({ name: name }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.status_code === 200) {
          notifications.show({
            title: "Name changed",
            message: (
              <Text>
                Your name has been changed to{" "}
                <Text span fw="bold">
                  {name}
                </Text>{" "}
                successfully.
              </Text>
            ),
            color: "teal",
          });
          setPreviousName(name);
          setTimeout(() => {
            store?.fetchUserData();
          }, 200);
        } else if (d.status_code === 429) {
          notifications.show({
            title: "Rate limit error",
            message: "You are going too fast. Please wait for a couple of seconds then try again.",
            color: "red",
          });
        } else {
          notifications.show({
            title: "Unknown error",
            message:
              "A error has occurred while trying to change your name. Please try again. If the error persists, contact us.",
            color: "red",
          });
        }
      })
      .catch((e) => {
        console.error(e);
        notifications.show({
          title: "Network error",
          message:
            "A network error error has occurred while trying to change your name. Please refresh the page and try again. If the error persists, contact us.",
          color: "red",
        });
      });
  };

  return (
    <Flex direction="column" gap="lg" align="start">
      <Flex direction="column" gap="xs">
        <Title order={3}>Display Name</Title>
        <Text fz="sm">Characters will use your display name to refer to you.</Text>
        <TextInput
          aria-label="Name"
          placeholder="1 to 100 characters"
          value={name}
          onChange={(e) => {
            setNameError("");
            setName(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              changeName();
            }
          }}
          rightSection={
            <ActionIcon
              variant="filled"
              color="primary"
              onClick={() => {
                changeName();
              }}
            >
              <AiFillSave />
            </ActionIcon>
          }
          maw="350px"
          maxLength={45}
          error={nameError}
        />
      </Flex>

      <Stack spacing="xs">
        <Group spacing="xs">
          <Title order={3}>Your Description</Title>
          <Badge>New</Badge>
        </Group>
        <Text fz="sm">
          Characters can refer to your description to know more about you. It is best to describe yourself in third
          person.
        </Text>
        <Textarea
          placeholder="Ex: {your-name-here} is a 21 year old college graduate living in..."
          value={description}
          error={descriptionError}
          maxRows={10}
          autosize
          onChange={(e) => {
            const error = validateDescription(e.currentTarget.value);
            setDescriptionError(error);
            setDescription(e.currentTarget.value);
          }}
        />
      </Stack>

      <Button
        leftIcon={<BiLogOut />}
        color="red"
        variant="light"
        onClick={() => {
          navigate("/logout");
        }}
      >
        Log Out
      </Button>
    </Flex>
  );
};

export default MyAccountSettings;
