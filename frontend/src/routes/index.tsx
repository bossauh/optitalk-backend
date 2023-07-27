/* eslint-disable react-hooks/exhaustive-deps */
import {
  ActionIcon,
  Anchor,
  AppShell,
  Avatar,
  Badge,
  Box,
  Burger,
  Button,
  Divider,
  Flex,
  Group,
  Header,
  Loader,
  MediaQuery,
  NavLink,
  Navbar,
  Overlay,
  Select,
  Text,
  ThemeIcon,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { ModalsProvider, modals } from "@mantine/modals";
import { FC, forwardRef, memo, useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { AiFillHeart, AiFillRobot, AiFillSetting, AiOutlinePlus } from "react-icons/ai";
import { BsFillChatFill } from "react-icons/bs";
import { FaDiscord, FaPaypal, FaRedditAlien } from "react-icons/fa";
import { MdAccountCircle } from "react-icons/md";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Changelog from "../blogs/Changelog";
import socket from "../common/socket";
import { deserializeSessionData, useSessions } from "../common/utils";
import StoreContext from "../contexts/store";

const HeaderComponent: FC<{ setOpen: React.Dispatch<React.SetStateAction<boolean>>; open: boolean }> = memo((props) => {
  const navigate = useNavigate();
  const store = useContext(StoreContext);
  const theme = useMantineTheme();
  const largerThanSm = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`);

  const [cookies, setCookies] = useCookies(["changelogShown"]);

  useEffect(() => {
    console.log("Using version", process.env.REACT_APP_OPTITALK_VERSION);

    if (cookies["changelogShown"] !== process.env.REACT_APP_OPTITALK_VERSION) {
      const currentDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(currentDate.getDate() + 100);

      setCookies("changelogShown", process.env.REACT_APP_OPTITALK_VERSION, { secure: false, expires: expiryDate });
      modals.open({ title: `Version ${process.env.REACT_APP_OPTITALK_VERSION}`, children: <Changelog /> });
    }
  }, []);

  return (
    <Header
      height={70}
      p="sm"
      sx={(theme) => ({
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: theme.colors.dark[8],
      })}
    >
      <Group align="flex-start" spacing={4}>
        <Group
          align="center"
          onClick={() => {
            navigate("/chat");
          }}
          sx={{
            cursor: "pointer",
          }}
        >
          <Avatar src="/images/mothlabs-icon.png" />
          <Title order={2}>OptiTalk</Title>
        </Group>
        <Badge
          onClick={() => {
            modals.open({ title: "Changelog", children: <Changelog /> });
          }}
          sx={{
            cursor: "pointer",
          }}
        >
          v{process.env.REACT_APP_OPTITALK_VERSION}
        </Badge>
      </Group>
      <Group align="center" spacing="xs">
        {!store?.authenticated && (
          <Button
            size={largerThanSm ? "sm" : "xs"}
            onClick={() => {
              navigate("/oauth/google-oauth");
            }}
          >
            Sign Up
          </Button>
        )}
        {/* {store?.userPlanDetails?.subscriptionStatus == null && store?.authenticated && (
          <Button
            size={largerThanSm ? "sm" : "xs"}
            onClick={() => {
              navigate("/optitalk-plus");
            }}
            variant="gradient"
          >
            Optitalk+
          </Button>
        )} */}
        {["activated", "pending"].includes(store?.userPlanDetails?.subscriptionStatus as string) && (
          <MediaQuery
            largerThan="sm"
            styles={{
              display: "none",
            }}
          >
            <Button
              size="xs"
              onClick={() => {
                navigate("/my-account");
              }}
            >
              My Account
            </Button>
          </MediaQuery>
        )}

        <MediaQuery
          largerThan="sm"
          styles={{
            display: "none",
          }}
        >
          <Burger
            opened={props.open}
            onClick={() => {
              props.setOpen(!props.open);
            }}
            size="sm"
          />
        </MediaQuery>
      </Group>
    </Header>
  );
});

const NavbarItem: FC<{
  path?: string;
  label: string;
  href?: string;
  noRightSection?: boolean;
  defaultOpened?: boolean;
  opened?: boolean;
  matchParamKey?: string;
  matchParamValue?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}> = memo((props) => {
  const [active, setActive] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (props.matchParamValue && props.matchParamKey) {
      let p = searchParams.get(props.matchParamKey);

      if (p === props.matchParamValue) {
        setActive(true);
      } else {
        setActive(false);
      }
      return;
    }

    if (props.path != null) {
      if (location.pathname.startsWith(props.path)) {
        if (props.path === "/" && location.pathname !== "/") {
          setActive(false);
        } else {
          setActive(true);
        }
      } else {
        setActive(false);
      }
    }
  }, [location.pathname, searchParams]);

  return (
    <NavLink
      label={props.label}
      variant="light"
      color="gray"
      active={active}
      icon={props.icon}
      opened={props.opened}
      defaultOpened={props.defaultOpened}
      onClick={() => {
        if (props.path) {
          navigate(props.path);
        }

        if (props.href) {
          window.open(props.href, "_blank");
        }

        if (props.matchParamKey && props.matchParamValue) {
          let newParams = new URLSearchParams(searchParams);
          newParams.set(props.matchParamKey, props.matchParamValue);
          setSearchParams(newParams);
        }
      }}
      rightSection={
        active && !props.children && !props.noRightSection ? (
          <Box
            sx={(theme) => ({
              height: "7px",
              width: "7px",
              borderRadius: "10px",
              backgroundColor: theme.colors.teal[6],
            })}
          ></Box>
        ) : undefined
      }
    >
      {props.children}
    </NavLink>
  );
});

interface SessionItemProps extends React.ComponentPropsWithoutRef<"div"> {
  label: string;
  messages: number;
}

const SessionItem = forwardRef<HTMLDivElement, SessionItemProps>(
  ({ label, messages, ...others }: SessionItemProps, ref) => (
    <Flex direction="column" ref={ref} {...others}>
      <Text truncate maw="180px">
        {label}
      </Text>
      <Text fz="xs" truncate maw="180px">
        {messages} Messages
      </Text>
    </Flex>
  )
);

const SessionSelection: FC = memo(() => {
  const [sessions, setSessions, loading] = useSessions();

  const navigate = useNavigate();
  const store = useContext(StoreContext);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const onAutoLabeled = (data: any) => {
      setSessions((prev) => {
        let newSessions = prev.map((s) => {
          let d = s;
          d.name = data.id === d.id ? data.new_name : d.name;
          return d;
        });
        return newSessions;
      });

      // @ts-expect-error
      store?.setActiveSession((prev: any) => {
        let copy = { ...prev };
        copy.new = false;
        copy.name = data.new_name;
        return copy;
      });
    };
    socket.on("session-auto-labeled", onAutoLabeled);

    return () => {
      socket.off("session-auto-labeled", onAutoLabeled);
    };
  }, []);

  useEffect(() => {
    const onSessionDeleted = (data: any) => {
      setSessions((prev) => prev.filter((i) => i.id !== data.id));
    };

    const onSessionSettingsUpdated = (data: any) => {
      data = deserializeSessionData(data);

      setSessions((prev) => {
        let newSessions = prev.map((s) => {
          let d = s;
          if (d.id === data.id) {
            console.debug("Changed", d, "to", data);
            return data;
          }
          return d;
        });

        return newSessions;
      });

      if (data.id === store?.activeSession?.id) {
        store?.setActiveSession(data);
      }
    };

    const onSessionUsed = (data: any) => {
      setSessions((prev) => {
        let newSessions = [...prev];
        let idx = newSessions.findIndex((i) => i.id === data.id);
        if (idx !== -1) {
          let session = newSessions.splice(idx, 1);
          newSessions = [...session, ...newSessions];
        }
        return newSessions;
      });
    };

    socket.on("session-deleted", onSessionDeleted);
    socket.on("session-settings-updated", onSessionSettingsUpdated);
    socket.on("session-used", onSessionUsed);

    return () => {
      socket.off("session-deleted", onSessionDeleted);
      socket.off("session-settings-updated", onSessionSettingsUpdated);
      socket.off("session-used", onSessionUsed);
    };
  }, []);

  useEffect(() => {
    let id = searchParams.get("session");
    if (id) {
      let session = sessions.find((i) => i.id === id);
      if (session) {
        store?.setActiveSession(session);
        return;
      }
    }
  }, [searchParams, sessions]);

  return (
    <Group noWrap align="end" spacing="xs" position="apart">
      <Select
        label={!store?.activeCharacter ? "Current chats" : `Current chats with ${store.activeCharacter.name}`}
        disabled={!store?.activeCharacter}
        placeholder={store?.activeCharacter ? "Pick a chat" : "Select a character first"}
        data={sessions.map((i) => ({ label: i.name, value: i.id, messages: i.messagesCount }))}
        searchable
        clearable
        size="xs"
        sx={{
          flex: 1,
          width: "100%",
        }}
        value={store?.activeSession?.id || null}
        onChange={(v) => {
          if (v) {
            let session = sessions.find((i) => i.id === v);
            if (session) {
              store?.setActiveSession(session);
              navigate(`/chat?session=${v}`);
              return;
            }
          }
          store?.setActiveSession(undefined);
        }}
        maxDropdownHeight={500}
        itemComponent={SessionItem}
        rightSection={loading ? <Loader size="xs" /> : undefined}
      />
      <ActionIcon
        variant="filled"
        color="primary"
        onClick={() => {
          store?.setActiveSession(undefined);
          navigate("/chat");
        }}
      >
        <AiOutlinePlus />
      </ActionIcon>
    </Group>
  );
});

const NavbarComponent: FC<{ opened: boolean }> = memo((props) => {
  const store = useContext(StoreContext);
  const theme = useMantineTheme();
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  return (
    <Navbar
      width={{ base: isSm ? 300 : 280 }}
      // hiddenBreakpoint="sm"
      // hidden={!props.opened}
      sx={(theme) => ({
        background: isSm ? "rgba(20,20,22,0.7)" : theme.colors.dark[8],
        backdropFilter: isSm ? "blur(7px)" : "none",
        zIndex: 200,
        left: isSm ? (props.opened ? 0 : -300) : 0,
        transition: "left 0.25s",
      })}
    >
      <Navbar.Section p="sm" pt="lg">
        <SessionSelection />
      </Navbar.Section>
      <Navbar.Section grow pt="lg">
        {store?.authenticated && (
          <NavbarItem
            icon={
              <ThemeIcon color="lime" variant="light">
                <MdAccountCircle />
              </ThemeIcon>
            }
            path="/my-account"
            label="My Account"
          >
            {store.userPlanDetails?.subscriptionStatus != null && (
              <NavbarItem
                path="/my-account"
                label="My Subscription"
                matchParamKey="tab"
                matchParamValue="subscription"
                icon={
                  <ThemeIcon color="blue" variant="light">
                    <FaPaypal />
                  </ThemeIcon>
                }
              />
            )}
            <NavbarItem
              path="/my-account"
              label="Settings"
              matchParamKey="tab"
              matchParamValue="settings"
              icon={
                <ThemeIcon color="orange" variant="light">
                  <AiFillSetting />
                </ThemeIcon>
              }
            />
          </NavbarItem>
        )}
        <NavbarItem
          path="/"
          label="Characters"
          icon={
            <ThemeIcon color="pink" variant="light">
              <AiFillRobot />
            </ThemeIcon>
          }
          opened
          noRightSection
        >
          <NavbarItem path="/" label="Featured" matchParamKey="tab" matchParamValue="featured" />
          <NavbarItem path="/" label="Public" matchParamKey="tab" matchParamValue="public" />
          <NavbarItem path="/" label="My Characters" matchParamKey="tab" matchParamValue="my-characters" />
          <NavbarItem path="/" label="Favorites" matchParamKey="tab" matchParamValue="favorites" />
          <NavbarItem
            path="/create-character"
            label="Create a Character"
            icon={
              <ThemeIcon variant="light">
                <AiOutlinePlus />
              </ThemeIcon>
            }
          />
        </NavbarItem>
        <NavbarItem
          href="https://www.buymeacoffee.com/optitalk"
          label="Support Us"
          icon={
            <ThemeIcon color="#eb4228" variant="filled">
              <AiFillHeart />
            </ThemeIcon>
          }
        />
        <NavbarItem
          path="/chat"
          label="Chat"
          icon={
            <ThemeIcon color="teal" variant="light">
              <BsFillChatFill />
            </ThemeIcon>
          }
        />
        <NavbarItem
          href="https://discord.gg/Cuue5V7X8J"
          label="Discord"
          icon={
            <ThemeIcon color="#5865F2" variant="filled">
              <FaDiscord />
            </ThemeIcon>
          }
        />
        <NavbarItem
          href="https://www.reddit.com/r/optitalk/"
          label="Subreddit"
          icon={
            <ThemeIcon color="#FF4500" variant="filled">
              <FaRedditAlien />
            </ThemeIcon>
          }
        />
      </Navbar.Section>
      <Divider />
      <Navbar.Section px="xs" py="sm">
        <Flex w="100%" direction="column" align="center">
          <Group>
            <Text fz="xs" color="gray.5">
              MothLabs © 2023
            </Text>
            <Anchor
              href="https://docs.google.com/forms/d/e/1FAIpQLSciRo_XWFTlm6MN4Ex__e2Da9UlHDG4osgJKGB5qVWsh5j96w/viewform"
              fz="xs"
            >
              Contact Form
            </Anchor>
            <Anchor
              onClick={() => {
                modals.open({ title: "Changelog", children: <Changelog /> });
              }}
              fz="xs"
            >
              Changelog
            </Anchor>
          </Group>
        </Flex>
      </Navbar.Section>
    </Navbar>
  );
});

const Index: FC = () => {
  const [navbarOpen, setNavbarOpen] = useState(false);

  return (
    <ModalsProvider>
      <AppShell
        header={<HeaderComponent setOpen={setNavbarOpen} open={navbarOpen} />}
        navbar={<NavbarComponent opened={navbarOpen} />}
        styles={(theme) => ({
          main: { backgroundColor: theme.colors.dark[7], height: "100%" },
        })}
        navbarOffsetBreakpoint="sm"
        padding={0}
        sx={{
          ".mantine-AppShell-body": {
            height: "100% !important",
          },
          ".mantine-AppShell-root": {
            height: "100% !important",
          },
          ".mantine-AppShell-main": {
            height: "100% !important",
          },
        }}
      >
        {navbarOpen && (
          <MediaQuery
            largerThan="sm"
            styles={{
              display: "none",
            }}
          >
            <Overlay
              color="#000"
              opacity={0.7}
              zIndex={10}
              onClick={() => {
                setNavbarOpen(false);
              }}
              pos="fixed"
            />
          </MediaQuery>
        )}
        <Outlet />
      </AppShell>
    </ModalsProvider>
  );
};

export default Index;
