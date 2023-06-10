import { Button, Card, Loading } from "@nextui-org/react";
import { FC, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Store from "../../contexts/store";

// Icons
import { BiUser } from "react-icons/bi";
import { BsBoxArrowUpRight } from "react-icons/bs";
import { FiLogIn } from "react-icons/fi";

const SideBarFooter: FC = () => {
  const storeCtx = useContext(Store);

  const navigate = useNavigate();

  return (
    <Card.Footer
      css={{
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <Button
        iconRight={<BsBoxArrowUpRight />}
        auto
        css={{
          width: "100%",
          height: "70px",
        }}
        color="gradient"
        onPress={() => {
          window.open("https://rapidapi.com/philmattdev/api/optitalk", "_blank");
        }}
      >
        API
      </Button>

      {storeCtx === null ? (
        <Button disabled auto css={{ width: "100%" }}>
          <Loading color="currentColor" size="sm" />
        </Button>
      ) : storeCtx.authenticated ? (
        <Button
          iconRight={<BiUser />}
          auto
          css={{
            width: "100%",
            height: "70px",
          }}
          color="secondary"
          onPress={() => {
            navigate("/my-account");
          }}
        >
          My Account
        </Button>
      ) : (
        <Button
          iconRight={<FiLogIn />}
          auto
          css={{
            width: "100%",
            height: "70px",
          }}
          color="primary"
          onPress={() => {
            navigate("/oauth/google-oauth");
          }}
        >
          Sign Up
        </Button>
      )}

      <a href="https://www.buymeacoffee.com/philippemathew">
        <img
          src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=philippemathew&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff"
          alt="support"
          width={200}
        />
      </a>
    </Card.Footer>
  );
};

export default SideBarFooter;
