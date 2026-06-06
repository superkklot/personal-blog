/**
 * 博客服务器入口文件
 * 使用 Express + EJS 构建的个人博客
 */

const express = require('express');
const path = require('node:path');

// 创建 Express 应用实例
const app = express();

// 服务器端口：优先使用环境变量 PORT，否则默认 3000
const PORT = process.env.PORT || 3000;

// Markdown 文章存放目录（articles/ 文件夹）
const ARTICLES_DIR = path.join(__dirname, 'articles');

// ----- 视图引擎配置 -----
// 使用 EJS 模板引擎渲染页面
app.set('view engine', 'ejs');
// 指定模板文件所在目录
app.set('views', path.join(__dirname, 'views'));

// ----- 静态资源服务 -----
// 公开目录下的文件可直接访问（CSS、图片、客户端 JS 等）
app.use(express.static(path.join(__dirname, 'public')));

// ----- 路由挂载 -----
// 所有页面路由由 routes/index.js 统一处理
app.use(require('./routes/index.js'));

// ----- 全局错误处理中间件 -----
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).send('服务器内部错误');
});

// ----- 启动服务器 -----
// 仅当直接运行此文件时才启动（被测试文件 require 时不启动）
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`服务器已启动: http://localhost:${PORT}`);
  });
}

// 导出 app 实例供测试文件使用
module.exports = app;
