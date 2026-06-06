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
