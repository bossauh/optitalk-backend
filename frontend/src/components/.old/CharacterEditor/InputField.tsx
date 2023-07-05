import { Input } from "@nextui-org/react";
import { FC, useEffect, useState } from "react";

interface InputFieldProps {
  value?: string;
  [key: string]: any;
}

const InputField: FC<InputFieldProps> = ({ value, onChange, ...props }) => {
  const [currentValue, setCurrentValue] = useState<string>();

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  return (
    <Input
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

export default InputField;
