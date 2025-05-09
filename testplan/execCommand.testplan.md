# 🧪 Test Plan – execCommand()

## Description
Asynchronous wrapper for `child_process.exec` that resolves stdout or throws on error.

---

## ✅ Positive Cases

- [x] `echo hello` → returns "hello"
- [ ] `ls` → returns directory listing (to be tested later)

## ❌ Negative Cases

- [ ] `invalidcommand` → throws error

---

## 🔗 Associated Test File

- `test/execCommand.test.js`
