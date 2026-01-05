#!/bin/bash
# Railway start script for n8n

# Install n8n globally if not already installed
if ! command -v n8n &> /dev/null; then
  echo "Installing n8n..."
  npm install -g n8n
fi

# Start n8n
echo "Starting n8n..."
n8n start
