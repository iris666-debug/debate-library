# 辩题库项目文档

## 项目概述

**辩题库（debate-library）** — 个人 BP 辩论题卡管理与训练工具

- **技术栈**: React (Vite) + Firebase (Firestore + Auth) + Gemini AI
- **部署**: 
  - 主站: GitHub Pages (https://iris666-debug.github.io/debate-library/)
  - AI 功能: Vercel Serverless Functions (待部署，API Key 安全方案)
- **用户**: 单用户，手动登录一个预设的 Firebase 账号
- **数据存储**: 云端 Firestore，多设备同步

---

## 开发者背景

**重要**: 开发者是电脑小白，所有代码改动最终通过以下流程完成：
1. Claude Code 在本地生成/修改代码
2. 开发者手动复制代码文件内容
3. 粘贴到 GitHub 网页编辑器
4. GitHub Pages 自动部署

**不会使用命令行工具**，所有 git/npm 操作由 Claude Code 代劳。

---

## 已实现功能模块

### 1. 题卡管理 (`/`)
- **位置**: `src/pages/MotionListPage.jsx`、`MotionDetailPage.jsx`、`MotionEditPage.jsx`
- **功能**:
  - 录入辩题 Motion + 赛事来源
  - **Motion Type** 下拉选择 (THBT/THO/THP/THR/THS/THW)
  - **Core Clash** 多选标签（支持一张题卡多个核心矛盾，如 "Innovation vs Safety"）
  - **标签系统**: 自由输入 + 预置 100+ 主题推荐（Privacy、Climate Change 等）
  - 正反双方各 3 个论点，每个论点包含:
    - **论点名称**: `name_en` / `name_zh` (英文/中文)
    - Claim / **Mechanism（支持拆步骤）** / Comparative / Impact（双语）
    - 每个论点可添加多条 POI 质询（question + answer，双语）
  - 关联"万能模块"（跨题卡复用的论证框架）
- **筛选**: Motion Type / Core Clash / 标签 / 搜索
- **数据**: `users/{uid}/motions` collection

### 2. 万能模块库 (`/modules`)
- **位置**: `src/pages/ModuleListPage.jsx`、`ModuleDetailPage.jsx`
- **功能**:
  - 存储可复用的论证逻辑（如"市场失灵"、"权利保护"）
  - 字段: 英文名/中文名、定义、应用场景
  - 题卡编辑时可多选关联模块
  - 删除模块时自动清理题卡的关联引用
- **数据**: `users/{uid}/modules` collection

### 3. 词汇本 (`/vocab`)
- **位置**: `src/pages/VocabListPage.jsx`、`VocabFormModal.jsx`
- **功能**:
  - 记录辩论专业词汇（如 power asymmetry、binding arbitration）
  - 字段: 英文词汇、中文释义、辩论用法说明、来源题卡（多选关联）
  - 每个词汇带 🔊 语音朗读按钮
- **数据**: `users/{uid}/vocab` collection

### 4. 复述训练 (`/drill`)
- **位置**: `src/pages/DrillPickerPage.jsx`、`DrillSessionPage.jsx`
- **功能**:
  - 选择题卡 → 选择正方/反方 → 开始复述训练
  - 逐个论点展示，自我标记"流畅/卡顿"
  - 不保存历史记录（纯会话内训练）

### 5. POI 训练 (`/poi`)
- **位置**: `src/pages/PoiPickerPage.jsx`、`PoiSessionPage.jsx`
- **功能**:
  - 选择题卡 → 选择论点 → 练习 POI 应答
  - 显示问题 → 自己作答 → 查看参考答案
  - POI 问题带 🔊 "听发音"按钮（慢速 0.85x 朗读）

### 6. AI 教练 (`/coach`) 🚧
- **位置**: `src/pages/CoachPage.jsx`、`src/ai/gemini.js`、`api/gemini.js`
- **功能**: 4 种模式
  1. **POI 模拟质询**: 选题卡 + 立场 → 生成 4 条 POI 质询
  2. **论点漏洞检查**: 检查正反双方论点逻辑薄弱环节
  3. **相似辩题推荐**: 优先走 Core Clash 精确匹配，兜底文本相似度
  4. **PDF 材料提炼**: 上传 PDF（支持 pdfjs-dist 解析）→ 提炼正方论点/反方攻击点/关键数据
- **AI 模型**:
  - 主模型: `gemini-2.5-flash`
  - 备用模型: `gemini-2.5-flash-lite`（主模型限额后自动切换）
  - 每模型每天 1500 次免费，共 3000 次
- **架构**: 
  - 前端调 `/api/gemini` (Vercel Serverless Function)
  - 后端持有 `GEMINI_API_KEY`，前端不暴露
- **状态**: 代码已完成，**Vercel 部署待完成**（需在 Vercel 网页配置环境变量）

### 7. 语音朗读（全局功能）
- **位置**: `src/components/SpeakButton.jsx`、`src/utils/speech.js`
- **技术**: 浏览器原生 Web Speech API（免费，无需 API）
- **位置**:
  - 题卡详情页: Motion 标题 + 每个论点字段（Claim/Mechanism 等）
  - POI 训练页: 问题标题旁"听发音"
  - 词汇本: 每个词汇旁

### 8. 数据管理 (`/data`)
- **位置**: `src/pages/DataPage.jsx`
- **功能**:
  - 导出全部数据为 JSON（题卡 + 模块 + 词汇）
  - 从 JSON 文件导入恢复数据
  - 清空所有数据

### 9. Motion Type 打法笔记 (`/motion-type-notes`) 🆕
- **位置**: `src/pages/MotionTypeGuidePage.jsx`
- **功能**:
  - 针对 6 种 Motion Type（THBT/THO/THP/THR/THS/THW）各自记录打法心得
  - 每种类型 5 个区块：核心论证要求、正方重心、反方重心、常见误区、示例题
  - 用户自己编辑内容，长期积累（不是 AI 预填）
  - 自动初始化 6 条空文档，不需要手动创建
- **数据**: `users/{uid}/motionTypeNotes` collection

---

## 数据结构

### Firestore Collections
```
users/{uid}/
  ├─ motions/           # 题卡
  ├─ modules/           # 万能模块
  └─ vocab/             # 词汇本

publicMotions/          # 公共题库（37k 条英文辩题，脚本导入）
```

### 题卡字段 (motions)
```js
{
  text: '',              // Motion 原文
  source: '',            // 赛事来源
  motionType: '',        // THBT/THO/THP/THR/THS/THW
  coreClashes: [],       // 核心矛盾数组（旧数据可能是 coreClash 单字符串）
  tags: [],              // 标签数组
  propArgs: [            // 正方论点（3 个）
    {
      name_en: '', name_zh: '',
      claim_en: '', claim_zh: '',
      mechanism_en: '', mechanism_zh: '',        // 旧格式：单一文本
      mechanism_points: [                        // 新格式：拆步骤
        { text_en: '', text_zh: '' }
      ],
      comparative_en: '', comparative_zh: '',
      impact_en: '', impact_zh: '',
      pois: [{ question_en: '', question_zh: '', answer_en: '', answer_zh: '' }]
    }
  ],
  oppArgs: [],           // 反方论点（同结构）
  linkedModuleIds: [],   // 关联的模块 ID 数组
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## 待办事项（已讨论但未实现）

### 1. Vercel 部署 AI 教练（高优先级）
**状态**: 代码已完成，卡在部署环节
- **阻塞原因**: Vercel CLI 在本地网络环境无法连接，需手动在 Vercel 网页配置
- **需要做**:
  1. 访问 https://vercel.com/new，用 GitHub 登录
  2. 导入 `iris666-debug/debate-library` 仓库
  3. 添加环境变量（7 个）:
     - `GEMINI_API_KEY` (后端用)
     - `VITE_FIREBASE_*` 6 个（前端用）
  4. 点 Deploy
- **完成后**: AI 教练功能上线，API Key 安全（不暴露在前端）

### 2. 公共题库浏览页面
**状态**: 数据已准备（37,274 条英文辩题 CSV），导入脚本已完成
- **位置**: `scripts/importPublicMotions.mjs`
- **数据源**: `motions_english_only (1).csv`
- **待做**:
  - 新建 `/public-motions` 页面
  - 搜索/筛选公共题库
  - 一键导入到"我的题卡"
- **导入命令**（一次性执行）:
  ```bash
  node scripts/importPublicMotions.mjs "C:/Users/iris/Downloads/motions_english_only (1).csv"
  ```

### 3. 自动打标签/Core Clash（AI 辅助）
**状态**: 未开始
- 3.7 万条公共题库没有 Motion Type / Core Clash / 标签
- 手工打不现实，需要 AI 批量处理
- 可能方案: 用 Gemini API 批量推断

### 4. GitHub Pages → Vercel 迁移
**状态**: 部分完成
- 当前两个网址:
  - GitHub Pages: https://iris666-debug.github.io/debate-library/ (静态功能)
  - Vercel: 待部署（AI 教练 + 全功能）
- **待决策**: 是否完全迁移到 Vercel，或保留 GitHub Pages 作展示

---

## 项目文件结构

```
辩题库/
├── src/
│   ├── pages/                # 页面组件
│   │   ├── MotionListPage.jsx       # 题卡列表
│   │   ├── MotionDetailPage.jsx     # 题卡详情
│   │   ├── MotionEditPage.jsx       # 题卡编辑
│   │   ├── ModuleListPage.jsx       # 模块列表
│   │   ├── ModuleDetailPage.jsx     # 模块详情
│   │   ├── VocabListPage.jsx        # 词汇本
│   │   ├── DrillPickerPage.jsx      # 复述训练选择
│   │   ├── DrillSessionPage.jsx     # 复述训练会话
│   │   ├── PoiPickerPage.jsx        # POI 训练选择
│   │   ├── PoiSessionPage.jsx       # POI 训练会话
│   │   ├── CoachPage.jsx            # AI 教练
│   │   └── DataPage.jsx             # 数据管理
│   ├── components/           # 通用组件
│   │   ├── Layout.jsx               # 导航栏布局
│   │   ├── ArgumentEditor.jsx       # 论点编辑器
│   │   ├── ArgumentDisplay.jsx      # 论点展示
│   │   ├── TagInput.jsx             # 标签输入框
│   │   ├── SpeakButton.jsx          # 语音朗读按钮
│   │   ├── ModuleMultiSelect.jsx    # 模块多选组件
│   │   ├── MotionMultiSelect.jsx    # 题卡多选组件
│   │   ├── VocabFormModal.jsx       # 词汇表单弹窗
│   │   └── ConfirmDialog.jsx        # 确认对话框
│   ├── data/                 # 数据层
│   │   ├── motions.js               # 题卡 CRUD
│   │   ├── modules.js               # 模块 CRUD
│   │   ├── vocab.js                 # 词汇 CRUD
│   │   ├── publicMotions.js         # 公共题库
│   │   └── debateTaxonomy.js        # Motion Types + 标签预置
│   ├── ai/                   # AI 功能
│   │   ├── gemini.js                # 前端 API 调用
│   │   ├── prompts.js               # AI prompt 构建
│   │   └── pdfText.js               # PDF 文本提取
│   ├── auth/                 # 认证
│   │   └── AuthProvider.jsx         # Firebase Auth 上下文
│   ├── firebase/             # Firebase 配置
│   │   └── config.js
│   ├── hooks/                # 自定义 Hooks
│   │   └── useCollection.js         # Firestore 实时订阅
│   └── utils/                # 工具函数
│       └── speech.js                # Web Speech API
├── api/                      # Vercel Serverless Functions
│   └── gemini.js                    # Gemini API 代理
├── scripts/                  # 脚本
│   └── importPublicMotions.mjs      # 公共题库导入
├── .env.local                # 环境变量（本地，不提交 Git）
├── vercel.json               # Vercel 配置
└── package.json              # 依赖
```

---

## 环境变量

### `.env.local` (本地开发)
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GEMINI_API_KEY=...   # 本地开发用，Vercel 部署时不需要
```

### Vercel 环境变量（服务器端）
```
GEMINI_API_KEY=...         # 后端 Serverless Function 用
VITE_FIREBASE_*=...        # 前端构建时需要（6 个）
```

---

## 恢复项目步骤（重装系统后）

1. 安装 Git、Node.js
2. 克隆仓库:
   ```bash
   git clone https://github.com/iris666-debug/debate-library.git
   cd debate-library
   ```
3. 恢复 `.env.local` 文件（从备份复制）
4. 安装依赖:
   ```bash
   npm install
   ```
5. 本地运行:
   ```bash
   npm run dev
   ```

---

## 已知限制

1. **GitHub Pages 版本无 AI 功能**（静态部署无法安全存储 API Key）
2. **Vercel 部署需手动配置**（CLI 工具在当前网络环境无法使用）
3. **公共题库已导入数据但无前端页面**（搜索/浏览功能未开发）
4. **Firebase Auth 单用户**（无注册页面，手动预设账号）

---

**最后更新**: 2026-06-21
**GitHub 仓库**: https://github.com/iris666-debug/debate-library
**GitHub Pages**: https://iris666-debug.github.io/debate-library/
**Vercel 部署**: 待完成
