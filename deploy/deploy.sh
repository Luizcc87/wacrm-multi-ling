#!/bin/bash
set -e

echo "======================================"
echo " Deploying Wacrm to Docker Swarm      "
echo "======================================"

if [ ! -f .env ]; then
  echo "Error: .env file not found."
  echo "Please copy .env.example to .env and configure your variables."
  exit 1
fi

# Load env vars for stack deploy (docker stack deploy doesn't read .env natively in some setups)
set -a
source .env
set +a

# Define the stack file (default to postgres if none is passed)
STACK_FILE=${1:-docker-compose.postgres.yml}

if [ ! -f "$STACK_FILE" ]; then
  echo "Error: Stack file '$STACK_FILE' not found."
  exit 1
fi

echo "Deploying the stack 'wacrm' using $STACK_FILE..."
docker stack deploy -c "$STACK_FILE" wacrm

echo "======================================"
echo " Deployment triggered successfully.   "
echo " Run 'docker service ls' to monitor.  "
echo "======================================"
