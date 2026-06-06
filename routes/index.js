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
