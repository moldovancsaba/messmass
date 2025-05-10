const path = require("path");
const fs = require("fs");
const os = require("os");
const pty = require("node-pty");
const { expect } = require("chai");

describe("PTY Shell Integration", function () {
  let ptyProcess;
  let testDir;

  before(function () {
    testDir = path.join(os.tmpdir(), "messmass-testdir");
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);

    ptyProcess = pty.spawn("zsh", [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: testDir,
      env: process.env,
    });
  });

  after(function () {
    if (ptyProcess) ptyProcess.kill();
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  it("should echo 'hello' correctly", function (done) {
    let buffer = "";
    ptyProcess.on("data", function (data) {
      buffer += data;
      if (buffer.includes("hello")) {
        expect(buffer).to.include("hello");
        done();
      }
    });
    ptyProcess.write("echo hello\n");
  });
});
