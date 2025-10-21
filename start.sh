#!/bin/bash

# Funzione per terminare tutti i processi in background
cleanup() {
    echo "
Stopping all services..."
    if [ ! -z "$BACKEND_PID" ]; then kill $BACKEND_PID 2>/dev/null; fi
    if [ ! -z "$FRONTEND_PID" ]; then kill $FRONTEND_PID 2>/dev/null; fi
    if [ ! -z "$NGROK_PID" ]; then kill $NGROK_PID 2>/dev/null; fi
    wait
    echo "Services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Kill any existing ngrok processes to ensure a clean start
echo "Stopping any existing ngrok processes..."
killall ngrok 2>/dev/null
sleep 1

is_port_in_use() {
    ss -tuln | grep -q ":$1 "
}

BACKEND_PORT=8001
while is_port_in_use $BACKEND_PORT; do
    echo "Port $BACKEND_PORT is in use, trying next port..."
    BACKEND_PORT=$((BACKEND_PORT + 1))
done

echo "Starting backend on port $BACKEND_PORT..."
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port $BACKEND_PORT &
BACKEND_PID=$!
cd ..

sleep 2

FRONTEND_PORT=3000
while is_port_in_use $FRONTEND_PORT; do
    echo "Port $FRONTEND_PORT is in use, trying next port..."
    FRONTEND_PORT=$((FRONTEND_PORT + 1))
done

echo "Starting frontend on port $FRONTEND_PORT..."
cd frontend
DANGEROUSLY_DISABLE_HOST_CHECK=true PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!
cd ..

sleep 10

# Expose frontend with ngrok, rewriting the host header
echo "Starting ngrok to expose frontend..."
NGROK_LOG_FILE="/tmp/ngrok.log"
> $NGROK_LOG_FILE # Clear previous log file
ngrok http $FRONTEND_PORT --log $NGROK_LOG_FILE --host-header=rewrite &
NGROK_PID=$!

echo "Waiting for ngrok tunnel..."
sleep 8

# Check if ngrok process is running
if ! kill -0 $NGROK_PID 2>/dev/null; then
    echo "-------------------------------------------------"
    echo "ERROR: ngrok process failed to start."
    echo "Please check your ngrok installation and configuration."
    echo "-------------------------------------------------"
    cleanup
    exit 1
fi

# Fetch the public URL from the ngrok API, with retries
NGROK_URL=""
RETRY_COUNT=0
MAX_RETRIES=5
while [ -z "$NGROK_URL" ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "Attempting to fetch ngrok URL (attempt $((RETRY_COUNT+1)))..."
    API_RESPONSE=$(curl -s http://127.0.0.1:4040/api/tunnels)
    NGROK_URL=$(echo $API_RESPONSE | grep -o 'https://[0-9a-z.-]*.ngrok-free.app' | head -n 1)

    if [ -z "$NGROK_URL" ]; then
        sleep 2
        RETRY_COUNT=$((RETRY_COUNT+1))
    fi
done

echo "-------------------------------------------------"
echo "Backend running on port $BACKEND_PORT"
echo "Frontend running on http://localhost:$FRONTEND_PORT"
if [ -n "$NGROK_URL" ]; then
    echo "Public URL (ngrok): $NGROK_URL"
else
    echo "ERROR: Could not retrieve ngrok URL after $MAX_RETRIES attempts."
    echo "Please check ngrok status."
    echo ""
    echo "--- ngrok log ($NGROK_LOG_FILE) ---"
    tail -n 20 $NGROK_LOG_FILE
    echo "------------------------------------"
fi
echo "-------------------------------------------------"
echo "Press Ctrl+C to stop all services"

wait
