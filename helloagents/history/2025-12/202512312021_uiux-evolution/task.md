# 任务清单: UI/UX 进化（Overlay交互 + 主题切换 + 链接安全）

目录: `helloagents/history/2025-12/202512312021_uiux-evolution/`

---

## 1. providers（Overlay / Theme）
- [√] 1.1 新增 OverlayProvider（Toast + Confirm），提供 `useOverlay()`，并完成 Portal 渲染
- [√] 1.2 新增 ThemeProvider（system/dark/light），对 `:root[data-theme]` 生效并持久化
- [√] 1.3 在 `src/App.tsx` 挂载 Provider（确保全站可用）

## 2. pages（替换阻塞弹窗）
- [√] 2.1 在 `src/pages/ChroniclesPage.tsx` 替换 `window.alert/confirm` 为 overlay
- [√] 2.2 在 `src/pages/NotesPage.tsx` 替换 `window.alert/confirm` 为 overlay
- [√] 2.3 在 `src/pages/GrottoMapPage.tsx` 替换 `window.alert/confirm` 为 overlay
- [√] 2.4 在 `src/pages/AnnotationsPage.tsx` 替换 `window.alert/confirm` 为 overlay
- [√] 2.5 在 `src/pages/RelationsPage.tsx` 替换 `window.alert/confirm` 为 overlay

## 3. components/ui（主题入口 & 链接安全）
- [√] 3.1 在 `src/components/chrome/TopNav.tsx` 增加主题切换入口（system/dark/light）
- [√] 3.2 在 `src/components/content/Markdown.tsx` 增加外链scheme校验与 noopener
- [√] 3.3 在 `src/components/ui/Button.tsx` 的外链按钮补齐 noopener 并复用 URL 校验

## 4. 安全检查
- [√] 4.1 全仓扫描：危险scheme链接、`dangerouslySetInnerHTML`、`eval/new Function` 等（应为0）
- [√] 4.2 `npm audit --registry https://registry.npmjs.org/`（确保0漏洞或给出修复建议）

## 5. 文档更新
- [√] 5.1 更新 `helloagents/wiki/*`：补齐Overlay/主题设计与模块状态
- [√] 5.2 更新 `helloagents/CHANGELOG.md`：记录本次变更

## 6. 验证
- [√] 6.1 `npm run lint`
- [√] 6.2 `npm run build`
