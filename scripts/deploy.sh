#!/bin/bash

# Multi-Environment Deployment Script for receiptscan-backend
# Usage: ./scripts/deploy.sh [dev|test|prd]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if environment parameter is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Environment parameter is required${NC}"
  echo "Usage: ./scripts/deploy.sh [dev|test|prd]"
  exit 1
fi

ENVIRONMENT=$1

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|test|prd)$ ]]; then
  echo -e "${RED}Error: Invalid environment '${ENVIRONMENT}'${NC}"
  echo "Valid environments: dev, test, prd"
  exit 1
fi

echo -e "${GREEN}Starting deployment to ${ENVIRONMENT} environment...${NC}"

# Set environment-specific variables
case $ENVIRONMENT in
  dev)
    ENV_FILE=".env.development"
    FIREBASE_PROJECT="receiptscan-dev"
    ;;
  test)
    ENV_FILE=".env.test"
    FIREBASE_PROJECT="receiptscan-test"
    ;;
  prd)
    ENV_FILE=".env.production"
    FIREBASE_PROJECT="receiptscan-prd"
    ;;
esac

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: Environment file ${ENV_FILE} not found${NC}"
  exit 1
fi

echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}Firebase Project: ${FIREBASE_PROJECT}${NC}"
echo -e "${YELLOW}Environment File: ${ENV_FILE}${NC}"

# Confirmation for production deployment
if [ "$ENVIRONMENT" == "prd" ]; then
  echo -e "${YELLOW}WARNING: You are about to deploy to PRODUCTION!${NC}"
  read -p "Are you sure you want to continue? (yes/no): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
  fi
fi

# Step 1: Install dependencies
echo -e "${GREEN}Step 1: Installing dependencies...${NC}"
npm ci

# Step 2: Run linter
echo -e "${GREEN}Step 2: Running linter...${NC}"
npm run lint

# Step 3: Build the application
echo -e "${GREEN}Step 3: Building application...${NC}"
npm run build

# Step 4: Deploy Firestore rules and indexes
echo -e "${GREEN}Step 4: Deploying Firestore rules and indexes...${NC}"
firebase use $FIREBASE_PROJECT
firebase deploy --only firestore

# Step 5: Deploy Storage rules
echo -e "${GREEN}Step 5: Deploying Storage rules...${NC}"
firebase deploy --only storage

# Step 6: Deploy to Cloud Run or Firebase Functions
echo -e "${GREEN}Step 6: Deploying application...${NC}"

# Note: Adjust deployment target based on your hosting choice
# Option 1: Firebase Functions
# firebase deploy --only functions

# Option 2: Cloud Run (requires additional configuration)
# gcloud run deploy receiptscan-api-${ENVIRONMENT} \
#   --source . \
#   --region us-central1 \
#   --platform managed \
#   --allow-unauthenticated \
#   --set-env-vars="$(cat ${ENV_FILE} | grep -v '^#' | xargs)"

echo -e "${GREEN}Deployment to ${ENVIRONMENT} completed successfully!${NC}"
echo -e "${YELLOW}Don't forget to set environment variables in your deployment platform${NC}"
