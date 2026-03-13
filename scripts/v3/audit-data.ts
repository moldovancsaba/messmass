import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function auditV3() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('messmass');
    
    const metricValuesCount = await db.collection('v3_metric_values').countDocuments();
    console.log('V3 Metric Values Count:', metricValuesCount);
    
    const metricDefsCount = await db.collection('v3_metric_definitions').countDocuments();
    console.log('V3 Metric Definitions Count:', metricDefsCount);
    
    if (metricValuesCount > 0) {
      const sample = await db.collection('v3_metric_values').findOne({});
      console.log('Sample Metric Value:', JSON.stringify(sample, null, 2));
    }

  } finally {
    await client.close();
  }
}

auditV3();
