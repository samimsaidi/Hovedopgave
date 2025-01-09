import axios from "axios";

interface User {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  id: number;
  email: string;
  name: string;
  role: string;
  requirePasswordChange: boolean;
}

export const registerUser = async (user: User) => {
  const response = await axios.post(
    "http://localhost:8080/api/register",
    user,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

export const loginUser = async (credentials: {
  email: string;
  password: string;
}): Promise<LoginResponse> => {
  const response = await axios.post(
    "http://localhost:8080/api/login",
    credentials,
    {
      withCredentials: true,
    }
  );
  return response.data;
};
