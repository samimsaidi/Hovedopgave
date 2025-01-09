import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Image, Alert } from "react-native";
import { intervalToDuration } from "date-fns";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { images } from "@/constants";
import Icon from "react-native-vector-icons/Feather";
import { useRouter } from "expo-router";
import { da } from "date-fns/locale";
import { differenceInSeconds } from "date-fns";

interface Schedule {
  id: number;
  start_time: string;
  end_time: string;
  route_name?: string;
  employee_id: number;
  created_by: number;
  created_at: string;
  updated_at: string | null;
}

interface Stats {
  totalEmployees: number;
  todayShifts: number;
  activeShifts: number;
  todayScheduledHours: number;
}

const TabHome = () => {
  const [activeShift, setActiveShift] = useState<number | null>(null);
  const [timer, setTimer] = useState<string>("Ingen aktive vagt");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [shiftLocation, setShiftLocation] = useState<string | null>(null);
  const { user } = useSelector((state: any) => state.auth);
  const [upcomingShifts, setUpcomingShifts] = useState<Schedule[]>([]);
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [nextShiftCountdown, setNextShiftCountdown] = useState<string | null>(
    null
  );

  const fetchUpcomingShifts = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/schedules/me/upcoming",
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const shifts = await response.json();
      setUpcomingShifts(shifts);
    } catch (error) {
      console.error("Error fetching upcoming shifts:", error);
    }
  };

  useEffect(() => {
    if (user.role === "USER") {
      checkActiveShift();
      fetchUpcomingShifts();
    }
  }, []);

  const checkActiveShift = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/shifts/me", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const shifts = await response.json();
      const activeShift = shifts.find(
        (shift: any) => shift.status === "ONGOING"
      );

      if (activeShift) {
        setActiveShift(activeShift.id);
        setStartTime(new Date(activeShift.start_time));
        setShiftLocation(activeShift.location);
      }
    } catch (error) {
      console.error("Error checking active shift:", error);
      alert("Failed to check active shift status");
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (startTime) {
      intervalId = setInterval(() => {
        const duration = intervalToDuration({
          start: startTime,
          end: new Date(),
        });

        let durationParts = [];
        if (duration.days && duration.days > 0) {
          durationParts.push(`${duration.days}d`);
        }
        if (duration.hours && duration.hours > 0) {
          durationParts.push(`${duration.hours}h`);
        }
        if (duration.minutes && duration.minutes > 0) {
          durationParts.push(`${duration.minutes}m`);
        }
        const seconds = duration.seconds ?? 0;
        durationParts.push(`${seconds.toString().padStart(2, "0")}s`);

        setTimer(durationParts.join(" "));
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [startTime]);

  const startShift = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/shifts/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 403) {
        alert(
          "You must be connected to an approved WiFi network to start a shift"
        );
        return;
      }

      if (response.ok) {
        setActiveShift(data.shiftId);
        setStartTime(new Date());
        setShiftLocation(data.location);
        setTimer("00s");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Error starting shift");
    }
  };

  const endShift = async () => {
    if (!activeShift) return;

    Alert.alert(
      "Afslut vagt",
      "Er du sikker på, at du vil afslutte din vagt?",
      [
        {
          text: "Annuller",
          style: "cancel",
        },
        {
          text: "Ja, afslut",
          onPress: async () => {
            try {
              const response = await fetch(
                `http://localhost:8080/api/shifts/${activeShift}/end`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  credentials: "include",
                }
              );

              const data = await response.json();
              if (response.ok) {
                setActiveShift(null);
                setStartTime(null);
                setTimer("Ingen aktive vagt");
              } else {
                Alert.alert("Fejl", data.message);
              }
            } catch (error) {
              Alert.alert(
                "Fejl",
                "Der opstod en fejl ved afslutning af vagten"
              );
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/stats", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    if (user.role === "ADMIN" || user.role === "ACCOUNTANT") {
      fetchStats();
    }
  }, [user.role]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (upcomingShifts.length > 0 && !activeShift) {
      const nextShift = upcomingShifts[0];
      const updateCountdown = () => {
        const now = new Date();
        const start = new Date(nextShift.start_time);

        if (now >= start) {
          setNextShiftCountdown(null);
          return;
        }

        const totalSeconds = differenceInSeconds(start, now);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        setNextShiftCountdown(
          `${hours}t ${minutes.toString().padStart(2, "0")}m ${seconds
            .toString()
            .padStart(2, "0")}s`
        );
      };

      updateCountdown();
      intervalId = setInterval(updateCountdown, 1000);
    }

    return () => clearInterval(intervalId);
  }, [upcomingShifts, activeShift]);

  return (
    <View className="flex-1 p-5 bg-[#f9fafb] pt-20">
      <Image
        source={images.logo}
        resizeMode="contain"
        className="w-[140px] h-[70px]"
      />

      <Text className="text-2xl font-semibold text-primary text-left font-psemibold my-4">
        God formiddag, <Text className="font-pmedium">{user.name}!</Text> 👋
      </Text>

      {user?.role === "USER" && nextShiftCountdown && !activeShift && (
        <View className="mb-4">
          <Text className="text-base text-gray-600 font-pmedium">
            Din næste vagt starter om
          </Text>
          <Text className="text-xl font-psemibold text-primary">
            {nextShiftCountdown}
          </Text>
        </View>
      )}

      {user?.role !== "USER" && (
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Text className="text-lg font-pregular text-primary">
                Du er logget ind som{" "}
                <Text className="font-psemibold capitalize">{user.role}</Text>
              </Text>
            </View>
          </View>
        </View>
      )}

      {user?.role === "USER" && (
        <>
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <Icon
                    name="calendar"
                    size={24}
                    color="#000"
                    className="mr-2"
                  />
                  <Text className="text-lg font-semibold text-primary font-psemibold">
                    Din Vagtplan
                  </Text>
                </View>
              </View>

              {upcomingShifts.length > 0 ? (
                <>
                  {upcomingShifts.map((shift, index) => (
                    <View
                      key={shift.id}
                      className={`py-3 flex-row items-start ${
                        index !== upcomingShifts.length - 1
                          ? "border-b border-gray-200"
                          : ""
                      }`}
                    >
                      <View className="items-center mr-4 w-12">
                        <Text className="text-lg font-psemibold text-gray-800">
                          {format(new Date(shift.start_time), "dd")}
                        </Text>
                        <Text className="text-xs text-gray-500 capitalize">
                          {format(new Date(shift.start_time), "EEE", {
                            locale: da,
                          }).toLowerCase()}
                        </Text>
                      </View>

                      <View className="flex-1">
                        <Text className="text-base font-pmedium text-gray-800">
                          {format(new Date(shift.start_time), "HH:mm")} -{" "}
                          {format(new Date(shift.end_time), "HH:mm")}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {Math.round(
                            ((new Date(shift.end_time).getTime() -
                              new Date(shift.start_time).getTime()) /
                              (1000 * 60 * 60)) *
                              10
                          ) / 10}{" "}
                          timer
                        </Text>
                      </View>

                      {shift.route_name && (
                        <View className="items-end">
                          <Text className="text-sm text-gray-600 font-pmedium">
                            {shift.route_name}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </>
              ) : (
                <Text className="text-sm text-gray-500">
                  Ingen kommende vagter
                </Text>
              )}

              <TouchableOpacity
                onPress={() => router.push("/schedule")}
                className="mt-3"
              >
                <Text className="text-secondary text-center text-sm font-pmedium">
                  Se fulde vagtplan
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <Icon name="clock" size={24} color="#000" className="mr-2" />
                  <Text className="text-lg font-semibold text-primary font-psemibold">
                    Aktiv Vagt
                  </Text>
                </View>
              </View>

              <View className="items-center mb-4">
                <Text
                  className={`${
                    timer === "Ingen aktive vagt" ? "text-2xl" : "text-3xl"
                  } font-psemibold my-2 text-gray-800`}
                >
                  {timer || "Ingen aktive vagt"}
                </Text>
                {startTime && (
                  <>
                    <Text className="text-sm font-pmedium text-gray-600">
                      Fra kl. {format(startTime, "HH:mm")} - ??-??
                    </Text>
                    {shiftLocation && (
                      <Text className="text-sm text-gray-500 mt-1">
                        {shiftLocation}
                      </Text>
                    )}
                  </>
                )}
              </View>

              {!activeShift ? (
                <TouchableOpacity
                  onPress={startShift}
                  className="bg-green-500 px-6 py-3 rounded-lg w-full"
                >
                  <Text className="text-white font-psemibold text-center text-base">
                    Start Vagt
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={endShift}
                  className="bg-red-500 px-6 py-3 rounded-lg w-full"
                >
                  <Text className="text-white font-psemibold text-center text-base">
                    Afslut Vagt
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      )}

      {(user?.role === "ADMIN" || user?.role === "ACCOUNTANT") && stats && (
        <View className="grid grid-cols-2 gap-4">
          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <View className="flex-row items-center mb-2">
              <Icon name="users" size={20} color="#4F46E5" />
              <Text className="ml-2 text-sm font-pmedium text-gray-500">
                Ansat(te)
              </Text>
            </View>
            <Text className="text-2xl font-psemibold text-gray-900">
              {stats.totalEmployees}
            </Text>
          </View>

          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <View className="flex-row items-center mb-2">
              <Icon name="calendar" size={20} color="#059669" />
              <Text className="ml-2 text-sm font-pmedium text-gray-500">
                Vagter I dag
              </Text>
            </View>
            <Text className="text-2xl font-psemibold text-gray-900">
              {stats.todayShifts}
            </Text>
          </View>

          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <View className="flex-row items-center mb-2">
              <Icon name="clock" size={20} color="#DC2626" />
              <Text className="ml-2 text-sm font-pmedium text-gray-500">
                Aktive vagter
              </Text>
            </View>
            <Text className="text-2xl font-psemibold text-gray-900">
              {stats.activeShifts}
            </Text>
          </View>

          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <View className="flex-row items-center mb-2">
              <Icon name="clock" size={20} color="#9333EA" />
              <Text className="ml-2 text-sm font-pmedium text-gray-500">
                Vagttimer i dag
              </Text>
            </View>
            <Text className="text-2xl font-psemibold text-gray-900">
              {stats.todayScheduledHours}t
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default TabHome;
