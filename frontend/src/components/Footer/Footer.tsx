import { Link, Text } from "@nextui-org/react";
import { FC, useContext } from "react";
import StoreContext from "../../contexts/store";

// Components
import { useNavigate } from "react-router-dom";
import Box from "../Box";

const Footer: FC = () => {
  const navigate = useNavigate();
  const store = useContext(StoreContext);

  return store?.userPlanDetails?.id === "free" ? (
    <Box
      css={{
        display: "flex",
        alignItems: "center",
        gap: "30px",
      }}
    >
      <Text
        size={13}
        css={{
          color: "$accents8",
        }}
      >
        {store?.userPlanDetails?.subscriptionStatus === "pending" ? (
          <>
            Your Subscription is <Text span>currently being activated.</Text> Thank You for your support! ♥
          </>
        ) : (
          <>
            Messages are limited to <Text span> 15 messages per 3 hours. </Text>{" "}
            <Link
              onPress={() => {
                navigate("/optitalk-plus");
              }}
            >
              Subscribe
            </Link>{" "}
            to get unlimited access.
          </>
        )}
      </Text>
    </Box>
  ) : (
    <Box></Box>
  );
};

export default Footer;
