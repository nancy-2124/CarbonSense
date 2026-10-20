// Placeholder data used ONLY when the Python API is unreachable (demo mode).
const C = {
  IND: { co2: 600,  g: 0.05,   gdp: 320,  gg: 0.065, en: 330,  eg: 0.03,   re: 45, rd: -0.8 },
  CHN: { co2: 2400, g: 0.06,   gdp: 360,  gg: 0.09,  en: 760,  eg: 0.045,  re: 30, rd: -0.5 },
  USA: { co2: 5000, g: 0.002,  gdp: 5900, gg: 0.04,  en: 7700, eg: -0.002, re: 5,  rd: 0.3 },
  DEU: { co2: 1000, g: -0.015, gdp: 1700, gg: 0.03,  en: 4100, eg: -0.004, re: 3,  rd: 0.9 },
  BRA: { co2: 200,  g: 0.025,  gdp: 460,  gg: 0.035, en: 1000, eg: 0.015,  re: 55, rd: -0.3 },
};
export const countryNames = {
  IND: "India", CHN: "China", USA: "United States", DEU: "Germany", BRA: "Brazil",
  RUS: "Russia", JPN: "Japan", IRN: "Iran", IDN: "Indonesia", SAU: "Saudi Arabia",
  KOR: "South Korea", CAN: "Canada", MEX: "Mexico", TUR: "Turkey", ZAF: "South Africa",
};

export const countries = Object.keys(C);

export function series(country) {
  const c = C[country] || C.IND;
  return Array.from({ length: 35 }, (_, i) => ({
    year: 1990 + i,
    co2: Math.round(c.co2 * Math.pow(1 + c.g, i) * (1 + Math.sin(i * 1.7) * 0.015)),
    gdp: Math.round(c.gdp * Math.pow(1 + c.gg, i)),
    energy: Math.round(c.en * Math.pow(1 + c.eg, i)),
    renewable: +Math.min(95, Math.max(2, c.re + c.rd * i)).toFixed(1),
  }));
}

export function summary() {
  const all = countries.map((n) => ({ country: n, rows: series(n) }));
  const last = (r) => r[r.length - 1];
  const rows = all.map((a) => ({ country: a.country, co2: last(a.rows).co2, gdp: last(a.rows).gdp, renewable: last(a.rows).renewable }));
  const total = rows.reduce((s, r) => s + r.co2, 0);
  return {
    totalCo2: total,
    avgCo2: Math.round(total / rows.length),
    latestYear: 2024,
    renewableShare: +(rows.reduce((s, r) => s + r.renewable, 0) / rows.length).toFixed(1),
    countries: rows,
    trend: all[0].rows.map((_, i) => ({ year: 1990 + i, co2: all.reduce((s, a) => s + a.rows[i].co2, 0) })),
  };
}

export function forecast(country, horizon) {
  const h = series(country);
  const tail = h.slice(-10);
  const slope = (tail[9].co2 - tail[0].co2) / 9;
  const last = h[h.length - 1];
  return {
    history: h.map(({ year, co2 }) => ({ year, co2 })),
    forecast: Array.from({ length: horizon }, (_, k) => {
      const v = Math.round(last.co2 + slope * (k + 1));
      const band = Math.round(v * 0.03 * Math.sqrt(k + 1));
      return { year: last.year + k + 1, co2: v, lower: v - band, upper: v + band };
    }),
  };
}

export function scenario(country, share) {
  const base = forecast(country, 10).forecast;
  const cur = series(country).slice(-1)[0].renewable;
  const delta = Math.max(0, share - cur) / 100;
  return {
    currentRenewable: cur,
    rows: base.map((b, i) => {
      const scen = Math.round(b.co2 * (1 - delta * 0.6 * ((i + 1) / base.length)));
      return { year: b.year, baseline: b.co2, scenario: scen, difference: scen - b.co2 };
    }),
  };
}
