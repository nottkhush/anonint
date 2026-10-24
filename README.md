# Wind Power Forecasting Portal

A web application for UK energy utilities to visualize wind power forecasts and evaluate forecast accuracy for day-ahead market procurement decisions.

## Overview

This application helps energy traders understand wind generation forecasts and their accuracy to make informed decisions about purchasing additional power from the wholesale market. It demonstrates the functionality using October 2026 data from the Elexon BMRS API.

**Note on Date Range**: The assignment originally requested January 2026 data, but since we're currently in October 2026, the Elexon BMRS API only provides recent historical data (approximately the last week). Therefore, the application demonstrates the full functionality using October 20-24, 2026 data. The architecture and methodology would work identically for any date range when historical forecast data is available.

## Tech Stack

- **Frontend**: React with Recharts for data visualization
- **Backend**: Python FastAPI with pandas for data processing
- **Data Source**: Elexon BMRS API (FUELHH for actuals, WINDFOR for forecasts)
- **Containerization**: Docker & Docker Compose

## Features

### 1. Latest Forecast View
- Display the most recent wind generation forecast available for day-ahead decisions
- Interactive date selection for different decision dates
- Visual representation of forecasted generation across 30-minute intervals
- Total generation statistics

### 2. Forecast Accuracy Analysis
- **MAE (Mean Absolute Error)**: Average magnitude of forecast errors
- **RMSE (Root Mean Squared Error)**: Error metric emphasizing larger deviations
- **MAPE (Mean Absolute Percentage Error)**: Normalized error percentage
- **Forecast Bias**: Tendency to over-forecast or under-forecast
- Time series comparison of forecasts vs actuals
- Error distribution histogram

## Project Structure

```
REint-assignment/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile          # Backend container config
├── frontend/
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   └── App.css         # Styling
│   ├── public/
│   ├── package.json        # Node dependencies
│   └── Dockerfile          # Frontend container config
├── docker-compose.yml      # Multi-container orchestration
└── README.md              # This file
```

## Running the Application

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and start both services
docker-compose up --build

# The application will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
```

### Option 2: Running Locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
# API runs on http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start
# App runs on http://localhost:3000
```

## API Endpoints

- `GET /` - API information
- `GET /actuals` - Actual wind generation data
- `GET /forecasts` - Wind generation forecasts
- `GET /latest-forecast?decision_date=YYYY-MM-DD` - Latest forecast for decision making
- `GET /accuracy` - Forecast accuracy metrics and analysis

## Development Notes

### AI Tools Used
This application was built with assistance from Claude (Anthropic's AI assistant) for:
- Architecture design and API structure
- React component development
- Data processing logic
- Documentation

### Key Design Decisions

1. **Day-Ahead Focus**: The application focuses on day-ahead forecasts (published 1 day before delivery) as this matches the market structure
2. **Historical Analysis**: Uses January 2026 data to provide complete actual vs forecast comparisons
3. **Error Metrics**: Multiple metrics (MAE, RMSE, MAPE, Bias) provide comprehensive accuracy assessment
4. **Visualization**: Clear charts help traders quickly understand generation patterns and forecast reliability

## Deployment

### Important Note on Data

The Elexon BMRS API only provides real-time wind forecasts (WINDFOR), not historical forecasts from January 2026. Therefore, the accuracy analysis uses synthetic forecast data generated from actual January 2026 generation data with realistic error characteristics (~8% standard deviation). This demonstrates the full functionality while working within API limitations.

In a production environment, historical forecasts would be:
- Stored in a database when originally published
- Or retrieved from Elexon's historical data archives
- Compared with actuals for genuine accuracy metrics

### Backend Deployment (Heroku/Railway/Render)

**Option 1: Heroku**
```bash
cd backend
# Install Heroku CLI if not installed
heroku create your-wind-forecast-api
heroku config:set PYTHONUNBUFFERED=1
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

**Option 2: Railway** (Recommended - has free tier)
```bash
# Install Railway CLI or use web interface
railway init
railway up
# Set PORT environment variable to 8000
```

**Option 3: Render** (Free tier available)
- Connect GitHub repo
- Select "backend" directory
- Set build command: `pip install -r requirements.txt`
- Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend Deployment (Vercel)

```bash
cd frontend
# Install Vercel CLI if not installed: npm i -g vercel
vercel

# Set environment variable in Vercel dashboard:
# REACT_APP_API_URL=https://your-backend-url.com
```

**Or deploy via Vercel web interface:**
1. Import GitHub repository
2. Set root directory to `frontend`
3. Add environment variable: `REACT_APP_API_URL`
4. Deploy

## Data Source

**Elexon BMRS API**: Provides UK electricity market data
- FUELHH dataset: Actual generation by fuel type (half-hourly)
- WINDFOR dataset: Wind generation forecasts

**Important Note on Forecasts**: The WINDFOR API endpoint provides real-time forward-looking forecasts only, not historical forecasts from past dates. For this demonstration:
- **Actual generation data** from October 2026 is retrieved from the FUELHH endpoint
- **Forecast data** is synthesized with realistic error characteristics (5-8% standard deviation) to demonstrate accuracy analysis functionality

In a production environment, forecasts would be stored in a database as they're published, allowing genuine historical forecast-vs-actual comparisons.

## Time Investment

Approximately 12-14 hours:
- Research & API exploration: 2 hours
- Backend development: 3 hours
- Frontend development: 4 hours
- Docker setup: 1 hour
- Testing & refinement: 2-3 hours
- Documentation: 1 hour

## Future Enhancements

- Real-time data updates
- Multi-month analysis
- Additional renewable sources (solar, hydro)
- Machine learning-based forecast improvements
- Export functionality for reports
- User authentication for team collaboration

## License

This project was created as an assignment demonstration.
