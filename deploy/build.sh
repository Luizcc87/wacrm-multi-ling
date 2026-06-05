#!/bin/bash
set -e

echo "======================================"
echo " Multi-Architecture Docker Build      "
echo "======================================"

IMAGE_NAME="lc1868/wacrm-multi-ling:latest"

# Setup buildx builder if it doesn't exist
docker buildx create --name multiarch-builder --use || true

# Get the absolute path to the project root
PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)

# Load environment variables if .env exists
if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

echo "Building and pushing multi-arch images (amd64, arm64) for $IMAGE_NAME..."
# Using the project root as the build context
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t "${IMAGE_NAME}" \
  -f "$PROJECT_ROOT/Dockerfile" \
  --push "$PROJECT_ROOT"

echo "======================================"
echo " Build and push complete!             "
echo "======================================"
