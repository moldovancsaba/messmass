const { expect } = require("chai");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

describe("Terminal Command Integration", () => {
  const testDir = path.join(__dirname, "../terminal_test_dir");

  before(() => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
    process.chdir(testDir);
  });

  after(() => {
    process.chdir(__dirname);
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  function run(cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, { shell: "/bin/zsh" }, (err, stdout, stderr) => {
        if (err) return reject(stderr || err.message);
        resolve(stdout.trim());
      });
    });
  }

  it("Create directory", async () => {
    await run(`mkdir sample-dir`);
    expect(fs.existsSync("sample-dir")).to.be.true;
  });

  it("Create file", async () => {
    await run(`echo 'content' > sample-dir/sample.txt`);
    expect(fs.existsSync("sample-dir/sample.txt")).to.be.true;
  });

  it("Copy file", async () => {
    await run(`cp sample-dir/sample.txt sample-dir/sample-copy.txt`);
    expect(fs.existsSync("sample-dir/sample-copy.txt")).to.be.true;
  });

  it("Move file", async () => {
    await run(`mv sample-dir/sample-copy.txt sample-dir/sample-moved.txt`);
    expect(fs.existsSync("sample-dir/sample-moved.txt")).to.be.true;
  });

  it("List directory", async () => {
    const output = await run(`ls sample-dir`);
    expect(output).to.include("sample.txt");
    expect(output).to.include("sample-moved.txt");
  });

  it("Change directory", async () => {
    const output = await run(`cd sample-dir && pwd`);
    expect(output).to.include("sample-dir");
  });

  it("Remove file", async () => {
    await run(`rm sample-dir/sample.txt`);
    expect(fs.existsSync("sample-dir/sample.txt")).to.be.false;
  });

  it("Remove directory", async () => {
    await run(`rm -r sample-dir`);
    expect(fs.existsSync("sample-dir")).to.be.false;
  });
});