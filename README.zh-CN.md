# Clarification Action Tracker System（中文说明）

英文主文档请看 [README.md](README.md)。

本文件用于中文快速上手，内容保持简洁并与英文主文档一致。

## 这套工具解决什么问题

- 把技术澄清和会议问题结构化录入
- 自动聚合未关闭项到 Actions 执行视图
- 用仪表盘快速暴露逾期和高优先级风险
- 一键导出 Excel，便于对外沟通和归档

## 运行模式

### 1) 本地后端模式（生产推荐）

- 数据落在本机 SQLite: data/tracker.db
- Windows:

```bat
quick-start.bat --serve 5500
```

- Linux/macOS:

```bash
sh quick-start.sh 5500
```

### 2) 网页模式（演示推荐）

- 访问部署地址并追加 ?mode=web
- 示例：

```text
https://<your-domain>/?mode=web
```

- 数据存储在浏览器 localStorage/IndexedDB，建议定期导出备份

## 核心流程（每天按这个走）

1. 在 Clarifications/Meetings 录入新问题。
2. 在 Actions 按逾期、高优先级、临近到期顺序推进。
3. 在 Dashboard 查看责任方负荷和关闭率。
4. 导出 Excel 做周报、对外沟通和归档。

## 三张示例截图

主文档已内嵌三张示例图，放置路径为：

- docs/screenshots/01-dashboard-en.png
- docs/screenshots/02-dashboard-zh.png
- docs/screenshots/03-actions-board.png

## 技术栈（简版）

- Frontend: HTML5 + CSS3 + Vanilla JavaScript
- Charts: Chart.js
- Excel: SheetJS (xlsx)
- Backend: Python http.server
- DB: SQLite
- PDF: PyMuPDF
- Deployment: Vercel / GitHub Pages

## 目录

```text
index.html
assets/
backend/
data/
docs/screenshots/
README.md
README.zh-CN.md
```

## 说明

- 文件管理看板目前临时下线，不影响主流程。
- 当前可见状态：OPEN / IN_PROGRESS / INFO / CLOSED。
