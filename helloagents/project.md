# 项目技术约定

---

## 技术栈
- **运行时:** Node.js 22（CI：GitHub Actions 使用 Node 22）
- **前端框架:** React 19
- **路由:** React Router（HashRouter，适配 GitHub Pages 静态部署）
- **构建:** Vite 7 + TypeScript 5.9（`tsc -b`）
- **样式:** Tailwind CSS 3.4 + `@tailwindcss/typography`
- **动效:** Framer Motion
- **代码质量:** ESLint 9（Flat Config）

---

## 目录约定
- `src/App.tsx`: 应用根组件（路由与Provider组装）
- `src/routes/*`: 路由与预取策略（prefetch）
- `src/pages/*`: 页面级组件（洞天/纪事/洞府图/关系谱/批注馆/藏品/札记…）
- `src/components/*`: 可复用组件（含 `ui/` 设计系统基元）
- `src/content/*`: 内容数据（经卷索引、年表、关系等）
- `src/lib/*`: 通用工具（存储、性能、查找、高亮等）
- `public/*`: 静态资源（封面、噪声纹理、favicon）

---

## 开发约定
- **TypeScript:** 开启 strict；避免 `any`；对外部输入（URL / 导入JSON）必须做类型收敛与兜底。
- **React:** 优先函数组件 + hooks；避免在渲染期做重计算，必要时 `useMemo` / `useDeferredValue` / `requestIdleCallback`。
- **样式:** 以 Tailwind class 为主；全局token在 `src/index.css`（CSS变量）与 `tailwind.config.cjs`（扩展）维护。
- **交互:** 避免 `window.alert/confirm` 这类阻塞交互；统一使用站内Overlay（Toast/Confirm）以保持视觉一致与无障碍体验。
- **可访问性:** 所有可交互控件必须具备可聚焦与清晰 focus-ring；弹层需支持 ESC 关闭与基础焦点管理。

---

## 质量门禁
- `npm run lint`：ESLint 必须通过
- `npm run build`：TypeScript + Vite 生产构建必须通过
- `npm audit --registry https://registry.npmjs.org/`：安全审计（若本机 registry 为镜像源，需显式指定）

---

## 提交流程（建议）
- Commit Message：Conventional Commits（`feat:`/`fix:`/`refactor:`/`docs:`/`chore:`）
- 原子提交：每次提交聚焦单一主题（交互系统 / 主题系统 / 文档 / 依赖升级 等）

