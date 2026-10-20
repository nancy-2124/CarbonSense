import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import { getScenario, downloadCsv, COUNTRIES } from "../api";
import { Page, Card, Loading, ErrorMsg, Field, CountrySelect } from "../Components/UI";

const SHARES = [20, 30, 40, 50];

export default function Sustainability() {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [share, setShare] = useState(30);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [demo, setDemo] = useState(false);
  const [err, setErr] = useState("");

  const run = async () => {
    setErr(""); setLoading(true);
    try {
      const r = await getScenario({ country, renewable: share });
      setData(r.data); setDemo(r.demo);
    } catch (e) { setErr(e.message); setData(null); }
    finally { setLoading(false); }
  };

  const last = data?.rows[data.rows.length - 1];
  const pct = last ? ((last.difference / last.baseline) * 100).toFixed(1) : null;

  return (
    <Page title="Sustainability Scenarios" subtitle="Compare a baseline forecast with a higher renewable-energy share" demo={demo}>
      <Card>
        <div className="filters">
          <Field label="Country"><CountrySelect value={country} onChange={setCountry} options={COUNTRIES} /></Field>
          <Field label="Target renewable share">
            <div className="segmented" role="group" aria-label="Renewable share">
              {SHARES.map((s) => (
                <button key={s} type="button" className={s === share ? "on" : ""} aria-pressed={s === share} onClick={() => setShare(s)}>{s}%</button>
              ))}
            </div>
          </Field>
          <div className="actions"><button className="btn" onClick={run} disabled={loading}>Compare scenario</button></div>
        </div>
      </Card>

      <ErrorMsg>{err}</ErrorMsg>
      {loading && <Loading />}
      {!loading && !data && !err && <p className="note">Pick a country and renewable share, then select Compare scenario.</p>}
      {!loading && data && (
        <>
          <div className="assumption" role="note">
            These are model-based estimates under the stated renewable-share assumption, not guaranteed emission reductions.
          </div>
          <Card title={`${country}: baseline vs ${share}% renewable scenario (Mt CO₂)`}>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={data.rows}>
                <CartesianGrid stroke="#e2e8f0" /><XAxis dataKey="year" /><YAxis domain={["auto", "auto"]} /><Tooltip /><Legend />
                <Line dataKey="baseline" name="Baseline" stroke="#1e293b" strokeWidth={2} dot={false} />
                <Line dataKey="scenario" name={`${share}% renewable`} stroke="#15803d" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            {pct !== null && (Math.abs(last.difference) < 0.05
  ? <p className="note">The current renewable share is {data.currentRenewable}%, which is already at or above the {share}% target, so the scenario matches the baseline. Choose a higher target.</p>
  : <p className="note">By {last.year}, the scenario estimate is {Math.abs(pct)}% {pct <= 0 ? "below" : "above"} the baseline.</p>)}
          </Card>
          <Card title="Scenario vs baseline">
            <div className="table-wrap"><table>
              <thead><tr><th>Year</th><th>Baseline (Mt)</th><th>Scenario (Mt)</th><th>Difference (Mt)</th></tr></thead>
              <tbody>{data.rows.map((r) => (
                <tr key={r.year}><td>{r.year}</td><td>{r.baseline.toLocaleString(undefined, {maximumFractionDigits:1})}</td><td>{r.scenario.toLocaleString(undefined, {maximumFractionDigits:1})}</td><td>{r.difference.toLocaleString(undefined, {maximumFractionDigits:1})}</td></tr>
              ))}</tbody>
            </table></div>
            <div className="actions"><button className="btn btn-ghost" onClick={() => downloadCsv(`scenario_${country}_${share}pct.csv`, data.rows)}>Download CSV</button></div>
          </Card>
        </>
      )}
    </Page>
  );
}
