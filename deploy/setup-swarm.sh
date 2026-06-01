#!/bin/bash
set -e

echo "======================================"
echo " Setting up Docker Swarm on ARM64     "
echo "======================================"

echo "[1/2] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    echo "Docker installed successfully."
else
    echo "Docker is already installed."
fi

echo "[2/2] Initializing Docker Swarm..."
# Using || true to prevent the script from failing if the node is already part of a swarm
docker swarm init || true

echo "======================================"
echo " Docker Swarm setup complete!         "
echo "======================================"
