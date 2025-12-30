#!/bin/bash
# Deployment script for Firebase Functions
# Usage: ./scripts/deploy.sh <environment>

set -e

ENVIRONMENT=${1:-dev}

echo "🚀 Deploying to $ENVIRONMENT environment..."

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|test|prd)$ ]]; then
  echo "❌ Invalid environment. Use: dev, test, or prd"
  exit 1
fi

# Load environment variables
if [ "$ENVIRONMENT" == "prd" ]; then
  ENV_FILE=".env.prd"
elif [ "$ENVIRONMENT" == "test" ]; then
  ENV_FILE=".env.test"
else
  ENV_FILE=".env.dev"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Environment file $ENV_FILE not found"
  exit 1
fi

echo "📦 Installing dependencies..."
npm ci

echo "🔍 Running linter..."
npm run lint

echo "🏗️  Building TypeScript..."
npm run build

echo "🔄 Switching to Firebase project..."
firebase use $ENVIRONMENT

echo "📤 Deploying to Firebase..."
firebase deploy --only functions

echo "✅ Deployment to $ENVIRONMENT completed successfully!"

# Run health check
if [ "$ENVIRONMENT" == "dev" ]; then
  BASE_URL="https://api-dev.receiptscan.ai"
elif [ "$ENVIRONMENT" == "test" ]; then
  BASE_URL="https://api-test.receiptscan.ai"
else
  BASE_URL="https://api.receiptscan.ai"
fi

echo "🏥 Running health check..."
sleep 5
curl -f "$BASE_URL/health" || echo "⚠️  Health check endpoint not yet available"

echo "✅ All done!"
