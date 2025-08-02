#!/bin/bash

# Start the backend
echo "Starting backend on port 8001..."
cd backend
python3 -m uvicorn main:app --reload --port 8001 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start the frontend
echo "Starting frontend on port 8080..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "Backend running on http://localhost:8001"
echo "Frontend running on http://localhost:8080"
echo "Press Ctrl+C to stop both servers"

# Function to cleanup processes
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait