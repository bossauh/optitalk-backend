import { Textarea } from "@nextui-org/react";
import { FC, useEffect, useState } from "react";

interface TextareaFieldProps {
  value?: string;
  [key: string]: any;
}

const TextareaField: FC<TextareaFieldProps> = ({ value, onChange, ...props }) => {
  const [currentValue, setCurrentValue] = useState<string>();

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  return (
    <Textarea
      value={currentValue}
      onChange={(e) => {
        setCurrentValue(e.target.value);
      }}
      onBlur={(e) => {
        onChange(e);
      }}
      {...props}
      aria-label={props.placeholder}
    />
  );
};

export default TextareaField;
