# routes

## 目的
维护路由定义、页面Lazy加载与预取策略，保证导航“手感”与首屏降负。

## 模块概述
- **职责:** AppRouter、prefetch（hover/press/focus）
- **状态:** ✅稳定
- **最后更新:** 2025-12-31

## 核心能力
- **预取策略:** hover→idle，press/focus→立即；对 Markdown-heavy 页面额外预取 Markdown 渲染模块
- **可测试性:** `prefetch.ts` 暴露纯函数（`normalizePath`/`getCorePrefetchTargets` 等）用于单测，避免把行为回归留给肉眼

## 依赖
- `pages`（页面组件）
- `components`（fallback UI）
- `lib`（无直接依赖）
