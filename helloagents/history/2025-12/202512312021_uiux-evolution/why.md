# 变更提案: UI/UX 进化（Overlay交互 + 主题切换 + 链接安全）

## 需求背景
当前站点整体视觉与交互已具备“经卷式”风格，但在少数关键交互上仍存在割裂点：
- 多处使用 `window.alert/confirm`：阻塞、丑陋、不可控，破坏沉浸感与一致性。
- 外链/Markdown链接未做协议白名单：理论上可能被 `javascript:` 等scheme利用（即便内容可信，仍建议防线内建）。
- 主题仅跟随系统：缺少用户显式偏好（系统浅色下可能不符合“洞天”调性）。

## 变更内容
1. 引入全局 Overlay 系统（Confirm + Toast），替换页面中的阻塞弹窗。
2. 引入主题偏好（system/dark/light）与顶栏快捷切换，写入本地存储。
3. 为 Markdown / 外链按钮增加 URL scheme 校验与 `rel="noopener noreferrer"`。

## 影响范围
- **模块:** providers / pages / components / ui / lib
- **文件:** `src/providers/*`, `src/pages/*`, `src/components/content/Markdown.tsx`, `src/components/ui/Button.tsx`, `src/index.css`
- **API:** URL/导入导出协议不变（仅交互层升级）
- **数据:** 本地存储新增 `theme` key（不影响既有数据）

## 核心场景

### 需求: 导入/清空确认不再“跳出洞天”
**模块:** providers/pages
替换 `window.alert/confirm`，在站内以统一风格展示提示与确认。

#### 场景: 导入收藏（纪事页）
访客导入收藏文件时需要选择“覆盖/合并”，错误时需提示原因。
- 预期结果：弹层风格一致、可键盘操作、不会阻塞主线程

#### 场景: 清空批注（洞府图/关系谱/批注馆）
批注清空属于破坏性操作，需要明确确认与视觉警示。
- 预期结果：危险操作具备“红色语义”，误触概率更低

### 需求: 主题偏好可控
**模块:** providers/components
提供 system/dark/light 三态主题偏好，并在顶栏可快速切换。

#### 场景: 夜间阅读/白天办公
同一设备在不同光线环境中切换主题，偏好可记住。
- 预期结果：主题切换即时生效，不闪烁，刷新不丢

### 需求: 链接安全与一致
**模块:** components/lib/ui
外链默认新开并带 noopener；禁止危险scheme。

#### 场景: Markdown 内含外链
经卷中若包含外链，点击不应带来潜在执行风险。
- 预期结果：仅允许 http/https/mailto/tel 等白名单；非法链接降级为普通文本

## 风险评估
- **风险:** Overlay引入会影响多页面交互路径；需要避免焦点丢失、ESC冲突。
- **缓解:** 统一Provider集中管理；对话框支持ESC关闭与基础焦点循环；全量跑 lint/build 验证。

