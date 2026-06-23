# 辩题库项目交接文档

## 项目概述
British Parliamentary 辩论备赛系统，包含题卡管理、AI 辅助、复述训练、词汇积累等模块。

---

## 已完成功能清单

### ✅ Motions（题卡管理）
- **列表页**（MotionListPage.jsx）
  - 三行筛选器：搜索框 + 排序（Newest First/Oldest First/A-Z）
  - Motion Type 筛选按钮（All/THW/THBT/THO/THP/THR/THS）
  - Tags 多选筛选（90+ 英文标签）
  - 点击卡片跳转详情页
  
- **编辑页**（MotionEditPage.jsx）
  - 顶部操作：← Back | Duplicate | Delete | Save
  - Motion 文本 + 🔊 朗读按钮
  - **Basic Info**（默认折叠）：Motion Type + Tags
  - **Core Clash**（默认展开）：自动联想历史值
  - **Characterization / Status Quo** 输入框
  - **Pro Arguments**（默认展开）：最多3个论点，Expand All/Collapse All
  - **Con Arguments**（默认展开）：最多3个论点
  - **Post-Round Review**（默认折叠）：Adjudicator Feedback + Next Improvement
  - 数据直接存储到 Firestore

### ✅ Frameworks（万能模块）
- 创建可复用论证框架
- 关联到具体 Motion

### ✅ Vocabulary（词汇本）
- 添加/编辑/删除词汇
- 关联到具体 Motion
- 朗读功能

### ✅ Shadowing（复述训练）
- 选择题卡
- 设置复述时长（30s/1min/2min/4min/7min）
- 倒计时后展示论点对照

### ✅ AI Coach（AI 教练）
- 按用途分组：Prepare（备赛）/ Train（训练）
- **Prepare 模式**：
  - Argument Weakness Check
  - Similar Motions
  - Extension Generator
  - PDF Extraction
- **Train 模式**：
  - POI Simulation
  - Micro-story Generator
  - Compression Suggester
- 所有模式英文化
- Prop/Opp 小型 toggle

### ✅ Clash（核心矛盾库）
- 按 Core Clash 分组显示题卡
- A-Z 排序
- 搜索功能

### ✅ Strategy Notes（打法笔记）
- 按 Motion Type 分类的备赛笔记

### ✅ POI 训练
- 模拟短暂质询场景

### ✅ Data（数据统计）
- 题卡数量统计
- 训练次数统计

---

## 待完成功能清单（按优先级）

### 🔴 优先级1：核心功能修复

#### 1. **从文字稿生成论点**
- 位置：Pro Arguments 区域上方
- 功能：
  - "Generate from Script" 按钮
  - 弹出文本框粘贴文字稿
  - 调用 Gemini（buildTranscriptExtractPrompt）
  - Loading 状态显示 "Generating..."
  - 预览结果，用户点击 Confirm 写入
  - 不覆盖已有内容
- 相关文件：`src/ai/prompts.js` (buildTranscriptExtractPrompt 已存在)

#### 2. **朗读功能扩展**
- Pro/Con Arguments 每个论点展开内容旁加 🔊 按钮
- 朗读内容：Claim + Mechanism + Impact 拼接
- AI Coach 每次回复下方加 🔊 按钮
- 使用：`src/hooks/useSpeech.js`

#### 3. **Stakeholder Analysis**
- 位置：Characterization 输入框下方
- 功能：
  - "Stakeholder Analysis" 按钮
  - 调用 Gemini 生成5-8个利益相关方
  - 每个旁边 "Generate Argument" 按钮
  - 生成 claim + mechanism + impact 预览
  - "Add to Prop" 和 "Add to Opp" 按钮
- 相关 prompt：`buildStakeholderPrompt`, `buildStakeholderArgumentPrompt`（已在 prompts.js）

### 🟡 优先级2：增强功能

#### 4. **My Arguments 区域**
- 位置：Con Arguments 下方，Post-Round Review 上方
- 功能：
  - 显示 Firestore `userArguments` collection
  - 每条显示：论点名称 + 内容摘要 + 标签
  - "Add to Prop" 和 "Add to Opp" 按钮
  - 底部 "+ New Argument" 按钮
  - 支持按标签筛选

#### 5. **AI Coach 完善**
- Extension Generator：
  - 选辩题下拉
  - Prop/Opp toggle
  - 文本框输入 "What did Opening already argue?"
  - 生成3个 Extension 方向
- Micro-story Generator：
  - 独立文本输入框（不选辩题）
  - Placeholder: "Enter your mechanism chain, e.g. AI automation → job loss → inequality"
- Compression Suggester：
  - 独立文本输入框（不选辩题）
  - Placeholder: "Enter your verbose expression in Chinese or English"

### 🟢 优先级3：界面优化

#### 6. **Clash 页面格式**
- 所有 clash 条目改成 "English Name（中文名）" 格式
- 文件：`src/pages/ClashPage.jsx`

#### 7. **VocabListPage BP Jargon 标签页**
- 顶部加两个标签切换：
  - **BP Jargon**：读取 `src/data/debateTerms.js` 显示20个术语
  - **My Vocabulary**：原有功能
- 支持搜索过滤

---

## 重要文件路径

### 📁 核心页面
- `src/pages/MotionEditPage.jsx` — Motion 编辑页（完全重建）
- `src/pages/MotionListPage.jsx` — Motion 列表页（筛选器已增强）
- `src/pages/CoachPage.jsx` — AI Coach 页面
- `src/pages/ClashPage.jsx` — Clash 页面
- `src/pages/VocabListPage.jsx` — 词汇页面

### 📁 数据与配置
- `src/data/debateTaxonomy.js` — 90+ 英文标签 + Motion Types
- `src/data/debateTerms.js` — BP Jargon 术语（20个）
- `src/data/motions.js` — Motion CRUD 操作
- `src/ai/prompts.js` — 所有 Gemini prompts

### 📁 组件
- `src/components/ArgumentEditor.jsx` — 论点编辑器
- `src/components/TagInput.jsx` — 标签输入组件
- `src/hooks/useSpeech.js` — 朗读功能 hook

### 📁 Firebase
- `src/firebase/config.js` — Firebase 配置
- `src/auth/AuthProvider.jsx` — 认证上下文

---

## 环境变量

创建 `.env` 文件（不要提交到 Git）：

```env
# Firebase 配置
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Gemini API
VITE_GEMINI_API_KEY=your_gemini_api_key
```

---

## 部署方式

### 开发环境
```bash
npm install
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### Vercel 部署
1. 连接 GitHub 仓库到 Vercel
2. 设置环境变量（在 Vercel Dashboard → Settings → Environment Variables）
3. 每次推送 main 分支自动部署
4. 部署完成后访问：https://debate-library.vercel.app

---

## 技术栈

- **前端框架**：React 18 + Vite
- **路由**：React Router v6
- **样式**：Tailwind CSS
- **数据库**：Firebase Firestore
- **认证**：Firebase Auth
- **AI**：Google Gemini API
- **PDF 处理**：pdf.js
- **语音合成**：Web Speech API
- **部署**：Vercel

---

## Git 提交记录（最近）

- `81c2b1e` - 完成2个关键功能：从文字稿生成论点+AI Coach修复+HANDOVER.md交接文档
- `d7b8805` - 快速修复3件事：删除Source字段+Sort下拉+所有标签英文化
- `6adcd28` - 第二批第3次（最终）：添加Post-Round Review折叠区域+Duplicate按钮
- `35156df` - 第二批第2次：添加Pro Arguments + Con Arguments区域
- `b35a3f5` - 第二批第1次：添加Basic Info折叠区域+Core Clash区域+朗读按钮
- `c474c7b` - 第二批开始：完全重建MotionEditPage（从零开始）

---

## 注意事项

1. **MotionEditPage 是全新重建的**（从旧版579行精简到新版），直接使用 Firestore API，不再依赖中间层函数
2. **所有标签已英文化**：90+ 英文标签在 `SUGGESTED_TAGS`
3. **Source 字段已删除**：不再显示和保存
4. **朗读功能**：Motion 文本旁有 🔊 按钮，待扩展到论点
5. **Core Clash**：支持多选，自动联想历史值

---

## 下一步建议

优先完成待办清单中的 **优先级1** 功能：
1. 从文字稿生成论点（最关键）
2. 朗读功能扩展
3. Stakeholder Analysis

这些功能的 prompt 函数已存在于 `src/ai/prompts.js`，只需添加 UI 和调用逻辑。

---

**文档更新时间**：2026-06-XX
**最新 Commit**：81c2b1e
**Vercel 部署状态**：✅ Active
