from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from datetime import datetime, timedelta
import pandas as pd
from typing import List, Dict
import numpy as np

app = FastAPI(title="Wind Power Forecast API")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"


def fetch_elexon_data(endpoint: str, from_date: str, to_date: str) -> List[Dict]:
    """Fetch data from Elexon BMRS API"""
    url = f"{ELEXON_BASE_URL}/datasets/{endpoint}"

    # Ensure datetime format with timezone
    if 'T' not in from_date:
        from_date = f"{from_date}T00:00:00Z"
    if 'T' not in to_date:
        to_date = f"{to_date}T23:59:59Z"

    params = {
        "from": from_date,
        "to": to_date
    }

    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data.get("data", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data from Elexon: {str(e)}")


@app.get("/")
def root():
    return {
        "message": "Wind Power Forecast API",
        "endpoints": {
            "/actuals": "Get actual wind generation data",
            "/forecasts": "Get wind generation forecasts",
            "/accuracy": "Get forecast accuracy metrics",
            "/latest-forecast": "Get latest available forecast for decision making"
        }
    }


@app.get("/actuals")
def get_actuals(from_date: str = "2026-10-20", to_date: str = "2026-10-24"):
    """
    Get actual wind generation data
    """
    # Adjust to_date to ensure we get all of January
    to_datetime = datetime.fromisoformat(to_date) + timedelta(days=1)
    to_date_adjusted = to_datetime.strftime("%Y-%m-%d")

    data = fetch_elexon_data("FUELHH", from_date, to_date_adjusted)

    # Filter for WIND only
    wind_data = [item for item in data if item.get("fuelType") == "WIND"]

    # Convert to DataFrame for easier processing
    df = pd.DataFrame(wind_data)
    if df.empty:
        return {"data": []}

    # Sort by startTime
    df = df.sort_values("startTime")

    # Convert to records
    result = df[["startTime", "generation", "publishTime"]].to_dict("records")

    return {
        "data": result,
        "count": len(result),
        "period": f"{from_date} to {to_date}"
    }


@app.get("/forecasts")
def get_forecasts(from_date: str = "2026-01-01", to_date: str = "2026-01-03"):
    """
    Get wind generation forecasts
    Note: Returns current forecasts as historical January 2026 forecasts aren't available in API
    """
    data = fetch_elexon_data("WINDFOR", from_date, to_date)

    df = pd.DataFrame(data)
    if df.empty:
        return {"data": []}

    df = df.sort_values(["publishTime", "startTime"])

    result = df[["publishTime", "startTime", "generation"]].to_dict("records")

    return {
        "data": result,
        "count": len(result),
        "unique_publish_times": df["publishTime"].nunique()
    }


@app.get("/latest-forecast")
def get_latest_forecast(decision_date: str = "2026-10-23"):
    """
    Get the latest available forecast for a given decision date.
    Simulates day-ahead market decision making for January 2026.

    Note: Uses synthetic forecast data as the API only contains real-time forecasts.
    """
    try:
        # Parse decision date and calculate next day
        decision_dt = datetime.fromisoformat(decision_date)
        next_day = decision_dt + timedelta(days=1)
        next_day_str = next_day.strftime("%Y-%m-%d")
        next_day_end = (next_day + timedelta(days=1)).strftime("%Y-%m-%d")

        # Fetch actual generation data for the next day to create synthetic forecast
        data = fetch_elexon_data("FUELHH", next_day_str, next_day_end)
        wind_data = [item for item in data if item.get("fuelType") == "WIND"]

        if not wind_data:
            return {
                "data": [],
                "latest_publish_time": None,
                "decision_date": decision_date,
                "forecast_for_date": next_day_str,
                "count": 0,
                "note": "No data available for this date"
            }

        df = pd.DataFrame(wind_data)
        df["startTime"] = pd.to_datetime(df["startTime"])

        # Filter for the target day only
        df = df[df["startTime"].dt.date == next_day.date()]

        if df.empty:
            return {
                "data": [],
                "latest_publish_time": None,
                "decision_date": decision_date,
                "forecast_for_date": next_day_str,
                "count": 0
            }

        # Create synthetic forecast with realistic variation (5% std dev)
        np.random.seed(int(decision_dt.timestamp()) % (2**32))
        df["generation"] = df["generation"] + np.random.normal(0, df["generation"].std() * 0.05, len(df))
        df["generation"] = df["generation"].clip(lower=0).round()

        result = df.sort_values("startTime")[["startTime", "generation"]].to_dict("records")

        # Simulate publish time as 6 PM on decision date
        publish_time = decision_dt.replace(hour=18, minute=0, second=0)

        return {
            "data": result,
            "latest_publish_time": publish_time.isoformat() + "Z",
            "decision_date": decision_date,
            "forecast_for_date": next_day_str,
            "count": len(result),
            "note": "Synthetic forecast for demonstration"
        }
    except Exception as e:
        return {
            "data": [],
            "latest_publish_time": None,
            "error": str(e),
            "decision_date": decision_date
        }


@app.get("/accuracy")
def get_accuracy_metrics(from_date: str = "2026-10-20", to_date: str = "2026-10-24"):
    """
    Calculate forecast accuracy metrics.

    Note: Uses synthetic forecast data for demonstration purposes since the WINDFOR API
    only contains real-time forecasts, not historical January 2026 forecasts.

    In a production system, this would compare actual historical forecasts with actuals.
    """
    # Fetch actuals from January 2026
    to_datetime = datetime.fromisoformat(to_date) + timedelta(days=1)
    actuals_data = fetch_elexon_data("FUELHH", from_date, to_datetime.strftime("%Y-%m-%d"))
    actuals_df = pd.DataFrame([item for item in actuals_data if item.get("fuelType") == "WIND"])

    if actuals_df.empty:
        raise HTTPException(status_code=404, detail="No actual data found for the specified period")

    actuals_df["startTime"] = pd.to_datetime(actuals_df["startTime"])
    actuals_df = actuals_df[["startTime", "generation"]].rename(columns={"generation": "actual"})

    # Generate synthetic forecast data for demonstration
    # Models realistic forecast errors: mean ~0, std ~8% of actual generation
    np.random.seed(42)  # Reproducible results
    noise = np.random.normal(0, actuals_df["actual"].std() * 0.08, len(actuals_df))
    actuals_df["forecast"] = (actuals_df["actual"] + noise).clip(lower=0)

    merged = actuals_df.copy()

    # Calculate errors
    merged["error"] = merged["forecast"] - merged["actual"]
    merged["abs_error"] = np.abs(merged["error"])
    merged["squared_error"] = merged["error"] ** 2
    merged["pct_error"] = (merged["abs_error"] / merged["actual"].replace(0, 1)) * 100

    # Calculate metrics
    mae = merged["abs_error"].mean()
    rmse = np.sqrt(merged["squared_error"].mean())
    mape = merged["pct_error"].mean()
    bias = merged["error"].mean()

    # Time series data for visualization (limit for performance)
    time_series = merged.sort_values("startTime").head(200)[
        ["startTime", "actual", "forecast", "error"]
    ].to_dict("records")

    # Error distribution
    error_bins = [-float('inf'), -2000, -1000, -500, 0, 500, 1000, 2000, float('inf')]
    merged["error_bin"] = pd.cut(merged["error"], bins=error_bins)
    error_dist = merged["error_bin"].value_counts().sort_index()

    return {
        "metrics": {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2),
            "bias": round(bias, 2),
            "sample_size": len(merged)
        },
        "time_series": time_series,
        "error_distribution": {
            "bins": [str(b) for b in error_dist.index],
            "counts": error_dist.tolist()
        },
        "summary": {
            "mean_actual": round(merged["actual"].mean(), 2),
            "mean_forecast": round(merged["forecast"].mean(), 2),
            "std_actual": round(merged["actual"].std(), 2),
            "std_forecast": round(merged["forecast"].std(), 2)
        },
        "note": "Synthetic forecast data used for demonstration. Real system would use historical forecasts."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
