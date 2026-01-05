#!/bin/bash
set -e

echo "=== n8n Docker Entrypoint ==="
echo "Starting n8n and importing workflows..."

# Set default values
N8N_HOST=${N8N_HOST:-0.0.0.0}
N8N_PORT=${N8N_PORT:-5678}
WORKFLOWS_DIR=${WORKFLOWS_DIR:-/data/n8n_workflows}

# Export environment variables for the import script
export N8N_HOST
export N8N_PORT
export N8N_PROTOCOL=${N8N_PROTOCOL:-http}
export N8N_BASIC_AUTH_USER
export N8N_BASIC_AUTH_PASSWORD
export WORKFLOWS_DIR

# Start n8n in the background
echo "Starting n8n..."
n8n start &
N8N_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "Shutting down n8n..."
    kill $N8N_PID 2>/dev/null || true
    wait $N8N_PID 2>/dev/null || true
    exit 0
}

# Trap signals
trap cleanup SIGTERM SIGINT

# Wait a bit for n8n to start
sleep 5

# Run workflow import script
echo "Importing workflows..."
if [ -f "/data/scripts/import-workflows.js" ]; then
    node /data/scripts/import-workflows.js
else
    echo "Warning: Import script not found at /data/scripts/import-workflows.js"
fi

# Keep n8n running
echo "n8n is running. Waiting for process $N8N_PID..."
wait $N8N_PID
