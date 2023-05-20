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
          }}
          color="primary"
          onPress={() => {
            navigate("/oauth/google-oauth");
          }}
        >
          Sign Up
        </Button>
      )}
    </Card.Footer>
  );
};

export default SideBarFooter;
