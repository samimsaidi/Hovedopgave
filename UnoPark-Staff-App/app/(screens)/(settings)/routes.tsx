import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import axios from "axios";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Swipeable } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { FontAwesome } from "@expo/vector-icons";
import { CustomInput } from "../../../components/CustomInput";
import LoadingButton from "@/components/LoadingButton";
import CustomButton from "@/components/CustomButton";

interface Route {
  id: number;
  name: string;
}

const Routes = () => {
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["25%", "75%"], []);

  const fetchRoutes = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/routes`, {
        withCredentials: true,
      });
      setRoutes(response.data);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not fetch routes",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Route name is required",
      });
      return;
    }

    try {
      if (editingRoute) {
        await axios.put(
          `http://localhost:8080/api/routes/${editingRoute.id}`,
          { name },
          { withCredentials: true }
        );
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Route updated successfully",
        });
      } else {
        await axios.post(
          `http://localhost:8080/api/routes`,
          { name },
          { withCredentials: true }
        );
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Route created successfully",
        });
      }
      setName("");
      setEditingRoute(null);
      bottomSheetRef.current?.close();
      fetchRoutes();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "An error occurred",
      });
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Slet rute", "Er du sikker på, at du vil slette denne rute?", [
      { text: "Annuller", style: "cancel" },
      {
        text: "Slet",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`http://localhost:8080/api/routes/${id}`, {
              withCredentials: true,
            });
            Toast.show({
              type: "success",
              text1: "Success",
              text2: "Route deleted successfully",
            });
            fetchRoutes();
          } catch (error) {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Could not delete route",
            });
          }
        },
      },
    ]);
  };

  const renderRightActions = (id: number) => {
    return (
      <TouchableOpacity
        className="bg-red-500 justify-center px-4"
        onPress={() => handleDelete(id)}
      >
        <Text className="text-white">Slet</Text>
      </TouchableOpacity>
    );
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setName(route.name);
    bottomSheetRef.current?.snapToIndex(1);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Text className="text-2xl font-semibold text-primary font-psemibold my-4 text-center">
        Ruter
      </Text>

      <View className="flex-1 bg-gray-50">
        <ScrollView className="flex-1">
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : routes.length === 0 ? (
            <View className="flex-1 justify-center items-center mt-10">
              <Text className="text-gray-500">Ingen ruter fundet</Text>
            </View>
          ) : (
            routes.map(route => (
              <Swipeable
                key={route.id}
                renderRightActions={() => renderRightActions(route.id)}
              >
                <TouchableOpacity onPress={() => handleEdit(route)}>
                  <View className="bg-white p-4 border-b border-gray-100">
                    <Text className="text-lg font-pbold">{route.name}</Text>
                  </View>
                </TouchableOpacity>
              </Swipeable>
            ))
          )}
        </ScrollView>

        <CustomButton
          title=""
          icon={<FontAwesome name="plus" size={24} color="white" />}
          handlePress={() => {
            setEditingRoute(null);
            setName("");
            bottomSheetRef.current?.snapToIndex(1);
          }}
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
            <Text className="text-xl font-pbold mb-4">
              {editingRoute ? "Rediger rute" : "Tilføj ny rute"}
            </Text>

            <CustomInput
              placeholder="Rutenavn"
              value={name}
              onChangeText={setName}
            />

            <LoadingButton
              title={editingRoute ? "Opdater rute" : "Tilføj rute"}
              handlePress={handleSubmit}
              isLoading={false}
              containerStyles="mb-4"
            />
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

export default Routes;
