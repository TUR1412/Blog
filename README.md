<div align="center">
  <img src="public/favicon.svg" width="108" height="108" alt="玄" />

  <h1>轩天帝 · 轩少｜修仙纪事</h1>

  <p>
    一卷“像真事”的修仙题材个人站：不写夸饰，不写旁门；只记<strong>行止</strong>、<strong>分寸</strong>、<strong>规矩</strong>与<strong>年表</strong>。
  </p>

  <p>
    <a href="https://tur1412.github.io/Blog/">在线洞天（GitHub Pages）</a>
    · <a href="#vol-0">卷首</a>
    · <a href="#vol-1">卷一·地界</a>
    · <a href="#vol-2">卷二·手感</a>
    · <a href="#vol-3">卷三·存档</a>
  </p>

  <p>
    <img alt="Pages" src="https://img.shields.io/github/actions/workflow/status/TUR1412/Blog/deploy-pages.yml?label=Pages&style=flat-square" />
    <img alt="Version" src="https://img.shields.io/github/package-json/v/TUR1412/Blog?label=Version&style=flat-square" />
    <img alt="Stars" src="https://img.shields.io/github/stars/TUR1412/Blog?label=Stars&style=flat-square" />
  </p>
</div>

---

> [!IMPORTANT]
> **三条规矩（写给读者，也写给写的人）**
> 1. 站点正文只围绕“修仙纪事与人物志”，只写“轩天帝（轩少）”的行止与章法。
> 2. 不写编程教程、不写无关杂谈；宁可少，也不乱。
> 3. 不夸大其词——写得像真事：能落地、可追溯、有分寸。

<a id="vol-0"></a>

## 卷首 · 一句话

这不是“吹出来”的修仙。它更像一卷被反复翻过的旧经：热闹在外，分寸在里。

> [!TIP]
> **最快入口**：直接点「在线洞天」进站；用灵镜（`Ctrl/⌘ + K` 或 `/`）搜一章、一事、一处去处。

<a id="vol-1"></a>

## 卷一 · 地界（你将看到什么）

| 地界 | 你能做什么 | 看点 |
| --- | --- | --- |
| 洞天 | 进站、总览、直达 | 第一眼的气口与节奏 |
| 纪事 | 按章读、收藏、续读 | “像真事”的起承转合 |
| 洞府图 | 年表可视化、筛选、定位 | 把岁月写成路标 |
| 关系谱 | 人/誓词/旧物/关口/地点 | 一张“对照之网” |
| 批注馆 | 汇总批注、检索、导入导出 | 复盘与归档 |
| 札记 | 即写即存、经卷观、卷内检索 | 把你的分寸留下来 |
| 藏品 | 拖拽排序、记住次序 | 旧物有旧物的来处 |

> [!NOTE]
> 这里的“厉害”不靠夸张：靠的是把一件事写清，把一个人写稳。

<a id="vol-2"></a>

## 卷二 · 手感（交互要 Q，要顺）

- **灵镜检索**：`Ctrl/⌘ + K`（或 `/`）召出命令面板，直达页面/篇章。
- **卷内检索**：命中高亮、上一处/下一处跳转；不让你在长卷里迷路。
- **沉浸阅读**：读到兴处，界面会“退后半步”，让内容站到台前。
- **拖拽排序**：藏品、收藏的次序能用手拉出来；次序会被记住。

> [!CAUTION]
> 若你觉得某处“卡卡的”，我会继续用默认策略优化：少重绘、少无谓动效、少重复计算——不加开关，不做臃肿模式。

<a id="vol-3"></a>

## 卷三 · 存档（不怕刷新、不怕迁移）

- 你写下的札记、收藏、批注、筛选状态，会默认落地保存（避免“刷新即丢”的幽灵）。
- 支持导出/导入（文卷 / 存档），便于备份、迁移、归档。

> [!WARNING]
> 存档是你的，不是服务器的：这卷站点偏向“个人经卷”，把主权留在你手里。

---

<details>
<summary><strong>术法 · 开发 / 构建 / 部署（给需要的人）</strong></summary>

### 本地

安装依赖：

```bash
npm install
```

本地预览（会启动开发服务，按需使用）：

```bash
npm run dev
```

构建静态产物：

```bash
npm run build
```

构建后预览：

```bash
npm run preview
```

### GitHub Pages

本仓库已内置 GitHub Actions 工作流：推送到 `main` 会自动 `npm ci` + `npm run build`，并把 `dist/` 发布到 GitHub Pages。

1. 在 GitHub 仓库打开：Settings → Pages
2. Source 选择：GitHub Actions
3. 等待 Actions 跑完后，访问：`https://<username>.github.io/Blog/`

</details>
