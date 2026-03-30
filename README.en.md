<div align="center">

# Clarification & Action Tracker System

**Engineering Tracker for FLNG/FPSO EPC Procurement Design**

[🇨🇳 中文](README.md) &nbsp;|&nbsp; 🇬🇧 English

[![Deploy on Vercel](https://img.shields.io/badge/Deploy_on-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https://github.com/XFKI/3.-Clarification_action_tracker_system)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/Vanilla_JS-F7DF1E?logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python_3-3776AB?logo=python&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)

</div>

> A personal productivity tool for FLNG/FPSO EPC equipment procurement design. Structured intake for technical clarifications and meeting actions, automatic aggregation of open items, overdue risk exposure — runs in both **local SQLite backend mode** and **Vercel web mode**, with zero framework dependencies and offline support.

---

## ✨ Core Features

| Module | Description |
|--------|-------------|
| 📋 **Structured Intake** | Inline editing for clarifications/meetings, field validation, custom dictionaries |
| 🔁 **Action Aggregation** | Auto-collect open items; closure writes back to source records |
| ⚠️ **Risk Exposure** | Overdue / high-priority / owner workload, combined filters |
| 📊 **Dashboard** | KPI cards + Chart.js charts, 7-day trend |
| 📁 **Excel I/O** | SheetJS bidirectional import/export, compatible with team workflows |
| 🗂️ **PDF Comments** | Batch PDF annotation extraction, independent board and export |
| 🔍 **Audit Trail** | Field change history + recycle bin restore |

## 🛠️ Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Vanilla JS (ES6) · HTML5 · CSS3 | Zero-dependency, offline-capable |
| Visualization | Chart.js | KPI & risk trend charts |
| Data Exchange | SheetJS (xlsx) | Excel round-trip integration |
| Local Service | Python 3 · http.server | Script-based startup, Windows batch friendly |
| Persistence | SQLite | Single-file DB, easy backup & migration |
| PDF Extraction | PyMuPDF | Stable engineering annotation extraction |
| Web Deployment | Vercel Static Hosting | Online access for restricted office environments |

## 🚀 Running Modes

### Mode 1: Local Backend Mode (Recommended — persistent data)

```bat
REM Windows
quick-start.bat --serve 5500
```

```bash
# Linux / macOS
sh quick-start.sh 5500
```

The script starts `backend/server.py` in the background; data is saved to `data/tracker.db`. You can close the terminal after startup. To stop:

```bat
quick-stop.bat 5500
```

### Mode 2: Vercel Web Mode (Recommended for restricted company laptops)

**Dashboard deploy (recommended):**

1. Click the Deploy on Vercel badge above, or import `XFKI/3.-Clarification_action_tracker_system` on [vercel.com](https://vercel.com)
2. Select Framework: **Other**, leave Build Command **blank**, then Deploy
3. Visit the generated URL (`.vercel.app` domains auto-activate web mode — no extra parameter needed)

**CLI deploy:**

```bash
npx vercel login
npx vercel --prod --yes
```

> ⚠️ Web mode uses browser localStorage / IndexedDB. Suitable for demos and restricted environments; not recommended as the sole production data source. Local backend mode is unaffected — both modes operate independently.

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | Add new entry |
| `Ctrl + S` | Save current edit |
| `Ctrl + Shift + X` | Quick-close focused row |
| `Alt + 1~5` | Switch main tabs |

## 📁 Project Structure

```text
index.html                   # App entry point (SPA)
assets/
  css/styles.css             # Global styles
  js/app.core.js             # Core logic: data, backend sync, state management
  js/app.features.js         # Feature modules: rendering, import/export, charts
backend/
  server.py                  # Python local API server
  extract_pdf_comments.py    # PDF annotation offline extraction script
data/
  tracker.db                 # Local SQLite (auto-created on startup)
vercel.json                  # Vercel static deployment config
.vercelignore                # Excludes backend / data and other backend directories
```

## Recommended Workflow

1. Input or import Excel in **Clarifications / Meetings**
2. Process **Actions** daily (order: Overdue → HIGH → Due in 7 days)
3. Review owner risk and weekly workload in **Dashboard**
4. Export Excel weekly; always export a backup before clearing data

---

> This is a local single-machine tool. It does not include server-side backup, access control, or multi-device sync. See [README.zh-CN.md](README.zh-CN.md) for full technical documentation (Chinese).
