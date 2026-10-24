# UK Wind Power Forecasting Portal

Web app for a UK energy utility's day-ahead buying team. It shows the latest wind generation forecast available at decision time and measures how accurate past forecasts were against actual generation (January 2026).

## Live Demo

- App: https://anonint.vercel.app
- API docs: https://anonint.onrender.com/docs

The backend runs on a free tier and sleeps when idle, so the first load can take 30-60 seconds.

## Features

**Latest forecast view**
- Pick a decision date and see the most recent forecast published before it
- Half-hourly forecast chart and total expected generation

**Forecast accuracy analysis**
- MAE, RMSE, MAPE and bias
- Forecast vs actual time series
- Error distribution histogram

## Tech Stack

- Frontend: React, Recharts
- Backend: Python, FastAPI, pandas
- Data: Elexon BMRS API (FUELHH for actuals, WINDFOR for forecasts)
- Docker and Docker Compose
- Hosting: Vercel (frontend), Render (backend)

## Project Structure

```
backend/             FastAPI app, requirements.txt, Dockerfile
frontend/            React app, Dockerfile
docker-compose.yml
README.md
```

## Run Locally

### Docker (recommended)

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000/docs

### Without Docker

```bash
# backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# frontend (new terminal)
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```

## API Endpoints

- `GET /` API info
- `GET /actuals` actual wind generation
- `GET /forecasts` wind generation forecasts
- `GET /latest-forecast?decision_date=YYYY-MM-DD` latest forecast available at decision time
- `GET /accuracy` accuracy metrics and error analysis

## Key Design Decisions

1. **Decision-time forecasts:** for each target time, only forecasts published before the decision cutoff are used, so the app never uses information a trader would not have had.
2. **Multiple error metrics:** MAE, RMSE, MAPE and bias together show typical error, large misses and systematic over or under forecasting.
3. **Simple deployment:** frontend and backend are deployed separately, with the API URL passed to the frontend through `REACT_APP_API_URL`.

## Use of AI Tools

I used Claude (Anthropic) for architecture planning, code assistance, debugging and deployment help. I reviewed and tested the code myself.

## Possible Improvements

- Store forecasts in a database as they are published
- Multi-month analysis and forecast horizon breakdown
- Caching to reduce Elexon API calls
- Export reports as CSV