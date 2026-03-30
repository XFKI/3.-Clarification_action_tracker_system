# Clarification Action Tracker System（中文）

面向 FLNG/FPSO EPC 设备采购设计阶段的个人效率工具，用于技术澄清、会议行动闭环与风险追踪。

## 项目亮点（可用于简历）

- 业务价值明确：围绕工程澄清闭环，提升录入效率、追踪效率、闭环效率、复盘效率。
- 前后端一体化：前端单页应用 + Python 轻量后端 + SQLite，支持本地稳定运行。
- 数据闭环完整：澄清/会议录入 -> 行动聚合 -> 仪表盘分析 -> Excel 导入导出。
- 工程化能力：状态归一化、批量操作、风险可视化、审计历史、回收站恢复。
- 部署策略清晰：保留本地强制后端模式，同时支持 Vercel 网页部署演示模式。

## 1. 技术栈

- Frontend: HTML5, CSS3, Vanilla JavaScript (ES6)
- Data Visualization: Chart.js
- Excel Import/Export: SheetJS (xlsx)
- Backend (local): Python 3 + http.server
- Database (local): SQLite
- PDF Comment Extraction: PyMuPDF（后端优先）
- Packaging & Scripts: batch/shell 脚本
- Deployment (web demo): Vercel Static Hosting

## 2. 核心能力

- 澄清与会议记录结构化录入
- 自动聚合行动项（未关闭事项）
- 到期/逾期/高优先级风险可视化
- 批量改状态、责任方、日期、优先级
- 历史追踪（createdAt/updatedAt/updatedBy + history）
- 回收站恢复与全量清理
- PDF 意见独立看板：导入、筛选、勾选导出

说明：文件管理看板当前处于临时下线状态，不影响主流程。

## 3. 运行模式

### 3.1 本地后端模式（生产推荐）

- 特点：强制后端模式，主数据与附件落库到本地 SQLite，稳定且可追溯。
- 启动：

```bat
quick-start.bat --serve 5500
```

或

```bash
sh quick-start.sh 5500
```

### 3.2 Vercel 网页模式（演示推荐）

- 特点：无需本地 Python 进程，适合公司电脑受限场景下的在线访问。
- 启动方式：访问部署地址后追加 `?mode=web`。
- 示例：`https://your-project.vercel.app/?mode=web`

注意：网页模式使用浏览器本地存储，不适合作为唯一生产数据源。

## 4. Vercel 部署步骤

1. 将仓库推送到 GitHub。
2. 在 Vercel 中 `Add New Project`，选择该仓库。
3. Framework 选择 `Other`，无需构建命令。
4. 保持根目录部署，直接点击 Deploy。
5. 部署完成后访问 `https://xxx.vercel.app/?mode=web`。

本项目已提供：

- `.vercelignore`（避免上传后端/数据/大文件）
- `vercel.json`（静态站点配置）

## 5. 项目结构（整理后）

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

## 6. 简历描述建议（可直接使用）

- 设计并实现 EPC 设备采购场景下的技术澄清与行动追踪系统，覆盖“录入-跟踪-闭环-复盘”完整链路。
- 基于 Vanilla JS + Python + SQLite 构建轻量架构，实现批量更新、风险看板、审计追踪与 Excel 双向集成。
- 引入双运行模式：本地强制后端保障数据可靠性，Vercel 网页模式满足受限办公环境的在线演示需求。
