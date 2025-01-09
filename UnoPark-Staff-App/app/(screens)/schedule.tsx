import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { View, Text, StyleSheet } from "react-native";
import { Calendar, CalendarEvent } from "react-native-big-calendar";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  differenceInHours,
  differenceInMinutes,
  format,
  formatDistanceToNow,
} from "date-fns";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { da } from "date-fns/locale";

interface Schedule {
  id: number;
  employee_id: number;
  start_time: string;
  end_time: string;
  employee_name: string;
  employee_position: string;
  route_name: string;
  schedule_type: "ADMIN" | "SHIFT";
}

interface CalendarEventType {
  title: string;
  start: Date;
  end: Date;
  children?: React.ReactElement | null;
  route?: string;
  schedule_type: "ADMIN" | "SHIFT";
}

interface SelectedSchedule {
  title: string;
  start: Date;
  end: Date;
  position?: string;
  route?: string;
  schedule_type: "ADMIN" | "SHIFT";
}

export default function Schedule() {
  const { user } = useSelector((state: any) => state.auth);
  const [schedules, setSchedules] = useState<CalendarEventType[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] =
    useState<SelectedSchedule | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => [330], []);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const fetchAllSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get(
        `http://localhost:8080/api/schedules/me`,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const formattedEvents = response.data
        .map((schedule: Schedule) => {
          const startDate = new Date(schedule.start_time);
          const endDate = new Date(schedule.end_time);

          const eventDetails = (
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
          );

          return {
            title: schedule.employee_name,
            start: startDate,
            end: endDate,
            children: eventDetails,
            schedule_type: schedule.schedule_type,
            route: schedule.route_name,
          };
        })
        .filter(Boolean);

      setSchedules(formattedEvents);
    } catch (error: any) {
      console.error("Error details:", error.response || error);
      if (error.response?.status === 401) {
        setError("Du skal være logget ind for at se din vagtplan");
      } else {
        setError("Kunne ikke hente vagtplanen");
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === "USER") {
      fetchAllSchedules();
    } else {
      setError("Kun medarbejdere kan se deres vagtplan");
      setIsLoading(false);
    }
  }, [user, fetchAllSchedules]);

  const handleDateChange = useCallback((date: Date | Date[]) => {
    const newDate = Array.isArray(date) ? date[0] : date;
    setCurrentDate(newDate);
  }, []);

  const handleEventPress = useCallback((event: CalendarEventType) => {
    setSelectedSchedule({
      title: event.title,
      start: event.start,
      end: event.end,
      position: event.children?.props.children[0]?.props.children || "",
      route: event.route,
      schedule_type: event.schedule_type,
    });

    if (bottomSheetRef.current) {
      bottomSheetRef.current.snapToIndex(0);
    }
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    setIsBottomSheetOpen(index >= 0);
  }, []);

  const memoizedCalendar = useMemo(
    () => (
      <View className="flex-1 bg-[#f9fafb]">
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
            scrollOffsetMinutes={420}
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

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f9fafb]">
        <Text className="text-red-500 text-base">{error}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {memoizedCalendar}

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          enablePanDownToClose
        >
          <BottomSheetView
            className="flex-1 px-4 pt-2 pb-6"
            style={{ minHeight: 400 }}
          >
            <Text className="text-2xl font-psemibold text-gray-800 mb-6">
              Vagtplan - Detaljer
            </Text>

            {selectedSchedule ? (
              <View className="space-y-4">
                <View className=" p-2">
                  <Text className="font-pregular text-gray-500 mb-1">
                    Medarbejder
                  </Text>
                  <Text className="text-lg font-psemibold text-gray-800">
                    {selectedSchedule.title} ({selectedSchedule.position})
                  </Text>
                </View>

                <View className=" p-2">
                  <Text className="text-sm text-gray-500 mb-1">Tidspunkt</Text>
                  <Text className="text-lg font-psemibold text-gray-800">
                    {format(selectedSchedule.start, "d. MMMM yyyy", {
                      locale: da,
                    })}
                  </Text>
                  <Text className="text-lg font-pmedium text-gray-800">
                    {format(selectedSchedule.start, "HH:mm")} -{" "}
                    {format(selectedSchedule.end, "HH:mm")} (
                    {differenceInHours(
                      selectedSchedule.end,
                      selectedSchedule.start
                    )}
                    t{" "}
                    {differenceInMinutes(
                      selectedSchedule.end,
                      selectedSchedule.start
                    ) % 60}
                    m)
                  </Text>
                  <Text className="font-pregular text-gray-500 mb-1">
                    {formatDistanceToNow(new Date(selectedSchedule.start), {
                      addSuffix: true,
                      locale: da,
                    })}
                  </Text>
                </View>

                {selectedSchedule.route && (
                  <View className=" p-2">
                    <Text className="font-pregular text-gray-500 mb-1">
                      Rute
                    </Text>
                    <Text className="text-lg font-psemibold text-gray-800">
                      {selectedSchedule.route}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text className="text-gray-500 text-center">
                Ingen vagt valgt
              </Text>
            )}
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
