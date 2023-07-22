import { Badge, Container, Tabs, TabsValue, Title } from "@mantine/core";
import { FC } from "react";
import { AiFillSetting } from "react-icons/ai";
import { BsGraphUpArrow } from "react-icons/bs";
import { FaPaypal } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import MyAccountDetails from "../components/MyAccountDetails";
import MyAccountSettings from "../components/MyAccountSettings";
import MyAccountSubscription from "../components/MyAccountSubscription";

const MyAccount: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams({ tab: "details" });

  const onTabChange = (v: TabsValue) => {
    if (v) {
      let newParams = new URLSearchParams(searchParams);
      newParams.set("tab", v.toString());
      setSearchParams(newParams);
    }
  };

  return (
    <Container mt="lg">
      <Title order={2}>My Account</Title>
      <Tabs
        keepMounted={false}
        value={searchParams.get("tab") || "details"}
        mt="lg"
        onTabChange={onTabChange}
        sx={(theme) => ({
          ".mantine-Tabs-panel": {
            paddingTop: theme.spacing.sm,
          },
        })}
      >
        <Tabs.List>
          <Tabs.Tab value="details" icon={<BsGraphUpArrow />}>
            Details
          </Tabs.Tab>
          <Tabs.Tab value="subscription" icon={<FaPaypal />}>
            My Subscription
          </Tabs.Tab>
          <Tabs.Tab value="settings" icon={<AiFillSetting />} rightSection={<Badge size="xs">New</Badge>}>
            Settings
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details">
          <MyAccountDetails />
        </Tabs.Panel>
        <Tabs.Panel value="subscription">
          <MyAccountSubscription />
        </Tabs.Panel>
        <Tabs.Panel value="settings">
          <MyAccountSettings />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};

export default MyAccount;
