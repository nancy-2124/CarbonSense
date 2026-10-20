import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  return (
    <section className="hero">
      <h1>Carbon Emission Prediction</h1>
      <p>Data Analytics, Carbon Emission Prediction and Sustainability Modeling Framework</p>
      <button className="btn" onClick={() => navigate("/dashboard")}>Explore Dashboard</button>
    </section>
  );
}
