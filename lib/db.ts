// Shared MongoDB accessors. Keep database selection centralized so routes and scripts
// use the configured database name consistently.

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
