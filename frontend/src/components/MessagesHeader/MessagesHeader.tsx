import { ActionIcon, Box, Flex, Group, MediaQuery, Switch, Title, Tooltip, useMantineTheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { FC, useContext, useEffect, useState } from "react";
import { FaEllipsisV } from "react-icons/fa";
import StoreContext from "../../contexts/store";

const MessagesHeader: FC<{
  asideOpened: boolean;
  setAsideOpened: React.Dispatch<React.SetStateAction<boolean>>;
  role: string;
  setRole: React.Dispatch<React.SetStateAction<string>>;
  sending?: boolean;
}> = (props) => {
  const [title, setTitle] = useState("New Session");
  const store = useContext(StoreContext);
  const theme = useMantineTheme();
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  useEffect(() => {
    if (store?.activeSession) {
      setTitle(store.activeSession.name);
    } else {
      setTitle("New Session");
    }
  }, [store?.activeSession]);

  return (
    <Box
      sx={(theme) => ({
        background: theme.colors.dark[8],
        borderWidth: "0px",
        borderBottomWidth: "2px",
        borderStyle: "solid",
        borderColor: theme.colors.dark[5],
        padding: theme.spacing.md,
        paddingTop: theme.spacing.xs,
        paddingBottom: theme.spacing.xs,
        position: isSm ? "fixed" : "static",
        left: 0,
        right: 0,
        zIndex: 1,
      })}
    >
      <Group position="apart" align="center" noWrap>
        <Flex direction="column">
          <MediaQuery
            smallerThan="xs"
            styles={(theme) => ({
              maxWidth: "130px",
              fontSize: theme.fontSizes.sm,
            })}
          >
            <MediaQuery
              smallerThan="lg"
              styles={{
                maxWidth: "280px",
              }}
            >
              <Title order={5} truncate maw="400px">
                {title}
              </Title>
            </MediaQuery>
          </MediaQuery>
          {/* <Text fz="xs">
            <Anchor>Read more</Anchor> about sessions.
          </Text> */}
        </Flex>
        <Group spacing="xs" align="center" noWrap>
          <Tooltip
            label={
              props.sending
                ? "You can't click this while a character is generating a response. Please wait."
                : undefined
            }
            hidden={!props.sending}
            zIndex={500}
          >
            <span>
              <Switch
                label="Chat as character"
                size="xs"
                onChange={(e) => {
                  if (e.currentTarget.checked) {
                    props.setRole("assistant");
                  } else {
                    props.setRole("user");
                  }
                }}
                checked={props.role === "assistant"}
                disabled={props.sending}
              />
            </span>
          </Tooltip>
          <ActionIcon
            onClick={() => {
              props.setAsideOpened(!props.asideOpened);
            }}
          >
            <FaEllipsisV />
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  );
};

export default MessagesHeader;
