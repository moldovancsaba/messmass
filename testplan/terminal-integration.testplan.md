# <0001f9e2> Test Plan – Terminal Integration

## 🎯 Purpose
Verify that the messmass terminal behaves like a real shell environment:
- Accepts `cd`, `ls`, `pwd`, etc.
- Maintains correct working directory
- Reflects prompt correctly
- Supports AI-generated command execution when in AI modes

---

## ✅ Positive Scenarios
- [ ] `cd some/folder` navigates and updates prompt
- [ ] `ls` shows directory content
- [ ] Shell prompt updates to reflect `cwd`
- [ ] `Auto AI` executes AI-parsed bash when active
- [ ] Human mode blocks AI parsing
- [ ] Switching back restores correct context

---

## 🚫 Negative Scenarios
- [ ] Invalid `cd` results in error
- [ ] Broken command returns stderr
- [ ] AI command with no plan returns warning
- [ ] Human command misparsed as AI is ignored in Human mode

---

## 🔁 Reproducibility
Each scenario must pass reliably in isolated test run.
