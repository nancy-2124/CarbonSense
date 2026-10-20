import api from "./client";
import * as demo from "./sampleData";

// Calls the API. If the server is unreachable, falls back to sample data (demo: true).
// A 400/422 is a validation error and is shown to the user.
async function call(request, fallback) {
  try {
    const res = await request();
    return { data: res.data, demo: false };
  } catch (err) {
    const status = err.response?.status;
    if (status === 400 || status === 422) {
      const d = err.response.data;
      throw new Error(d?.error || (typeof d?.detail === "string" ? d.detail : "The server rejected these inputs."), {cause: err});
    }
    console.warn("API call failed, using sample data:", err.response?.status ?? err.message);
    return { data: fallback(), demo: true };
  }
}

export const COUNTRIES = demo.countries;
export const COUNTRY_NAMES = demo.countryNames;
export const getSummary = () =>
  call(() => api.get("/emissions/summary"), () => demo.summary());

export const getAnalysis = (country) =>
  call(() => api.get("/emissions/analysis", { params: { country } }), () => demo.series(country));

export const getPrediction = (inputs) =>
  call(() => api.post("/predict", inputs), () => {
    const mt = ((inputs.population * inputs.energy) / 1000) * (inputs.fossil / 100) * 3.0;
    return { co2: Math.round(mt), metrics: null };
  });

export const getForecast = ({ country, horizon, model }) =>
  call(() => api.get("/forecast", { params: { country, horizon, model } }), () => demo.forecast(country, horizon));

export const getScenario = ({ country, renewable }) =>
  call(() => api.post("/scenario", { country, renewable }), () => demo.scenario(country, renewable));

export function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => r[k]).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}