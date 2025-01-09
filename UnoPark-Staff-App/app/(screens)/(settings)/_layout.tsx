import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerTitle: "",
        headerTintColor: "#34b5cd",
        headerBackTitle: "Tilbage",
        headerStyle: {
          backgroundColor: "transparent",
        },
        contentStyle: {
          backgroundColor: "#f9fafb",
          paddingTop: 40,
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="employees" />
      <Stack.Screen name="employee-schedule/[id]" />
    </Stack>
  );
}
