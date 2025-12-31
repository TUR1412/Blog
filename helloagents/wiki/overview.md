# 轩天帝 · 轩少｜修仙纪事（xuantian-blog）

> 本文件包含项目级别的核心信息。详细的模块文档见 `modules/` 目录。

---

## 1. 项目概述

### 目标与背景
这是一个**纯前端静态站点**：以“纪事与人物志”为主轴，用强交互的方式组织经卷（纪事）、路标（年表/洞府图）、牵连（关系谱）与对照（批注馆），并提供“札记/收藏/批注”等**本地优先**能力。

### 范围
- **范围内：**
  - 页面阅读与导航（洞天/纪事/洞府图/关系谱/批注馆/藏品/札记）
  - 本地保存（localStorage/sessionStorage）
  - 导入/导出（JSON）
  - 渐进增强动效与性能降负（prefetch、lazy、idle调度）
- **范围外：**
  - 账号体系、云端同步、服务端存储
  - 服务器API与数据库（当前为静态部署）

### 干系人
- **负责人:** TUR1412（仓库维护者）

---

## 2. 模块索引

| 模块名称 | 职责 | 状态 | 文档 |
|---------|------|------|------|
| app | 应用入口与Provider组装 | ✅稳定 | [modules/app.md](modules/app.md) |
| routes | 路由与资源预取策略 | ✅稳定 | [modules/routes.md](modules/routes.md) |
| pages | 页面级业务与交互实现 | ✅稳定 | [modules/pages.md](modules/pages.md) |
| components | 组件库与页面组合组件 | ✅稳定 | [modules/components.md](modules/components.md) |
| ui | 设计系统基础组件（Button/Card/Chip…） | ✅稳定 | [modules/ui.md](modules/ui.md) |
| content | 内容数据与索引（经卷/年表/关系…） | ✅稳定 | [modules/content.md](modules/content.md) |
| providers | 全局能力Provider（命令面板/Overlay/主题…） | ✅稳定 | [modules/providers.md](modules/providers.md) |
| lib | 工具库（存储/查找/性能/触感…） | ✅稳定 | [modules/lib.md](modules/lib.md) |
| hooks | 自定义Hook（本地存储状态等） | ✅稳定 | [modules/hooks.md](modules/hooks.md) |

---

## 3. 快速链接
- [技术约定](../project.md)
- [架构设计](arch.md)
- [URL/导入导出“接口”](api.md)
- [数据模型](data.md)
- [变更历史](../history/index.md)
