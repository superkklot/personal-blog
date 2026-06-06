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
