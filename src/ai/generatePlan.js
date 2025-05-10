import { queryOpenAI } from './openaiClient.js';
import fs from 'fs';

export async function generatePlan(prompt = '') {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('❌ Invalid prompt provided to generatePlan');
  }

  const response = await queryOpenAI(prompt);

  try {
    const jsonStart = response.indexOf('[');
    const jsonEnd = response.lastIndexOf(']') + 1;
    const jsonString = response.slice(jsonStart, jsonEnd);
    const plan = JSON.parse(jsonString);

    fs.mkdirSync('ai_test_dir', { recursive: true });
    fs.writeFileSync('ai_test_dir/plan.json', JSON.stringify(plan, null, 2));

    return plan;
  } catch (e) {
    throw new Error(`❌ Failed to parse AI response:\n${response}\n\n${e.message}`);
  }
}