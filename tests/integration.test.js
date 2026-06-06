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
