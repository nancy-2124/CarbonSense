import { COUNTRY_NAMES } from "../api";

export function Page({ title, subtitle, demo, children }) {
  return (
    <main className="page">
      <header className="page-head">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </header>
      {demo && (
        <div className="banner" role="status">
          Showing sample data. The API isn't reachable, so these numbers are placeholders, not model output.
        </div>
      )}
      {children}
    </main>
  );
}

export const Kpi = ({ label, value, unit }) => (
  <div className="kpi">
    <span className="kpi-label">{label}</span>
    <span className="kpi-value">{value}{unit && <small> {unit}</small>}</span>
  </div>
);

export const Card = ({ title, children }) => (
  <section className="card">{title && <h2>{title}</h2>}{children}</section>
);

export const Loading = () => <div className="loading"><span className="spinner" />Loading…</div>;

export const ErrorMsg = ({ children }) =>
  children ? <div className="error" role="alert">{children}</div> : null;

export const Field = ({ label, error, children }) => (
  <label className="field">
    <span>{label}</span>
    {children}
    {error && <em className="field-error">{error}</em>}
  </label>
);

export const CountrySelect = ({ value, onChange, options }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)}>
    {options.map((c) => <option key={c} value={c}>{COUNTRY_NAMES[c] ||c}({c})</option>)}
  </select>
);
