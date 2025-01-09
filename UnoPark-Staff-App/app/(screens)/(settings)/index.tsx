import React, { useEffect, useState } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useDispatch, useSelector } from "react-redux";
import { logoutAction } from "../../(redux)/authSlice";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import {
  Briefcase,
  RoadHorizon,
  SignOut,
  UsersThree,
  WifiHigh,
} from "phosphor-react-native";
import axios from "axios";

interface Stats {
  workedHours: number;
  scheduledHours: number;
  workedShifts: number;
  scheduledShifts: number;
  salary: number;
  salaryType: "HOURLY" | "FIXED";
  salaryRate: number;
}

const Settings = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [onlyActiveShifts, setOnlyActiveShifts] = useState(true);

  const handleLogout = () => {
    dispatch(logoutAction());
    router.replace("/auth/login");
    Toast.show({
      type: "success",
      text1: "Logget ud",
      text2: "Du er nu logget ud",
    });
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const response = await axios.get(
        "http://localhost:8080/api/employees/me/stats",
        {
          params: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            onlyActiveShifts,
          },
          withCredentials: true,
        }
      );
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "USER") {
      fetchStats();
    }
  }, [user, onlyActiveShifts]);

  return (
    <View className="flex-1 justify-between p-5 bg-[#f9fafb]">
      <View>
        <Text className="text-2xl font-semibold text-primary font-psemibold my-4 text-center">
          Indstillinger
        </Text>
        <View className="my-2.5">
          {(user?.role === "ADMIN" || user?.role === "ACCOUNTANT") && (
            <View>
              <TouchableOpacity
                className="flex-row items-center py-4 px-2.5 rounded-lg bg-white mb-2.5"
                onPress={() => router.push("/employees")}
              >
                <Briefcase weight="bold" size={24} color="#000" />
                <Text className="flex-1 text-lg ml-2.5 text-gray-800">
                  Medarbejdere
                </Text>
                <Icon
                  name="angle-right"
                  size={24}
                  color="#999"
                  className="ml-auto mr-2"
                />
              </TouchableOpacity>

              {user?.role === "ADMIN" && (
                <>
                  <TouchableOpacity
                    className="flex-row items-center py-4 px-2.5 rounded-lg bg-white mb-2.5"
                    onPress={() => router.push("/users")}
                  >
                    <UsersThree weight="bold" size={24} color="#000" />
                    <Text className="flex-1 text-lg ml-2.5 text-gray-800">
                      Brugere
                    </Text>
                    <Icon
                      name="angle-right"
                      size={24}
                      color="#999"
                      className="ml-auto mr-2"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center py-4 px-2.5 rounded-lg bg-white mb-2.5"
                    onPress={() => router.push("/wifi-settings")}
                  >
                    <WifiHigh weight="bold" size={24} color="#000" />
                    <Text className="flex-1 text-lg ml-2.5 text-gray-800">
                      WiFi Whitelist
                    </Text>
                    <Icon
                      name="angle-right"
                      size={24}
                      color="#999"
                      className="ml-auto mr-2"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center py-4 px-2.5 rounded-lg bg-white mb-2.5"
                    onPress={() => router.push("/routes")}
                  >
                    <RoadHorizon weight="bold" size={24} color="#000" />
                    <Text className="flex-1 text-lg ml-2.5 text-gray-800">
                      Ruter
                    </Text>
                    <Icon
                      name="angle-right"
                      size={24}
                      color="#999"
                      className="ml-auto mr-2"
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </View>

      {user && user.role !== "ADMIN" && stats && (
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-xl font-pbold mb-4">Denne måned</Text>

          <View className="flex-row justify-between mb-4">
            <View className="flex-2">
              <Text className="text-gray-600 font-psemibold">Timer</Text>
              <Text className="text-lg font-pmedium">
                {stats.workedHours}t / {stats.scheduledHours}t
              </Text>
            </View>
            <View className="flex-2">
              <Text className="text-gray-600 font-psemibold">Vagter</Text>
              <Text className="text-lg font-pmedium">
                {stats.workedShifts} / {stats.scheduledShifts}
              </Text>
            </View>
            <View className="flex-2">
              <Text className="text-gray-600 font-psemibold">Løn</Text>
              <Text className="text-lg font-pmedium">
                {stats.salary.toLocaleString("da-DK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                kr
              </Text>
              <Text className="text-xs text-gray-500">
                (
                {stats.salaryType === "HOURLY"
                  ? `${stats.salaryRate} kr / timen`
                  : `${stats.salaryRate} kr / måneden`}
                )
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600 font-psemibold">
              Vis kun aktive vagter
            </Text>
            <TouchableOpacity
              onPress={() => setOnlyActiveShifts(!onlyActiveShifts)}
              className={`w-6 h-6 flex items-center justify-center rounded ${
                onlyActiveShifts ? "bg-primary" : "bg-gray-200"
              }`}
            >
              {onlyActiveShifts && (
                <Icon name="check" size={14} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        className="flex-row items-center py-4 px-2.5 rounded-lg bg-red-500 mb-2.5"
        onPress={handleLogout}
      >
        <SignOut weight="bold" size={24} color="#fff" />
        <Text className="flex-1 text-lg ml-2.5 text-white">Logud</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Settings;
