// lib/db.ts
// Central DB accessor built on top of lib/mongodb and lib/config
// WHAT: Provides getDb() to retrieve the application's configured database
// WHY: Removes repetition of clientPromise + db(config.dbName) across routes

import clientPromise from './mongodb';
import config from './config';

export async function getClient() {
  return clientPromise;
}

export async function getDb() {
  const client = await clientPromise;
  return client.db(config.dbName);
}

export default getDb;
