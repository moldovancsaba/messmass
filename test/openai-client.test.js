import { strict as assert } from 'assert';
import { queryOpenAI } from '../src/ai/openaiClient.js';

describe('OpenAI Client', () => {
  it('should return a valid response from the API', async () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'List files in current directory.' }
    ];

    const response = await queryOpenAI(messages);
    assert.ok(typeof response === 'string', 'Expected a string response');
    assert.ok(response.includes('ls') || response.includes('dir'), 'Response should contain a known shell command');
  });
});