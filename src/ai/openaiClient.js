import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-3.5-turbo'; // nem használunk GPT-4-et, hogy kerüljük a hozzáférési hibákat

export async function queryOpenAI(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('❌ Prompt must be a valid string.');
  }

  const url = 'https://api.openai.com/v1/chat/completions';

  const body = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: 'You are a helpful assistant that generates valid JSON command plans from natural language.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`OpenAI API Error: ${JSON.stringify(data)}`);
  }

  return data.choices[0].message.content;
}