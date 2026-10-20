import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

Data_path="data/carbon_emission_ml_ready.csv"
Output_dir="results/eda"
os.makedirs(Output_dir, exist_ok=True)
df=pd.read_csv(Data_path)
print("\n=== Exploratory data analysis ===")
print("\n Dataset Overview")
print(f"Rows:{df.shape[0]}")
print(f"Columns:{df.shape[1]}")
print("\nColumn Names:")
print(df.columns.tolist())
print("\nData types:")
print(df.dtypes)
print("\n--- Descriptive Statistics ---") 
print(df.describe().round(2)) 
print("\n--- Missing Values ---") 
# Missing-value percentage bar chart

missing_percentage = (
    df.isnull().sum() / len(df) * 100
)

plt.figure(figsize=(10, 5))

bars = plt.bar(
    missing_percentage.index,
    missing_percentage.values
)

plt.xlabel("Features")
plt.ylabel("Missing Values (%)")
plt.title("Missing Value Percentage by Feature")

plt.xticks(rotation=45, ha="right")

# Show percentage values above bars
for bar, value in zip(bars, missing_percentage.values):
    plt.text(
        bar.get_x() + bar.get_width() / 2,
        0.05,
        f"{value:.1f}%",
        ha="center",
        va="bottom"
    )

plt.ylim(0, max(missing_percentage.values)+5)
plt.tight_layout()

plt.savefig(
    f"{Output_dir}/01_missing_values.png",
    dpi=300
)

plt.close()
print("\n--- Duplicate Analysis ---") 
duplicates = df.duplicated().sum() 
print(f"Duplicate rows: {duplicates}")
print("\n--- CO2 Emission Statistics ---") 
print( df["co2_edgar_mt"] .describe() .round(2) ) 
plt.figure(figsize=(8, 5)) 
sns.histplot( df["co2_edgar_mt"].dropna(), bins=50, kde=True ) 
plt.xlabel("CO2 Emissions (Mt)") 
plt.ylabel("Frequency") 
plt.title("Distribution of CO2 Emissions") 
plt.tight_layout() 
plt.savefig( f"{Output_dir}/02_co2_distribution.png", dpi=300 ) 
plt.close()
plt.figure(figsize=(8, 4)) 
sns.boxplot( x=df["co2_edgar_mt"].dropna() ) 
plt.xlabel("CO2 Emissions (Mt)") 
plt.title("CO2 Emissions Boxplot") 
plt.tight_layout() 
plt.savefig( f"{Output_dir}/03_co2_boxplot.png", dpi=300 ) 
plt.close()
features = [ "population", "gdp_usd", "energy_intensity_mj_per_ppp_usd", "energy_use_kgoe_per_capita", "renewable_electricity_pct", "renewable_energy_consumption_pct", "fossil_fuel_energy_pct" ]
print("\n--- Feature Distributions ---") 
for feature in features: 
    plt.figure(figsize=(8, 5)) 
    sns.histplot( df[feature].dropna(), bins=40, kde=True ) 
    plt.xlabel(feature) 
    plt.ylabel("Frequency") 
    plt.title(f"Distribution of {feature}") 
    plt.tight_layout() 
    safe_name = feature.replace("/", "_") 
    plt.savefig( f"{Output_dir}/04_distribution_{safe_name}.png", dpi=300 ) 
    plt.close()
print("\n--- Feature vs CO2 Analysis ---") 
for feature in features: 
    plt.figure(figsize=(8, 5)) 
    sns.scatterplot( data=df, x=feature, y="co2_edgar_mt", alpha=0.4 ) 
    plt.xlabel(feature) 
    plt.ylabel("CO2 Emissions (Mt)") 
    plt.title(f"{feature} vs CO2 Emissions") 
    plt.tight_layout() 
    safe_name = feature.replace("/", "_") 
    plt.savefig( f"{Output_dir}/05_{safe_name}_vs_co2.png", dpi=300 ) 
    plt.close()
print("\n--- Correlation Matrix ---") 
correlation = df.corr(numeric_only=True) 
print(correlation.round(3)) 
print("\n--- Correlation with CO2 Emissions ---") 
print( correlation["co2_edgar_mt"] .sort_values(ascending=False) .round(3) ) 
plt.figure(figsize=(10, 8)) 
sns.heatmap( correlation, annot=True, fmt=".2f", cmap="RdBu_r", center=0 ) 
plt.title("Correlation Matrix of ML Features") 
plt.tight_layout() 
plt.savefig( f"{Output_dir}/06_correlation_heatmap.png", dpi=300 ) 
plt.close()
print("\n=== EDA COMPLETED SUCCESSFULLY ===") 
print(f"\nEDA results saved in: {Output_dir}")