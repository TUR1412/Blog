# 任务清单: capstone-delivery（封顶交付）

目录: `helloagents/plan/202512312233_capstone-delivery/`

---

## 1. UI/UX（Design System + 交互一致性）
- [√] 1.1 强化基础组件（Button/Card/Chip 等）的状态与可访问性，验证 why.md#需求-uiux-封顶跨端一致--微交互
- [√] 1.2 统一弹层/菜单/命令面板的焦点与关闭策略，验证 why.md#场景-弹层菜单命令面板交互一致
- [√] 1.3 为高成本视觉效果补齐 reduced-motion 降级策略，验证 why.md#场景-弹层菜单命令面板交互一致

## 2. A11y Gate（自动可访问性门禁）
- [√] 2.1 引入并配置 e2e a11y 扫描（serious/critical 门禁），验证 why.md#需求-可访问性门禁a11y-gate
- [√] 2.2 增加关键键盘路径 e2e（Tab/ESC/快捷键），验证 why.md#场景-关键页面无严重可访问性问题

## 3. Performance Budget（体积预算与自证）
- [√] 3.1 添加构建产物体积扫描脚本并输出报告，验证 why.md#需求-性能预算与自证performance-budget
- [√] 3.2 将预算线接入 CI，超预算失败并提示定位方式，验证 why.md#场景-产物体积不在迭代中失控

## 4. Quality Gate（单测 + e2e 稳定性）
- [√] 4.1 为 `src/routes/prefetch.ts` 补齐单测覆盖，验证 why.md#需求-测试与ci-可观测性quality-gate
- [√] 4.2 e2e 扩展覆盖并固化失败工件策略（trace/report/video/screenshot），验证 why.md#场景-回归可被自动发现失败可被快速定位

## 5. 文档与SSOT 同步
- [√] 5.1 更新 README（门禁、测试、架构、排障）并保持排版与可读性，验证 why.md#变更内容
- [√] 5.2 更新 `helloagents/wiki/*` 与模块文档，补齐 ADR 索引与新门禁说明，验证 why.md#影响范围
- [√] 5.3 更新 `helloagents/CHANGELOG.md`，并将已执行方案包迁移至 `helloagents/history/`
