import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  AlertButton,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import Toast from "react-native-toast-message";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Swipeable } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import CreateScheduleSheet from "../../../components/CreateScheduleSheet";
import { CustomInput } from "../../../components/CustomInput";
import LoadingButton from "@/components/LoadingButton";
import CustomButton from "@/components/CustomButton";
import { z } from "zod";
import { useSelector } from "react-redux";

interface Employee {
  id: number;
  name: string;
  position: string;
  salary_type: "HOURLY" | "FIXED";
  salary_rate: number;
  email: string;
}

interface User {
  id: number;
  email: string;
  name: string;
}

const createEmployeeSchema = z.object({
  name: z.string().min(1, "Navn er påkrævet"),
  position: z.string().min(1, "Stilling er påkrævet"),
  salaryType: z.enum(["HOURLY", "FIXED"]),
  salaryRate: z.number({
    required_error: "Løn er påkrævet",
    invalid_type_error: "Løn skal være et tal",
  }),
  email: z.string().email("Ugyldig email adresse"),
});

const updateEmployeeSchema = createEmployeeSchema.partial({ email: true });

export default function Employees() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [salaryType, setSalaryType] = useState<"HOURLY" | "FIXED">("HOURLY");
  const [salaryRate, setSalaryRate] = useState("");
  const [email, setEmail] = useState("");

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => [330], []);

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [userSearchQuery, setUserSearchQuery] = useState("");

  const createScheduleBottomSheetRef = useRef<BottomSheet>(null);

  const user = useSelector((state: any) => state.auth.user);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/employees", {
        withCredentials: true,
      });
      setEmployees(response.data);
      setFilteredEmployees(response.data);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Kunne ikke hente medarbejdere",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/users", {
        withCredentials: true,
      });
      setAvailableUsers(response.data);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Kunne ikke hente brugere",
      });
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAvailableUsers();
  }, []);

  useEffect(() => {
    const filtered = employees.filter(
      employee =>
        (employee.name?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (employee.email?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        )
    );
    setFilteredEmployees(filtered);
  }, [searchQuery, employees]);

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8080/api/employees/${id}`, {
        withCredentials: true,
      });
      fetchEmployees();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Medarbejder slettet",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Kunne ikke slette medarbejder",
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const formData = {
        name,
        position,
        salaryType,
        salaryRate: Number(salaryRate),
        email,
      };

      const validatedData = createEmployeeSchema.parse(formData);

      setIsSubmitting(true);
      await axios.post("http://localhost:8080/api/employees", validatedData, {
        withCredentials: true,
      });

      setName("");
      setPosition("");
      setSalaryType("HOURLY");
      setSalaryRate("");
      setEmail("");

      fetchEmployees();
      bottomSheetRef.current?.close();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Medarbejder oprettet",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => err.message).join("\n");
        Toast.show({
          type: "error",
          text1: "Validerings fejl",
          text2: errorMessages,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Kunne ikke oprette medarbejder",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingEmployee) return;

    try {
      const formData = {
        name,
        position,
        salaryType,
        salaryRate: Number(salaryRate),
        email: editingEmployee.email,
      };

      const validatedData = updateEmployeeSchema.parse(formData);

      setIsSubmitting(true);
      await axios.put(
        `http://localhost:8080/api/employees/${editingEmployee.id}`,
        validatedData,
        { withCredentials: true }
      );

      setEditingEmployee(null);
      setIsEditing(false);
      resetForm();
      fetchEmployees();
      bottomSheetRef.current?.close();

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Medarbejder opdateret",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => err.message).join("\n");
        Toast.show({
          type: "error",
          text1: "Validerings fejl",
          text2: errorMessages,
        });
      } else {
        console.log(error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Kunne ikke opdatere medarbejder",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setPosition("");
    setSalaryType("HOURLY");
    setSalaryRate("");
    setEmail("");
  };

  const renderRightActions = (id: number) => {
    return (
      <TouchableOpacity
        className="bg-red-500 justify-center px-4"
        onPress={() => {
          Alert.alert(
            "Slet medarbejder",
            "Er du sikker på at du vil slette denne medarbejder?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                onPress: () => handleDelete(id),
                style: "destructive",
              },
            ]
          );
        }}
      >
        <Text className="text-white">Delete</Text>
      </TouchableOpacity>
    );
  };

  const handleEmployeePress = (employee: Employee) => {
    const options: AlertButton[] = [
      {
        text: "Se vagtplan",
        onPress: () => router.push(`/employee-schedule/${employee.id}`),
      },
    ];

    if (user?.role !== "ACCOUNTANT") {
      options.push(
        {
          text: "Opret vagtplan",
          onPress: () => {
            setEditingEmployee(employee);
            bottomSheetRef.current?.close();
            createScheduleBottomSheetRef.current?.snapToIndex(1);
          },
        },
        {
          text: "Rediger medarbejder",
          onPress: () => {
            setEditingEmployee(employee);
            setName(employee.name);
            setPosition(employee.position);
            setSalaryType(employee.salary_type);
            setSalaryRate(employee.salary_rate.toString());
            setEmail(employee.email);
            setIsEditing(true);
            bottomSheetRef.current?.snapToIndex(1);
          },
        }
      );
    }

    options.push({
      text: "Cancel",
      style: "cancel",
    });

    Alert.alert(employee.name, "Vælg en handling", options);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Text className="text-2xl font-semibold text-primary font-psemibold my-4 text-center">
        Medarbejdere
      </Text>
      <View className="flex-1 bg-gray-50">
        <View className="p-4 border-b border-gray-200">
          <CustomInput
            placeholder="Søg efter medarbejder..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView className="flex-1">
          {filteredEmployees.length === 0 ? (
            <View className="flex-1 justify-center items-center mt-10">
              <Text className="text-gray-500">Ingen medarbejdere fundet</Text>
            </View>
          ) : (
            filteredEmployees.map(employee => (
              <Swipeable
                key={employee.id}
                renderRightActions={() => renderRightActions(employee.id)}
              >
                <TouchableOpacity onPress={() => handleEmployeePress(employee)}>
                  <View className="bg-white p-4 border-b border-gray-100">
                    <Text className="text-lg font-bold">{employee.name}</Text>
                    <Text className="text-gray-600">{employee.position}</Text>
                    <Text className="text-gray-500">{employee.email}</Text>
                    <Text className="text-gray-500">
                      <Text className="font-bold">
                        {employee.salary_type === "HOURLY"
                          ? "Timeløn"
                          : "Fast løn"}{" "}
                      </Text>
                      {employee.salary_rate} kr.
                    </Text>
                  </View>
                </TouchableOpacity>
              </Swipeable>
            ))
          )}
        </ScrollView>

        {user?.role === "ADMIN" && (
          <CustomButton
            title=""
            icon={<FontAwesome name="plus" size={24} color="white" />}
            handlePress={() => bottomSheetRef.current?.snapToIndex(1)}
            containerStyles="absolute bottom-5 right-5 w-14 h-14 !rounded-full"
            textStyles="text-center justify-center !mr-[-3px]"
          />
        )}

        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          enablePanDownToClose
          index={-1}
          style={{
            borderColor: "#CBD5E0",
            borderWidth: 1,
          }}
          handleIndicatorStyle={{
            backgroundColor: "#CBD5E0",
            width: 40,
          }}
        >
          <BottomSheetView className="flex-1 p-4">
            <Text className="text-xl font-bold mb-4">
              {isEditing ? "Rediger medarbejder" : "Opret ny medarbejder"}
            </Text>

            <CustomInput
              placeholder="Navn"
              value={name}
              onChangeText={setName}
            />

            <CustomInput
              placeholder="Jobtitel"
              value={position}
              onChangeText={setPosition}
            />

            <View className="flex-row mb-2">
              <View className="flex-1 mr-2">
                <CustomInput
                  placeholder="Løn"
                  value={salaryRate}
                  onChangeText={text => {
                    const numericValue = text.replace(/[^0-9.]/g, "");
                    setSalaryRate(numericValue);
                  }}
                  keyboardType="numeric"
                  className="h-[40px] justify-center"
                />
              </View>

              <View className="flex-row flex-1">
                <CustomButton
                  title="Timeløn"
                  variant={salaryType === "HOURLY" ? "primary" : "outlined"}
                  handlePress={() => setSalaryType("HOURLY")}
                  containerStyles="flex-1 mr-1 max-h-[40px]"
                  fontSize="text-sm"
                />

                <CustomButton
                  title="Fast løn"
                  variant={salaryType === "FIXED" ? "primary" : "outlined"}
                  handlePress={() => setSalaryType("FIXED")}
                  containerStyles="flex-1 ml-1 max-h-[40px]"
                  fontSize="text-sm"
                />
              </View>
            </View>

            {!isEditing && (
              <View className="border border-gray-200 rounded-lg p-2 mb-4">
                <Text className="text-gray-600 mb-2">Søg email</Text>
                <CustomInput
                  placeholder="Søg efter email eller navn..."
                  value={userSearchQuery}
                  onChangeText={setUserSearchQuery}
                />
                <ScrollView className="max-h-24">
                  {availableUsers
                    .filter(
                      user =>
                        (!employees.some(emp => emp.email === user.email) ||
                          user.email === email) &&
                        (user.email
                          .toLowerCase()
                          .includes(userSearchQuery.toLowerCase()) ||
                          user.name
                            .toLowerCase()
                            .includes(userSearchQuery.toLowerCase()))
                    )
                    .map(user => (
                      <TouchableOpacity
                        key={user.id}
                        className={`p-2 rounded ${
                          email === user.email ? "bg-blue-100" : ""
                        }`}
                        onPress={() => {
                          setEmail(user.email);
                          setName(user.name);
                        }}
                      >
                        <Text>
                          {user.email} - {user.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}

            <LoadingButton
              title={
                isSubmitting
                  ? "Vent venligst..."
                  : isEditing
                  ? "Opdater medarbejder"
                  : "Opret medarbejder"
              }
              handlePress={isEditing ? handleUpdate : handleSubmit}
              isLoading={isSubmitting}
            />
          </BottomSheetView>
        </BottomSheet>

        <CreateScheduleSheet
          bottomSheetRef={createScheduleBottomSheetRef}
          employeeId={editingEmployee?.id ?? 0}
          onSuccess={() => {
            Toast.show({
              type: "success",
              text1: "Success",
              text2: "Vagtplan oprettet",
            });
            setEditingEmployee(null);
          }}
        />
      </View>
    </GestureHandlerRootView>
  );
}
