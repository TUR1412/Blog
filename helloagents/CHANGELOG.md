# Changelog
本文件记录项目所有重要变更。  
格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增
- （待记录）

### 变更
- （待记录）

### 修复
- （待记录）

### 移除
- （待记录）

## [0.142.1] - 2026-01-01

### 变更
- UI：`glass/slab` 增加 hover/focus-within 的描边与 lift 微交互，整体更“玻璃拟态”、更顺手。
- UI：`Button` 新增 `loading` 状态（spinner + `aria-busy`），为异步操作提供更明确的反馈。
- 文档：README 增补项目 Title ASCII 艺术字与 Emoji 功能清单，作为“产品门户”入口更清晰。

## [0.142.0] - 2025-12-31

### 新增
- 质量门禁：新增构建产物体积预算脚本 `npm run budget`，并接入 GitHub Actions（build 后执行）。
- e2e（A11y）：引入 axe 扫描，对首页/灵镜/札记+Confirm 做 serious/critical 门禁覆盖。
- 单测：补齐 `routes/prefetch` 的纯函数覆盖（路径规范化与核心预取目标）。

### 变更
- 可访问性：命令面板与 Confirm 弹层统一 focus trap / 恢复焦点，遮罩按钮 `aria-hidden` 且不进入 Tab 顺序。
- UI：`Button` 补齐 disabled 状态的视觉与交互兜底（不可点/不误触）。
- 首页：range slider 增加 label，满足可访问性规则。

## [0.141.4] - 2025-12-31

### 新增
- e2e：新增“札记编辑内容可持久化（刷新不丢）”覆盖，验证 localStorage 写入与 reload 后状态一致。

### 变更
- 测试脚本：`test:e2e:ci` 直接运行 `playwright test`，reporter 由 `playwright.config.ts` 统一控制。
- Playwright：失败时保留截图与视频（`only-on-failure` / `retain-on-failure`），提升 CI 排障效率。

## [0.141.3] - 2025-12-31

### 新增
- CI：缓存 Playwright 浏览器下载（`~/.cache/ms-playwright`），并在失败时上传 `playwright-report/` 与 `test-results/` 工件便于排障。
- e2e：补齐“主题持久化（刷新不丢）”与“ESC 取消 Confirm”覆盖。

## [0.141.2] - 2025-12-31

### 新增
- e2e 测试：引入 Playwright（Chromium）覆盖导航、主题切换、危险操作 Confirm 流程。

### 变更
- CI 门禁：GitHub Pages 部署流程在构建后执行 e2e（`npm run test:e2e:ci`）。
- 仓库规范：新增 `.gitattributes` 统一行尾策略，减少跨平台 CRLF/LF 噪音。
- 文档：README 补充 e2e 运行说明。

## [0.141.1] - 2025-12-31

### 新增
- 自动化测试：引入 Vitest + Testing Library，覆盖 `parseSafeLink`、`ThemeProvider`、`OverlayProvider` 的关键路径。
- CI：GitHub Pages 部署流程在构建前执行 `npm run test:ci`。

### 变更
- Overlay 无障碍增强：Confirm 使用 `aria-labelledby/aria-describedby`，Toast 增加 `role="status"` 并对 danger toast 使用 `role="alert"`。
- Confirm 交互增强：打开时锁定页面滚动，避免移动端背景滚动穿透。

## [0.141.0] - 2025-12-31

### 新增
- 站内 Overlay 交互（Toast/Confirm）：替换 `window.alert/confirm`，交互一致、非阻塞。
- 主题偏好：system/dark/light 三态，顶栏切换 + 命令面板入口，本地持久化。
- 知识库（helloagents/）初始化：为项目建立SSOT文档结构与模块索引。

### 变更
- Markdown/外链链接安全：URL scheme 白名单 + `rel="noopener noreferrer"`。
- 依赖升级：Vite/React Router/Lucide/TypeScript ESLint/Tailwind patch 等。

## [0.140.0] - 2025-12-31

### 新增
- 初始版本：Vite + React + TypeScript + Tailwind 的静态站点，包含洞天/纪事/洞府图/关系谱/批注馆/藏品/札记等模块。
