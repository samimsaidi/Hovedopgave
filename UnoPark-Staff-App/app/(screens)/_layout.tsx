import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import {
  HouseSimple,
  ChalkboardTeacher,
  CalendarBlank,
  GearSix,
} from "phosphor-react-native";

export default function RootLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#34b5cd",
          tabBarStyle: {
            backgroundColor: "#f9fafb",
            paddingTop: 4,
          },
          tabBarLabelStyle: {
            marginTop: 2,
            fontSize: 10,
            fontWeight: "bold",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Hjem",
            tabBarIcon: ({ color }) => <HouseSimple size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: "Opslagstavle",
            tabBarIcon: ({ color }) => (
              <ChalkboardTeacher size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: "Vagtplan",
            tabBarIcon: ({ color }) => (
              <CalendarBlank size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(settings)"
          options={{
            title: "Indstillinger",
            tabBarIcon: ({ color }) => <GearSix size={28} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
