import { Badge, Button } from "@nextui-org/react";
import { FC, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Item: FC<{ title: string; path: string; top?: boolean; bottom?: boolean; new?: boolean }> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [active, setActive] = useState(false);

  useEffect(() => {
    if (location.pathname === props.path) {
      setActive(true);
    } else {
      setActive(false);
    }
  }, [location.pathname, props.path]);

  return (
    <Button
      light={!active}
      css={{
        borderRadius: "0px",
        py: "25px",

        "@md": {
          borderTopLeftRadius: props.top ? "10px" : undefined,
          borderTopRightRadius: props.top ? "10px" : undefined,

          borderBottomLeftRadius: props.bottom ? "10px" : undefined,
          borderBottomRightRadius: props.bottom ? "10px" : undefined,
        },
        "@mdMax": {
          flex: 1,
          minWidth: "130px",
          // borderTopLeftRadius: props.top ? "10px" : undefined,
          // borderBottomLeftRadius: props.top ? "10px" : undefined,

          // borderTopRightRadius: props.bottom ? "10px" : undefined,
          // borderBottomRightRadius: props.bottom ? "10px" : undefined,
        },
      }}
      onPress={() => {
        navigate(props.path);
      }}
      onMouseDown={(e) => {
        if (e.button === 1) {
          window.open(props.path, "_blank");
        }
      }}
      icon={
        props.new ? (
          <Badge color="primary" size="xs">
            New
          </Badge>
        ) : undefined
      }
    >
      {props.title}
    </Button>
  );
};

export default Item;
