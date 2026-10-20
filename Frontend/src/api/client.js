import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 15000,
});

// export const getHistorical = () => api.get("/emissions/historical");
// export const predictEmissions = (payload) => api.post("/predict", payload);
// export const runScenario = (payload) => api.post("/scenario", payload);

export default api;