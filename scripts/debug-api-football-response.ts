import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.API_FOOTBALL_KEY;

async function debugResponse() {
  const response = await fetch('https://v3.football.api-sports.io/teams?search=AS Roma', {
    headers: {
      'x-apisports-key': apiKey!,
    },
  });

  const data = await response.json();
  console.log('\n📦 Full API Response:\n');
  console.log(JSON.stringify(data, null, 2));
}

debugResponse();
