/* eslint-disable react-hooks/exhaustive-deps */
import { Flex, Loader, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { FC, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StoreContext from "../contexts/store";

const Logout: FC = () => {
  const store = useContext(StoreContext);
  const navigate = useNavigate();

  const logout = () => {
    fetch("/api/users/logout")
      .then((r) => r.json())
      .then((d) => {
        if (d.status_code === 200) {
          window.location.href = "/";
        } else {
          notifications.show({
            title: "Unknown error",
            message:
              "A unknown error has occurred while trying to log you out. Please try again by refreshing the page. If the problem persists, contact us.",
            color: "red",
          });
        }
      })
      .catch((e) => {
        console.error(e);
        notifications.show({
          title: "Network error",
          message:
            "This error shouldn't happen unless OptiTalk is down or in maintenance. Please refresh the page to try again. If the problem persists, contact us.",
          color: "red",
        });
      });
  };

  useEffect(() => {
    if (!store?.isAuthenticating) {
      if (store?.authenticated) {
        logout();
      } else {
        navigate("/");
      }
    }
  }, [store]);

  return (
    <Flex direction="column" h="100vh" align="center" justify="center">
      <Flex direction="column" gap="sm" align="center">
        <Title order={2}>We are logging you out...</Title>
        <Loader />
      </Flex>
    </Flex>
  );
};

export default Logout;
