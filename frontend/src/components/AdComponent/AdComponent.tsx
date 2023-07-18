import { FC, useEffect } from "react";

const AdComponent: FC<{ client: string; slot: string; format: string }> = (props) => {
  useEffect(() => {
    // @ts-expect-error
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={props.client}
      data-ad-slot={props.slot}
      data-ad-format={props.format}
      data-full-width-responsive="true"
    />
  );
};

export default AdComponent;
