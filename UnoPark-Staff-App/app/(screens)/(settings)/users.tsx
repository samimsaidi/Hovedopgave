import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import Toast from "react-native-toast-message";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Swipeable } from "react-native-gesture-handler";
import { CustomInput } from "../../../components/CustomInput";
import LoadingButton from "@/components/LoadingButton";
import CustomButton from "@/components/CustomButton";

interface User {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "ACCOUNTANT";
  created_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN" | "ACCOUNTANT">("USER");

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => [400], []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/users", {
        withCredentials: true,
      });
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch users",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(
      user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8080/api/users/${id}`, {
        withCredentials: true,
      });
      fetchUsers();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "User deleted successfully",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete user",
      });
    }
  };

  const handleSubmit = async () => {
    if (!name || !email || !password || !role) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill all fields",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        "http://localhost:8080/api/users",
        {
          name,
          email,
          password,
          role,
        },
        { withCredentials: true }
      );

      setName("");
      setEmail("");
      setPassword("");
      setRole("USER");

      fetchUsers();
      bottomSheetRef.current?.close();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "User created successfully",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "Failed to create user",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRightActions = (id: number) => {
    return (
      <TouchableOpacity
        className="bg-red-500 justify-center px-4"
        onPress={() => {
          Alert.alert(
            "Delete User",
            "Are you sure you want to delete this user?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                onPress: () => handleDelete(id),
                style: "destructive",
              },
            ]
          );
        }}
      >
        <Text className="text-white">Delete</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Text className="text-2xl font-semibold text-primary font-psemibold my-4 text-center">
        Brugere
      </Text>

      <View className="flex-1 bg-gray-50">
        <View className="p-4  border-b border-gray-200">
          <CustomInput
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView className="flex-1">
          {filteredUsers.map(user => (
            <Swipeable
              key={user.id}
              renderRightActions={() => renderRightActions(user.id)}
            >
              <View className="bg-white p-4 border-b border-gray-100">
                <Text className="text-lg font-pbold">{user.name}</Text>
                <Text className="text-gray-600 font-psemibold">
                  {user.email}
                </Text>
                <Text className="text-gray-500 font-pmedium capitalize">
                  {user.role.toLowerCase()}
                </Text>
              </View>
            </Swipeable>
          ))}
        </ScrollView>

        <CustomButton
          title=""
          icon={<FontAwesome name="plus" size={24} color="white" />}
          handlePress={() => bottomSheetRef.current?.snapToIndex(1)}
          containerStyles="absolute bottom-5 right-5 w-14 h-14 !rounded-full"
          textStyles="text-center justify-center !mr-[-3px]"
        />

        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          enablePanDownToClose
          index={-1}
          style={{
            borderColor: "#CBD5E0",
            borderWidth: 1,
          }}
        >
          <BottomSheetView className="flex-1 p-4">
            <Text className="text-xl font-pbold mb-4">Opret ny bruger</Text>

            <CustomInput
              placeholder="Navn"
              value={name}
              onChangeText={setName}
            />

            <CustomInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <CustomInput
              placeholder="Midlertidig adgangskode"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <View className="flex-row mb-4">
              {["USER", "ACCOUNTANT", "ADMIN"].map(r => (
                <CustomButton
                  key={r}
                  title={r}
                  variant={role === r ? "primary" : "outlined"}
                  handlePress={() => setRole(r as typeof role)}
                  containerStyles="flex-1 mx-1 min-h-[40px]"
                  textStyles="text-center capitalize"
                  fontSize="text-sm"
                />
              ))}
            </View>

            <LoadingButton
              title={isSubmitting ? "Vent venligst..." : "Opret bruger"}
              handlePress={handleSubmit}
              isLoading={isSubmitting}
            />
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
