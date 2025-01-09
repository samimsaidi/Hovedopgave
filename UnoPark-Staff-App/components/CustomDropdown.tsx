import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";

interface DropdownOption {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  containerStyles?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  value,
  options,
  onSelect,
  isOpen,
  setIsOpen,
  containerStyles = "",
}) => {
  return (
    <View className={`flex-1 ${containerStyles}`}>
      <Text className="text-gray-600 font-psemibold mb-2">{label}</Text>
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        className="border border-gray-300 rounded-md p-3 bg-white"
      >
        <Text>{value}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View className="absolute top-[74px] left-0 right-0 bg-white border border-gray-300 rounded-md z-50 max-h-40">
          <ScrollView>
            {options.map(option => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
                className="p-3 border-b border-gray-100"
              >
                <Text>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default CustomDropdown;
