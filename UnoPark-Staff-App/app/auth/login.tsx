import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { loginUser } from "../../api/apiClient";
import { useDispatch, useSelector } from "react-redux";
import { loginAction } from "../(redux)/authSlice";
import LoadingButton from "@/components/LoadingButton";
import { images } from "@/constants";
import Toast from "react-native-toast-message";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import axios from "axios";
import { CustomInput } from "../../components/CustomInput";
import { Icon } from "react-native-vector-icons/Icon";
import { WarningCircle } from "phosphor-react-native";

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Ugyldig email")
    .required("Indtast venligst en email"),

  password: Yup.string().required("Indtast venligst en adgangskode"),
});

const PasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/^[A-Z]/, "Password must start with capital letter")
    .matches(/\d/, "Password must contain at least one number")
    .matches(/[!@#$%^&*]/, "Password must contain at least one symbol")
    .required("Required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Required"),
});

export default function Login() {
  const router = useRouter();

  const dispatch = useDispatch();
  const mutation = useMutation({
    mutationFn: loginUser,
    mutationKey: ["login"],
  });
  const user = useSelector((state: any) => state.auth.user);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => [300], []);

  useEffect(() => {
    if (user) {
      router.push("/(screens)");
    }
  }, []);

  const handlePasswordChange = async (values: { password: string }) => {
    try {
      await axios.post(
        "http://localhost:8080/api/users/change-password",
        { password: values.password },
        { withCredentials: true }
      );
      setShowPasswordChange(false);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Ny adgangskode sat",
      });
      router.push("/(screens)");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Fejl",
        text2: "Kunne ikke ændre adgangskode",
      });
    }
  };

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      const data = await mutation.mutateAsync(values);

      if (data.requirePasswordChange) {
        dispatch(loginAction(data));
        setShowPasswordChange(true);
        bottomSheetRef.current?.snapToIndex(0);
      } else {
        dispatch(loginAction(data));
        Toast.show({
          type: "success",
          text1: "Logind success",
          text2: "Velkommen tilbage, " + data.name,
        });
        router.push("/(screens)");
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Login fejlede",
        text2: "Ugyldig email eller adgangskode",
      });
    }
  };

  return (
    <SafeAreaView className="h-full bg-[#f9fafb]">
      <ScrollView>
        <View
          className="w-full flex justify-center h-full px-4 my-6"
          style={{
            minHeight: Dimensions.get("window").height - 100,
          }}
        >
          <Image
            source={images.logo}
            resizeMode="contain"
            className="w-[140px] h-[70px]"
          />
          <Text className="text-3xl font-semibold text-primary font-psemibold my-4">
            Login
          </Text>
          <Formik
            initialValues={{
              email: "janedoe@unopark.dk",
              password: "test123",
            }}
            validationSchema={LoginSchema}
            onSubmit={handleLogin}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
            }) => (
              <View className="w-full">
                <TextInput
                  className="h-[50px] border border-gray-300 rounded-lg px-4 mb-2 bg-white"
                  placeholder="Email"
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  value={values.email}
                  keyboardType="email-address"
                />
                {errors.email && touched.email ? (
                  <View className="flex-row items-center bg-red-200 border border-red-500 px-2 py-3 mb-2 rounded-lg">
                    <WarningCircle
                      size={20}
                      color="red"
                      style={{ marginRight: 2 }}
                    />
                    <Text className="text-red-500">{errors.email}</Text>
                  </View>
                ) : null}
                <TextInput
                  className="h-[50px] border border-gray-300 rounded-lg px-4 mb-2 bg-white"
                  placeholder="Adgangskode"
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  value={values.password}
                  secureTextEntry
                />
                {errors.password && touched.password ? (
                  <View className="flex-row items-center bg-red-200 border border-red-500 px-2 py-3 mb-2 rounded-lg">
                    <WarningCircle
                      size={20}
                      color="red"
                      style={{ marginRight: 2 }}
                    />
                    <Text className="text-red-500">{errors.password}</Text>
                  </View>
                ) : null}
                <LoadingButton
                  title="Login"
                  handlePress={() => handleSubmit()}
                  containerStyles="w-full mt-10"
                  isLoading={mutation.isPending}
                />
              </View>
            )}
          </Formik>
        </View>
      </ScrollView>

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        index={showPasswordChange ? 0 : -1}
        style={{
          borderColor: "#CBD5E0",
          borderWidth: 1,
        }}
      >
        <BottomSheetView className="flex-1 p-4">
          <Text className="text-xl font-pbold mb-4">Set ny adgangskode</Text>
          <Formik
            initialValues={{
              password: "",
              confirmPassword: "",
            }}
            validationSchema={PasswordSchema}
            onSubmit={handlePasswordChange}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
            }) => (
              <View>
                <CustomInput
                  placeholder="Ny adgangskode"
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  value={values.password}
                  secureTextEntry
                  error={touched.password && Boolean(errors.password)}
                />

                <CustomInput
                  placeholder="Bekræft adgangskode"
                  onChangeText={handleChange("confirmPassword")}
                  onBlur={handleBlur("confirmPassword")}
                  value={values.confirmPassword}
                  secureTextEntry
                  error={
                    touched.confirmPassword && Boolean(errors.confirmPassword)
                  }
                />

                <LoadingButton
                  title="Set ny adgangskode"
                  handlePress={() => handleSubmit()}
                  isLoading={false}
                  containerStyles="mb-4"
                />
              </View>
            )}
          </Formik>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
}
