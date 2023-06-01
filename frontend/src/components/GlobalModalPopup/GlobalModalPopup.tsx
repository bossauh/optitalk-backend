import { Modal, Text } from "@nextui-org/react";
import { FC, useEffect, useState } from "react";
import { GlobalModalPopupProps } from "../../common/types";

const GlobalModalPopup: FC<GlobalModalPopupProps> = (props) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (props.showCounter > 0) {
      setOpen(true);
      setTimeout(() => {
        setOpen(false);
      }, props.hideIn || 3000);
    }
  }, [props.hideIn, props.showCounter]);

  return (
    <Modal closeButton open={open} onClose={() => setOpen(false)}>
      {props.title && (
        <Modal.Header>
          <Text b size={19}>
            {props.title}
          </Text>
        </Modal.Header>
      )}

      <Modal.Body>{props.content}</Modal.Body>
    </Modal>
  );
};

export default GlobalModalPopup;
