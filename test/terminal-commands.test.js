import { strict as assert } from 'assert';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, before, after } from 'mocha';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testDir = path.join(__dirname, '../terminal_test_dir');

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: testDir, shell: '/bin/zsh' }, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout.trim());
    });
  });
}

describe("Terminal Command Integration", () => {
  before(() => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
  });

  after(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  it("Create directory", async () => {
    await run("mkdir test-dir");
    assert.ok(fs.existsSync(path.join(testDir, "test-dir")));
  });

  it("Create file", async () => {
    await run("echo 'content' > test-dir/test.txt");
    const content = fs.readFileSync(path.join(testDir, "test-dir/test.txt"), "utf-8");
    assert.equal(content.trim(), "content");
  });

  it("Copy file", async () => {
    await run("cp test-dir/test.txt test-dir/test-copy.txt");
    assert.ok(fs.existsSync(path.join(testDir, "test-dir/test-copy.txt")));
  });

  it("Move file", async () => {
    await run("mv test-dir/test-copy.txt test-dir/test-moved.txt");
    assert.ok(fs.existsSync(path.join(testDir, "test-dir/test-moved.txt")));
  });

  it("List directory", async () => {
    const output = await run("ls test-dir");
    assert.ok(output.includes("test.txt"));
  });

  it("Change directory", async () => {
    const output = await run("cd test-dir && pwd");
    assert.ok(output.endsWith("test-dir"));
  });

  it("Remove file", async () => {
    await run("rm test-dir/test.txt");
    assert.ok(!fs.existsSync(path.join(testDir, "test-dir/test.txt")));
  });

  it("Remove directory", async () => {
    await run("rm -r test-dir");
    assert.ok(!fs.existsSync(path.join(testDir, "test-dir")));
  });
});