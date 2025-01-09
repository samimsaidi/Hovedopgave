import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  TextInput,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import axios from "axios";
import Toast from "react-native-toast-message";
import { Picker } from "@react-native-picker/picker";
import { CustomInput } from "./CustomInput";
import CustomButton from "./CustomButton";
import LoadingButton from "./LoadingButton";

interface Route {
  id: number;
  name: string;
}

interface CreateScheduleSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
  employeeId: number;
  onSuccess: () => void;
}

export default function CreateScheduleSheet({
  bottomSheetRef,
  employeeId,
  onSuccess,
}: CreateScheduleSheetProps) {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(new Date());
  const [recurrence, setRecurrence] = useState<
    "NONE" | "DAILY" | "WEEKLY" | "MONTHLY"
  >("NONE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [searchRoute, setSearchRoute] = useState("");
  const [showRoutePicker, setShowRoutePicker] = useState(false);

  const snapPoints = useMemo(() => ["75%"], []);

  const recurrenceLabels = {
    NONE: "Ingen",
    DAILY: "Daglig",
    WEEKLY: "Ugentlig",
    MONTHLY: "Månedlig",
  };

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/routes", {
          withCredentials: true,
        });
        setRoutes(response.data);
      } catch (error) {
        console.error("Kunne ikke hente ruter:", error);
      }
    };
    fetchRoutes();
  }, []);

  const filteredRoutes = useMemo(() => {
    return routes.filter(route =>
      route.name.toLowerCase().includes(searchRoute.toLowerCase())
    );
  }, [routes, searchRoute]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await axios.post(
        "http://localhost:8080/api/schedules/recurring",
        {
          employeeId,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          recurrence,
          endDate: recurrenceEndDate.toISOString(),
          routeId: selectedRouteId ? parseInt(selectedRouteId) : null,
        },
        { withCredentials: true }
      );

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Vagtplan(er) oprettet",
      });

      onSuccess();
      bottomSheetRef.current?.close();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Fejl",
        text2: "Kunne ikke oprette vagtplan(er)",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      index={-1}
    >
      <BottomSheetView className="p-4">
        <Text className="text-xl font-bold mb-4">Opret vagtplan</Text>

        <View className="mb-4">
          <Text className="font-semibold mb-2">Starttid</Text>
          <DateTimePicker
            value={startDate}
            mode="datetime"
            onChange={(event, date) => date && setStartDate(date)}
            minuteInterval={30}
          />
        </View>

        <View className="mb-4">
          <Text className="font-semibold mb-2">Sluttid</Text>
          <DateTimePicker
            value={endDate}
            mode="datetime"
            onChange={(event, date) => date && setEndDate(date)}
            minuteInterval={30}
          />
        </View>

        <View className="mb-4">
          <Text className="font-semibold mb-2">Gentagelse</Text>
          <View className="flex-row">
            {(["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const).map(type => (
              <CustomButton
                key={type}
                title={recurrenceLabels[type]}
                variant={recurrence === type ? "primary" : "outlined"}
                handlePress={() => setRecurrence(type)}
                containerStyles="flex-1 mr-1 min-h-[40px]"
              />
            ))}
          </View>
        </View>

        {recurrence !== "NONE" && (
          <View className="mb-4">
            <Text className="font-semibold mb-2">Gentagelse til</Text>
            <DateTimePicker
              value={recurrenceEndDate}
              mode="date"
              onChange={(event, date) => date && setRecurrenceEndDate(date)}
            />
          </View>
        )}

        <View className="mb-4">
          <Text className="font-semibold mb-2">Rute (Valgfri)</Text>
          <View className="border border-gray-200 rounded-lg p-2">
            <CustomInput
              placeholder="Søg efter rute..."
              value={searchRoute}
              onChangeText={setSearchRoute}
            />
            <ScrollView className="max-h-24">
              <TouchableOpacity
                className={`p-2 rounded ${
                  !selectedRouteId ? "bg-blue-100" : ""
                }`}
                onPress={() => setSelectedRouteId("")}
              >
                <Text>Ingen rute</Text>
              </TouchableOpacity>
              {filteredRoutes.map(route => (
                <TouchableOpacity
                  key={route.id}
                  className={`p-2 rounded ${
                    selectedRouteId === route.id.toString() ? "bg-blue-100" : ""
                  }`}
                  onPress={() => setSelectedRouteId(route.id.toString())}
                >
                  <Text>{route.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <LoadingButton
          title={isSubmitting ? "Vent venligst..." : "Opret vagtplan"}
          handlePress={handleSubmit}
          isLoading={isSubmitting}
        />
      </BottomSheetView>
    </BottomSheet>
  );
}
