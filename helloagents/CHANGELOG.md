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
