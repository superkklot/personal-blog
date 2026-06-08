/**
 * 文章服务 — 负责从 articles/ 目录读取 Markdown 文章，
 * 解析 frontmatter 元数据，并使用 marked + highlight.js 渲染为 HTML。
 *
 * 使用流程：
 *   const service = require('./services/articleService');
 *   const list = await service.listArticles('/path/to/articles');
 *   const article = await service.getArticleBySlug('/path/to/articles', 'my-post');
 */

// Node.js 原生模块：异步文件操作与路径处理
const fs = require('node:fs/promises');
const path = require('node:path');

// 第三方依赖：解析 Markdown 文件头部的 YAML frontmatter（--- ... ---）
const matter = require('gray-matter');

// 第三方依赖：Markdown → HTML 渲染器（新一代 marked，支持 ESM）
const { Marked } = require('marked');
// marked 扩展：桥接 highlight.js 实现代码块语法高亮
const { markedHighlight } = require('marked-highlight');
// 代码高亮引擎，支持 190+ 编程语言
const hljs = require('highlight.js');

// marked 渲染器：启用代码高亮（marked@12+ 需 marked-highlight 扩展桥接）
const marked = new Marked(
  markedHighlight({
    // highlight.js CSS 类名前缀，对应 highlight.js 主题中的 .hljs 规则
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      // 若指定语言不可识别则按纯文本高亮，避免 hljs 报错
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  })
);

/**
 * 扫描指定目录，收集所有 .md 文件并解析 frontmatter，
 * 返回按日期倒序排列的文章元数据列表。
 *
 * @param {string} articlesDir - articles 目录绝对路径
 * @returns {Promise<Array<{slug: string, title: string, date: string}>>}
 *          文章列表，每项包含 slug（文件名不含 .md）、title 和 date（YYYY-MM-DD）
 */
async function listArticles(articlesDir) {
  let files;
  try {
    files = await fs.readdir(articlesDir);
  } catch (err) {
    // 目录不存在时返回空列表而非报错，方便首次使用
    if (err.code === 'ENOENT') return [];
    throw err;
  }

  // 只处理 .md 文件，忽略其他文件（如图片、.DS_Store 等）
  const mdFiles = files.filter((f) => f.endsWith('.md'));
  const articles = [];

  for (const file of mdFiles) {
    const fullPath = path.join(articlesDir, file);
    const raw = await fs.readFile(fullPath, 'utf8');
    const { data } = matter(raw);

    // 缺少 title 或 date 的文章视为无效，跳过
    if (!data.title || !data.date) continue;

    // slug 由文件名（不含 .md）决定，确保 URL 唯一且可读
    const slug = file.replace(/\.md$/, '');
    // gray-matter 可能将 date 解析为 Date 对象，统一转为 YYYY-MM-DD 字符串
    const dateStr = data.date instanceof Date
      ? data.date.toISOString().slice(0, 10)
      : String(data.date);
    articles.push({ slug, title: data.title, date: dateStr });
  }

  // 按日期倒序排列（最新在前）
  articles.sort((a, b) => b.date.localeCompare(a.date));
  return articles;
}

/**
 * 根据 slug（即文件名不含 .md）读取单篇文章，解析 frontmatter 并渲染 Markdown 为 HTML。
 *
 * @param {string} articlesDir - articles 目录绝对路径
 * @param {string} slug - 文章标识（从 URL 获取）
 * @returns {Promise<{slug: string, title: string, date: string, html: string} | null>}
 *          文章完整数据，slug 对应文件不存在或元数据无效时返回 null
 */
async function getArticleBySlug(articlesDir, slug) {
  // 防御：拒绝含路径分隔符的 slug，防止 ../ 等路径穿越攻击
  if (!slug || /[\/\\]/.test(slug)) return null;

  const filePath = path.join(articlesDir, `${slug}.md`);

  let raw;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null; // 文件不存在 → 404
    throw err;                              // 其他 I/O 错误向上抛
  }

  const { data, content } = matter(raw);

  // 缺少必填元数据的文件视为无效，不展示
  if (!data.title || !data.date) return null;

  // 将 Markdown 正文渲染为带代码高亮的 HTML
  const html = marked.parse(content);
  const dateStr = data.date instanceof Date
    ? data.date.toISOString().slice(0, 10)
    : String(data.date);
  return { slug, title: data.title, date: dateStr, html };
}

module.exports = { listArticles, getArticleBySlug };
