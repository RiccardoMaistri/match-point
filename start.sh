#!/bin/bash

# Funzione per terminare tutti i processi in background
cleanup() {
    echo "
Stopping all services..."
    # Termina i processi usando i loro PID
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    kill $NGROK_PID 2>/dev/null
    # Attende che i processi terminino
    wait
    echo "Services stopped."
    exit 0
}

# Imposta una "trap" per chiamare la funzione cleanup quando lo script riceve un segnale di interruzione (Ctrl+C) o terminazione
trap cleanup SIGINT SIGTERM

# Funzione per verificare se una porta è in uso
is_port_in_use() {
    ss -tuln | grep -q ":$1 "
}

# Trova una porta libera per il backend
BACKEND_PORT=8001
while is_port_in_use $BACKEND_PORT; do
    echo "Port $BACKEND_PORT is in use, trying next port..."
    BACKEND_PORT=$((BACKEND_PORT + 1))
done

# Avvia il backend in background
echo "Starting backend on port $BACKEND_PORT..."
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port $BACKEND_PORT &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Trova una porta libera per il frontend
FRONTEND_PORT=3000
while is_port_in_use $FRONTEND_PORT; do
    echo "Port $FRONTEND_PORT is in use, trying next port..."
    FRONTEND_PORT=$((FRONTEND_PORT + 1))
done

# Start the frontend
echo "Starting frontend on port $FRONTEND_PORT..."
cd ../frontend
PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!

echo "Backend running and accessible on your network at port $BACKEND_PORT"
echo "Frontend running on http://localhost:$FRONTEND_PORT"
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
