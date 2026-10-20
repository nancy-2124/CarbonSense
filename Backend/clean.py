import pandas as pd
import numpy as np

## load dataset
input_file="data/carbon_emission.csv"
df=pd.read_csv(input_file)
print("Original shape:",df.shape)
print("\nColumns:")
print(df.columns.tolist())

##remove duplicate rows
before=len(df)
df=df.drop_duplicates()
after=len(df)
print("\nDuplicate rows removed:",before-after)

if "fossil_fuel_energy_pct" in df.columns:
    df.loc[
        df["year"]>=2015, "fossil_fuel_energy_pct"
    ]=np.nan

if "iso_code" in df.columns and "year" in df.columns:

    duplicates = df.duplicated(
        subset=["iso_code", "year"]
    ).sum()

    print("Duplicate country-year rows:", duplicates)


# 4. Convert numeric columns
numeric_columns = df.select_dtypes(
    include=np.number
).columns

for col in numeric_columns:
    df[col] = pd.to_numeric(
        df[col],
        errors="coerce"
    )


# 5. Missing values
missing = df.isnull().sum()

print("\nMissing values:")
print(
    missing[missing > 0]
    .sort_values(ascending=False)
)


# 6. Remove columns with
#    extremely high missing values
missing_percentage = (
    df.isnull().mean() * 100
)

columns_to_drop = missing_percentage[
    missing_percentage > 85
].index

print("\nColumns dropped because >85% missing:")

for col in columns_to_drop:
    print(col)

df = df.drop(
    columns=columns_to_drop
)


# 7. Interpolate numerical
#    values within each country
if "iso_code" in df.columns and "year" in df.columns:

    df = df.sort_values(
        ["iso_code", "year"]
    )

    numeric_columns = df.select_dtypes(
        include=np.number
    ).columns

    for col in numeric_columns:

        if col not in ["year"]:

            df[col] = (
                df.groupby("iso_code")[col]
                .transform(
                    lambda x:
                    x.interpolate(
                        limit=3,
                        limit_direction="forward"
                    )
                )
            )

# 8. Remove rows where
#    important variables are missing
required_columns = [
    "co2_edgar_mt",
    "population",
    "gdp_usd"
]

available_required = [
    col for col in required_columns
    if col in df.columns
]

df = df.dropna(
    subset=available_required
)


# 9. Remove invalid values
if "co2_edgar_mt" in df.columns:

    df = df[
        df["co2_edgar_mt"] >= 0
    ]

if "population" in df.columns:

    df = df[
        df["population"] > 0
    ]

if "gdp_usd" in df.columns:

    df = df[
        df["gdp_usd"] > 0
    ]


# 10. Check percentage columns
percentage_columns = [
    col for col in df.columns
    if col.endswith("_pct")
    and "growth" not in col
]

for col in percentage_columns:

    df.loc[
        (df[col] < 0) |
        (df[col] > 100),
        col
    ] = np.nan


# 11. Save cleaned dataset

output_file = (
    "data/carbon_emission_model_ready.csv"
)

df.to_csv(
    output_file,
    index=False
)

print("\nFinal shape:", df.shape)

print(
    "\nCleaned dataset saved to:",
    output_file
)

print(
    "\nRemaining missing values:",
    df.isnull().sum().sum()
)

ml_columns = [
    "population",
    "gdp_usd",
    "energy_intensity_mj_per_ppp_usd",
    "energy_use_kgoe_per_capita",
    "renewable_electricity_pct",
    "renewable_energy_consumption_pct",
    "fossil_fuel_energy_pct"
]

print("\nML columns missing values:")
print(df[ml_columns].isnull().sum())

print("\nML columns missing percentage:")
print(
    (df[ml_columns].isnull().mean() * 100)
    .round(2)
)
target="co2_edgar_mt"

ml_dataset=df[
    ["iso_code","year"]+ml_columns+[target]
].copy()

ml_dataset.to_csv(
    "data/carbon_emission_ml_ready.csv",
    index=False
)
print("ML-ready dataset shape:",ml_dataset.shape)
print(ml_dataset.columns.tolist())
print("\nMissing values in ML-ready dataset:")
print(ml_dataset[ml_columns].isnull().sum())