import React from "react";
import { TextInput, TextInputProps } from "react-native";

interface CustomInputProps extends TextInputProps {
  height?: number;
  error?: boolean;
  className?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  height = 50,
  error,
  className = "",
  ...props
}) => {
  return (
    <TextInput
      className={`border ${
        error ? "border-red-500" : "border-gray-300"
      } rounded-lg px-4 mb-2 bg-white ${className}`}
      style={{ height }}
      {...props}
    />
  );
};
