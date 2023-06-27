import { FC, useEffect, useState } from "react";
import { DarkOverlayProps } from "../../common/types";

// Components
import Box from "../Box";

const DarkOverlay: FC<DarkOverlayProps> = (props) => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (props.active) {
      setShown(true);
    } else {
      const timer = setTimeout(() => {
        setShown(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [props.active]);

  return (
    <Box
      css={{
        inset: 0,
        position: "fixed",
        zIndex: props.zIndex || 201,
        backgroundColor: props.active ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0)",
        transition: `background-color 0.2s, opacity 0.2s, visibility 0.2s`,
        visibility: shown ? "visible" : "hidden",
        opacity: shown ? 1 : 0,
      }}
      onClick={() => {
        props.setActive(false);
      }}
    />
  );
};

export default DarkOverlay;
