import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

import { Stack } from "expo-router/stack";
import { loadUser } from "./authSlice";
import { StatusBar } from "expo-status-bar";

function AppWrapper() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="index"
          options={{ title: "Home", headerShown: false }}
        />
        <Stack.Screen
          name="feed"
          options={{ title: "Feed", headerShown: false }}
        />
        <Stack.Screen
          name="auth/login"
          options={{ title: "Login", headerShown: false }}
        />
      </Stack>
      <StatusBar backgroundColor="#ffffff" style="dark" />
    </>
  );
}

export default AppWrapper;
