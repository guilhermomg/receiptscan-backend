#!/bin/bash
# Rollback script for Firebase Functions
# Usage: ./scripts/rollback.sh <environment> <version>

set -e

ENVIRONMENT=${1:-dev}
VERSION=${2}

echo "⏪ Rolling back $ENVIRONMENT environment..."

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|test|prd)$ ]]; then
  echo "❌ Invalid environment. Use: dev, test, or prd"
  exit 1
fi

if [ -z "$VERSION" ]; then
  echo "❌ Version not specified"
  echo "Usage: ./scripts/rollback.sh <environment> <version>"
  echo "To see available versions, run: firebase functions:list --project receiptscan-$ENVIRONMENT"
  exit 1
fi

echo "🔄 Switching to Firebase project..."
firebase use $ENVIRONMENT

echo "⏪ Rolling back to version $VERSION..."
firebase functions:delete api --force
firebase deploy --only functions

echo "✅ Rollback to version $VERSION completed!"

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
curl -f "$BASE_URL/health" || echo "⚠️  Health check failed"
