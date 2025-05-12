import { queryOpenAI } from './openaiClient.js';
import fs from 'fs/promises';

export async function generatePlan(promptText) {
  const systemMessage = {
    role: 'system',
    content: 'You are a terminal assistant that returns a valid JSON array of shell commands only. Each item must be an object with a "command" field.'
  };

  const userMessage = {
    role: 'user',
    content: promptText
  };

  const messages = [systemMessage, userMessage];

  const rawResponse = await queryOpenAI(messages);

  let plan;
  try {
    // Remove Markdown-style code blocks if present
    const jsonStart = rawResponse.indexOf('```json');
    const jsonEnd = rawResponse.lastIndexOf('```');
    const cleaned = jsonStart !== -1 ? rawResponse.slice(jsonStart + 7, jsonEnd).trim() : rawResponse.trim();

    plan = JSON.parse(cleaned);

    if (!Array.isArray(plan)) throw new Error('Parsed plan is not an array');

    const allValid = plan.every(
      (item) => typeof item === 'object' && typeof item.command === 'string'
    );

    if (!allValid) {
      throw new Error('Parsed plan items are not valid command objects');
    }

    await fs.writeFile('plan.json', JSON.stringify(plan, null, 2), 'utf8');
    return plan;
  } catch (err) {
    throw new Error(`❌ Invalid JSON from AI:\n${rawResponse}`);
  }
}