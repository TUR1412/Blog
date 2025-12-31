# providers

## 目的
提供跨页面的全局能力（快捷检索、弹层、主题、全局提示等），避免在各页面重复造轮子。

## 模块概述
- **职责:** 命令面板（Command Palette）、Overlay（Toast/Confirm）、主题偏好（system/dark/light）
- **状态:** ✅稳定
- **最后更新:** 2025-12-31

## 核心能力
- **命令面板:** `CommandPaletteProvider`（Ctrl/⌘ K 或 /）
- **Overlay:** `OverlayProvider` + `useOverlay()`（toast/confirm）
- **主题:** `ThemeProvider` + `useTheme()`（system/dark/light）

## 依赖
- `ui`（弹层与提示的基础样式）
- `lib`（存储）
