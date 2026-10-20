import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import Analysis from "./Pages/Analysis";
import Prediction from "./Pages/Prediction";
import Forecasting from "./Pages/Forecasting";
import Sustainability from "./Pages/Sustainability";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/prediction" element={<Prediction />} />
        <Route path="/forecasting" element={<Forecasting />} />
        <Route path="/sustainability" element={<Sustainability />} />
      </Routes>
    </BrowserRouter>
  );
}
