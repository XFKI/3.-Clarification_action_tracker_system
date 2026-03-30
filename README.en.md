# Clarification Action Tracker System (English)

A personal productivity system for FLNG/FPSO EPC equipment procurement design, focused on technical clarification logging, action closure, and risk tracking.

## Resume Highlights

- Clear business impact: improves data entry speed, tracking visibility, closure rate, and review efficiency.
- End-to-end architecture: SPA frontend + lightweight Python backend + SQLite for reliable local operation.
- Closed-loop workflow: Clarification/Meeting input -> Action aggregation -> Dashboard analytics -> Excel I/O.
- Engineering quality: status normalization, batch operations, risk exposure, audit history, recycle restore.
- Deployment strategy: keep local forced-backend mode while enabling Vercel web-demo mode.

## 1. Tech Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript (ES6)
- Visualization: Chart.js
- Excel Integration: SheetJS (xlsx)
- Local Backend: Python 3 + http.server
- Local DB: SQLite
- PDF Comment Extraction: PyMuPDF (backend-first)
- Scripts: batch/shell scripts
- Web Deployment: Vercel Static Hosting

## 2. Core Features

- Structured Clarification and Meeting records
- Auto-generated Action board for open items
- Due/overdue/high-priority risk visibility
- Batch update for status, owner, date, and priority
- Auditability with metadata and change history
- Recycle/restore and cleanup support
- Independent PDF comment board: import, filter, selective export

Note: The document management board is temporarily disabled and does not affect core workflow.

## 3. Runtime Modes

### 3.1 Local Backend Mode (recommended for production)

- Behavior: forced backend mode, data and attachments stored in local SQLite.
- Start:

```bat
quick-start.bat --serve 5500
```

or

```bash
sh quick-start.sh 5500
```

### 3.2 Vercel Web Mode (recommended for demo)

- Behavior: no local Python process required, suitable for restricted enterprise laptops.
- Access pattern: append `?mode=web` to the deployed URL.
- Example: `https://your-project.vercel.app/?mode=web`

Important: web mode uses browser local storage; do not treat it as the only production data source.

## 4. Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, click `Add New Project` and import this repo.
3. Select `Other` framework, no build command needed.
4. Deploy from root directory.
5. Open `https://xxx.vercel.app/?mode=web`.

Included in this repo:

- `.vercelignore` (excludes backend/data/large files)
- `vercel.json` (static deployment config)

## 5. Project Structure

```text
index.html
assets/
  css/styles.css
  js/app.core.js
  js/app.features.js
backend/
data/
README.md
README.zh-CN.md
README.en.md
.vercelignore
vercel.json
.gitignore
```

## 6. Resume-ready Description

- Built a clarification and action-tracking system for EPC equipment engineering, covering a full loop from intake to closure and retrospective analysis.
- Implemented a lightweight stack (Vanilla JS + Python + SQLite) with batch updates, risk dashboarding, audit history, and Excel round-trip integration.
- Delivered dual runtime strategy: reliable local forced-backend mode and Vercel web mode for online demos in restricted office environments.
