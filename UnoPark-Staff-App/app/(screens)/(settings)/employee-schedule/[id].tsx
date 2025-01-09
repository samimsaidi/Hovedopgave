import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { View, Text, ActivityIndicator, Alert, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import { Calendar } from "react-native-big-calendar";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CustomButton from "@/components/CustomButton";
import { FontAwesome } from "@expo/vector-icons";
import LoadingButton from "@/components/LoadingButton";
import CustomDropdown from "@/components/CustomDropdown";

interface Schedule {
  id: number;
  start_time: string;
  end_time: string;
  employee_name: string;
  employee_position: string;
  route_name: string | null;
  schedule_type: string;
}

interface MonthStats {
  workedHours: number;
  scheduledHours: number;
  workedShifts: number;
  scheduledShifts: number;
  salary: number;
  salaryType: "HOURLY" | "FIXED";
  salaryRate: number;
}

interface CalendarEventType {
  id: number;
  title: string;
  start: Date;
  end: Date;
  schedule_type: string;
  children?: React.ReactElement | null;
}

interface Employee {
  id: number;
  name: string;
  position: string;
}

export default function EmployeeSchedule() {
  const { id } = useLocalSearchParams();
  const [schedules, setSchedules] = useState<CalendarEventType[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthStats, setMonthStats] = useState<MonthStats | null>(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [customStartMonth, setCustomStartMonth] = useState(
    new Date().getMonth()
  );
  const [customStartYear, setCustomStartYear] = useState(
    new Date().getFullYear()
  );
  const [customEndMonth, setCustomEndMonth] = useState(new Date().getMonth());
  const [customEndYear, setCustomEndYear] = useState(new Date().getFullYear());
  const [startMonthOpen, setStartMonthOpen] = useState(false);
  const [startYearOpen, setStartYearOpen] = useState(false);
  const [endMonthOpen, setEndMonthOpen] = useState(false);
  const [endYearOpen, setEndYearOpen] = useState(false);
  const [onlyActiveShifts, setOnlyActiveShifts] = useState(true);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => [500], []);

  const getMonthName = (month: number) => {
    return new Date(2025, month, 1).toLocaleString("da-DK", {
      month: "long",
    }) as string;
  };

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        label: getMonthName(i),
        value: String(i),
      })),
    []
  );

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const year = String(new Date().getFullYear() - 2 + i);
        return {
          label: year,
          value: year,
        };
      }),
    []
  );

  const fetchSchedules = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/employees/${id}/schedules/stats`,
        {
          params: {
            start_date: selectedStartDate?.toISOString(),
            end_date: selectedEndDate?.toISOString(),
            onlyActiveShifts: onlyActiveShifts,
          },
          withCredentials: true,
        }
      );

      console.log(response.data);

      const formattedEvents = response.data.schedules.map(
        (schedule: Schedule) => ({
          id: schedule.id,
          title: schedule.employee_name,
          start: new Date(schedule.start_time),
          end: new Date(schedule.end_time),
          schedule_type: schedule.schedule_type,
          children: (
            <View style={{ marginTop: 3 }}>
              <Text className="text-xs text-white">
                {schedule.employee_position}
              </Text>
              <View className="h-[1px] bg-white/20 my-1" />
              {schedule.route_name && (
                <Text className="text-xs text-white">
                  {schedule.route_name}
                </Text>
              )}
            </View>
          ),
        })
      );

      setSchedules(formattedEvents);
      setMonthStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      setError("Kunne ikke hente vagtplaner");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployee = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/employees/${id}`,
        { withCredentials: true }
      );
      setEmployee(response.data);
    } catch (error) {
      setError("Kunne ikke hente medarbejder detaljer");
    }
  };

  useEffect(() => {
    fetchEmployee();
    fetchSchedules();
  }, [id, selectedStartDate, selectedEndDate, onlyActiveShifts]);

  useEffect(() => {
    if (!selectedStartDate || !selectedEndDate) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setSelectedStartDate(start);
      setSelectedEndDate(end);
      setCustomStartMonth(now.getMonth());
      setCustomStartYear(now.getFullYear());
      setCustomEndMonth(now.getMonth());
      setCustomEndYear(now.getFullYear());
    }
  }, []);

  const handleDateChange = useCallback((date: Date | Date[]) => {
    const newDate = Array.isArray(date) ? date[0] : date;
    setCurrentDate(newDate);
  }, []);

  const handleEventPress = useCallback(
    (event: CalendarEventType) => {
      Alert.alert(
        "Slet vagtplan",
        "Er du sikker på at du vil slette denne vagtplan?",
        [
          {
            text: "Annuller",
            style: "cancel",
          },
          {
            text: "Slet",
            style: "destructive",
            onPress: async () => {
              try {
                await axios.delete(
                  `http://localhost:8080/api/schedules/${event.id}`,
                  { withCredentials: true }
                );
                fetchSchedules();
              } catch (error) {
                Alert.alert("Fejl", "Kunne ikke slette vagtplan");
              }
            },
          },
        ]
      );
    },
    [fetchSchedules]
  );

  const memoizedCalendar = useMemo(
    () => (
      <View className="flex-1">
        <View style={{ width: "100%", height: "100%" }}>
          <Calendar
            events={schedules}
            height={600}
            mode="week"
            date={currentDate}
            onChangeDate={handleDateChange}
            swipeEnabled={true}
            eventMinHeightForMonthView={0}
            hourRowHeight={60}
            weekStartsOn={1}
            scrollOffsetMinutes={480}
            theme={{
              palette: {
                primary: {
                  main: "#34b5cd",
                  contrastText: "#ffffff",
                },
              },
            }}
            eventCellStyle={event => ({
              backgroundColor:
                event.schedule_type === "ADMIN" ? "#08173e" : "#34b5cd",
              padding: 4,
              margin: 0,
              borderRadius: 4,
            })}
            calendarCellStyle={{
              padding: 0,
              margin: 0,
            }}
            showTime={true}
            overlapOffset={70}
            onPressEvent={handleEventPress}
          />
        </View>
      </View>
    ),
    [schedules, currentDate, handleDateChange, handleEventPress]
  );

  const handleDateSelect = () => {
    if (!isCustomRange) {
      const start = new Date(customStartYear, customStartMonth, 1);
      const end = new Date(customStartYear, customStartMonth + 1, 0);
      setSelectedStartDate(start);
      setSelectedEndDate(end);
    } else {
      const start = new Date(customStartYear, customStartMonth, 1);
      const end = new Date(customEndYear, customEndMonth + 1, 0);
      setSelectedStartDate(start);
      setSelectedEndDate(end);
    }
    bottomSheetRef.current?.close();
  };

  const getFormattedPeriod = () => {
    if (!selectedStartDate || !selectedEndDate) return "";

    const startMonth = getMonthName(selectedStartDate.getMonth());
    const startYear = selectedStartDate.getFullYear();
    const endMonth = getMonthName(selectedEndDate.getMonth());
    const endYear = selectedEndDate.getFullYear();

    if (startMonth === endMonth && startYear === endYear) {
      return `${startMonth} ${startYear}`;
    }
    return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500 text-base">{error}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-gray-50">
        <View className="bg-white p-4 mb-4">
          <Text className="text-xl font-pbold mb-2">
            Vagtplan for {employee?.name}
          </Text>

          <View className="flex-row justify-between">
            <View className="flex-2">
              <Text className="text-gray-600 font-psemibold">Timer</Text>
              <Text className="text-lg font-pmedium">
                {monthStats?.workedHours || 0}t /{" "}
                {monthStats?.scheduledHours || 0}t
              </Text>
            </View>
            <View className="flex-2">
              <Text className="text-gray-600 font-psemibold">Vagter</Text>
              <Text className="text-lg font-pmedium">
                {monthStats?.workedShifts || 0} /{" "}
                {monthStats?.scheduledShifts || 0}
              </Text>
            </View>
            <View className="flex-2">
              <Text className="text-gray-600 font-psemibold">
                Løn for periode
              </Text>
              <Text className="text-lg font-pmedium">
                {monthStats?.salary?.toLocaleString("da-DK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                kr
              </Text>
              <Text className="text-xs text-gray-500">
                (
                {monthStats?.salaryType === "HOURLY"
                  ? `${monthStats?.salaryRate} kr / timen`
                  : `${monthStats?.salaryRate} kr / måneden`}
                )
              </Text>
            </View>
          </View>
          <View className="justify-center items-center mt-2">
            <View>
              <Pressable
                onPress={() => bottomSheetRef.current?.snapToIndex(0)}
                className="flex-row items-center justify-between bg-white border border-gray-200 p-3 rounded-md mb-4 mx-2"
              >
                <Text className="text-gray-600 font-psemibold mr-2">
                  {getFormattedPeriod()}
                </Text>
                <FontAwesome name="calendar" size={20} color="#666" />
              </Pressable>
            </View>
          </View>
          <View className="flex-row items-center justify-between px-4 py-2 bg-white border-t border-gray-200">
            <Text className="text-gray-600 font-psemibold">
              Vis kun aktive vagter
            </Text>
            <Pressable
              onPress={() => setOnlyActiveShifts(!onlyActiveShifts)}
              className={`w-6 h-6 flex items-center justify-center rounded ${
                onlyActiveShifts ? "bg-primary" : "bg-gray-200"
              }`}
            >
              {onlyActiveShifts && (
                <FontAwesome name="check" size={14} color="white" />
              )}
            </Pressable>
          </View>
        </View>

        {memoizedCalendar}

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
            <Text className="text-xl font-pbold mb-4">Vælg periode</Text>

            <View className="flex-row mb-4">
              <CustomButton
                title="Måned"
                handlePress={() => setIsCustomRange(false)}
                containerStyles={`flex-1 mr-2 ${
                  !isCustomRange ? "bg-primary" : "bg-gray-300"
                }`}
              />
              <CustomButton
                title="Periode"
                handlePress={() => setIsCustomRange(true)}
                containerStyles={`flex-1 ${
                  isCustomRange ? "bg-primary" : "bg-gray-300"
                }`}
              />
            </View>

            {!isCustomRange ? (
              <View className="flex-row space-x-2">
                <CustomDropdown
                  label="Måned"
                  value={getMonthName(customStartMonth)}
                  options={monthOptions}
                  onSelect={value => setCustomStartMonth(Number(value))}
                  isOpen={startMonthOpen}
                  setIsOpen={setStartMonthOpen}
                  containerStyles="mr-2"
                />
                <CustomDropdown
                  label="År"
                  value={customStartYear.toString()}
                  options={yearOptions}
                  onSelect={value => setCustomStartYear(Number(value))}
                  isOpen={startYearOpen}
                  setIsOpen={setStartYearOpen}
                />
              </View>
            ) : (
              <View>
                <Text className="text-gray-600 mb-2">Start periode</Text>
                <View className="flex-row space-x-2 mb-4">
                  <CustomDropdown
                    label="Måned"
                    value={getMonthName(customStartMonth)}
                    options={monthOptions}
                    onSelect={value => setCustomStartMonth(Number(value))}
                    isOpen={startMonthOpen}
                    setIsOpen={setStartMonthOpen}
                    containerStyles="mr-2"
                  />
                  <CustomDropdown
                    label="År"
                    value={customStartYear.toString()}
                    options={yearOptions}
                    onSelect={value => setCustomStartYear(Number(value))}
                    isOpen={startYearOpen}
                    setIsOpen={setStartYearOpen}
                  />
                </View>

                <Text className="text-gray-600 mb-2">Slut periode</Text>
                <View className="flex-row space-x-2">
                  <CustomDropdown
                    label="Måned"
                    value={getMonthName(customEndMonth)}
                    options={monthOptions}
                    onSelect={value => setCustomEndMonth(Number(value))}
                    isOpen={endMonthOpen}
                    setIsOpen={setEndMonthOpen}
                    containerStyles="mr-2"
                  />
                  <CustomDropdown
                    label="År"
                    value={customEndYear.toString()}
                    options={yearOptions}
                    onSelect={value => setCustomEndYear(Number(value))}
                    isOpen={endYearOpen}
                    setIsOpen={setEndYearOpen}
                  />
                </View>
              </View>
            )}

            <LoadingButton
              title="Vælg periode"
              handlePress={handleDateSelect}
              containerStyles="mt-4 mb-10"
              isLoading={loading}
            />
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
