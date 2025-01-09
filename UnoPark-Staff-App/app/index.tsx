import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { images } from "../constants";
import LoadingButton from "@/components/LoadingButton";
import { useSelector } from "react-redux";

export default function App() {
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);

  useEffect(() => {
    if (user) {
      router.replace("/(screens)");
    }
  }, [user]);

  if (user) {
    return null;
  }

  return (
    <SafeAreaView className="h-full bg-[#f9fafb]">
      <ScrollView
        contentContainerStyle={{
          height: "100%",
        }}
      >
        <View className="w-full flex justify-center items-center h-full px-4">
          <Image
            source={images.logo}
            resizeMode="contain"
            className="w-[210px] h-[100px]"
          />
          <View className="relative mt-5">
            <Text className="text-xl text-primary font-bold text-center">
              Staff App for UnoPark Staff
            </Text>
          </View>
          <Text className="text-md font-pregular text-gray-600 mt-7 text-center">
            This app is only for{" "}
            <Text className="font-psemibold">UnoPark ApS</Text> employees
          </Text>
          <LoadingButton
            title="Login"
            handlePress={() => router.push("/auth/login")}
            containerStyles="w-[300px] mt-10"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
