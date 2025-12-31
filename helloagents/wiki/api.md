# API 手册（URL / 导入导出）

本项目为静态站点，没有服务端HTTP API。这里的“API”指：
1) **URL 入口**（路由与Query参数），以及  
2) **导入/导出 JSON 协议**（本地数据迁移与备份）。

---

## 1. 路由（URL 入口）

| 页面 | 路径 | 说明 |
|---|---|---|
| 洞天 | `/#/` | 首页 |
| 纪事 | `/#/chronicles` | 章节索引 |
| 单篇纪事 | `/#/chronicles/:slug` | 章节正文 |
| 洞府图 | `/#/grotto` | 年表/路标 |
| 人物志 | `/#/about` | 人物与卷规说明 |
| 关系谱 | `/#/relations` | 关系网络可视化 |
| 批注馆 | `/#/annotations` | 批注汇总与回看 |
| 藏品 | `/#/treasury` | 藏品展示与排序 |
| 札记 | `/#/notes` | 本地札记（编辑/阅读） |

---

## 2. Query 参数（选摘）

### 2.1 纪事（/chronicles）
- `only=bookmarks`：只显示已收藏篇章
- `tag=<标签>`：按标签筛选

### 2.2 札记（/notes）
- `view=edit|scroll`：编辑/阅读视图
- `h=<headingId>`：定位到某个标题（阅读视图）

---

## 3. 导入/导出 JSON 协议

### 3.1 收藏（Bookmarks）
导出文件名示例：`xuantian-bookmarks-YYYY-MM-DD.json`

**Payload:**
```json
{
  "kind": "xuantian.bookmarks",
  "v": 1,
  "exportedAt": 0,
  "count": 0,
  "bookmarks": ["slug-1", "slug-2"]
}
```

### 3.2 札记（Notes）
**Payload:**
```json
{
  "kind": "xuantian.notes",
  "v": 1,
  "exportedAt": 0,
  "meta": { "updatedAt": 0, "lastSource": "optional" },
  "text": "markdown..."
}
```

### 3.3 路标批注（Grotto Annotations）
**Payload:**
```json
{
  "kind": "xuantian.grotto.annotations",
  "v": 1,
  "exportedAt": 0,
  "count": 0,
  "annotations": {
    "timeline-event-id": { "text": "markdown...", "updatedAt": 0 }
  }
}
```

> 其他批注（关系谱/批注馆）协议同理：均带有 `kind` + `v`，并包含 `exportedAt` 与内容主体。

