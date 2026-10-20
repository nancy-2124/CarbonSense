import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { getAnalysis, COUNTRIES } from "../api";
import { Page, Card, Loading, ErrorMsg, Field, CountrySelect } from "../Components/UI";

const X_OPTIONS = {
  year: "Year", gdp: "GDP (USD bn)", energy: "Energy use (kg oil eq. per capita)", renewable: "Renewable energy (%)",
};

function correlation(rows, key) {
  const n = rows.length;
  if (n < 3) return null;
  const xs = rows.map((r) => r[key]), ys = rows.map((r) => r.co2);
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; syy += (ys[i] - my) ** 2; });
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

export default function Analysis() {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [xKey, setXKey] = useState("year");
  const [from, setFrom] = useState(1990);
  const [to, setTo] = useState(2024);
  const [rows, setRows] = useState(null);
  const [demo, setDemo] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    getAnalysis(country).then((r) => { setRows(r.data); setDemo(r.demo); }).catch((e) => setErr(e.message));
  }, [country]);

  const filtered = useMemo(() => (rows || []).filter((r) => r.year >= from && r.year <= to), [rows, from, to]);
  const r = filtered.length ? correlation(filtered, xKey) : null;
  const rangeError = from > to ? "“From” year must not be after “To” year." : "";

  return (
    <Page title="Emission Analysis" subtitle="How CO₂ relates to time, GDP, energy use and renewable share" demo={demo}>
      <Card>
        <div className="filters">
          <Field label="Country"><CountrySelect value={country} onChange={setCountry} options={COUNTRIES} /></Field>
          <Field label="Compare CO₂ against">
            <select value={xKey} onChange={(e) => setXKey(e.target.value)}>
              {Object.entries(X_OPTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="From year"><input type="number" min="1990" max="2024" value={from} onChange={(e) => setFrom(+e.target.value)} /></Field>
          <Field label="To year" error={rangeError}><input type="number" min="1990" max="2024" value={to} onChange={(e) => setTo(+e.target.value)} /></Field>
        </div>
      </Card>

      <ErrorMsg>{err}</ErrorMsg>
      {!rows && !err ? <Loading /> : rows && (
        <Card title={`CO₂ (Mt) vs ${X_OPTIONS[xKey]}`}>
          {r !== null && xKey !== "year" && (
            <p className="note">Correlation (r) over {filtered.length} years: <strong>{r.toFixed(2)}</strong></p>
          )}
          <ResponsiveContainer width="100%" height={340}>
            {xKey === "year" ? (
              <LineChart data={filtered}>
                <CartesianGrid stroke="#e2e8f0" /><XAxis dataKey="year" /><YAxis /><Tooltip />
                <Line type="monotone" dataKey="co2" name="CO₂ (Mt)" stroke="#1e293b" strokeWidth={2} dot={false} />
              </LineChart>
            ) : (
              <ScatterChart>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis type="number" dataKey={xKey} name={X_OPTIONS[xKey]} domain={["auto", "auto"]} />
                <YAxis type="number" dataKey="co2" name="CO₂ (Mt)" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={filtered} fill="#15803d" />
              </ScatterChart>
            )}
          </ResponsiveContainer>
        </Card>
      )}
    </Page>
  );
}
