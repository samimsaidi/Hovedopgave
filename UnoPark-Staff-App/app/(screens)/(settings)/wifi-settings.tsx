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

interface WhitelistEntry {
  id: number;
  name: string;
  ip_address: string;
  created_by_name: string;
  created_at: string;
}

const WifiSettings = () => {
  const router = useRouter();
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [editingEntry, setEditingEntry] = useState<WhitelistEntry | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["25%", "75%"], []);

  const fetchEntries = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/wifi-whitelist`
      );
      setEntries(response.data);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Kunne ikke hente IP adresser fra whitelist",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSubmit = async () => {
    try {
      if (editingEntry) {
        await axios.put(
          `http://localhost:8080/api/wifi-whitelist/${editingEntry.id}`,
          {
            name,
            ip_address: ipAddress,
          }
        );
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "IP adresse opdateret",
        });
      } else {
        await axios.post(`http://localhost:8080/api/wifi-whitelist`, {
          name,
          ip_address: ipAddress,
        });
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "IP adresse tilføjet til whitelist",
        });
      }
      setName("");
      setIpAddress("");
      setEditingEntry(null);
      fetchEntries();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "An error occurred",
      });
    }
  };

  const handleEdit = (entry: WhitelistEntry) => {
    setEditingEntry(entry);
    setName(entry.name);
    setIpAddress(entry.ip_address);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Slet IP adresse",
      "Er du sikker på at du vil slette denne IP adresse?",
      [
        { text: "Annuller", style: "cancel" },
        {
          text: "Slet",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(
                `http://localhost:8080/api/wifi-whitelist/${id}`
              );
              Toast.show({
                type: "success",
                text1: "Success",
                text2: "IP adresse slettet fra whitelist",
              });
              fetchEntries();
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Kunne ikke slette IP adresse fra whitelist",
              });
            }
          },
        },
      ]
    );
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Text className="text-2xl font-semibold text-primary font-psemibold my-4 text-center">
        WiFi Whitelist
      </Text>

      <View className="flex-1 bg-gray-50">
        <ScrollView className="flex-1">
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : entries.length === 0 ? (
            <View className="flex-1 justify-center items-center mt-10">
              <Text className="text-gray-500">Ingen IP adresser fundet</Text>
            </View>
          ) : (
            entries.map(entry => (
              <Swipeable
                key={entry.id}
                renderRightActions={() => renderRightActions(entry.id)}
              >
                <View className="bg-white p-4 border-b border-gray-100">
                  <Text className="text-lg font-pbold">{entry.name}</Text>
                  <Text className="text-gray-600 font-psemibold">
                    {entry.ip_address}
                  </Text>
                </View>
              </Swipeable>
            ))
          )}
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
            <Text className="text-xl font-pbold mb-4">
              {editingEntry ? "Rediger IP" : "Tilføj IP"}
            </Text>

            <CustomInput
              placeholder="Navn"
              value={name}
              onChangeText={setName}
            />

            <CustomInput
              placeholder="IP Adresse"
              value={ipAddress}
              onChangeText={setIpAddress}
              keyboardType="numeric"
            />

            <LoadingButton
              title={editingEntry ? "Opdater IP" : "Tilføj IP"}
              handlePress={handleSubmit}
              isLoading={false}
            />
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

export default WifiSettings;
