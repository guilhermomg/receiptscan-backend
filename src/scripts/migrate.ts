#!/usr/bin/env node
/**
 * Database migration script
 * Usage: npm run migrate -- --env dev
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

interface Migration {
  version: string;
  description: string;
  up: () => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: '1.0.0',
    description: 'Initial schema setup',
    up: async () => {
      console.log('Setting up initial collections...');
      // Create migration tracking document
      await db.collection('_migrations').doc('current').set({
        version: '1.0.0',
        appliedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    },
  },
];

async function getCurrentVersion(): Promise<string> {
  const doc = await db.collection('_migrations').doc('current').get();
  return doc.exists ? doc.data()?.version || '0.0.0' : '0.0.0';
}

async function applyMigration(migration: Migration) {
  console.log(`\nApplying migration ${migration.version}: ${migration.description}`);
  
  try {
    await migration.up();
    
    // Update migration tracking
    await db.collection('_migrations').doc('current').set({
      version: migration.version,
      appliedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Add to migration history
    await db.collection('_migrations').doc(`history_${migration.version}`).set({
      version: migration.version,
      description: migration.description,
      appliedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`✓ Migration ${migration.version} applied successfully`);
  } catch (error) {
    console.error(`✗ Migration ${migration.version} failed:`, error);
    throw error;
  }
}

async function main() {
  console.log(`\n🔄 Running migrations for environment: ${environment}`);
  console.log(`   Project ID: ${process.env.FIREBASE_PROJECT_ID}\n`);
  
  try {
    const currentVersion = await getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);
    
    const pendingMigrations = migrations.filter(
      (m) => m.version > currentVersion
    );
    
    if (pendingMigrations.length === 0) {
      console.log('\n✓ Database is up to date. No migrations needed.');
      process.exit(0);
    }
    
    console.log(`\nFound ${pendingMigrations.length} pending migration(s)`);
    
    for (const migration of pendingMigrations) {
      await applyMigration(migration);
    }
    
    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
