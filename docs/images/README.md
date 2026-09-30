# 原型截图说明

## v1.3.1 完整照片与口味标签

2026-09-30 采集独立 Chromium 测试会话；桌面1440 × 1024、手机390 × 844。为验证竖图上下完整显示，使用生成饮品图构造竖版夹具：上下边缘带测试色条。图片不是用户私人数据，也不是实机截图。

- [桌面完整照片](shop-v131-catalog-desktop.jpg)、[手机完整照片](shop-v131-catalog-mobile.jpg)
- [桌面编辑](shop-v131-editor-desktop.jpg)、[手机编辑](shop-v131-editor-mobile.jpg)、[手机口味多选](shop-v131-tastes-mobile.jpg)


## v1.3 解忧杂货店

2026-09-30 采集独立 Chromium 示例会话。桌面1440 × 1024，手机390 × 844；全部来自实际运行页面，不是真机照片。示例饮品图片由 Image Gen 生成，编辑页上传同一演示图片，不涉及用户私人数据。PNG转JPEG，仅压缩未改写内容。

- [桌面酒单](shop-desktop.jpg)、[手机酒单](shop-mobile.jpg)
- [桌面独立编辑](shop-editor-desktop.jpg)、[手机独立编辑](shop-editor-mobile.jpg)
- [完整自我关怀桌面](shop-care-desktop.jpg)、[完整自我关怀手机](shop-care-mobile.jpg)
- [设计参考与对照](../iterations/shop/DESIGN.md)


[返回项目首页](../../README.md) · [详细 PRD](../PRD.md)

本目录包含 v1.0 / v1.1 历史截图和 v1.2 实际实现截图，用于 README 与 PRD。

## v1.2 首页与时间回顾

采集于 2026-09-28，本地实际 Chromium 页面、独立示例手帐。使用 1440 × 1184 桌面首页、1440 × 1024 回顾页和 390 × 1010 手机 CSS viewport，density 1。日期选择为近 30 天；数据为内置虚构示例，缺失日真实留空。手机图来自响应式浏览器，不是安卓真机拍摄。

| 文件 | 内容与处理 |
|---|---|
| [home-v1.2-desktop.jpg](home-v1.2-desktop.jpg) | 实际首页完整页面，含绿色入口、表单、便签及趋势 |
| [home-v1.2-mobile.jpg](home-v1.2-mobile.jpg) | 同一手机页面从顶部到趋势后，按内容裁切；不是一屏可见承诺 |
| [trend-menu-mobile.jpg](trend-menu-mobile.jpg) | 时间选项展开的实际视口 |
| [trend-date-mobile.jpg](trend-date-mobile.jpg) | 自定义日期底部面板，背景为当前首页 |
| [trend-review-desktop.jpg](trend-review-desktop.jpg) | 实际回顾页，同范围曲线与因素 |

PNG 原始截图转为 JPEG，未重绘、改写或拼接页面内容。选定概念另存于 [设计档案](../iterations/home-trend/DESIGN.md)，不会冒充实现截图。

## v1.1.1 影集布局修复

`album-mobile.jpg` 已替换为本轮实际单列页面（390 × 1090 的内容截取），`album-desktop.jpg` 为 1440 × 1800 的前四篇记录。`album-feed-mixed-mobile.jpg` 是完整混合记录长截图，用于观察单图、多图、纯文字与长标题。素材全部为生成的示例照片和虚构测试文字；不发布用户手机里的照片。其他编辑和详情截图沿用 v1.1，对应功能本轮未改变。

## v1.1 照片手帐历史采集

采集于 2026-09-27，来源为本轮工作区的实际本地服务；独立 Chromium 会话，390 × 844 / 1440 × 1024 CSS viewport。测试环境使用内置照片构造的虚构记录，无真实用户内容。新图转为 JPEG，未重绘或改变页面内容。

| 图片 | 页面 |
|---|---|
| [album-mobile.jpg](album-mobile.jpg) | 手机生活影集 |
| [album-editor-mobile.jpg](album-editor-mobile.jpg) | 手机独立编辑器 |
| [album-detail-mobile.jpg](album-detail-mobile.jpg) | 手机只读详情 |
| [album-desktop.jpg](album-desktop.jpg) | 桌面生活影集 |
| [album-editor-desktop.jpg](album-editor-desktop.jpg) | 桌面独立编辑器 |

参考概念及并排对照见 [设计档案](../iterations/photo-journal/DESIGN.md)。

## v1.0 历史截图

以下记录为原主线功能基线；旧回顾列表已在 v1.1 调整为独立影集，不能用旧截图描述新导航。

- 来源：[正式在线原型](https://moodjournal-pi.vercel.app/)，功能基线 `c6fc23e`。
- 采集日期：2026-09-27；浏览器：独立 Chrome 会话，由 agent-browser 操作。
- 数据模式：全部使用「示例手帐」；首页文字为示例草稿，关怀反馈为演示操作，不是用户研究或效果评估数据。
- 个人数据：采集完成后检查，个人日记与关怀记录的本地存储键均未写入。
- 处理方式：浏览器原始 PNG 转为 JPEG 以减小仓库体积；便签图按实际组件边界裁切，未改写页面内容。
- 桌面图尺寸：1487 × 1058；手机图尺寸：390 × 960。手机画幅用于完整展示保存操作和弹窗，不对应某一特定硬件型号。
- 后续 UI 调整时请同步重拍，避免原型和文档不一致。

| 图片 | 展示内容 | 状态说明 |
|---|---|---|
| [home.jpg](home.jpg) | 今日心情、短日记、便签与趋势 | 示例模式，草稿未保存，溪流便签选中 |
| [review.jpg](review.jpg) | 七天趋势、低落因素和日记列表 | 内置七天示例记录 |
| [care.jpg](care.jpg) | 三类关怀入口及关怀记录 | 两条演示活动反馈，非真实效果结果 |
| [noise-player.jpg](noise-player.jpg) | 自然声选择、音量、定时与播放状态 | 森林播放中，15 分钟定时 |
| [breathing.jpg](breathing.jpg) | 呼吸引导、倒计时与控制 | 练习已开始 |
| [note-breathe.jpg](note-breathe.jpg) | 呼吸便签与圆点 | 第 1 张；右侧为白噪音、散步 |
| [note-noise.jpg](note-noise.jpg) | 白噪音便签与圆点 | 第 2 张，选中溪流；右侧为散步、呼吸 |
| [note-walk.jpg](note-walk.jpg) | 散步便签与圆点 | 第 3 张；右侧为呼吸、白噪音 |
| [mobile-home.jpg](mobile-home.jpg) | 手机首页核心记录操作 | 示例模式，包含保存按钮 |
| [mobile-noise.jpg](mobile-noise.jpg) | 手机自然声播放器 | 选中海浪，等待主动播放 |
