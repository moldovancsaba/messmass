// scripts/config.js
// Centralized configuration for Node scripts (CommonJS)
// Aligns with lib/config.ts but stays JS/require-friendly

const path = require('path');
const dotenv = require('dotenv');

// Load .env.local from project root
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

function requireEnv(name) {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

const config = {
  mongodbUri: requireEnv('MONGODB_URI'),
  dbName: (process.env.MONGODB_DB && process.env.MONGODB_DB.trim()) || 'messmass',
  adminPassword: (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim()) || 'MessMassAdmin2025!',
  nextPublicWsUrl: (process.env.NEXT_PUBLIC_WS_URL && process.env.NEXT_PUBLIC_WS_URL.trim()) || undefined,
  nodeEnv: process.env.NODE_ENV || 'development',
};

module.exports = config;
