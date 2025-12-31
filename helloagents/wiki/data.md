# 数据模型

## 概述
项目的数据分为两类：
1) **内容数据（静态TS）**：经卷、年表、关系等，随代码发布；  
2) **用户数据（本地存储）**：收藏/札记/批注/筛选状态等，保存在浏览器。

---

## 1. 内容数据（静态）

### 1.1 经卷索引（ChronicleMeta）
用于：列表、命令面板索引、预取。

常见字段：`slug`、`title`、`excerpt`、`dateText`、`tags[]`。

### 1.2 经卷正文（Chronicle）
结构：章节 → 段落。

常见字段：`slug`、`title`、`dateText`、`sections[]`，其中 `sections[]` 包含 `heading` 与 `paragraphs[]`。

### 1.3 年表/洞府图（TimelineEvent）
用于：按layer分层展示与检索。

常见字段：`id`、`when`、`title`、`detail`、`layer`、`tone`。

### 1.4 关系谱（Relations）
用于：关系网络渲染、筛选与批注。

（详细字段以 `src/content/relations.ts` 的类型为准。）

---

## 2. 用户数据（本地存储）

### 2.1 localStorage keys
见 `src/lib/constants.ts` 的 `STORAGE_KEYS`。

补充：主题偏好使用 `xuantian.theme.v1`（system/dark/light）。

### 2.2 导入/导出协议
见 `wiki/api.md`。
