import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
const endpoint = 'https://api.openai.com/v1/chat/completions';

export async function queryOpenAI(messages) {
  if (!Array.isArray(messages)) {
    throw new TypeError('❌ queryOpenAI expected an array of messages');
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.2
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`❌ OpenAI API error: ${res.status} ${res.statusText}\n${errorText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}