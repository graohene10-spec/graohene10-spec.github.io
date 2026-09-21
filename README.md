# Kerf · 个人主页

个人主页、交互项目与文字，发布在 [graohene10-spec.github.io](https://graohene10-spec.github.io/)。

首页使用简洁导航与响应式卡片，支持浅色和深色主题。姓名为 Kerf，自我介绍展示兴趣领域与教育经历；项目区域已有月相实验室，并为后续项目留有位置。文字栏目按标签筛选文章，以独立页面阅读。

## 页面结构

```text
index.html                 个人主页
assets/home.css            主页与 404 页样式
assets/home.js             导航状态和项目数量
assets/site.js             主题偏好与文章标签筛选
assets/writing.css         文字列表、长文排版与深色主题
assets/reading.js          阅读进度与公式渲染
assets/favicon.svg         网站图标
assets/moon-preview.svg    月相项目预览
assets/vendor/katex/       本地托管的公式渲染库与字体
content/articles.json      文章目录，数组顺序即阅读顺序
content/*.html             文章正文源文件
writing/*/index.html       自动生成的独立文章页
scripts/build.mjs          更新导航、文字卡片与文章页面
scripts/check.mjs          检查前后篇导航、链接与公式字体
scripts/serve.mjs          本地预览
projects/moon-phase/       独立月相实验室
404.html                   未找到页面时的导航
.nojekyll                  直接发布静态文件
```

## 修改个人介绍

在 `index.html` 中查找 `id="personal-introduction"`。兴趣领域位于 `.bio-interests`，教育经历位于 `.bio-education`；可以直接修改对应文字，或在该容器中加入介绍段落，例如 `<p>你的自我介绍。</p>`。

## 添加项目

1. 在 `projects/` 中新建目录，放入项目的 `index.html` 与资源文件。
2. 在首页 `.projects-grid` 中复制已有的 `.project-card` 卡片，修改其中链接的目标地址、标题、说明和预览。保留 `data-project` 属性，主页会自动更新项目数量，并给新预览使用不同的 ID。
3. 按需要替换或移除 `.future-slot` 预留卡片，并调整卡片显示的项目序号。
4. 在子页面添加返回主页的链接 `../../`。

## 添加或修改文章

《下雨的人》从提供的 Word 文件导入。正文、段落、标点与段内换行保持原样，原 Word 文件及其文件属性没有发布。

1. 在 `content/` 中添加正文 HTML 文件。用 `<p>...</p>` 表示段落、`<br>` 表示段内换行，也可以使用标题、引用等 HTML 元素。
2. 在 `content/articles.json` 中添加一条记录，填写 `slug`（小写英文与短横线）、`title`、`author`、`tags`、`excerpt` 和 `bodyFile`。文件路径相对于 `content/`。
3. 运行 `node scripts/build.mjs`。脚本会更新首页文字卡片、标签选项、字数、预计阅读时间和独立文章页，并根据目录数组的顺序生成上一篇／下一篇链接。第一篇和最后一篇会显示相应的不可用状态。
4. 运行 `node scripts/check.mjs` 检查链接，再运行 `node scripts/serve.mjs`，在 `http://127.0.0.1:4173/` 预览。按 Ctrl+C 停止预览。
5. 提交正文、目录和生成后的页面，再推送到 `main`。

正文请修改 `content/` 中的源文件；`writing/` 中的页面会在生成时更新。个人简介和项目区域仍直接编辑首页，生成脚本会保留它们。删除文章时，也应删除对应的 `writing/<slug>/` 页面。

标签筛选为单选，支持 `/?tag=小说#writing` 这样的分类链接。主题首次跟随系统，手动切换后会在当前浏览器记住偏好，并在首页、文章页和 404 页面之间沿用。

## 公式

《量子力学入门：从线性空间到时间演化》的源文件位于 `content/quantum-mechanics-introduction.tex`，标签为“物理”。修改源文件后运行相同的生成脚本即可更新网页。LaTeX 文章在生成时完成公式排版，不依赖读者浏览器运行脚本；章节目录、公式编号和 `\eqref` 跳转自动生成，字数统计只计算正文文字。

`scripts/latex-article.mjs` 支持本文使用的 `section`、`subsection`、`abstract`、`textbf`、`important`、行内公式、独立公式、`equation`、`align`、`label` 与 `eqref`，并读取数学宏定义。它不是通用 LaTeX 编译器；遇到不支持的正文命令、公式错误或无法解析的引用时，生成会报错，需先处理后发布。

文章页使用本地托管的 [KaTeX 0.18.7](https://katex.org/docs/browser.html)，渲染器与字体均由本站提供。正文支持以下写法：

```html
<p>行内公式：\(e^{i\pi}+1=0\)。</p>
<p>$$\int_{-\infty}^{\infty} e^{-x^2}\,dx=\sqrt{\pi}$$</p>
```

也支持 `$...$` 行内公式和 `\[...\]` 独立公式。单独的金额符号可写成 `\$`。HTML 中的小于号和与号仍需写成 `&lt;` 和 `&amp;`。长公式可横向滚动；代码块不参与自动渲染。公式内容使用 KaTeX 的数学字体，并输出可供辅助阅读的 MathML。

## 月相实验室

[进入月相实验室](https://graohene10-spec.github.io/projects/moon-phase/)。

- 拖动月球或时间滑块，播放完整的 29.53 天周期。
- 同步查看轨道位置、地球视角、相位角和月盘亮区比例。
- 通过代表性入射光与散射光、月盘投影、可移动横向切片理解月相形状。
- 从球面交界线推导 `k = (1 + cos α) / 2`，并查看可交互的时间曲线。
- 支持南北半球典型方向示意、键盘操作与手机布局。

这是平行太阳光、匀速圆周相对运动和正交投影的教学模型，忽略食、轨道倾角、天平动与地面视差。面积比例指月盘亮区的投影面积比例，不是月球表面受光比例或观测光度。

旧主页的 `/#principle` 与 `/#optics-details` 链接会转到月相项目中对应的区域。

科普参考：[NASA Moon Phases](https://science.nasa.gov/moon/moon-phases/)。

## 发布

纯静态 HTML、CSS、JavaScript 网站，无需安装依赖。仅在修改文章目录、正文或页面模板后需要运行本地生成脚本。GitHub Pages 直接从 `main` 分支根目录 `/` 发布已生成的文件；提交并推送后自动更新。
