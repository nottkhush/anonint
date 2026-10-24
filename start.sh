#!/bin/bash

echo "🚀 Starting Wind Power Forecast Portal..."
echo ""

# Check if Docker is installed
if command -v docker-compose &> /dev/null; then
    echo "Using Docker Compose..."
    docker-compose up --build
else
    echo "Docker not found. Starting services locally..."
    echo ""

    # Start backend
    echo "📊 Starting backend on http://localhost:8000..."
    cd backend
    pip install -r requirements.txt > /dev/null 2>&1
    python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..

    sleep 3

    # Start frontend
    echo "🎨 Starting frontend on http://localhost:3000..."
    cd frontend
    npm install > /dev/null 2>&1
    REACT_APP_API_URL=http://localhost:8000 npm start &
    FRONTEND_PID=$!
    cd ..

    echo ""
    echo "✅ Application started!"
    echo "   Backend:  http://localhost:8000"
    echo "   Frontend: http://localhost:3000"
    echo ""
    echo "Press Ctrl+C to stop all services"

    # Wait for Ctrl+C
    trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
    wait
fi
