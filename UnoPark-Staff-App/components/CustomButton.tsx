import { Text, TouchableOpacity } from "react-native";

const CustomButton = ({
  title,
  handlePress,
  containerStyles,
  textStyles,
  variant = "primary",
  icon,
  fontSize = "text-lg",
}: {
  title: string;
  handlePress: () => void;
  containerStyles?: string;
  textStyles?: string;
  variant?: "primary" | "secondary" | "outlined";
  icon?: React.ReactNode;
  fontSize?: "text-sm" | "text-base" | "text-lg" | "text-xl";
}) => {
  const getBgColor = () => {
    switch (variant) {
      case "primary":
        return "bg-primary";
      case "secondary":
        return "bg-secondary";
      case "outlined":
        return "bg-transparent border-2 border-primary";
      default:
        return "bg-primary";
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "primary":
        return "text-white";
      case "secondary":
        return "text-primary";
      case "outlined":
        return "text-primary";
      default:
        return "text-white";
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={`${getBgColor()} rounded-xl min-h-[50px] flex flex-row justify-center items-center ${containerStyles}`}
    >
      <Text
        className={`${getTextColor()} font-psemibold ${fontSize} ${textStyles}`}
      >
        {title}
      </Text>
      {icon}
    </TouchableOpacity>
  );
};

export default CustomButton;
