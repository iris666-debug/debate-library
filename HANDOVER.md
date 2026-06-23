# 辩题库项目交接文档

## 项目概述
British Parliamentary 辩论备赛系统，包含题卡管理、AI 辅助、复述训练、词汇积累等模块。

**线上地址**：https://debate-library.vercel.app

---

## 已完成功能清单

### ✅ Motions（题卡管理）

#### 列表页（MotionListPage.jsx）
- 三行筛选器：搜索框 + 排序（Newest First / Oldest First / A-Z）
- Motion Type 筛选按钮（All / THW / THBT / THO / THP / THR / THS）
- Tags 多选筛选（90+ 英文标签）
- 点击卡片跳转详情页

#### 编辑页（MotionEditPage.jsx）
- **顶部操作**：← Back | Duplicate | Delete | Save
- **Motion 文本** + 🔊 朗读按钮
- **Basic Info**（默认折叠）：Motion Type + Tags
- **Core Clash**（默认展开）：自动联想历史值
- **Characterization / Status Quo** 输入框
  - 下方 **Stakeholder Analysis** 按钮（生成 5-8 个利益相关方）
  - 每个利益相关方支持 Generate Argument → Add to Prop/Opp
- **Pro Arguments**（默认展开）：最多 3 个论点
  - "AI Draft" 按钮（直接根据 motion 生成草稿）
  - "Generate from Script" 按钮（粘贴文字稿提取论点）
  - Expand All / Collapse All
  - 每个论点旁有 🔊 朗读按钮（朗读 Claim + Mechanism + Impact）
- **Con Arguments**（默认展开）：同 Pro Arguments
- **Post-Round Review**（默认折叠）：Adjudicator Feedback + Next Improvement
- 数据直接存储到 Firestore

### ✅ Frameworks（万能模块）
- 创建可复用论证框架
- 关联到具体 Motion
- 全英文界面（"Frameworks" / "+ New Framework"）

### ✅ Vocabulary（词汇本）
- **两个标签页**：
  - **BP Jargon**：20 个 BP 辩论术语词典（debateTerms.js）
  - **My Vocabulary**：个人词汇本
- 添加/编辑/删除词汇
- 关联到具体 Motion
- 朗读功能
- 全英文界面

### ✅ Shadowing（复述训练）
- 选择题卡
- 设置复述时长（30s / 1min / 2min / 4min / 7min）
- 倒计时后展示论点对照

### ✅ AI Coach（AI 教练）
- 按用途分组：**Prepare**（备赛）/ **Train**（训练）
- **Prepare 模式**：
  - Argument Weakness Check
  - Similar Motions
  - Extension Generator
  - PDF Extraction
- **Train 模式**：
  - POI Simulation
  - Micro-story Generator
  - Compression Suggester
- 全英文界面（"Link to Motion (Optional)" / "Upload PDF" / "Generate" 等）
- AI 报错统一显示 "AI服务繁忙，请稍后再试"（503/429/500+）

### ✅ Clash（核心矛盾库）
- 按 Core Clash 分组显示题卡
- A-Z 排序（"English Name（中文名）" 格式）
- 搜索功能

### ✅ Strategy（打法笔记）
- 按 Motion Type 分类的备赛笔记
- 导航栏显示为 "Strategy"，页面标题为 "Notes"

### ✅ POI 训练
- 模拟短暂质询场景

### ✅ Data（数据统计）
- 题卡数量统计
- 训练次数统计

### ✅ 登录系统
- **Google 一键登录**（Firebase GoogleAuthProvider）
- 邮箱密码登录（保留）
- 自动检测 popup 阻止/取消等错误

---

## 今日完成的核心改动

### 🆕 1. Google 一键登录
- LoginPage.jsx 顶部新增 "Sign in with Google" 按钮
- AuthProvider.jsx 添加 `loginWithGoogle` 方法
- 处理 popup-closed-by-user / popup-blocked 错误

### 🆕 2. AI Draft 按钮
- 位置：Pro Arguments 区域标题旁
- 直接根据 motion 文本生成完整论点草稿（正反方各 3 个）
- 复用 transcript modal 的预览界面

### 🆕 3. Generate from Script 完整功能
- 位置：Pro Arguments 区域标题旁
- 完整的 modal：textarea + Cancel + Generate（带 Loading 状态）
- 完整预览：Core Clash + Pro/Con Arguments（含 mechanism 步骤列表）
- Confirm & Add 按钮：写入论点字段（不覆盖已有内容）
- 修复 mechanism_points 显示问题（MechanismEditor 使用 useEffect 监听数据变化）

### 🆕 4. Stakeholder Analysis
- 位置：Characterization 输入框下方
- 蓝色 "Stakeholder Analysis" 按钮
- 生成 5-8 个利益相关方（蓝色背景区域显示）
- 每个利益相关方有 "Generate Argument" 按钮
- 生成的论点显示 Claim + Impact 预览
- "Add to Prop" 和 "Add to Opp" 按钮

### 🆕 5. 朗读功能扩展
- Motion 文本旁有 🔊 朗读按钮
- Pro/Con Arguments 每个论点展开后顶部有 🔊 "Read Argument" 按钮
- 朗读内容：Claim + Mechanism + Impact 拼接
- Vocabulary 词汇旁有 🔊 按钮

### 🆕 6. BP Jargon 词典
- VocabListPage 顶部新增标签切换：
  - **BP Jargon**：20 个 BP 术语（Motion / Mechanism / Characterization / Status Quo 等）
  - **My Vocabulary**：原有个人词汇本
- 支持搜索过滤
- 每个术语显示：term / zh / definition / example

### 🆕 7. 导航栏改名（全英文化）
- 题卡 → **Motions**
- 模块 → **Frameworks**
- 词汇 → **Vocabulary**
- 复述 → **Shadowing**
- 打法笔记 → **Strategy**（页面标题为 "Notes"）
- AI 教练 → **AI Coach**
- 数据 → **Data**

### 🆕 8. 全部页面英文化
- **MotionListPage**：搜索框、排序、空状态、计数
- **MotionEditPage**：所有标签、按钮、placeholder
- **ModuleListPage**：标题 / 按钮 / 计数
- **CoachPage**：所有 6 个模式的 UI 文案、PDF 上传提示、错误消息、配置说明
- **VocabListPage**：标签页 / 搜索 / 按钮 / 验证消息
- **ClashPage**：搜索 / 题卡数量 / "No motions"

### 🆕 9. AI 错误处理优化
- 429（限流）/ 503（服务不可用）/ 500+ → 统一显示 "AI服务繁忙，请稍后再试"
- 网络错误 → 同样的友好提示

### 🆕 10. 修复 VocabFormModal props 不匹配
- VocabListPage 传入的 props 改为正确的 `item` / `onSave` / `onClose`（之前是 `initial` / `onSubmit` / `onCancel`）
- 解决 "t is not a function" 报错

---

## 待完成功能清单

### 🟡 优先级2：增强功能

#### 1. **My Arguments 区域**
- 位置：Con Arguments 下方，Post-Round Review 上方
- 功能：
  - 显示 Firestore `userArguments` collection
  - 每条显示：论点名称 + 内容摘要 + 标签
  - "Add to Prop" 和 "Add to Opp" 按钮
  - 底部 "+ New Argument" 按钮
  - 支持按标签筛选

---

## 重要文件路径

### 📁 核心页面
- `src/pages/MotionEditPage.jsx` — Motion 编辑页（全功能：AI Draft / Generate from Script / Stakeholder Analysis / 朗读 / Post-Round Review）
- `src/pages/MotionListPage.jsx` — Motion 列表页（筛选器已增强）
- `src/pages/CoachPage.jsx` — AI Coach 页面（7 种模式）
- `src/pages/ClashPage.jsx` — Clash 页面（English Name（中文）格式）
- `src/pages/VocabListPage.jsx` — 词汇页面（BP Jargon + My Vocabulary 两个标签）
- `src/pages/MotionTypeGuidePage.jsx` — Strategy/Notes 页面
- `src/pages/ModuleListPage.jsx` — Frameworks 页面

### 📁 数据与配置
- `src/data/debateTaxonomy.js` — 90+ 英文标签 + Motion Types
- `src/data/debateTerms.js` — BP Jargon 术语（20 个）
- `src/data/clashKnowledge.json` — Clash 知识库
- `src/ai/prompts.js` — 所有 Gemini prompts
- `src/ai/gemini.js` — Gemini API 封装（含错误处理）

### 📁 组件
- `src/components/ArgumentEditor.jsx` — 论点编辑器
- `src/components/MechanismEditor.jsx` — Mechanism 步骤编辑器（已修复 useEffect）
- `src/components/TagInput.jsx` — 标签输入组件
- `src/components/SpeakButton.jsx` — 朗读按钮
- `src/components/VocabFormModal.jsx` — 词汇表单弹窗

### 📁 钩子
- `src/hooks/useSpeech.js` — 朗读功能 hook（4 种音色：Female/Male + US/UK）
- `src/hooks/useCollection.js` — Firestore collection 钩子

### 📁 Firebase / Auth
- `src/firebase/config.js` — Firebase 配置
- `src/auth/AuthProvider.jsx` — 认证上下文（含 Google 登录）
- `src/auth/LoginPage.jsx` — 登录页面（含 Google 按钮）

---

## 环境变量

创建 `.env.local` 文件（不要提交到 Git）：

```env
# Firebase 配置
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Gemini API（仅本地使用，Vercel 通过环境变量配置）
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**注意**：Vercel 部署需要在 Vercel Dashboard → Settings → Environment Variables 配置同样的变量（不需要 VITE_GEMINI_API_KEY，使用服务端代理）。

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

### Firebase 配置（Google 登录需要）
1. Firebase Console → Authentication → Sign-in method
2. 启用 "Google" provider
3. 添加 Vercel 域名到 Authorized domains

---

## 技术栈

- **前端框架**：React 18 + Vite
- **路由**：React Router v6
- **样式**：Tailwind CSS
- **数据库**：Firebase Firestore
- **认证**：Firebase Auth（邮箱密码 + Google）
- **AI**：Google Gemini API（gemini-1.5-flash）
- **PDF 处理**：pdf.js
- **语音合成**：Web Speech API（Female/Male + US/UK）
- **部署**：Vercel（Serverless Functions 代理 Gemini API）

---

## Git 提交记录（今日改动）

### 今日全部 Commits（按时间倒序）
- `f5fc7da` - 完成 CoachPage 剩余中文修复：PDF 验证消息+选择辩题提示
- `1cacf9e` - 完成 CoachPage 英文化：PDF 错误提示+AI Coach 配置说明+所有验证消息
- `042041e` - 英文化 Frameworks 页面和 PDF Extraction 中文文案
- `304834c` - 修复 VocabFormModal props（onSave/onClose）+ 页面标题改为 Notes
- `754fbee` - 修复 VocabFormModal 的 onSave/onSubmit 不匹配+导航 Strategy Notes 改为 Strategy+页面标题去掉'打法笔记'
- `c789018` - 新增 Google 一键登录+AI 错误统一为 'AI 服务繁忙'+mechanism_points 确认
- `f9175c5` - 添加 AI Draft 按钮：Pro Arguments 区域自动生成论点草稿功能（完整）
- `0d250f0` - 修复 Generate from Script：添加缺失的 modal UI 代码
- `b9d27a5` - 修复 mechanism_points 显示问题：MechanismEditor 使用 useEffect 监听数据变化
- `f8e7d0e` - 修复 Generate from Script：完整提取 coreClash+所有字段+增强预览显示
- `065e624` - 优先级 1 全部完成：Task #11-13（从文字稿生成+朗读扩展+Stakeholder Analysis 完整 UI）
- `a4bce48` - Task #13 完成：Stakeholder Analysis 完整功能（生成利益相关方+生成论点+添加到 Pro/Opp）
- `9bdfa6b` - Task #12 完成：朗读功能扩展到 Pro/Con Arguments 每个论点
- `7daae9d` - 修复 Clash 页面：英文名称在前格式 English Name（中文）
- `e649cac` - 完成从文字稿生成论点功能（完整：按钮+modal+生成逻辑+预览+确认）
- `8b0cbf7` - Task #11 完成：从文字稿生成论点功能（modal+Gemini 提取+预览+确认写入）

---

## 注意事项

1. **MotionEditPage** 是全新重建的，直接使用 Firestore API
2. **所有标签已英文化**：90+ 英文标签在 `SUGGESTED_TAGS`
3. **Source 字段已删除**：不再显示和保存
4. **朗读功能**：Motion 文本旁 + 每个论点旁均有 🔊 按钮
5. **Core Clash**：支持多选，自动联想历史值
6. **AI Draft 和 Generate from Script** 共用 transcript modal 的预览/确认逻辑
7. **mechanism_points** 写入逻辑已修复（MechanismEditor 使用 useEffect）
8. **VocabFormModal props 是 `item` / `onSave` / `onClose`**（不是 initial/onSubmit/onCancel）
9. **AI 错误友好提示**：429/503/500+ 都显示 "AI 服务繁忙，请稍后再试"
10. **Google 登录**需要在 Firebase Console 启用并添加 Vercel 域名

---

## 下一步建议

剩余待办（优先级 2）：**My Arguments 区域**

实现要点：
1. 在 MotionEditPage.jsx 的 Con Arguments 下方、Post-Round Review 上方添加新区域
2. 默认折叠
3. 读取 Firestore `users/{uid}/userArguments` collection
4. 每条显示：name + content + tags
5. "Add to Prop" / "Add to Opp" 按钮（找第一个空槽插入）
6. "+ New Argument" 按钮（弹出表单）
7. 支持按标签筛选

---

**文档更新时间**：2026-06-23
**最新 Commit**：f5fc7da
**Vercel 部署状态**：✅ Active
**线上地址**：https://debate-library.vercel.app
