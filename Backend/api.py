
import json
from pathlib import Path
 
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
 
DATA_PATH = Path(__file__).parent / "data" / "carbon_emission_ml_ready.csv"
TARGET = "co2_edgar_mt"
REN = "renewable_energy_consumption_pct"
FOSSIL = "fossil_fuel_energy_pct"
FEATURES = [
    "population",
    "gdp_usd",
    "energy_intensity_mj_per_ppp_usd",
    "energy_use_kgoe_per_capita",
    "renewable_electricity_pct",
    REN,
    FOSSIL,
]
 
# ---------------------------------------------------------------- data + model
df = pd.read_csv(DATA_PATH).dropna(subset=[TARGET]).sort_values(["iso_code", "year"])
 
train, test = df[df["year"] < 2019], df[df["year"] >= 2019]
model = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("regressor", RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)),
])
model.fit(train[FEATURES], train[TARGET])
 
_pred = model.predict(test[FEATURES])
_mse = mean_squared_error(test[TARGET], _pred)
METRICS = {
    "mae": float(mean_absolute_error(test[TARGET], _pred)),
    "mse": float(_mse),
    "rmse": float(np.sqrt(_mse)),
    "r2": float(r2_score(test[TARGET], _pred)),
}
 
# Years where only a few countries have data would distort totals, so we ignore them.
_counts = df.groupby("year").size()
COMPLETE_YEARS = _counts[_counts >= 0.8 * _counts.max()].index
LATEST_YEAR = int(COMPLETE_YEARS.max())
 
# ------------------------------------------------------------------------ app
app = FastAPI(title="CarbonSense API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173","https://carbon-sense-dusky.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)
 
 
@app.exception_handler(RequestValidationError)
async def validation_handler(request, exc):
    first = exc.errors()[0]
    field = ".".join(str(p) for p in first["loc"] if p not in ("body", "query"))
    return JSONResponse(status_code=400, content={"error": f"{field}: {first['msg']}"})
 
 
def num(x, nd=1):
    return None if pd.isnull(x) else round(float(x), nd)
 
 
def country_rows(code: str) -> pd.DataFrame:
    d = df[df["iso_code"] == code.upper()].sort_values("year")
    if d.empty:
        raise HTTPException(400, f"No data for country code '{code}'.")
    if len(d) < 10:
        raise HTTPException(400, f"Not enough yearly data for '{code}' to model.")
    return d
 
 
def run_forecast(code: str, horizon: int, model_name: str):
    d = country_rows(code)
    y = d[TARGET].to_numpy(dtype=float)
    try:
        if model_name.upper() == "SARIMA":
            fit = SARIMAX(y, order=(1, 1, 1), seasonal_order=(0, 0, 0, 0)).fit(disp=False)
        else:
            fit = ARIMA(y, order=(1, 1, 1)).fit()
        fc = fit.get_forecast(steps=horizon)
        mean = np.asarray(fc.predicted_mean)
        ci = np.asarray(fc.conf_int(alpha=0.05))
    except Exception:
        raise HTTPException(400, f"Could not fit a {model_name} model for '{code}'.")
    last_year = int(d["year"].max())
    history = [{"year": int(a), "co2": round(float(b), 1)} for a, b in zip(d["year"], y)]
    forecast = [
        {
            "year": last_year + i + 1,
            "co2": round(max(0.0, float(mean[i])), 1),
            "lower": round(max(0.0, float(ci[i, 0])), 1),
            "upper": round(max(0.0, float(ci[i, 1])), 1),
        }
        for i in range(horizon)
    ]
    return history, forecast
 
 
# ------------------------------------------------------------------- endpoints
@app.get("/emissions/summary")
def summary():
    latest = df[df["year"] == LATEST_YEAR]
    total = float(latest[TARGET].sum())
    top = latest.nlargest(15, TARGET)
    trend = df[df["year"].isin(COMPLETE_YEARS)].groupby("year")[TARGET].sum()
    return {
        "totalCo2": round(total),
        "avgCo2": round(total / len(latest)),
        "latestYear": LATEST_YEAR,
        "renewableShare": num(latest[REN].mean()),
        "countryCount": int(len(latest)),
        "countries": [
            {
                "country": r["iso_code"],
                "co2": num(r[TARGET]),
                "gdp": num(r["gdp_usd"] / 1e9),
                "renewable": num(r[REN]),
            }
            for _, r in top.iterrows()
        ],
        "trend": [{"year": int(y), "co2": round(float(v))} for y, v in trend.items()],
    }
 
 
@app.get("/emissions/analysis")
def analysis(country: str):
    d = country_rows(country)
    out = pd.DataFrame({
        "year": d["year"],
        "co2": d[TARGET],
        "gdp": d["gdp_usd"] / 1e9,
        "energy": d["energy_use_kgoe_per_capita"],
        "renewable": d[REN],
    }).dropna()
    return json.loads(out.round(2).to_json(orient="records"))
 
 
@app.get("/forecast")
def forecast(country: str, horizon: int = Query(10, ge=1, le=15), model: str = "ARIMA"):
    model=model.upper()
    if model not in ["ARIMA", "SARIMA"]:
        raise HTTPException(
            400, "Model must be either ARIMA or SARIMA"
        )
    history, fc = run_forecast(country, horizon, model)
    return {"history": history, "forecast": fc}
 
 
class PredictIn(BaseModel):
    gdp: float = Field(ge=0)          # USD billion
    population: float = Field(ge=0)   # millions
    energy: float = Field(ge=0)       # kg oil equivalent per capita
    fossil: float = Field(ge=0, le=100)
    renewable: float = Field(ge=0, le=100)
 
 
@app.post("/predict")
def predict(p: PredictIn):
    # The two features the form does not ask for are left empty; the pipeline imputes the median.
    row = pd.DataFrame([{
        "population": p.population * 1e6,
        "gdp_usd": p.gdp * 1e9,
        "energy_intensity_mj_per_ppp_usd": np.nan,
        "energy_use_kgoe_per_capita": p.energy,
        "renewable_electricity_pct": np.nan,
        REN: p.renewable,
        FOSSIL: p.fossil,
    }])[FEATURES]
    return {"co2": round(float(model.predict(row)[0]), 1), "metrics": METRICS}
 
 
class ScenarioIn(BaseModel):
    country: str
    renewable: float = Field(ge=0, le=100)
 
 
@app.post("/scenario")
def scenario(s: ScenarioIn):
    d = country_rows(s.country)
    _, baseline = run_forecast(s.country, 10, "ARIMA")
 
    last = d.iloc[-1]
    cur_ren = last[REN]
    if pd.isnull(cur_ren):
        raise HTTPException(400, f"No renewable-share data for '{s.country}'.")
 
    base_row = last[FEATURES].to_frame().T.astype(float)
    scen_row = base_row.copy()
    delta = max(0.0, s.renewable - float(cur_ren))
    scen_row[REN] = float(cur_ren) + delta
    if pd.notnull(last[FOSSIL]):
        scen_row[FOSSIL] = max(0.0, float(last[FOSSIL]) - delta)
 
    base_pred = float(model.predict(base_row)[0])
    ratio = float(model.predict(scen_row)[0]) / base_pred if base_pred > 0 else 1.0
 
    n = len(baseline)
    rows = []
    for i, b in enumerate(baseline):
        # the renewable share is assumed to rise linearly until it reaches the target in the last year
        scen = b["co2"] * (1 + (ratio - 1) * (i + 1) / n)
        rows.append({
            "year": b["year"],
            "baseline": round(b["co2"], 1),
            "scenario": round(scen, 1),
            "difference": round(scen - b["co2"], 1),
        })
    return {"currentRenewable": round(float(cur_ren), 1), "rows": rows}