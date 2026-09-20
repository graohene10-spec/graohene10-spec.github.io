# Kerf · 个人主页

个人主页与交互项目合集，发布在 [graohene10-spec.github.io](https://graohene10-spec.github.io/)。

首页使用浅色背景、简洁导航与响应式项目卡片。姓名为 Kerf，自我介绍展示兴趣领域与教育经历；项目区域已有月相实验室，并为后续项目留有位置。

## 页面结构

```text
index.html                 个人主页
assets/home.css            主页与 404 页样式
assets/home.js             导航状态和项目数量
assets/favicon.svg         网站图标
assets/moon-preview.svg    月相项目预览
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

纯静态 HTML、CSS、JavaScript 网站，无需安装依赖或构建。GitHub Pages 从 `main` 分支根目录 `/` 发布；提交并推送后自动更新。
