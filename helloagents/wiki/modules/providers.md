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

## 规范
### 需求: 弹层/命令面板焦点管理一致
**模块:** providers
弹层与命令面板必须具备基础可访问性能力：ESC 关闭、焦点落点合理、Tab 不逃逸到背景，并在关闭后恢复到触发前焦点。

#### 场景: Focus Trap
- 预期结果：Tab/Shift+Tab 在弹层/面板内部循环
- 预期结果：关闭后焦点回到触发按钮或上一个可聚焦元素

## 依赖
- `ui`（弹层与提示的基础样式）
- `lib`（存储）
