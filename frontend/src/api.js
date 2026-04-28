import axios from "axios";
import { clearStudentSession, hasValidStudentSession } from "./auth";

const API_BASE_URL = "http://localhost:5001";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers["Authorization"];
    clearStudentSession();
  }
};

if (hasValidStudentSession()) {
  const savedToken = localStorage.getItem("token");
  setAuthToken(savedToken);
} else {
  clearStudentSession();
}

export default apiClient;
