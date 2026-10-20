import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { getSummary, COUNTRY_NAMES } from "../api";
import { Page, Kpi, Card, Loading, ErrorMsg } from "../Components/UI";

const fmt = (n) => Number(n).toLocaleString();

export default function Dashboard() {

  const [s, setS] = useState(null);
  const [demo, setDemo] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    getSummary().then((r) => { setS(r.data); setDemo(r.demo); }).catch((e) => setErr(e.message));
  }, []);

  if (err) return <Page title="Dashboard"><ErrorMsg>{err}</ErrorMsg></Page>;
  if (!s) return <Page title="Dashboard"><Loading /></Page>;

  return (
    <Page title="Dashboard" subtitle={`CO₂ emissions overview, latest year ${s.latestYear}`} demo={demo}>
      <div className="kpi-row">
        <Kpi label="Total CO₂" value={fmt(s.totalCo2)} unit="Mt" />
        <Kpi label="Average per country" value={fmt(s.avgCo2)} unit="Mt" />
        <Kpi label="Renewable share (avg)" value={s.renewableShare} unit="%" />
        <Kpi label="Countries covered" value={s.countryCount} />
      </div>

      <div className="grid-2">
        <Card title="Total CO₂ emissions over time (Mt)">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={s.trend}>
              <CartesianGrid stroke="#e2e8f0" /><XAxis dataKey="year" /><YAxis /><Tooltip />
              <Line type="monotone" dataKey="co2" name="CO₂ (Mt)" stroke="#1e293b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title={`CO₂ by country, ${s.latestYear} (Mt)`}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={s.countries}>
              <CartesianGrid stroke="#e2e8f0" /><XAxis dataKey="country" tickFormatter={(c) => COUNTRY_NAMES[c] || c} /><YAxis /><Tooltip />
              <Bar dataKey="co2" name="CO₂ (Mt)" fill="#1e293b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Country-wise data">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Country</th><th>CO₂ (Mt)</th><th>GDP (USD bn)</th><th>Renewable (%)</th></tr></thead>
            <tbody>
              {s.countries.map((c) => (
                <tr key={c.country}><td>{COUNTRY_NAMES[c.country] || c.country}</td><td>{fmt(c.co2)}</td><td>{fmt(c.gdp)}</td><td>{c.renewable}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Page>
  );
}
