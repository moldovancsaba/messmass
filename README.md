# Messmass – Terminal AI Assistant

**Version**: 1.0.0  
**Status**: ✅ Stable  
**License**: MIT

---

## 🧠 Overview

**Messmass** is a developer-focused local terminal assistant powered by AI, combining interactive shell input, context-aware command interpretation, and automated execution. Built using **Electron**, it provides an intuitive terminal-like UI enhanced by AI interaction modes.

---

## 💡 Key Features

- Real-time terminal interface
- Human/AI command modes with toggle
- Optional Auto AI execution
- Session management (save/load/resume)
- Full test coverage with Mocha
- TDD + documentation enforced
- Git-integrated development workflow

---

## 🔧 Tech Stack

- **Frontend**: Electron + HTML/CSS + Vanilla JS
- **Backend**: Node.js
- **AI Layer**: Local planner `generatePlan()` + `runPlan()` executors
- **Testing**: Mocha + Chai
- **Persistence**: Filesystem-based session JSONs

---

## 🧪 Run Tests

```bash
npm test
```

All test files are in `test/` and cover AI behaviour, shell command integration, UI renderer, and session management.

---

## 🚀 Run the App

```bash
npm start
```

Electron will launch a terminal-style UI.  
Use the sidebar to toggle between `HUMAN` and `AI` mode, enable/disable `AUTO AI`, create new sessions, or manually `Run` generated plans.

---

## 🗂️ Project Structure

```text
messmass/
├── src/
│   ├── ai/
│   │   ├── generatePlan.js
│   │   └── runPlan.js
│   └── session/
│       └── sessionManager.js
├── test/
│   ├── ai-behaviour.test.js
│   ├── basic.test.js
│   ├── session.test.js
│   ├── terminal-commands.test.js
│   ├── terminal-pty.test.js
│   └── ui-renderer.test.js
├── testplan/
│   └── *.testplan.md
├── sessions/
│   └── *.json
├── index.html
├── renderer.js
├── main.js
├── package.json
└── README.md
```

---

## 🧠 AI Modes

| Mode        | Description                                                  |
|-------------|--------------------------------------------------------------|
| HUMAN       | Raw terminal shell. Direct shell command entry.              |
| AI          | Interprets natural language and generates a bash plan.       |
| AUTO AI ON  | AI plans are executed immediately without manual confirmation. |
| AUTO AI OFF | AI shows suggested plan; user must confirm via 'Run'.        |

---

## 💾 Sessions

Session states are saved in `/sessions/` as `.json` files.  
They can be restored automatically on app startup.

---

## 🏁 Development Rules

- ✅ TDD enforced
- ✅ All tests must pass before merge
- ✅ Git commits must include version or context
- ✅ No hardcoded paths
- ✅ All interactive UI features must be testable

---

## 🏷️ Versioning

Use semantic versioning.  
Current: `v1.0.0` – "Stable AI and Terminal core features with test coverage"

---

## 🧩 Contributing

This project is maintained privately.  
All contributors must follow internal coding and documentation standards.  
Open to future expansion with GPT/Ollama plugin support.

---