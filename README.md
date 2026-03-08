# Own Blog

这是一个由 HTML + JSON + Markdown 组成的静态博客，不需要后端即可维护内容。

## 目录结构

- `src/index.html`：主页入口
- `src/subpage.html`：栏目聚合页入口
- `src/article.html`：文章详情页入口
- `src/connect.html`：联系方式页面入口
- `src/assets/app.js`：页面渲染逻辑
- `src/data/site-config.json`：站点全局配置（导航、首页、精选区块、页脚）
- `src/data/subpage-config.json`：各栏目页面配置
- `src/data/articles.json`：文章元数据
- `src/content/*.md`：文章正文

## 本地预览

在 `src` 目录启动静态服务：

```bash
python -m http.server 4173
```

浏览器访问：

```text
http://localhost:4173
```

## 如何新增一篇文章

### 1) 新建 Markdown 正文

在 `src/content/` 新建一个 `.md` 文件，例如：

```text
src/content/my-new-post.md
```

### 2) 在 articles.json 追加元数据

编辑 `src/data/articles.json`，新增一个对象，核心字段如下：

- `id`：唯一标识，用于文章链接
- `title`：文章标题
- `summary`：摘要
- `date`：日期（建议 `YYYY-MM-DD`）
- `category`：分类数组（可同时属于主分类与精选分类）
- `tags`：标签数组
- `contentPath`：对应的 Markdown 路径

示例：

```json
{
  "id": "my-new-post",
  "title": "My New Post",
  "summary": "A short summary of this post.",
  "date": "2026-03-09",
  "category": ["projects", "futureLab"],
  "featuredOrder": 3,
  "tags": ["Demo", "Notes"],
  "specialMark": true,
  "contentPath": "./content/my-new-post.md"
}
```

## 分类与栏目说明

### 主导航栏目（文章主分类）

常用主分类值：

- `projects`
- `media`
- `logs`
- `career`
- `life`

### 首页精选分类（与重命名后的键保持一致）

当前精选分类值：

- `futureLab`
- `mediaRank`
- `ideaLogs`
- `careerExperience`
- `lifeStream`

如果希望文章进入某个精选区域，需要把对应值写进该文章的 `category` 数组。

## 如何调整栏目页

编辑 `src/data/subpage-config.json`：

- `views.<key>.pageTitle`：浏览器标题
- `views.<key>.heading`：页面主标题
- `views.<key>.description`：栏目描述
- `views.<key>.category`：该页筛选使用的分类值
- `views.<key>.sort`：排序规则（如 `dateDesc`、`featuredOrderAsc`、`rankAsc`）
- `views.<key>.display`：展示样式（如 `grid-3`、`grid-2`、`rank`）

## 如何调整首页内容

编辑 `src/data/site-config.json`：

- `navigation`：顶部导航配置
- `home.hero`：首页首屏文案与按钮
- `featuredSections`：首页精选区块及其数据来源
- `connect`：联系方式卡片
- `footer`：页脚文案

`featuredSections` 中最关键的字段：

- `viewKey`：跳转到哪个子页面视图
- `sourceCategory`：从文章中筛选哪个分类
- `sort`：排序规则
- `display`：展示样式
- `limit`：显示条数

## 常见修改场景

- 改品牌名：`site-config.json -> brand`
- 改首页按钮文案：`site-config.json -> home.hero.actions`
- 改联系方式：`site-config.json -> connect.cards`
- 改文章展示顺序：`articles.json` 中 `date`、`featuredOrder`、`rank`
- 改文章详情内容：对应 `src/content/*.md`

## 注意事项

- `id` 必须全局唯一，否则详情页可能冲突。
- `contentPath` 必须和实际 Markdown 文件路径一致。
- `category` 的值必须和配置中的分类值一致，否则该文章不会在目标栏目出现。
- 修改 JSON 后请确保语法合法（逗号、引号、括号完整）。
