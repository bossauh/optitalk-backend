/* eslint-disable react-hooks/exhaustive-deps */
import { ActionIcon, Button, Flex, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { FC, useContext, useEffect, useState } from "react";
import { AiFillSave } from "react-icons/ai";
import { BiLogOut } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import StoreContext from "../../contexts/store";

const MyAccountSettings: FC = () => {
  const [name, setName] = useState("");
  const [previousName, setPreviousName] = useState("");

  const [nameError, setNameError] = useState("");
  const store = useContext(StoreContext);

  const navigate = useNavigate();

  useEffect(() => {
    if (store?.isAuthenticating) {
      return;
    }

    if (store?.authenticated) {
      setName(store.displayName || "");
      setPreviousName(store.displayName || "");
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
