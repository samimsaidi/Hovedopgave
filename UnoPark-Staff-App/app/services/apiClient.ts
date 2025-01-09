import axios from "axios";

const apiClient = {
  loginUser: async (user: any) => {
    const response = await axios.post("http://localhost:8080/api/login", user, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  },

  logoutUser: async () => {
    const response = await axios.post("http://localhost:8080/api/logout", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  },
};

export default apiClient;
