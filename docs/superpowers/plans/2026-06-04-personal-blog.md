# 个人博客网站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个使用 Express + EJS 服务端渲染的个人博客，文章以 Markdown 文件形式存放在 `articles/` 目录，运行时动态加载。

**Architecture:** 三层架构 — `services/articleService.js`（核心隔离单元，文件系统 + Markdown 解析）→ `routes/index.js`（HTTP 层）→ `views/*.ejs`（模板）。每次请求都读取文件系统（不缓存），确保新增文章无需重启服务器。

**Tech Stack:** Node.js (内置 `node:test`)、Express 4、EJS、gray-matter、marked、highlight.js

**Spec:** `docs/superpowers/specs/2026-06-04-personal-blog-design.md`

---

## 文件总览

| 文件 | 职责 |
|------|------|
| `package.json` | 依赖声明、npm scripts |
| `.gitignore` | 忽略 node_modules、临时文件 |
| `server.js` | Express 入口，挂载中间件、静态资源、路由 |
| `routes/index.js` | 路由：`/`、`/articles/:slug`、404 |
| `services/articleService.js` | `listArticles()`、`getArticleBySlug(slug)` 核心逻辑 |
| `views/layout.ejs` | 主 HTML 骨架（head + body 网格） |
| `views/partials/header.ejs` | 头部：avatar + 名称 |
| `views/partials/article-list.ejs` | 左侧文章列表 |
| `views/partials/article-content.ejs` | 右侧文章正文 |
| `views/partials/empty.ejs` | 空状态提示 |
| `views/partials/not-found.ejs` | 404 页面 |
| `public/css/style.css` | 全部样式 |
| `public/avatar.png` | 头像占位（SVG 转换的 PNG） |
| `articles/welcome.md` | 示例文章 |
| `articles/2026-06-04-hello-world.md` | 示例文章 |
| `tests/articleService.test.js` | articleService 单元测试 |
| `tests/integration.test.js` | 启动 Express 验证 HTTP 响应 |
| `README.md` | 启动说明 |

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: 初始化 git 仓库**

```bash
cd D:/code/codex/test5
git init
git config user.email "blog@example.com"
git config user.name "Blog Author"
```

- [ ] **Step 2: 创建 `package.json`**

```json
{
  "name": "personal-blog",
  "version": "1.0.0",
  "description": "Personal blog with Express + EJS, articles in Markdown",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "node --test tests/"
  },
  "dependencies": {
    "ejs": "^3.1.10",
    "express": "^4.21.0",
    "gray-matter": "^4.0.3",
    "highlight.js": "^11.10.0",
    "marked": "^12.0.0"
  }
}
```

- [ ] **Step 3: 创建 `.gitignore`**

```
node_modules/
*.log
.DS_Store
.env
```

- [ ] **Step 4: 创建 `README.md`**

```markdown
# 乘风马个人博客

基于 Express + EJS 的服务端渲染博客，文章以 Markdown 形式存放在 `articles/` 目录。

## 启动

```bash
npm install
npm start
```

访问 http://localhost:3000

## 添加文章

在 `articles/` 目录新建 `.md` 文件，文件名（不含扩展名）即 URL slug。

```markdown
---
title: 文章标题
date: 2026-06-04
---

正文内容...
```

## 测试

```bash
npm test
```
```

- [ ] **Step 5: 提交**

```bash
cd D:/code/codex/test5
git add .
git commit -m "chore: initialize project with package.json and gitignore"
```

---

## Task 2: 安装依赖

**Files:**
- Modify: `package.json`（npm 自动添加 `node_modules`）
- Create: `package-lock.json`

- [ ] **Step 1: 安装所有依赖**

```bash
cd D:/code/codex/test5
npm install
```

Expected: 安装 express, ejs, gray-matter, marked, highlight.js，无错误。

- [ ] **Step 2: 验证依赖安装成功**

```bash
cd D:/code/codex/test5
ls node_modules | head -5
```

Expected: 输出包含 `express` 等目录。

- [ ] **Step 3: 提交**

```bash
cd D:/code/codex/test5
git add package.json package-lock.json
git commit -m "chore: install dependencies"
```

---

## Task 3: 实现 articleService.listArticles（空目录场景）

**Files:**
- Create: `tests/articleService.test.js`
- Create: `services/articleService.js`
- Create: `articles/`（空目录，添加 `.gitkeep`）

- [ ] **Step 1: 创建 `articles/.gitkeep`**

```bash
mkdir -p "D:/code/codex/test5/articles"
touch "D:/code/codex/test5/articles/.gitkeep"
```

- [ ] **Step 2: 写失败的测试（空目录返回空数组）**

创建 `tests/articleService.test.js`：

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { listArticles, getArticleBySlug } = require('../services/articleService.js');

const ARTICLES_DIR = path.join(__dirname, '..', 'articles');

test('listArticles: 空目录返回空数组', async () => {
  const result = await listArticles(ARTICLES_DIR);
  assert.deepEqual(result, []);
});

test('getArticleBySlug: 空目录返回 null', async () => {
  const result = await getArticleBySlug(ARTICLES_DIR, 'any-slug');
  assert.equal(result, null);
});
```

- [ ] **Step 3: 运行测试，验证失败**

```bash
cd D:/code/codex/test5
node --test tests/articleService.test.js
```

Expected: FAIL — "Cannot find module '../services/articleService.js'"

- [ ] **Step 4: 实现 articleService（最小版本）**

创建 `services/articleService.js`：

```js
const fs = require('node:fs/promises');
const path = require('node:path');
const matter = require('gray-matter');

/**
 * 读取 articles 目录下所有 .md 文件，返回文章元数据列表（按 date 倒序）
 * @param {string} articlesDir - articles 目录绝对路径
 * @returns {Promise<Array<{slug: string, title: string, date: string}>>}
 */
async function listArticles(articlesDir) {
  let files;
  try {
    files = await fs.readdir(articlesDir);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }

  const mdFiles = files.filter((f) => f.endsWith('.md'));
  const articles = [];

  for (const file of mdFiles) {
    const fullPath = path.join(articlesDir, file);
    const raw = await fs.readFile(fullPath, 'utf8');
    const { data } = matter(raw);
    if (!data.title || !data.date) continue;
    const slug = file.replace(/\.md$/, '');
    articles.push({ slug, title: data.title, date: data.date });
  }

  articles.sort((a, b) => b.date.localeCompare(a.date));
  return articles;
}

/**
 * 根据 slug 读取单篇文章
 * @param {string} articlesDir
 * @param {string} slug
 * @returns {Promise<{slug, title, date, html} | null>}
 */
async function getArticleBySlug(articlesDir, slug) {
  // Task 5 中实现具体逻辑
  return null;
}

module.exports = { listArticles, getArticleBySlug };
```

- [ ] **Step 5: 运行测试，验证通过**

```bash
cd D:/code/codex/test5
node --test tests/articleService.test.js
```

Expected: 2 tests pass

- [ ] **Step 6: 提交**

```bash
cd D:/code/codex/test5
git add services/articleService.js tests/articleService.test.js articles/
git commit -m "feat(articleService): implement listArticles with empty dir handling"
```

---

## Task 4: 实现 articleService.listArticles（多文件 + 排序）

**Files:**
- Modify: `tests/articleService.test.js`
- Modify: `services/articleService.js`（不需改，已支持）

- [ ] **Step 1: 写失败的测试（多文件 + 排序）**

向 `tests/articleService.test.js` 追加：

```js
const fs = require('node:fs/promises');

test('listArticles: 多个文件按 date 倒序', async () => {
  // 准备测试数据
  await fs.writeFile(
    path.join(ARTICLES_DIR, 'old.md'),
    '---\ntitle: 旧文章\ndate: 2025-01-01\n---\n\n旧内容'
  );
  await fs.writeFile(
    path.join(ARTICLES_DIR, 'new.md'),
    '---\ntitle: 新文章\ndate: 2026-06-04\n---\n\n新内容'
  );

  const result = await listArticles(ARTICLES_DIR);
  const slugs = result.map((a) => a.slug);
  assert.deepEqual(slugs, ['new', 'old']);

  // 清理
  await fs.unlink(path.join(ARTICLES_DIR, 'old.md'));
  await fs.unlink(path.join(ARTICLES_DIR, 'new.md'));
});

test('listArticles: 缺少 title 或 date 的文件被跳过', async () => {
  await fs.writeFile(
    path.join(ARTICLES_DIR, 'invalid.md'),
    '---\ntitle: 只有标题\n---\n\n内容'
  );

  const result = await listArticles(ARTICLES_DIR);
  assert.equal(result.find((a) => a.slug === 'invalid'), undefined);

  await fs.unlink(path.join(ARTICLES_DIR, 'invalid.md'));
});
```

- [ ] **Step 2: 运行测试，验证通过**

```bash
cd D:/code/codex/test5
node --test tests/articleService.test.js
```

Expected: 4 tests pass（实现已支持，无需修改）

- [ ] **Step 3: 提交**

```bash
cd D:/code/codex/test5
git add tests/articleService.test.js
git commit -m "test(articleService): add multi-file sorting and validation tests"
```

---

## Task 5: 实现 articleService.getArticleBySlug

**Files:**
- Modify: `tests/articleService.test.js`
- Modify: `services/articleService.js`

- [ ] **Step 1: 写失败的测试（命中场景）**

向 `tests/articleService.test.js` 追加：

```js
const { marked } = require('marked');

test('getArticleBySlug: 命中返回 title, date, html', async () => {
  await fs.writeFile(
    path.join(ARTICLES_DIR, 'hello.md'),
    '---\ntitle: 你好\ndate: 2026-06-04\n---\n\n# 标题\n\n这是**加粗**文本。'
  );

  const result = await getArticleBySlug(ARTICLES_DIR, 'hello');
  assert.equal(result.slug, 'hello');
  assert.equal(result.title, '你好');
  assert.equal(result.date, '2026-06-04');
  assert.ok(result.html.includes('<h1'));
  assert.ok(result.html.includes('<strong>加粗</strong>'));

  await fs.unlink(path.join(ARTICLES_DIR, 'hello.md'));
});

test('getArticleBySlug: 不存在的 slug 返回 null', async () => {
  const result = await getArticleBySlug(ARTICLES_DIR, 'nonexistent');
  assert.equal(result, null);
});
```

- [ ] **Step 2: 运行测试，验证失败（getArticleBySlug 仍是 null）**

```bash
cd D:/code/codex/test5
node --test tests/articleService.test.js
```

Expected: 第一个新测试 FAIL（返回 null 而不是完整对象）

- [ ] **Step 3: 实现 getArticleBySlug**

替换 `services/articleService.js` 中的 `getArticleBySlug`：

```js
const { marked } = require('marked');
const hljs = require('highlight.js');

// 配置 marked 使用 highlight.js
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (__) {}
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: false,
  gfm: true,
});

async function getArticleBySlug(articlesDir, slug) {
  if (!slug || /[\/\\]/.test(slug)) return null; // 防止路径穿越
  const filePath = path.join(articlesDir, `${slug}.md`);

  let raw;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }

  const { data, content } = matter(raw);
  if (!data.title || !data.date) return null;

  const html = marked.parse(content);
  return { slug, title: data.title, date: data.date, html };
}
```

- [ ] **Step 4: 运行测试，验证通过**

```bash
cd D:/code/codex/test5
node --test tests/articleService.test.js
```

Expected: 6 tests pass

- [ ] **Step 5: 提交**

```bash
cd D:/code/codex/test5
git add services/articleService.js tests/articleService.test.js
git commit -m "feat(articleService): implement getArticleBySlug with markdown rendering"
```

---

## Task 6: Express 服务器骨架

**Files:**
- Create: `server.js`

- [ ] **Step 1: 创建 `server.js`**

```js
const express = require('express');
const path = require('node:path');

const app = express();
const PORT = process.env.PORT || 3000;
const ARTICLES_DIR = path.join(__dirname, 'articles');

// 视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 静态资源
app.use(express.static(path.join(__dirname, 'public')));

// 路由
app.use(require('./routes/index.js'));

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).send('服务器内部错误');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`服务器已启动: http://localhost:${PORT}`);
  });
}

module.exports = app;
```

- [ ] **Step 2: 验证 server 可以 require（不启动）**

```bash
cd D:/code/codex/test5
node -e "const app = require('./server.js'); console.log('OK');"
```

Expected: 输出 "OK"，无错误

- [ ] **Step 3: 提交**

```bash
cd D:/code/codex/test5
git add server.js
git commit -m "feat(server): add Express skeleton with static files and error handler"
```

---

## Task 7: 路由 — `/` 和 `/articles/:slug`

**Files:**
- Create: `routes/index.js`
- Create: `views/partials/empty.ejs`
- Create: `views/partials/not-found.ejs`

- [ ] **Step 1: 创建空状态和 404 模板**

`views/partials/empty.ejs`：

```html
<div class="empty-state">
  <h1>还没有任何文章</h1>
  <p>请在 <code>articles/</code> 目录添加一个 Markdown 文件。</p>
  <p>文件格式示例：</p>
  <pre><code>---
title: 我的第一篇文章
date: 2026-06-04
---

正文从这里开始。</code></pre>
</div>
```

`views/partials/not-found.ejs`：

```html
<div class="not-found">
  <h1>404</h1>
  <p>找不到这篇文章：<code><%= slug %></code></p>
  <p><a href="/">返回首页</a></p>
</div>
```

- [ ] **Step 2: 创建 `routes/index.js`**

```js
const express = require('express');
const path = require('node:path');
const { listArticles, getArticleBySlug } = require('../services/articleService.js');

const router = express.Router();
const ARTICLES_DIR = path.join(__dirname, '..', 'articles');

// 首页：重定向到最新文章
router.get('/', async (req, res, next) => {
  try {
    const articles = await listArticles(ARTICLES_DIR);
    if (articles.length === 0) {
      // articles 目录为空，仍渲染完整布局（侧边栏为空），让用户看到头部和提示
      return res.status(200).render('layout', {
        article: null,
        articles,
        activeSlug: '',
        notFoundSlug: null,
      });
    }
    res.redirect(`/articles/${articles[0].slug}`);
  } catch (err) {
    next(err);
  }
});

// 文章详情
router.get('/articles/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const article = await getArticleBySlug(ARTICLES_DIR, slug);
    const articles = await listArticles(ARTICLES_DIR);
    if (!article) {
      // 404：仍渲染完整布局，侧边栏可用，方便用户导航回其他文章
      return res.status(404).render('layout', {
        article: null,
        articles,
        activeSlug: '',
        notFoundSlug: slug,
      });
    }
    res.render('layout', { article, articles, activeSlug: slug, notFoundSlug: null });
  } catch (err) {
    next(err);
  }
});

// 兜底 404（未匹配的路径）
router.use((req, res, next) => {
  listArticles(ARTICLES_DIR)
    .then((articles) =>
      res.status(404).render('layout', {
        article: null,
        articles,
        activeSlug: '',
        notFoundSlug: req.path,
      })
    )
    .catch(next);
});

module.exports = router;
```

- [ ] **Step 3: 验证 require 不出错**

```bash
cd D:/code/codex/test5
node -e "const r = require('./routes/index.js'); console.log('OK');"
```

Expected: 输出 "OK"

- [ ] **Step 4: 提交**

```bash
cd D:/code/codex/test5
git add routes/index.js views/partials/empty.ejs views/partials/not-found.ejs
git commit -m "feat(routes): add home redirect and article detail routes"
```

---

## Task 8: 主布局 + 头部 + 头像占位图

**Files:**
- Create: `views/layout.ejs`
- Create: `views/partials/header.ejs`
- Create: `public/css/style.css`
- Create: `public/avatar.png`（用 SVG 内嵌 + base64，或创建简单 PNG）

- [ ] **Step 1: 创建 `public/css/style.css`**

```css
/* === Reset & Base === */
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
  background: #fafafa;
  color: #333;
  line-height: 1.6;
}

a { color: #2563eb; text-decoration: none; }
a:hover { text-decoration: underline; }

code {
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  background: #f1f1f1;
  padding: 0.1em 0.3em;
  border-radius: 3px;
  font-size: 0.9em;
}

pre {
  background: #f6f8fa;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
}

pre code {
  background: transparent;
  padding: 0;
  font-size: 0.9em;
}

/* === Layout === */
body {
  display: grid;
  grid-template-rows: 80px 1fr;
  min-height: 100vh;
}

.app {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 2em;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5em;
}

/* === Header === */
.site-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  padding: 0 1.5em;
  gap: 1em;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
}

.site-title {
  font-size: 1.25em;
  font-weight: 600;
  color: #111;
}

/* === Sidebar === */
.sidebar {
  padding-top: 1.5em;
}

.sidebar h2 {
  font-size: 0.85em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  margin-bottom: 0.75em;
  font-weight: 600;
}

.article-list { list-style: none; }
.article-list li { margin-bottom: 0.4em; }

.article-list a {
  display: block;
  padding: 0.5em 0.75em;
  border-radius: 6px;
  color: #374151;
  font-size: 0.95em;
  transition: background 0.15s;
}

.article-list a:hover { background: #f3f4f6; text-decoration: none; }

.article-list a.active {
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 600;
}

.article-date {
  display: block;
  font-size: 0.75em;
  color: #9ca3af;
  margin-top: 0.15em;
}

/* === Article Content === */
.article-content {
  padding: 1.5em 0 4em;
  max-width: 760px;
}

.article-content h1 {
  font-size: 2em;
  margin-bottom: 0.4em;
  color: #111;
}

.article-content h2 {
  font-size: 1.5em;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: #111;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}

.article-content h3 {
  font-size: 1.25em;
  margin-top: 1.2em;
  margin-bottom: 0.4em;
}

.article-content p { margin-bottom: 1em; }
.article-content ul, .article-content ol { margin: 0 0 1em 1.5em; }
.article-content blockquote {
  border-left: 4px solid #d1d5db;
  padding-left: 1em;
  color: #6b7280;
  margin: 1em 0;
}

.article-content table {
  border-collapse: collapse;
  margin: 1em 0;
}
.article-content th, .article-content td {
  border: 1px solid #e5e7eb;
  padding: 0.5em 0.75em;
  text-align: left;
}
.article-content th { background: #f9fafb; }

.article-meta {
  color: #6b7280;
  font-size: 0.9em;
  margin-bottom: 2em;
}

/* === Empty / Not Found === */
.empty-state, .not-found {
  max-width: 600px;
  margin: 4em auto;
  padding: 2em;
  background: #fff;
  border-radius: 8px;
  text-align: center;
}
.empty-state h1, .not-found h1 {
  margin-bottom: 0.5em;
  font-size: 1.5em;
}
.not-found h1 { font-size: 4em; color: #d1d5db; }

/* === Responsive === */
@media (max-width: 768px) {
  .app {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .sidebar {
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1em;
  }
  .article-content { padding-top: 1em; }
}
```

- [ ] **Step 2: 创建 `public/avatar.png`**

由于环境无图片编辑工具，用一个简单方法生成占位 PNG。在 `public/` 下创建 `avatar.svg`，作为临时方案（但用户要的是 PNG）。

先用 Node 生成一个简单的 200x200 PNG：

```bash
cd D:/code/codex/test5
node -e "
const fs = require('fs');
// 一个最小的有效 PNG：1x1 灰色
// 使用 Buffer 直接构造 200x200 灰色 PNG
const { createCanvas } = (() => { try { return require('canvas'); } catch { return {}; } })();
if (createCanvas) {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(100, 100, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 80px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('乘', 100, 100);
  fs.writeFileSync('public/avatar.png', canvas.toBuffer('image/png'));
  console.log('avatar.png created');
} else {
  console.log('canvas not available, will use SVG fallback');
}
"
```

如果上面失败（无 canvas 库），改用 SVG 方案（需要改 layout 引用）。但 PNG 是用户要求。

**回退方案**：用 PowerShell 生成 PNG：

```bash
cd D:/code/codex/test5
powershell -Command "
Add-Type -AssemblyName System.Drawing;
\$bmp = New-Object System.Drawing.Bitmap 200,200;
\$g = [System.Drawing.Graphics]::FromImage(\$bmp);
\$g.SmoothingMode = 'AntiAlias';
\$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(148,163,184));
\$g.FillEllipse(\$brush, 0, 0, 200, 200);
\$font = New-Object System.Drawing.Font 'Microsoft YaHei', 100, ([System.Drawing.FontStyle]::Bold);
\$textBrush = [System.Drawing.Brushes]::White;
\$g.DrawString('乘', \$font, \$textBrush, 30, 25);
\$bmp.Save('public/avatar.png', [System.Drawing.Imaging.ImageFormat]::Png);
\$g.Dispose();
\$bmp.Dispose();
Write-Host 'avatar.png created';
"
```

Expected: `public/avatar.png` 文件存在（200x200，灰色圆 + "乘"字）

- [ ] **Step 3: 创建 `views/partials/header.ejs`**

```html
<header class="site-header">
  <img src="/avatar.png" alt="头像" class="avatar" />
  <h1 class="site-title">乘风马</h1>
</header>
```

- [ ] **Step 4: 创建 `views/layout.ejs`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%= article ? article.title : '乘风马博客' %></title>
  <link rel="stylesheet" href="/css/style.css" />
</head>
<body>
  <%- include('partials/header') %>

  <div class="app">
    <aside class="sidebar">
      <h2>文章列表</h2>
      <ul class="article-list">
        <% articles.forEach(function(a) { %>
          <li>
            <a href="/articles/<%= a.slug %>" class="<%= a.slug === activeSlug ? 'active' : '' %>">
              <%= a.title %>
              <span class="article-date"><%= a.date %></span>
            </a>
          </li>
        <% }); %>
      </ul>
    </aside>

    <main class="article-content">
      <% if (article) { %>
        <h1><%= article.title %></h1>
        <div class="article-meta">发布于 <%= article.date %></div>
        <%- article.html %>
      <% } else if (notFoundSlug) { %>
        <%- include('partials/not-found', { slug: notFoundSlug }) %>
      <% } else { %>
        <%- include('partials/empty') %>
      <% } %>
    </main>
  </div>
</body>
</html>
```

- [ ] **Step 5: 验证模板语法正确**

```bash
cd D:/code/codex/test5
node -e "const ejs = require('ejs'); ejs.renderFile('views/layout.ejs', {article:null, articles:[], activeSlug:''}); console.log('OK');"
```

Expected: 输出 "OK"

- [ ] **Step 6: 提交**

```bash
cd D:/code/codex/test5
git add views/ public/css/ public/avatar.png
git commit -m "feat(views): add layout, header, sidebar, and styles"
```

---

## Task 9: 示例文章 + 手动验证

**Files:**
- Create: `articles/welcome.md`
- Create: `articles/2026-06-04-hello-world.md`

- [ ] **Step 1: 创建 `articles/welcome.md`**

```markdown
---
title: 欢迎来到乘风马的博客
date: 2026-06-04
---

# 欢迎

这是用 Markdown 写的第一篇博客文章。

## 功能

- 支持标准 Markdown
- 支持代码高亮
- 支持表格、列表、引用

## 代码示例

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet('乘风马'));
```

## 引用

> 这是一个引用块。

| 列 1 | 列 2 |
|------|------|
| A    | B    |
| C    | D    |
```

- [ ] **Step 2: 创建 `articles/2026-06-04-hello-world.md`**

```markdown
---
title: 你好，世界
date: 2026-05-15
---

这是一篇较早的文章，用来测试日期排序。

第二段：*斜体*、**加粗**、`行内代码` 都应该正常显示。

- 列表项 1
- 列表项 2
- 列表项 3
```

- [ ] **Step 3: 启动服务器**

```bash
cd D:/code/codex/test5
node server.js
```

Expected: 控制台输出 "服务器已启动: http://localhost:3000"

**此步骤保持服务器运行**，在后续步骤中验证。

- [ ] **Step 4: 用 curl 验证首页**

打开另一个终端：

```bash
curl -i http://localhost:3000/
```

Expected: HTTP 302，重定向到 `/articles/welcome`（或最新的，按日期倒序）

- [ ] **Step 5: 验证文章详情页**

```bash
curl -s http://localhost:3000/articles/welcome | head -20
```

Expected: HTML 中包含 `<h1>欢迎来到乘风马的博客</h1>` 和 `<strong>加粗</strong>`

- [ ] **Step 6: 验证 404**

```bash
curl -i http://localhost:3000/articles/nonexistent
```

Expected: HTTP 404

- [ ] **Step 7: 验证样式和头像可访问**

```bash
curl -I http://localhost:3000/css/style.css
curl -I http://localhost:3000/avatar.png
```

Expected: 两个都返回 200

- [ ] **Step 8: 停止服务器**

在运行服务器的终端按 `Ctrl+C`。

- [ ] **Step 9: 提交**

```bash
cd D:/code/codex/test5
git add articles/
git commit -m "feat(articles): add welcome and hello-world example posts"
```

---

## Task 10: 集成测试

**Files:**
- Create: `tests/integration.test.js`

- [ ] **Step 1: 写失败的集成测试**

`tests/integration.test.js`：

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs/promises');

const app = require('../server.js');
const ARTICLES_DIR = path.join(__dirname, '..', 'articles');

let server;
let baseUrl;

test.before(async () => {
  // 确保有示例文章
  await fs.writeFile(
    path.join(ARTICLES_DIR, 'integration-test.md'),
    '---\ntitle: 集成测试文章\ndate: 2026-06-01\n---\n\n# 集成测试'
  );

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await fs.unlink(path.join(ARTICLES_DIR, 'integration-test.md')).catch(() => {});
  await new Promise((resolve) => server.close(resolve));
});

function get(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${urlPath}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject);
  });
}

test('GET / 返回 302 重定向到最新文章', async () => {
  const res = await get('/');
  assert.equal(res.status, 302);
  assert.ok(res.headers.location.startsWith('/articles/'));
});

test('GET /articles/integration-test 返回 200 和正确内容', async () => {
  const res = await get('/articles/integration-test');
  assert.equal(res.status, 200);
  assert.ok(res.body.includes('集成测试文章'));
  assert.ok(res.body.includes('<h1'));
  assert.ok(res.body.includes('article-list'));
});

test('GET /articles/nonexistent 返回 404 且页面包含"找不到这篇文章"', async () => {
  const res = await get('/articles/nonexistent');
  assert.equal(res.status, 404);
  assert.ok(res.body.includes('找不到这篇文章'));
  assert.ok(res.body.includes('article-list'));
});

test('GET /css/style.css 返回 200', async () => {
  const res = await get('/css/style.css');
  assert.equal(res.status, 200);
  assert.ok(res.body.includes('site-header'));
});
```

- [ ] **Step 2: 运行集成测试，验证通过**

```bash
cd D:/code/codex/test5
node --test tests/integration.test.js
```

Expected: 4 tests pass

- [ ] **Step 3: 运行所有测试**

```bash
cd D:/code/codex/test5
npm test
```

Expected: 所有测试通过（10+ 个）

- [ ] **Step 4: 提交**

```bash
cd D:/code/codex/test5
git add tests/integration.test.js
git commit -m "test(integration): add HTTP integration tests"
```

---

## Task 11: 动态加载验证 + 边界情况

**Files:**
- Modify: `tests/articleService.test.js`

- [ ] **Step 1: 写测试验证添加新文章立即生效**

向 `tests/articleService.test.js` 追加：

```js
test('listArticles: 添加新文章后立即可读（无需重启）', async () => {
  await fs.writeFile(
    path.join(ARTICLES_DIR, 'fresh.md'),
    '---\ntitle: 刚加的\ndate: 2026-12-31\n---\n\n新鲜出炉'
  );

  const result = await listArticles(ARTICLES_DIR);
  assert.ok(result.find((a) => a.slug === 'fresh'));

  await fs.unlink(path.join(ARTICLES_DIR, 'fresh.md'));
});

test('getArticleBySlug: 防止路径穿越', async () => {
  const result = await getArticleBySlug(ARTICLES_DIR, '../server.js');
  assert.equal(result, null);
});
```

- [ ] **Step 2: 运行测试，验证通过**

```bash
cd D:/code/codex/test5
node --test tests/articleService.test.js
```

Expected: 所有测试通过（含新加的 2 个）

- [ ] **Step 3: 运行完整测试套件**

```bash
cd D:/code/codex/test5
npm test
```

Expected: 全部通过

- [ ] **Step 4: 提交**

```bash
cd D:/code/codex/test5
git add tests/articleService.test.js
git commit -m "test(articleService): add hot-reload and path traversal tests"
```

---

## Task 12: 收尾

**Files:**
- Modify: `README.md`（添加用法）

- [ ] **Step 1: 更新 README 添加使用说明**

替换 `README.md`：

```markdown
# 乘风马个人博客

基于 Express + EJS 的服务端渲染博客。Markdown 文件即文章，添加新文章无需重启服务器。

## 启动

```bash
npm install
npm start
```

默认监听 `http://localhost:3000`，可通过 `PORT` 环境变量修改。

## 添加新文章

在 `articles/` 目录新建 `.md` 文件：

```markdown
---
title: 文章标题
date: 2026-06-04
---

正文（标准 Markdown）。
```

文件名（不含 `.md`）即 URL slug。例如 `hello.md` 对应 `/articles/hello`。

**front-matter 必填字段**：`title`、`date`（`YYYY-MM-DD`）。

## 测试

```bash
npm test
```

## 项目结构

```
.
├── server.js               # Express 入口
├── routes/index.js         # 路由
├── services/               # 业务逻辑（核心隔离单元）
│   └── articleService.js
├── views/                  # EJS 模板
├── public/                 # 静态资源
│   ├── css/style.css
│   └── avatar.png
├── articles/               # 你的 Markdown 文章
└── tests/                  # 单元 + 集成测试
```

## 技术栈

- Express 4 — HTTP 服务器
- EJS — 模板引擎
- gray-matter — front-matter 解析
- marked — Markdown → HTML
- highlight.js — 代码高亮
- Node 内置 `node:test` — 测试

## 替换头像

把自己的图片命名为 `avatar.png`（建议 200x200 以上），覆盖 `public/avatar.png` 即可。
```

- [ ] **Step 2: 启动服务器做最终冒烟测试**

```bash
cd D:/code/codex/test5
node server.js
```

打开浏览器访问 `http://localhost:3000`，验证：
- [ ] 头部显示圆形头像 + "乘风马"
- [ ] 左侧文章列表显示 2 篇文章（按日期倒序）
- [ ] 右侧显示文章内容，代码块有高亮
- [ ] 点击侧边栏文章，URL 变化，内容切换
- [ ] 当前文章在侧边栏高亮

按 `Ctrl+C` 停止。

- [ ] **Step 3: 最终提交**

```bash
cd D:/code/codex/test5
git add README.md
git commit -m "docs: expand README with usage instructions"
```

- [ ] **Step 4: 查看 git log 确认提交链**

```bash
cd D:/code/codex/test5
git log --oneline
```

Expected: 12 个左右的提交，每个对应一个任务。

---

## 验收清单

完成后应当满足：

- [ ] `npm install` 成功
- [ ] `npm test` 全部通过
- [ ] `npm start` 启动服务器
- [ ] 访问 `http://localhost:3000` 自动跳到最新文章
- [ ] 头部显示圆形头像 + "乘风马" 文字
- [ ] 左侧文章列表按日期倒序，当前文章高亮
- [ ] 右侧 Markdown 渲染正确，代码块有高亮
- [ ] 在 `articles/` 目录新增 `.md` 后刷新页面立即可见
- [ ] 访问不存在的 slug 返回 404
