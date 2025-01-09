import { SafeAreaView } from "react-native-safe-area-context";
import queryClient from "../api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import store from "./(redux)/store";
import { useFonts } from "expo-font";
import { Provider } from "react-redux";
import { SplashScreen } from "expo-router";
import AppWrapper from "./(redux)/AppWrapper";
import "../global.css";
import { useEffect } from "react";
import Toast, { BaseToast, ToastProps } from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const toastConfig = {
  success: (props: ToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#4CAF50", marginTop: 30 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: "500" }}
    />
  ),
  error: (props: ToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#FF5252", marginTop: 30 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: "500" }}
    />
  ),
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
  });

  useEffect(() => {
    if (error) throw error;

    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded) {
    return null;
  }

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        className="flex-1"
        edges={["top"]}
        style={{ backgroundColor: "#f9fafb" }}
      >
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <AppWrapper />
            <Toast config={toastConfig} />
          </QueryClientProvider>
        </Provider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
