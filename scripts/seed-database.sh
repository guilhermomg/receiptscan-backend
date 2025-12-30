#!/bin/bash

# Database Seeding Script for Test Data
# Usage: ./scripts/seed-database.sh [dev|test|prd]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if environment parameter is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Environment parameter is required${NC}"
  echo "Usage: ./scripts/seed-database.sh [dev|test|prd]"
  exit 1
fi

ENVIRONMENT=$1

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|test|prd)$ ]]; then
  echo -e "${RED}Error: Invalid environment '${ENVIRONMENT}'${NC}"
  echo "Valid environments: dev, test, prd"
  exit 1
fi

# Prevent accidental seeding of production
if [ "$ENVIRONMENT" == "prd" ]; then
  echo -e "${RED}Error: Cannot seed production database with test data${NC}"
  echo "Production data should only be created by actual users"
  exit 1
fi

echo -e "${GREEN}Starting database seeding for ${ENVIRONMENT} environment...${NC}"

# Set environment-specific variables
case $ENVIRONMENT in
  dev)
    FIREBASE_PROJECT="receiptscan-dev"
    ;;
  test)
    FIREBASE_PROJECT="receiptscan-test"
    ;;
esac

echo -e "${YELLOW}Firebase Project: ${FIREBASE_PROJECT}${NC}"

# Select Firebase project
firebase use $FIREBASE_PROJECT

echo -e "${GREEN}Seeding test data...${NC}"

# Note: This is a placeholder script. Implement actual seeding logic using:
# 1. Firebase Admin SDK with a Node.js script
# 2. Firestore emulator data import
# 3. Custom TypeScript seeding scripts

# Example structure for seed script:
# node -e "
# const admin = require('firebase-admin');
# admin.initializeApp();
# const db = admin.firestore();
# 
# // Seed test users
# // Seed test receipts
# // Seed test subscriptions
# "

echo -e "${YELLOW}Note: Implement actual seeding logic in a TypeScript/JavaScript file${NC}"
echo -e "${YELLOW}Consider using: npm run seed:${ENVIRONMENT}${NC}"

echo -e "${GREEN}Database seeding completed!${NC}"
