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
} from "react-native";
import { useSelector } from "react-redux";
import { FontAwesome } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import Toast from "react-native-toast-message";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { da } from "date-fns/locale";
import { CustomInput } from "../../components/CustomInput";
import LoadingButton from "@/components/LoadingButton";
import CustomButton from "@/components/CustomButton";

interface FeedPost {
  id: number;
  title: string;
  content: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  author_name: string;
}

export default function Feed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useSelector((state: any) => state.auth.user);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["25%", "50%"], []);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const fetchPosts = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/feed", {
        withCredentials: true,
      });
      setPosts(response.data);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Fejl",
        text2: "Kunne ikke indlæse opslagstavle",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: number) => {
    Alert.alert(
      "Slet opslag",
      "Er du sikker på at du vil slette dette opslag?",
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
              await axios.delete(`http://localhost:8080/api/feed/${id}`, {
                withCredentials: true,
              });
              fetchPosts();
              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Opslag slettet",
              });
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Fejl",
                text2: "Kunne ikke slette opslag",
              });
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      Toast.show({
        type: "error",
        text1: "Fejl",
        text2: "Udfyld venligst alle felter",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        "http://localhost:8080/api/feed",
        { title, content },
        { withCredentials: true }
      );
      setTitle("");
      setContent("");
      fetchPosts();
      bottomSheetRef.current?.close();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Opslag oprettet",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Fejl",
        text2: "Kunne ikke oprette opslag",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSheetChanges = useCallback((index: number) => {
    setIsBottomSheetOpen(index >= 0);
  }, []);

  const openCreatePost = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-gray-50">
        <ScrollView className="flex-1 p-4">
          <Text className="text-2xl font-semibold text-primary font-psemibold my-4 text-center">
            Opslagstavle
          </Text>

          {posts.length === 0 ? (
            <View className="flex-1 items-center justify-center py-8">
              <Text className="text-gray-500 text-lg">Ingen opslag endnu</Text>
            </View>
          ) : (
            posts.map(post => (
              <View
                key={post.id}
                className="bg-white p-4 rounded-lg border border-gray-200 mb-4"
              >
                <View className="flex-row justify-between items-start">
                  <Text className="text-lg font-bold flex-1">{post.title}</Text>
                  {user?.role === "ADMIN" && (
                    <TouchableOpacity
                      onPress={() => handleDelete(post.id)}
                      className="ml-2"
                    >
                      <FontAwesome name="trash" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text className="text-gray-600 my-2">{post.content}</Text>
                <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100">
                  <Text className="text-sm text-gray-500">
                    {post.author_name}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                      locale: da,
                    })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {user?.role === "ADMIN" && (
          <CustomButton
            title=""
            icon={<FontAwesome name="plus" size={24} color="white" />}
            handlePress={openCreatePost}
            containerStyles="absolute bottom-5 right-5 w-14 h-14 !rounded-full"
            textStyles="text-center justify-center !mr-[-3px]"
          />
        )}

        {user?.role === "ADMIN" && (
          <BottomSheet
            ref={bottomSheetRef}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            enablePanDownToClose
            index={-1}
          >
            <BottomSheetView className="flex-1 p-4">
              <Text className="text-lg font-bold mb-2">Opret nyt opslag</Text>
              <CustomInput
                placeholder="Titel"
                value={title}
                onChangeText={setTitle}
              />
              <CustomInput
                placeholder="Indhold"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={4}
                height={100}
              />
              <LoadingButton
                title={isSubmitting ? "Opretter..." : "Opret"}
                handlePress={handleSubmit}
                containerStyles="w-full mt-2"
                isLoading={isSubmitting}
              />
            </BottomSheetView>
          </BottomSheet>
        )}
      </View>
    </GestureHandlerRootView>
  );
}
