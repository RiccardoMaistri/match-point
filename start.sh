#!/bin/bash

# Start the backend
echo "Starting backend on port 8001, accessible on your local network..."
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start the frontend
echo "Starting frontend on port 3000..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "Backend running and accessible on your network at port 8001"
echo "Frontend running on http://localhost:3000"
echo "PWA enabled - Install the app from your browser!"
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
