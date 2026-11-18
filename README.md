# CarbonSense

## Data Analytics, Carbon Emission Prediction and Sustainability Modeling Framework

CarbonSense is a web-based application for analyzing carbon emissions, predicting future emissions, forecasting trends, and exploring renewable-energy scenarios.

The project combines data analytics, machine learning, time-series forecasting, and an interactive React interface.

Live Demo

Live Application: https://carbon-sense-dusky.vercel.app/

GitHub Repository: https://github.com/nancy-2124/CarbonSense

## Features

- Carbon emission overview dashboard
- Country-wise emission analysis
- CO₂ emission prediction using Random Forest
- Future emission forecasting using ARIMA/SARIMA
- Renewable-energy scenario analysis
- Interactive charts and tables
- CSV download for scenario results
- FastAPI backend with REST APIs
- React-based frontend

## Technology Stack

### Frontend
- React
- Vite
- React Router
- Recharts
- JavaScript

### Backend
- Python
- FastAPI
- Uvicorn
- Pandas
- NumPy
- Scikit-learn
- Statsmodels
- Matplotlib
- Seaborn

### Machine Learning
- Random Forest Regression
- Linear Regression
- Median imputation for missing values
- Temporal train-test split

### Data Sources
- EDGAR
- World Bank / WDI indicators

System Architecture

                 ┌─────────────────────┐
                 │      React UI       │
                 │      Vite App       │
                 └──────────┬──────────┘
                            │
                         REST API
                            │
                            ▼
                 ┌─────────────────────┐
                 │     FastAPI         │
                 │      Backend        │
                 └──────────┬──────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
        Data Processing   ML Models    Forecasting
              │             │             │
              ▼             ▼             ▼
           Pandas       Random Forest    ARIMA
              │
              ▼
        Carbon Emission
             Data

Application Pages
Dashboard
Provides an overview of carbon emissions, including:
Total CO₂ emissions
Average emissions
Renewable-energy share
Countries covered
Historical emission trends
Country-wise emission comparison

Analysis
Provides detailed analysis of historical carbon-emission data and country-level trends using interactive visualizations.

Prediction
Uses machine learning to estimate CO₂ emissions based on selected input features.
The project includes Random Forest Regression for the primary prediction workflow.

Forecasting
Uses time-series forecasting to estimate future emission trends for a configurable number of years.
Sustainability
Allows users to explore renewable-energy scenarios and observe their potential effect on emission-related outputs.

## Project Structure

```text
CarbonSense/
├── Backend/
│   ├── data/
│   │   ├── carbon_emission.csv
│   │   ├── carbon_emission_model_ready.csv
│   │   └── carbon_emission_ml_ready.csv
│   ├── results/
│   │   ├── eda/
│   │   ├── actual_vs_predicted_rf.png
│   │   ├── feature_importance_rf.csv
│   │   ├── feature_importance_rf.png
│   │   ├── random_forest_predictions.csv
│   │   └── residual_plot_rf.png
│   ├── api.py
│   ├── clean.py
│   ├── eda.py
│   ├── model.py
│   └── requirements.txt
│
├── Frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── Components/
│   │   └── Pages/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md



Deployment
The application is deployed using:
Frontend: Vercel
Backend: Render
The deployed React frontend communicates with the FastAPI backend through the configured API URL.
