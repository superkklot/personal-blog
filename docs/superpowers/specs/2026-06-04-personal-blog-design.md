# 个人博客网站 — 设计文档

**日期**: 2026-06-04
**项目**: 乘风马个人博客
**作者**: Claude

## 1. 目标与背景

构建一个简洁的个人博客网站，结构为"头部 + 左侧文章导航 + 右侧文章正文"。网站使用 Node.js 开发，前后端不分离（服务端渲染）。文章以 Markdown 文件形式存放在特定目录，运行时动态加载。

### 关键决策（来自 brainstorming）

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 技术栈 | Express + EJS | 中量级使用最广，资料丰富 |
| 文章元数据 | 仅 title + date | 用户选择最简方案 |
| 头像 | 圆形图片占位 | 用户可自行替换为真实头像 |
| 数据源方案 | Front-matter + 每次读取 | 添加文章无需重启服务器 |

## 2. 整体架构

```
浏览器
  │
  │ HTTP 请求
  ▼
┌─────────────────────────────┐
│  Express 服务器 (server.js) │
│  ├─ 路由层 (routes/index.js)│
│  └─ 服务层                  │
│      └─ 文章服务            │
│         (articleService.js)│
└─────────────────────────────┘
  │            │
  │            │ 读文件 + 解析
  ▼            ▼
articles/*.md    public/*
(Markdown 源)  (静态资源)
  │            │
  │ 解析        │
  ▼            │
gray-matter + marked
  │
  ▼
EJS 模板 → HTML → 浏览器
```

## 3. 目录结构

```
test5/
├── server.js                 # Express 入口
├── package.json
├── routes/
│   └── index.js              # 路由定义
├── services/
│   └── articleService.js     # 文章读取/解析/排序（核心隔离单元）
├── views/
│   ├── layout.ejs            # 主布局（头部 + 侧边栏 + 内容区）
│   ├── partials/
│   │   ├── article-list.ejs  # 侧边栏文章列表片段
│   │   └── article-content.ejs # 文章正文片段
├── public/
│   ├── css/
│   │   └── style.css         # 样式
│   ├── avatar.png            # 头像（占位图）
│   └── favicon.ico
├── articles/                 # Markdown 文章目录
│   ├── welcome.md            # 默认示例文章
│   └── 2026-06-04-hello.md
├── tests/
│   └── articleService.test.js # 单元测试
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-06-04-personal-blog-design.md
```

## 4. 路由设计

| 路径 | 方法 | 功能 | 返回 |
|------|------|------|------|
| `/` | GET | 自动重定向到最新的文章 | 302 |
| `/articles/:slug` | GET | 显示指定文章 | 200 / 404 |
| `/static/*` | GET | 静态资源（CSS、头像、JS） | 200 |
| `*` | ALL | 未匹配路径 | 404 |

## 5. 数据流

### 5.1 请求 `/articles/hello` 的完整流程

1. Express 接收请求
2. 路由 `/articles/:slug` 命中
3. 路由处理器调用 `articleService.getArticleBySlug('hello')`
4. articleService 遍历 `articles/` 目录
5. 用 `gray-matter` 读取每个 `.md` 文件，提取 front-matter + 正文
6. 用文件名作为 slug，匹配 `hello` 的文件
7. 返回 `{ title, date, html }` 或 `null`
8. 同时调用 `articleService.listArticles()` 拿到所有文章列表（按 date 倒序）
9. 路由把两批数据传给 EJS 模板
10. 模板渲染完整 HTML 返回

### 5.2 Markdown 文件格式

文件名作为 URL slug（不含 `.md` 后缀），例如 `articles/hello-world.md` 对应 `/articles/hello-world`。

**articles 目录位置**：项目根目录下的 `articles/` 文件夹。服务启动时检查该目录是否存在，不存在则创建空目录并打印警告。

```markdown
---
title: 我的第一篇博客
date: 2026-06-04
---

# 正文从这里开始

支持所有标准 Markdown 语法，包括：

- 列表
- **加粗** 和 *斜体*
- [链接](https://example.com)
- 代码块
```

**front-matter 字段**：
- `title`（必填）：文章标题
- `date`（必填）：发布日期，ISO 8601 格式（`YYYY-MM-DD`）

## 6. 关键模块

### 6.1 `services/articleService.js`（核心隔离单元）

**职责单一**：文件系统读取 + Markdown 解析。不接触 HTTP。

**导出**：
```js
// 返回 [{slug, title, date}, ...] 按 date 倒序
async function listArticles(): Promise<ArticleMeta[]>

// 返回 {title, date, html} 或 null（找不到时）
async function getArticleBySlug(slug: string): Promise<Article | null>
```

**ArticleMeta 类型**：
```ts
{
  slug: string    // 文件名（不含 .md）
  title: string   // 来自 front-matter
  date: string    // 来自 front-matter，格式 YYYY-MM-DD
}
```

**Article 类型**：
```ts
{
  slug: string
  title: string
  date: string
  html: string    // 渲染后的 HTML
}
```

**为什么是隔离单元**：可以在不启动 Express 的情况下单独测试，不依赖 HTTP 上下文。文件增长时是单元本身变大还是该拆分的清晰信号。

### 6.2 `routes/index.js`（HTTP 层）

职责：解析 URL 参数、调用 service、组装 EJS、处理错误码（404、500）。

```js
router.get('/articles/:slug', async (req, res) => {
  const article = await articleService.getArticleBySlug(req.params.slug);
  if (!article) return res.status(404).render('not-found');
  const articles = await articleService.listArticles();
  res.render('layout', { article, articles, activeSlug: article.slug });
});
```

### 6.3 模板

- **`views/layout.ejs`**：完整 HTML 骨架
  - `<head>`：引入 CSS、设置标题
  - `<header>`：avatar + "乘风马" 名字
  - 左侧 `<aside>`：包含 article-list.ejs
  - 右侧 `<main>`：包含 article-content.ejs
- **`views/partials/article-list.ejs`**：遍历 articles 数组，渲染链接列表
- **`views/partials/article-content.ejs`**：渲染当前文章的 HTML

## 7. 错误处理

| 场景 | 处理 |
|------|------|
| 文章 slug 不存在 | 404 页面（"找不到这篇文章"） |
| articles 目录为空 | 主页显示提示："还没有任何文章，请先添加 .md 文件" |
| Markdown 解析失败 | 500 页面 + 服务端日志记录错误 |
| articles 目录不存在 | 启动时给出警告，按空目录处理 |
| front-matter 缺少 title 或 date | 跳过该文件并打日志，不影响其他文章 |

所有 service 层抛出的异常在路由层用 try/catch 包裹，转换为 500 响应，不让原始异常冒泡到 HTTP 层。

## 8. 视觉/UX 决策

- **布局**：CSS Grid，顶部头部横跨 + 下方两列
  - 头部高 80px
  - 左侧导航 240px 固定宽度
  - 右侧正文自适应
- **配色**：浅色主题
  - 背景：`#fafafa`
  - 正文：`#333`
  - 主色：`#2563eb`（深蓝）
  - 链接/强调：`#1d4ed8`
- **字体**：系统字体栈（`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`）；代码用 `Menlo, Monaco, Consolas, monospace`
- **代码高亮**：使用 `highlight.js`，主题为 `github`（浅色）
- **响应式**：屏幕宽度 < 768px 时折叠为单列（导航在上，正文在下）
- **当前文章高亮**：侧边栏中当前文章加粗 + 蓝色背景标识
- **无 JavaScript 框架**：纯 HTML/CSS，每次点击导航是完整页面刷新（最简单可靠）

## 9. 测试策略

- **单元测试**：`tests/articleService.test.js` 用 Node 内置 `node:test`
  - 测试 listArticles 排序逻辑
  - 测试 listArticles 对空目录的处理
  - 测试 getArticleBySlug 命中/未命中
  - 测试 front-matter 解析
- **集成测试**：测试脚本启动 Express，curl 几个 URL，验证返回的 HTML 包含预期内容（`<h1>` 标题、侧边栏项等）
- **不引入** Jest、Mocha 等测试框架（避免依赖爆炸）

## 10. 依赖

```json
{
  "dependencies": {
    "express": "^4.21.0",
    "ejs": "^3.1.10",
    "gray-matter": "^4.0.3",
    "marked": "^12.0.0",
    "highlight.js": "^11.10.0"
  }
}
```

无前端构建工具（webpack、vite 等），纯服务端渲染。

## 11. 启动与开发

默认端口 `3000`，可通过环境变量 `PORT` 覆盖。

```bash
# 安装依赖
npm install

# 启动开发服务器
node server.js

# 访问
http://localhost:3000

# 自定义端口
PORT=8080 node server.js
```

## 12. 未来扩展（不在本次范围内）

- 标签/分类
- 文章搜索
- RSS 订阅
- 评论系统
- 暗色模式切换
- 文章阅读量统计

## 13. 验收标准

实现完成后，应当满足：

1. 访问 `http://localhost:3000/` 自动重定向到最新文章
2. 头部显示圆形头像和"乘风马"文字
3. 左侧显示所有文章列表，按日期倒序，当前文章高亮
4. 右侧显示 Markdown 渲染后的 HTML（含代码高亮）
5. 点击左侧文章，URL 变为 `/articles/<slug>`，内容区更新
6. 在 `articles/` 中添加新 `.md` 文件，刷新页面即可看到（无需重启）
7. 访问不存在的文章 slug，返回 404 页面
8. 所有单元测试通过
