/* eslint-disable react-hooks/exhaustive-deps */
import {
  ActionIcon,
  Anchor,
  AppShell,
  Avatar,
  Box,
  Divider,
  Flex,
  Footer,
  Group,
  Header,
  Loader,
  MediaQuery,
  Menu,
  NavLink,
  Navbar,
  Overlay,
  Select,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { FC, forwardRef, useContext, useEffect, useState } from "react";
import { AiFillCaretRight, AiFillRobot, AiFillSetting, AiOutlinePlus } from "react-icons/ai";
import { BsFillChatFill } from "react-icons/bs";
import { FiLogOut } from "react-icons/fi";
import { GiHamburgerMenu, GiUpgrade } from "react-icons/gi";
import { HiOutlineLogin } from "react-icons/hi";
import { MdAccountCircle, MdContactSupport } from "react-icons/md";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import socket from "../common/socket";
import { useSessions } from "../common/utils";
import SettingsModal from "../components/SettingsModal";
import StoreContext from "../contexts/store";

const HeaderComponent: FC<{ setOpen: React.Dispatch<React.SetStateAction<boolean>>; open: boolean }> = (props) => {
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
      <Group align="center">
        <Avatar src="/images/mothlabs-icon.png" />
        <Title order={2}>OptiTalk</Title>
      </Group>
      <MediaQuery
        largerThan="sm"
        styles={{
          display: "none",
        }}
      >
        <ActionIcon
          size="lg"
          onClick={() => {
            props.setOpen(!props.open);
          }}
        >
          <GiHamburgerMenu size={20} />
        </ActionIcon>
      </MediaQuery>
    </Header>
  );
};

const NavbarItem: FC<{
  path: string;
  label: string;
  noRightSection?: boolean;
  defaultOpened?: boolean;
  opened?: boolean;
  matchParamKey?: string;
  matchParamValue?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}> = (props) => {
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

    if (location.pathname.startsWith(props.path)) {
      if (props.path === "/" && location.pathname !== "/") {
        setActive(false);
      } else {
        setActive(true);
      }
    } else {
      setActive(false);
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
        navigate(props.path);

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
};

interface SessionItemProps extends React.ComponentPropsWithoutRef<"div"> {
  label: string;
}

const SessionItem = forwardRef<HTMLDivElement, SessionItemProps>(({ label, ...others }: SessionItemProps, ref) => (
  <div ref={ref} {...others}>
    <Text truncate maw="180px">
      {label}
    </Text>
  </div>
));

const SessionSelection: FC = () => {
  const [sessions, setSessions, loading] = useSessions();

  const navigate = useNavigate();
  const store = useContext(StoreContext);

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
    };
    socket.on("session-auto-labeled", onAutoLabeled);

    return () => {
      socket.off("session-auto-labeled", onAutoLabeled);
    };
  }, []);

  return (
    <Group noWrap align="end" spacing="xs" position="apart">
      <Select
        label="Session"
        placeholder="Pick a session"
        data={sessions.map((i) => ({ label: i.name, value: i.id }))}
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
};

const NavbarComponent: FC<{ opened: boolean }> = (props) => {
  const store = useContext(StoreContext);
  const navigate = useNavigate();

  return (
    <Navbar
      width={{ base: 280 }}
      hiddenBreakpoint="sm"
      hidden={!props.opened}
      sx={(theme) => ({
        background: theme.colors.dark[8],
      })}
    >
      <Navbar.Section p="sm" pt="lg">
        <SessionSelection />
      </Navbar.Section>
      <Navbar.Section grow pt="lg">
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
          path="/chat"
          label="Chat"
          icon={
            <ThemeIcon color="teal" variant="light">
              <BsFillChatFill />
            </ThemeIcon>
          }
        />
      </Navbar.Section>
      <Divider />
      {store !== null && (
        <Navbar.Section p="sm">
          {store.userPlanDetails?.subscriptionStatus !== "activated" && store.authenticated && (
            <Tooltip
              label={
                store.userPlanDetails?.subscriptionStatus === "pending" ? "Subscription being activated..." : undefined
              }
              sx={{
                zIndex: 1000,
              }}
              opened={
                [null, undefined, "activated"].includes(store.userPlanDetails?.subscriptionStatus) ? false : undefined
              }
            >
              <NavLink
                label={store.userPlanDetails?.subscriptionStatus === "pending" ? "Activating OptiTalk+" : "OptiTalk+"}
                icon={
                  store.userPlanDetails?.subscriptionStatus === "pending" ? (
                    <Loader size="xs" color="teal" />
                  ) : (
                    <GiUpgrade />
                  )
                }
                variant="subtle"
                active
                color="teal"
                onClick={() => {
                  navigate("/optitalk-plus");
                }}
                disabled={store.userPlanDetails?.subscriptionStatus === "pending"}
              />
            </Tooltip>
          )}

          {store.authenticated ? (
            <Menu>
              <Menu.Target>
                <NavLink
                  description={store.userPlanDetails?.subscriptionStatus === "activated" ? "OptiTalk+ User" : undefined}
                  label="My Account"
                  icon={<MdAccountCircle />}
                  rightSection={<AiFillCaretRight />}
                />
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{store.displayName}</Menu.Label>
                <Menu.Item
                  onClick={() => {
                    window.open(
                      "https://docs.google.com/forms/d/e/1FAIpQLSciRo_XWFTlm6MN4Ex__e2Da9UlHDG4osgJKGB5qVWsh5j96w/viewform?usp=sf_link",
                      "_blank"
                    );
                  }}
                  icon={<MdContactSupport />}
                >
                  Contact Us
                </Menu.Item>
                <Menu.Item
                  onClick={() => {
                    modals.open({
                      title: "Settings",
                      children: <SettingsModal />,
                      centered: true,
                      size: "lg",
                    });
                  }}
                  icon={<AiFillSetting />}
                >
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  onClick={() => {
                    fetch("/api/users/logout")
                      .then((r) => r.json())
                      .then((d) => {
                        if (d.status_code !== 200) {
                          notifications.show({
                            title: "Error trying to logout",
                            message: "Please try again. If the problem persists, contact us.",
                            color: "red",
                          });
                        } else {
                          window.open("/");
                        }
                      });
                  }}
                  icon={<FiLogOut />}
                  color="red"
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <NavLink
              label="Sign Up"
              icon={<HiOutlineLogin />}
              onClick={() => {
                navigate("/oauth/google-oauth");
              }}
            />
          )}
        </Navbar.Section>
      )}
    </Navbar>
  );
};

const FooterItem: FC = () => {
  return (
    <Footer
      height={40}
      p="xs"
      sx={(theme) => ({
        background: theme.colors.dark[8],
      })}
    >
      <Flex align="center" justify="end" gap="xl">
        <Anchor
          fz="xs"
          target="_blank"
          href="https://docs.google.com/forms/d/e/1FAIpQLSciRo_XWFTlm6MN4Ex__e2Da9UlHDG4osgJKGB5qVWsh5j96w/viewform"
        >
          Contact Us
        </Anchor>
        <Text fz="xs" color="gray.5">
          MothLabs © 2023
        </Text>
      </Flex>
    </Footer>
  );
};

const Index: FC = () => {
  const [navbarOpen, setNavbarOpen] = useState(false);

  return (
    <AppShell
      padding="md"
      header={<HeaderComponent setOpen={setNavbarOpen} open={navbarOpen} />}
      navbar={<NavbarComponent opened={navbarOpen} />}
      footer={<FooterItem />}
      styles={(theme) => ({
        main: { backgroundColor: theme.colors.dark[7], height: "100vh" },
      })}
      navbarOffsetBreakpoint="sm"
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
          />
        </MediaQuery>
      )}
      <Outlet />
    </AppShell>
  );
};

export default Index;
