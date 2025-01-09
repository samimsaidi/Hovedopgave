import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

const LoadingButton = ({
  title,
  handlePress,
  containerStyles,
  textStyles,
  isLoading,
  variant = "primary",
}: {
  title: string;
  handlePress: () => void;
  containerStyles?: string;
  textStyles?: string;
  isLoading?: boolean;
  variant?: "primary" | "secondary";
}) => {
  const bgColor = variant === "primary" ? "bg-primary" : "bg-secondary";
  const textColor = variant === "primary" ? "text-white" : "text-primary";
  const spinnerColor = variant === "primary" ? "#fff" : "#000";

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={`${bgColor} rounded-xl min-h-[50px] flex flex-row justify-center items-center ${containerStyles} ${
        isLoading ? "opacity-50" : ""
      }`}
      disabled={isLoading}
    >
      <Text className={`${textColor} font-psemibold text-lg ${textStyles}`}>
        {title}
      </Text>

      {isLoading && (
        <ActivityIndicator
          animating={isLoading}
          color={spinnerColor}
          size="small"
          className="ml-2"
        />
      )}
    </TouchableOpacity>
  );
};

export default LoadingButton;
