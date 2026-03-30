<div align="center">

# Clarification Action Tracker System

**Clarification & Action Tracker · FLNG/FPSO EPC**

[![English](https://img.shields.io/badge/English-Primary-0B5FFF)](README.md)
[![中文](https://img.shields.io/badge/%E4%B8%AD%E6%96%87-Switch-334155)](README.zh-CN.md)

[![Deploy on Vercel](https://img.shields.io/badge/Deploy_on-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https://github.com/XFKI/3.-Clarification_action_tracker_system)
[![Deploy to GitHub Pages](https://img.shields.io/badge/Deploy_to-GitHub_Pages-222?logo=github&logoColor=white)](https://github.com/XFKI/3.-Clarification_action_tracker_system/actions/workflows/github-pages-deploy.yml)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-F7DF1E?logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python_3-3776AB?logo=python&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)

</div>

A lightweight engineering tracker for FLNG/FPSO EPC procurement design.
It converts clarification and meeting records into actionable tasks, risk visibility, and export-ready reporting.

---

## Highlights

| Module | Value |
| --- | --- |
| Structured Input | Clarification/Meeting records with inline edit and validation |
| Action Aggregation | Auto-build open actions and support source writeback |
| Risk Exposure | Overdue, high-priority, owner workload, due-soon |
| Dashboard | KPI cards + Chart.js trend views |
| Excel I/O | SheetJS import/export for engineering handover |
| PDF Comments | Extract, review, and export PDF annotations |
| Auditability | Change history + recycle/restore |

## Tech Stack

### Stack Icons

- 🌐 Frontend: HTML5 + CSS3 + Vanilla JavaScript (ES6)
- 📈 Visualization: Chart.js
- 📄 Excel Engine: SheetJS (xlsx)
- 🐍 Local API: Python 3 + http.server
- 🗄️ Storage: SQLite
- 🧾 PDF Mining: PyMuPDF
- 🚀 Hosting: Vercel + GitHub Pages

### Stack Map

| Layer | Technology | Role |
| --- | --- | --- |
| UI | Vanilla JS, HTML5, CSS3 | Lightweight SPA interaction |
| Charts | Chart.js | KPI and trend visualization |
| Data Exchange | SheetJS | Excel import and export |
| Local Service | Python http.server | Local backend endpoints |
| Persistence | SQLite | Reliable single-file storage |
| PDF Extraction | PyMuPDF | PDF comment parsing |
| Web Delivery | Vercel, GitHub Pages | Online demo deployment |

## Architecture

```mermaid
flowchart LR
  A[Clarifications] --> C[Actions View]
  B[Meetings] --> C
  C --> D[Dashboard]
  A --> E[Excel I/O]
  B --> E
  F[PDF Comments] --> E
```

```mermaid
flowchart TB
  subgraph Local[Local Backend Mode]
    L1[Python Server]
    L2[SQLite data/tracker.db]
  end

  subgraph Web[Web Mode]
    W1[Static Hosting]
    W2[Browser localStorage + IndexedDB]
  end

  UI[SPA Frontend] --> L1 --> L2
  UI --> W1 --> W2
```

## Runtime Modes

### 1) Local Backend Mode (recommended)

```bat
quick-start.bat --serve 5500
```

```bash
sh quick-start.sh 5500
```

- Data and attachments are persisted in local SQLite.
- Stop backend:

```bat
quick-stop.bat 5500
```

### 2) Web Mode (Vercel / GitHub Pages)

- Vercel URL:

```text
https://<your-domain>.vercel.app/?mode=web
```

- GitHub Pages URL:

```text
https://xfki.github.io/3.-Clarification_action_tracker_system/
```

- Browser storage is used in web mode, suitable for demo/restricted devices.

## Deployment

### One-Click Deploy

[![Deploy on Vercel](https://img.shields.io/badge/Deploy_on-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https://github.com/XFKI/3.-Clarification_action_tracker_system)
[![Deploy to GitHub Pages](https://img.shields.io/badge/Deploy_to-GitHub_Pages-222?logo=github&logoColor=white)](https://github.com/XFKI/3.-Clarification_action_tracker_system/actions/workflows/github-pages-deploy.yml)

### Manual Notes

1. Vercel: Framework = Other, Build command empty.
2. GitHub Pages: run `.github/workflows/github-pages-deploy.yml`.
3. For Vercel demo, append `?mode=web` if needed.

## UI Preview

### 1) English Dashboard

![English Dashboard](docs/screenshots/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260330235223_206_339.png)

### 2) Chinese Dashboard

![Chinese Dashboard](docs/screenshots/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260330235239_207_339.png)

### 3) Actions Board

![Actions Board](docs/screenshots/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260330235319_208_339.png)

## Quick Workflow

1. Input new records in Clarifications/Meetings.
2. Work from Actions: overdue -> high-priority -> due soon.
3. Review owner risks in Dashboard.
4. Export Excel for weekly handover/archive.

## Project Structure

```text
index.html
assets/
  css/styles.css
  js/app.core.js
  js/app.features.js
backend/
data/
docs/
  screenshots/
README.md
README.zh-CN.md
```

## Notes

- Document management board is temporarily disabled and does not block core workflow.
- Current status values: OPEN / IN_PROGRESS / INFO / CLOSED.
- Long-term normalization target: OPEN / IN_PROGRESS / CLOSED.
