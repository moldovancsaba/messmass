import { strict as assert } from 'assert';
import { spawn } from 'node-pty';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, before, after } from 'mocha';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("PTY Shell Integration", () => {
  let shell;
  let output = "";

  before((done) => {
    shell = spawn('/bin/zsh', [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: __dirname,
      env: process.env,
    });

    shell.onData((data) => {
      output += data;
      if (output.includes('hello')) {
        done();
      }
    });

    shell.write("echo hello\n");
  });

  it("should echo 'hello' correctly", () => {
    assert.ok(output.includes("hello"));
  });

  after(() => {
    shell.kill();
  });
});