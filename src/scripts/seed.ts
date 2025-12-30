#!/usr/bin/env node
/**
 * Database seeding script for test/dev environments
 * Usage: npm run seed -- --env dev
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const envIndex = args.indexOf('--env');
const environment = envIndex !== -1 ? args[envIndex + 1] : 'dev';

// Load appropriate environment file
const envFile = environment === 'prd' ? '.env.prd' : environment === 'test' ? '.env.test' : '.env.dev';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

// Sample categories
const categories = [
  { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#FF6B6B' },
  { id: 'transport', name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#FFE66D' },
  { id: 'utilities', name: 'Utilities', icon: '⚡', color: '#95E1D3' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#F38181' },
  { id: 'healthcare', name: 'Healthcare', icon: '⚕️', color: '#AA96DA' },
  { id: 'education', name: 'Education', icon: '📚', color: '#FCBAD3' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#A8D8EA' },
  { id: 'other', name: 'Other', icon: '📌', color: '#C7CEEA' },
];

// Sample test user data
const testUsers = [
  {
    id: 'test-user-1',
    email: 'testuser1@receiptscan.ai',
    displayName: 'Test User 1',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    id: 'test-user-2',
    email: 'testuser2@receiptscan.ai',
    displayName: 'Test User 2',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

async function seedCategories() {
  console.log('Seeding categories...');
  const batch = db.batch();
  
  categories.forEach((category) => {
    const docRef = db.collection('categories').doc(category.id);
    batch.set(docRef, category);
  });
  
  await batch.commit();
  console.log(`✓ Seeded ${categories.length} categories`);
}

async function seedTestUsers() {
  console.log('Seeding test users...');
  const batch = db.batch();
  
  testUsers.forEach((user) => {
    const docRef = db.collection('users').doc(user.id);
    batch.set(docRef, user);
  });
  
  await batch.commit();
  console.log(`✓ Seeded ${testUsers.length} test users`);
}

async function seedTestReceipts() {
  console.log('Seeding test receipts...');
  const batch = db.batch();
  
  // Create sample receipts for test users
  const sampleReceipts = [
    {
      userId: 'test-user-1',
      merchantName: 'Whole Foods Market',
      total: 125.50,
      date: new Date('2024-01-15'),
      category: 'food',
      items: [
        { name: 'Organic Vegetables', price: 25.00 },
        { name: 'Meat & Poultry', price: 45.50 },
        { name: 'Dairy Products', price: 30.00 },
        { name: 'Miscellaneous', price: 25.00 },
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      userId: 'test-user-1',
      merchantName: 'Shell Gas Station',
      total: 65.00,
      date: new Date('2024-01-16'),
      category: 'transport',
      items: [
        { name: 'Gasoline', price: 65.00 },
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];
  
  sampleReceipts.forEach((receipt) => {
    const docRef = db.collection('receipts').doc();
    batch.set(docRef, receipt);
  });
  
  await batch.commit();
  console.log(`✓ Seeded ${sampleReceipts.length} test receipts`);
}

async function main() {
  console.log(`\n🌱 Seeding database for environment: ${environment}`);
  console.log(`   Project ID: ${process.env.FIREBASE_PROJECT_ID}\n`);
  
  if (environment === 'prd') {
    console.error('❌ Cannot seed production database!');
    process.exit(1);
  }
  
  try {
    await seedCategories();
    await seedTestUsers();
    await seedTestReceipts();
    
    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
}

main();
