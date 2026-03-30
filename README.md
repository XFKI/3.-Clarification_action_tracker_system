<div align="center">

# 工程澄清与行动追踪系统

**Clarification & Action Tracker · FLNG/FPSO EPC**

🇨🇳 中文 &nbsp;|&nbsp; [🇬🇧 English](README.en.md)

[![Deploy on Vercel](https://img.shields.io/badge/Deploy_on-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https://github.com/XFKI/3.-Clarification_action_tracker_system)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/Vanilla_JS-F7DF1E?logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python_3-3776AB?logo=python&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)

</div>

> 面向 FLNG/FPSO EPC 采购设计阶段的个人工程效率工具。结构化录入技术澄清与会议行动，自动聚合待办、暴露逾期风险，支持**本地 SQLite 后端**与 **Vercel 网页**双模式运行，无需框架依赖，可离线使用。

---

## ✨ 核心能力

| 模块 | 说明 |
|------|------|
| 📋 **结构化录入** | 澄清/会议行内编辑，必填校验，字典自定义 |
| 🔁 **行动聚合** | 自动汇聚未关闭项，关闭回写源记录 |
| ⚠️ **风险暴露** | 逾期 / 高优先级 / 责任方负荷，组合筛选 |
| 📊 **仪表盘** | KPI + Chart.js 统计图，7 天趋势 |
| 📁 **Excel I/O** | SheetJS 双向导入导出，兼容工程团队 Excel 习惯 |
| 🗂️ **PDF 意见** | 批量提取 PDF 批注，独立展示与导出 |
| 🔍 **审计追踪** | 字段变更历史 + 回收站恢复 |

## 🛠️ 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端 | Vanilla JS (ES6) · HTML5 · CSS3 | 零框架依赖，部署轻，离线可用 |
| 可视化 | Chart.js | KPI 与风险趋势统计图 |
| 数据交换 | SheetJS (xlsx) | Excel 双向集成 |
| 本地服务 | Python 3 · http.server | 脚本一键启动，Windows 批处理友好 |
| 持久化 | SQLite | 单文件 DB，备份与迁移简单 |
| PDF 提取 | PyMuPDF | 工程图纸批注稳定提取 |
| 在线部署 | Vercel Static Hosting | 受限办公环境可在线访问 |

## 🚀 运行方式

### 方式一：本地后端模式（推荐，数据持久化）

```bat
REM Windows
quick-start.bat --serve 5500
```

```bash
# Linux / macOS
sh quick-start.sh 5500
```

脚本自动在后台启动 `backend/server.py`，数据存入 `data/tracker.db`，可直接关闭终端。停止后端：

```bat
quick-stop.bat 5500
```

### 方式二：Vercel 网页模式（公司受限设备推荐）

**控制台部署（推荐）：**

1. 点击上方 Deploy on Vercel 徽章，或在 [vercel.com](https://vercel.com) 导入仓库 `XFKI/3.-Clarification_action_tracker_system`
2. Framework 选 **Other**，Build Command **留空**，直接 Deploy
3. 访问生成的 URL（`*.vercel.app` 域名自动进入网页模式，无需额外参数）

**CLI 部署：**

```bash
npx vercel login
npx vercel --prod --yes
```

> ⚠️ 网页模式使用浏览器 localStorage / IndexedDB 存储数据，适合演示与受限环境，不建议作为唯一生产数据源。本地后端模式不受影响，两种模式互不干扰。

## ⌨️ 常用快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + N` | 新建条目 |
| `Ctrl + S` | 保存当前编辑 |
| `Ctrl + Shift + X` | 快速关闭当前行 |
| `Alt + 1~5` | 切换主标签页 |

## 📁 目录结构

```text
index.html                   # 应用入口（SPA）
assets/
  css/styles.css             # 全局样式
  js/app.core.js             # 核心逻辑：数据、后端同步、状态管理
  js/app.features.js         # 功能模块：渲染、导入导出、图表
backend/
  server.py                  # Python 本地 API 服务
  extract_pdf_comments.py    # PDF 批注离线提取脚本
data/
  tracker.db                 # 本地 SQLite（启动后自动创建）
vercel.json                  # Vercel 静态部署配置
.vercelignore                # 排除 backend / data 等后端目录
```

## 推荐工作流

1. 在 **Clarifications / Meetings** 录入或导入 Excel
2. 每日优先处理 **Actions**（顺序：逾期 → HIGH → 7 天内到期）
3. 在 **Dashboard** 查看责任方风险与周负荷
4. 每周导出 Excel 归档，对外沟通前先导出备份

---

> 当前版本为本地单机工具，不含服务端备份、权限控制和多端协同。详细技术文档见 [README.zh-CN.md](README.zh-CN.md)。
