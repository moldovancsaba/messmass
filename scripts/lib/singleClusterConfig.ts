import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

let envLoaded = false;

function ensureEnvLoaded(): void {
  if (envLoaded) return;
  envLoaded = true;
  const envLocal = path.resolve(process.cwd(), '.env.local');
  const envDefault = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envLocal)) {
    dotenv.config({ path: envLocal });
  } else if (fs.existsSync(envDefault)) {
    dotenv.config({ path: envDefault });
  }
}

export function requireMessmassUri(): string {
  ensureEnvLoaded();
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
    throw new Error(
      'Missing or invalid MONGODB_URI. Scripts must connect exclusively to the single configured Messmass cluster via MONGODB_URI (never hardcode cluster URIs or credentials).'
    );
  }
  return uri;
}

export function optionalCameraUri(): string | null {
  ensureEnvLoaded();
  const uri = process.env.CAMERA_MONGODB_URI?.trim();
  if (!uri) return null;
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error('Invalid CAMERA_MONGODB_URI format.');
  }
  return uri;
}

export function extractMongoHost(uri: string): string {
  const withoutScheme = uri.replace(/^mongodb(?:\+srv)?:\/\//, '');
  const atIndex = withoutScheme.lastIndexOf('@');
  const hostAndRest = atIndex >= 0 ? withoutScheme.slice(atIndex + 1) : withoutScheme;
  return hostAndRest.split('/')[0]?.split('?')[0] || 'unknown-host';
}
