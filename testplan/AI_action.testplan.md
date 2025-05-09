# 🤖 Test Plan – AI-Initiated Shell Actions

## Description
This test plan defines the expected behavior when the AI issues shell commands via `execCommand`. It ensures correctness, verifiability, and safe failure modes.

---

## ✅ Positive Scenarios

- [ ] When AI replies with: `mkdir -p /tmp/ai-test`, the folder must be created
- [ ] If `echo "test" > /tmp/ai-test/README.md` is run, file content must match
- [ ] If a command creates multiple outputs, all should exist and be verified

---

## ❌ Negative Scenarios

- [ ] AI issues command to protected directory → proper error is thrown
- [ ] AI issues invalid shell command → captured and reported cleanly
- [ ] AI repeats command → system must handle idempotency or warn

---

## 🧪 Associated Modules

- `src/execCommand.js`
- `src/renderer.js` (UI execution flow)
- AI response interpreter (planned)

---

## 🚧 Notes

- These tests will be partially manual until interpreter logic is testable.
- Test coverage will expand with the `Auto AI` controller feature.
