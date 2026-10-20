import { useState } from "react";
import { getPrediction } from "../api";
import { Page, Card, Loading, ErrorMsg, Field } from "../Components/UI";

const FIELDS = [
  { key: "gdp", label: "GDP (USD bn)" },
  { key: "population", label: "Population (millions)" },
  { key: "energy", label: "Energy use (kg oil eq. per capita)" },
  { key: "fossil", label: "Fossil fuel share (%)", percent: true },
  { key: "renewable", label: "Renewable energy share (%)", percent: true },
];
const empty = Object.fromEntries(FIELDS.map((f) => [f.key, ""]));

function validate(values) {
  const errors = {};
  FIELDS.forEach(({ key, percent }) => {
    const v = values[key];
    if (v === "" || isNaN(Number(v))) errors[key] = "Enter a number.";
    else if (Number(v) < 0) errors[key] = "Must be 0 or more.";
    else if (percent && Number(v) > 100) errors[key] = "Must be between 0 and 100.";
  });
  return errors;
}

export default function Prediction() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [demo, setDemo] = useState(false);
  const [apiErr, setApiErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found); setApiErr("");
    if (Object.keys(found).length) return;
    setLoading(true);
    try {
      const payload = Object.fromEntries(FIELDS.map((f) => [f.key, Number(values[f.key])]));
      const r = await getPrediction(payload);
      setResult(r.data); setDemo(r.demo);
    } catch (err) { setApiErr(err.message); setResult(null); }
    finally { setLoading(false); }
  };

  const m = result?.metrics;
  const metric = (k) => (m && m[k] != null ? Number(m[k]).toFixed(4) : "n/a");

  return (
    <Page title="CO₂ Prediction" subtitle="Enter country-level indicators to estimate annual CO₂ emissions" demo={demo}>
      <div className="grid-2">
        <Card title="Inputs">
          <form onSubmit={submit} noValidate className="stack">
            {FIELDS.map((f) => (
              <Field key={f.key} label={f.label} error={errors[f.key]}>
                <input type="number" step="any" value={values[f.key]}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              </Field>
            ))}
            <div className="actions">
              <button className="btn" type="submit" disabled={loading}>Predict CO₂</button>
              <button className="btn btn-ghost" type="button" onClick={() => { setValues(empty); setErrors({}); setResult(null); setApiErr(""); }}>Clear</button>
            </div>
          </form>
        </Card>

        <Card title="Result">
          <ErrorMsg>{apiErr}</ErrorMsg>
          {loading && <Loading />}
          {!loading && !result && !apiErr && <p className="note">Fill in all five fields and select Predict CO₂.</p>}
          {!loading && result && (
            <>
              <div className="big-number">{Number(result.co2).toLocaleString(undefined, {maximumFractionDigits:1})}<small> Mt CO₂ per year</small></div>
              <h3>Model performance (held-out test data)</h3>
              <div className="metrics">
                {["mae", "mse", "rmse", "r2"].map((k) => (
                  <div key={k}><span>{k === "r2" ? "R²" : k.toUpperCase()}</span><strong>{metric(k)}</strong></div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </Page>
  );
}
