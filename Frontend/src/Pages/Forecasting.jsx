import { useState } from "react";
import { ComposedChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import { getForecast, COUNTRIES } from "../api";
import { Page, Card, Loading, ErrorMsg, Field, CountrySelect } from "../Components/UI";

export default function Forecasting() {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [horizon, setHorizon] = useState(10);
  const [model, setModel] = useState("ARIMA");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [demo, setDemo] = useState(false);
  const [err, setErr] = useState("");

  const run = async (e) => {
    e.preventDefault();
    if (!(horizon >= 1 && horizon <= 15)) { setErr("Horizon must be between 1 and 15 years."); return; }
    setErr(""); setLoading(true);
    try {
      const r = await getForecast({ country, horizon, model });
      const { history, forecast } = r.data;
      const merged = history.map((h, i) => ({
        year: h.year,
        history: h.co2,
        // last historical point also starts the forecast line so the two lines join
        ...(i === history.length - 1 ? { forecast: h.co2 } : {}),
      }));
      forecast.forEach((f) => merged.push({ year: f.year, forecast: f.co2, lower: f.lower, upper: f.upper }));
      setData({ merged, forecast }); setDemo(r.demo);
    } catch (e2) { setErr(e2.message); setData(null); }
    finally { setLoading(false); }
  };

  return (
    <Page title="CO₂ Forecasting" subtitle="Time-series forecast (ARIMA / SARIMA) shown alongside historical emissions" demo={demo}>
      <Card>
        <form onSubmit={run} className="filters" noValidate>
          <Field label="Country"><CountrySelect value={country} onChange={setCountry} options={COUNTRIES} /></Field>
          <Field label="Horizon (years)"><input type="number" min="1" max="15" value={horizon} onChange={(e) => setHorizon(+e.target.value)} /></Field>
          <Field label="Model">
            <select value={model} onChange={(e) => setModel(e.target.value)}><option>ARIMA</option><option>SARIMA</option></select>
          </Field>
          <div className="actions"><button className="btn" type="submit" disabled={loading}>Run forecast</button></div>
        </form>
      </Card>

      <ErrorMsg>{err}</ErrorMsg>
      {loading && <Loading />}
      {!loading && !data && !err && <p className="note">Choose a country and horizon, then select Run forecast.</p>}
      {!loading && data && (
        <>
          <Card title={`${country}: CO₂ history and ${model} forecast (Mt)`}>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={data.merged}>
                <CartesianGrid stroke="#e2e8f0" /><XAxis dataKey="year" /><YAxis /><Tooltip /><Legend />
                <Line dataKey="history" name="History" stroke="#1e293b" strokeWidth={2} dot={false} connectNulls />
                <Line dataKey="forecast" name="Forecast" stroke="#d97706" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls />
                <Line dataKey="upper" name="Upper bound" stroke="#d97706" strokeOpacity={0.4} dot={false} legendType="none" />
                <Line dataKey="lower" name="Lower bound" stroke="#d97706" strokeOpacity={0.4} dot={false} legendType="none" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Forecast values">
            <div className="table-wrap"><table>
              <thead><tr><th>Year</th><th>Forecast (Mt)</th><th>Lower</th><th>Upper</th></tr></thead>
              <tbody>{data.forecast.map((f) => (
                <tr key={f.year}><td>{f.year}</td><td>{f.co2.toLocaleString(undefined, {maximumFractionDigits:1})}</td><td>{f.lower?.toLocaleString(undefined, {maximumFractionDigits:1}) ?? "–"}</td><td>{f.upper?.toLocaleString(undefined, {maximumFractionDigits:1}) ?? "–"}</td></tr>
              ))}</tbody>
            </table></div>
          </Card>
        </>
      )}
    </Page>
  );
}
