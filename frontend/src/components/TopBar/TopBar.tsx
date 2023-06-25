import { Button, Navbar, Text } from "@nextui-org/react";
import { FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TopBarProps } from "../../common/types";

// Icons
import { AiOutlinePlus } from "react-icons/ai";
import { FiMenu } from "react-icons/fi";

// Components
import Box from "../Box";

const links = [
  {
    path: "/chat",
    name: "Chat",
  },
  {
    path: "/",
    name: "Characters",
  },
];

const TopBar: FC<TopBarProps> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box>
      <Navbar
        variant="sticky"
        containerCss={{
          background: "none !important",
          "@smMax": {
            background: "$primaryContainerBackground !important",
          },
        }}
      >
        <Navbar.Brand
          css={{
            gap: "20px",
            "@sm": {
              display: "none",
            },
          }}
        >
          <Button
            iconRight={<FiMenu size={25} />}
            color="primary"
            size="md"
            auto
            css={{
              maxWidth: "40px",
              minWidth: "40px",
            }}
            light
            onPress={() => {
              props.setSideBarActive(true);
            }}
          />
          <Text
            h3
            size={30}
            css={{
              textGradient: "$primaryTextGradient",
              mt: "7px",
            }}
            b
          >
            OptiTalk
          </Text>
        </Navbar.Brand>
        <Navbar.Content activeColor="primary" variant="underline">
          {links.map((i) => {
            let active = false;

            if (i.path === "/") {
              active = location.pathname === "/" || location.pathname.startsWith("/s");
            } else {
              active = location.pathname.startsWith(i.path);
            }

            return (
              <Navbar.Link
                key={i.path}
                onPress={() => {
                  navigate(i.path);
                }}
                isActive={active}
              >
                {i.name}
              </Navbar.Link>
            );
          })}
        </Navbar.Content>
        <Navbar.Content
          css={{
            "@smMax": {
              display: "none",
            },
          }}
        >
          <Navbar.Item>
            <Button
              auto
              size="sm"
              onPress={() => {
                navigate("/create-character");
              }}
              icon={<AiOutlinePlus />}
            >
              Create Character
            </Button>
          </Navbar.Item>
        </Navbar.Content>
      </Navbar>
    </Box>
  );
};

export default TopBar;
