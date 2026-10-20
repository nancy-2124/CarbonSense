import os
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import RandomForestRegressor
import matplotlib.pyplot as plt
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

DATA_PATH="data/carbon_emission_ml_ready.csv"
df=pd.read_csv(DATA_PATH)
print("\nDataset Loaded")
print("shape:",df.shape)

features=[
     "population",
    "gdp_usd",
    "energy_intensity_mj_per_ppp_usd",
    "energy_use_kgoe_per_capita",
    "renewable_electricity_pct",
    "renewable_energy_consumption_pct",
    "fossil_fuel_energy_pct"
]
target="co2_edgar_mt"
X=df[features]
y=df[target]
print("\nFeatures")
print(X.columns.tolist())
print("\nTarget")
print(target)

train_data=df[df["year"]<2019]
test_data=df[df["year"]>=2019]
X_train=train_data[features]
y_train=train_data[target]
X_test=test_data[features]
y_test=test_data[target]
print("\nTemporal Train Test Split")
print("Training data:",X_train.shape)
print("Testing data:",X_test.shape)
print("Training years:", train_data["year"].min(),"to", train_data["year"].max())
print("Testing years:", test_data["year"].min(),"to",test_data["year"].max())

os.makedirs("results",exist_ok=True)

model=Pipeline([
    ("imputer",SimpleImputer(strategy="median")),
    ("regressor",LinearRegression())
])
model.fit(X_train,y_train)
print("\nModel Training Completed")
y_pred=model.predict(X_test)

errors=y_test.values-y_pred
print("\nError Analysis")
print(f"Mean Error:{errors.mean():.2f}")
print(f"Positive Errors:{(errors>0).sum()}")
print(f"Negative Errors:{(errors<0).sum()}")
print(f"Zero Errors:{(errors==0).sum()}")
mae=mean_absolute_error(y_test,y_pred)
rmse=np.sqrt(
    mean_squared_error(y_test,y_pred)
)
r2=r2_score(y_test, y_pred)
print("\nModel Evaluation")
print(f"MAE:{mae:.2f}")
print(f"RMSE:{rmse:.2f}")
print(f"R^2:{r2:.4f}")
results=pd.DataFrame({
    "Year": test_data["year"].values,

    "Actual_CO2": y_test.values,

    "Predicted_CO2": y_pred
})
print("\nFirst 10 Predictions")
print(results.head(10))
results.to_csv(
    "results/model_predictions.csv",
    index=False
)
print("\nPredictions saved to:")
print("results/model_predictions.csv")

print("\nRandom Forest Regression")
rf_model=Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("regressor", RandomForestRegressor(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
))
])
rf_model.fit(X_train, y_train)
rf_pred=rf_model.predict(X_test)
print("Random Forest Training Completed")

rf_mae = mean_absolute_error(y_test, rf_pred)
rf_rmse = np.sqrt(mean_squared_error(y_test, rf_pred))
rf_r2 = r2_score(y_test, rf_pred)

print(f"MAE  : {rf_mae:.2f}")
print(f"RMSE : {rf_rmse:.2f}")
print(f"R²   : {rf_r2:.4f}")

plt.figure(figsize=(8,6))
plt.scatter(y_test,rf_pred,alpha=0.6)
min_value=min(y_test.min(), rf_pred.min())
max_value=max(y_test.max(),rf_pred.max())
plt.plot(
    [min_value, max_value],
    [min_value, max_value], linestyle="--"
)
plt.xlabel("Actual CO2 Emissions (Mt)")
plt.ylabel("Predicted CO2 Emissions (Mt)")
plt.title("Actual vs Predicted CO₂ Emissions - Random Forest")

plt.tight_layout()

plt.savefig(
    "results/actual_vs_predicted_rf.png",
    dpi=300
)
plt.close()

residuals = y_test.values - rf_pred

plt.figure(figsize=(8, 6))

plt.scatter(
    rf_pred,
    residuals,
    alpha=0.6
)

plt.axhline(
    y=0,
    linestyle="--"
)

plt.xlabel("Predicted CO₂ Emissions (Mt)")
plt.ylabel("Residuals (Actual - Predicted)")
plt.title("Residual Plot - Random Forest")

plt.tight_layout()

plt.savefig(
    "results/residual_plot_rf.png",
    dpi=300
)
plt.close()

print("\n=== RANDOM FOREST FEATURE IMPORTANCE ===")

importance = pd.DataFrame({
    "Feature": features,
     "Importance": rf_model.named_steps["regressor"].feature_importances_
})

importance = importance.sort_values(
    by="Importance",
    ascending=False
)

print(importance)

importance.to_csv(
    "results/feature_importance_rf.csv",
    index=False
)


plt.figure(figsize=(10, 6))

plt.barh(
    importance["Feature"],
    importance["Importance"]
)

plt.xlabel("Importance")
plt.ylabel("Features")
plt.title("Random Forest Feature Importance")

plt.tight_layout()

plt.savefig(
    "results/feature_importance_rf.png",
    dpi=300
)
plt.close()

print("\n=== RANDOM FOREST PREDICTIONS ===")

rf_results = pd.DataFrame({
    "Year": test_data["year"].values,
    "Actual_CO2": y_test.values,
    "Predicted_CO2": rf_pred
})

print(rf_results.head(10))
rf_results.to_csv(
    "results/random_forest_predictions.csv",
    index=False
)

print(
    "\nRandom Forest predictions saved to:"
)

print(
    "results/random_forest_predictions.csv"
)

