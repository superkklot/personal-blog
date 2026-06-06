const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const os = require('node:os');
const { listArticles, getArticleBySlug } = require('../services/articleService.js');

// 每个测试用独立的临时目录，避免与 articles/ 下的示例文件相互干扰
async function makeTempDir() {
  return await fs.mkdtemp(path.join(os.tmpdir(), 'article-test-'));
}

test('listArticles: 空目录返回空数组', async () => {
  const dir = await makeTempDir();
  try {
    const result = await listArticles(dir);
    assert.deepEqual(result, []);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('getArticleBySlug: 空目录返回 null', async () => {
  const dir = await makeTempDir();
  try {
    const result = await getArticleBySlug(dir, 'any-slug');
    assert.equal(result, null);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('listArticles: 多个文件按 date 倒序', async () => {
  const dir = await makeTempDir();
  try {
    await fs.writeFile(
      path.join(dir, 'old.md'),
      '---\ntitle: 旧文章\ndate: 2025-01-01\n---\n\n旧内容'
    );
    await fs.writeFile(
      path.join(dir, 'new.md'),
      '---\ntitle: 新文章\ndate: 2026-06-04\n---\n\n新内容'
    );

    const result = await listArticles(dir);
    const slugs = result.map((a) => a.slug);
    assert.deepEqual(slugs, ['new', 'old']);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('listArticles: 缺少 title 或 date 的文件被跳过', async () => {
  const dir = await makeTempDir();
  try {
    await fs.writeFile(
      path.join(dir, 'invalid.md'),
      '---\ntitle: 只有标题\n---\n\n内容'
    );

    const result = await listArticles(dir);
    assert.equal(result.find((a) => a.slug === 'invalid'), undefined);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('getArticleBySlug: 命中返回 title, date, html', async () => {
  const dir = await makeTempDir();
  try {
    await fs.writeFile(
      path.join(dir, 'hello.md'),
      '---\ntitle: 你好\ndate: 2026-06-04\n---\n\n# 标题\n\n这是**加粗**文本。'
    );

    const result = await getArticleBySlug(dir, 'hello');
    assert.equal(result.slug, 'hello');
    assert.equal(result.title, '你好');
    assert.equal(result.date, '2026-06-04');
    assert.ok(result.html.includes('<h1'));
    assert.ok(result.html.includes('<strong>加粗</strong>'));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('getArticleBySlug: 不存在的 slug 返回 null', async () => {
  const dir = await makeTempDir();
  try {
    const result = await getArticleBySlug(dir, 'nonexistent');
    assert.equal(result, null);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('listArticles: 添加新文章后立即可读（无需重启）', async () => {
  const dir = await makeTempDir();
  try {
    await fs.writeFile(
      path.join(dir, 'fresh.md'),
      '---\ntitle: 刚加的\ndate: 2026-12-31\n---\n\n新鲜出炉'
    );

    const result = await listArticles(dir);
    assert.ok(result.find((a) => a.slug === 'fresh'));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('getArticleBySlug: 防止路径穿越', async () => {
  const dir = await makeTempDir();
  try {
    const result = await getArticleBySlug(dir, '../server.js');
    assert.equal(result, null);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('getArticleBySlug: 代码块被高亮（hljs 类）', async () => {
  const dir = await makeTempDir();
  try {
    await fs.writeFile(
      path.join(dir, 'code.md'),
      '---\ntitle: 代码测试\ndate: 2026-06-04\n---\n\n```javascript\nconst x = 1;\n```'
    );

    const result = await getArticleBySlug(dir, 'code');
    assert.ok(result.html.includes('hljs'));
    assert.ok(result.html.includes('language-javascript'));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
