# 心晴 · 情绪日记与自我关怀

一本从一个表情、一句话、一张照片开始的数字手帐。记录日常感受，收藏生活与旅行片刻，回看情绪变化，再给自己一点休息时间。

**在线体验**：[打开心晴](https://moodjournal-pi.vercel.app/) · **安装包**：[最新安装包](docs/RELEASES.md) · [Android 安装与构建](docs/ANDROID.md) · [iOS 工程与签名](docs/IOS.md)

**产品文档**：[完整 PRD](docs/PRD.md) · [照片手帐](docs/PHOTO-JOURNAL.md) · [首页与时间筛选](docs/TIME-RANGE.md) · [解忧杂货店](docs/SHOP.md) · [视觉与交互验收](design-qa.md)

无需注册，记录保存在当前浏览器或 App；支持手动备份和恢复，不会自动跨设备同步。情绪分析采用统计，关怀建议采用简单规则，未接入大模型。

## 原型展示

以下均为当前实现的实际页面，按电脑版与手机版展示，覆盖记录、回顾、日记浏览与编辑、自我关怀、酒单浏览与编辑。并排截图统一展示高度，保留原图比例与完整内容；点击图片可查看原图。

截图使用内置示例手帐与虚构素材，不含个人记录。手机图展示网页的响应式布局，长图用于完整呈现页面，不代表一屏可见或已经通过真机验收。采集信息见 [截图说明](docs/images/current/README.md)。

### 电脑版

**今日心情** · 快捷记录、图文日记入口、关怀便签与心情轨迹。

![电脑版今日心情](docs/images/current/home-desktop.jpg)

| 情绪回顾 | 自定义日期 |
|:---:|:---:|
| <a href="docs/images/current/review-desktop.jpg"><img src="docs/images/current/review-desktop.jpg" height="240" alt="电脑版情绪回顾"></a> | <a href="docs/images/current/date-desktop.jpg"><img src="docs/images/current/date-desktop.jpg" height="240" alt="电脑版自定义日期"></a> |

| 生活影集 | 日记详情 |
|:---:|:---:|
| <a href="docs/images/current/album-desktop.jpg"><img src="docs/images/current/album-desktop.jpg" height="240" alt="电脑版生活影集"></a> | <a href="docs/images/current/journal-detail-desktop.jpg"><img src="docs/images/current/journal-detail-desktop.jpg" height="240" alt="电脑版日记详情"></a> |

| 图文日记编辑 | 自我关怀 |
|:---:|:---:|
| <a href="docs/images/current/journal-editor-desktop.jpg"><img src="docs/images/current/journal-editor-desktop.jpg" height="240" alt="电脑版图文日记编辑"></a> | <a href="docs/images/current/care-desktop.jpg"><img src="docs/images/current/care-desktop.jpg" height="240" alt="电脑版自我关怀"></a> |

| 自然声播放器 | 呼吸练习 |
|:---:|:---:|
| <a href="docs/images/current/noise-desktop.jpg"><img src="docs/images/current/noise-desktop.jpg" height="240" alt="电脑版自然声播放器"></a> | <a href="docs/images/current/breathing-desktop.jpg"><img src="docs/images/current/breathing-desktop.jpg" height="240" alt="电脑版呼吸练习"></a> |

| 散步建议 | 骏马特调酒单 |
|:---:|:---:|
| <a href="docs/images/current/walk-desktop.jpg"><img src="docs/images/current/walk-desktop.jpg" height="240" alt="电脑版散步建议"></a> | <a href="docs/images/current/drinks-desktop.jpg"><img src="docs/images/current/drinks-desktop.jpg" height="240" alt="电脑版骏马特调酒单"></a> |

| 配方详情 | 酒单编辑 |
|:---:|:---:|
| <a href="docs/images/current/drink-detail-desktop.jpg"><img src="docs/images/current/drink-detail-desktop.jpg" height="240" alt="电脑版配方详情"></a> | <a href="docs/images/current/drink-editor-desktop.jpg"><img src="docs/images/current/drink-editor-desktop.jpg" height="240" alt="电脑版酒单编辑"></a> |

### 手机版

| 今日心情 | 情绪回顾 | 自定义日期 |
|:---:|:---:|:---:|
| <a href="docs/images/current/home-mobile.jpg"><img src="docs/images/current/home-mobile.jpg" height="320" alt="手机版今日心情，完整记录表单、趋势与关怀便签"></a> | <a href="docs/images/current/review-mobile.jpg"><img src="docs/images/current/review-mobile.jpg" height="320" alt="手机版情绪回顾，趋势与低落因素"></a> | <a href="docs/images/current/date-mobile.jpg"><img src="docs/images/current/date-mobile.jpg" height="320" alt="手机版自定义日期底部面板"></a> |

| 生活影集 | 日记详情 | 图文日记编辑 |
|:---:|:---:|:---:|
| <a href="docs/images/current/album-mobile.jpg"><img src="docs/images/current/album-mobile.jpg" height="320" alt="手机版生活影集，同篇图文纵向排列"></a> | <a href="docs/images/current/journal-detail-mobile.jpg"><img src="docs/images/current/journal-detail-mobile.jpg" height="320" alt="手机版日记详情，完整照片与正文"></a> | <a href="docs/images/current/journal-editor-mobile.jpg"><img src="docs/images/current/journal-editor-mobile.jpg" height="320" alt="手机版图文日记编辑，日期、正文、照片与心情"></a> |

| 自我关怀 | 自然声播放器 | 呼吸练习 | 散步建议 |
|:---:|:---:|:---:|:---:|
| <a href="docs/images/current/care-mobile.jpg"><img src="docs/images/current/care-mobile.jpg" height="320" alt="手机版自我关怀入口与关怀记录"></a> | <a href="docs/images/current/noise-mobile.jpg"><img src="docs/images/current/noise-mobile.jpg" height="320" alt="手机版自然声选择、音量与定时"></a> | <a href="docs/images/current/breathing-mobile.jpg"><img src="docs/images/current/breathing-mobile.jpg" height="320" alt="手机版一分钟呼吸练习"></a> | <a href="docs/images/current/walk-mobile.jpg"><img src="docs/images/current/walk-mobile.jpg" height="320" alt="手机版五分钟散步建议"></a> |

| 骏马特调酒单 | 配方详情 | 酒单编辑 |
|:---:|:---:|:---:|
| <a href="docs/images/current/drinks-mobile.jpg"><img src="docs/images/current/drinks-mobile.jpg" height="320" alt="手机版左图右文配方摘记卡"></a> | <a href="docs/images/current/drink-detail-mobile.jpg"><img src="docs/images/current/drink-detail-mobile.jpg" height="320" alt="手机版配方照片、材料、步骤与心得"></a> | <a href="docs/images/current/drink-editor-mobile.jpg"><img src="docs/images/current/drink-editor-mobile.jpg" height="320" alt="手机版酒单编辑，封面、类别、口味与配方"></a> |

## 功能介绍

### 今日心情与情绪回顾

首页支持两种记录方式：用一个表情快速记下心情，或从「写图文日记」进入独立编辑器，保存照片与故事。

- **快捷记录**：五档心情、七类影响因素、500 字内的一句话日记；只选表情也能保存。
- **时间筛选**：近 7 天、近 30 天或自定义日期。首页和回顾页共享时间选择，图表、日期与低落因素一起更新；电脑使用弹层，手机使用底部日期面板。
- **心情轨迹**：同一天的多条心情取均值，缺失日期留空；点击曲线点位可查看当天均值和记录数。
- **影响因素**：展示所选范围内低落记录中出现的标签，帮助回看相似情境，不将关联解释为原因。

### 图文日记与生活影集

浏览、阅读、编辑是三个独立界面：影集专注回看，详情专注阅读，点击「记一笔」或「更多 → 编辑日记」进入编辑器。电脑端同篇图文左右排列，手机端按照片、日期心情和文字纵向排列，每篇日记独占一行。

| 能力 | 已实现的行为 |
|---|---|
| 图文记录 | 每篇最多 9 张照片、5,000 个正文字符、40 个标题字符；心情可选 |
| 照片管理 | 预览大图、前后翻看、前移/后移、设为封面、移除；不修改相册原文件 |
| 独立写作 | 纯文字、纯照片、只选心情均可保存；支持选择今天或过去日期 |
| 草稿恢复 | 编辑器自动保存本机草稿，刷新可恢复；新建与各篇编辑草稿分开 |
| 阅读回顾 | 日期倒序，支持「全部记录 / 有照片」筛选；两张照片并排，三张及以上显示前三张拼贴与总数，点开可查看全部照片 |
| 情绪联动 | 有心情的图文记录参与所选时间范围的统计；未填心情不计为低落或一般 |
| 备份恢复 | JSON 包含日记文字和实际照片；导入前预览，已有 ID 保留本机版本 |
| 旧数据兼容 | 首次升级将旧日记迁入 IndexedDB，保留旧 localStorage 原始数据 |

多张图片在后台逐张处理，按选择顺序显示预览；可继续输入或停止添加，单张失败不会丢弃其他成功照片，处理结果合并保存到草稿。

### 解忧杂货店

**自我关怀**提供随时可以停下的小休息，并记录结束后的感受。

- **呼吸与散步**：1 分钟自然呼吸引导、5 分钟散步建议，可暂停和提前结束。
- **自然声**：细雨、海浪、森林、溪流，支持音量、暂停继续、定时停止；选声音时插画同步变化。
- **关怀便签**：首页三张纸依次叠放，圆点对应「呼吸 → 白噪音 → 散步」，支持箭头、边签、键盘及手机滑动。

**骏马特调**用于收录个人配方和好喝推荐。电脑以双列摘记卡呈现，手机采用单列左图右文；列表、详情和编辑相互独立。

- **配方与推荐**：记录名称、材料用量、调配步骤或推荐心得，按「可以自己调 / 好喝推荐」筛选。
- **照片与口味**：支持上传封面，默认完整显示，也可手动裁剪并随时切回；口味使用可多选标签，并保留已有自定义口味。
- **卡片摘要**：展示名称、口味和已填写的摘记；长内容在详情页完整查看，未填写的摘记不显示占位说明。
- **本机收藏**：支持草稿恢复与酒单备份，照片不会自动公开；日记和酒单分别导出备份。

### 示例体验与安装

内置示例手帐与个人记录隔离，可体验新增、编辑和关怀反馈。网页、Android 与 iOS 共用功能代码，但各自保存数据，不自动同步。

安装包目录只保留最新完整版本，下载与校验信息见 [最新安装包](docs/RELEASES.md)。Android 安装方法见 [安卓文档](docs/ANDROID.md)；iOS 提供 Xcode 工程和工作流生成的**未签名 IPA**，需要苹果签名后才能安装，具体条件与验证范围见 [iOS 文档](docs/IOS.md)。

## 产品设计

| 场景 | 设计取舍 |
|---|---|
| 情绪波动时不想填复杂表单 | 首页继续保持低门槛，表情即可记录 |
| 想写图文，却找不到入口 | 绿色整块按钮位于心情表单之前，不打断快速记录 |
| 想回看一个月或一次旅行期间的心情 | 时间菜单提供预设和自定义日期，图表与因素同步 |
| 生活随拍后想写几句，旅行后想写长文 | 一份图文记录支持不同篇幅，心情和标题可选 |
| 回看时不想看见上传框和表单 | 相册、详情、编辑分开，列表没有照片管理控件 |
| 照片不一定代表某种情绪 | 不识别照片情绪，不自动填写心情，不污染趋势 |
| 不想注册或公开自己的日记 | 本机存储、手动备份，清楚说明设备间的数据边界 |

```mermaid
flowchart LR
  A[生活影集] -->|记一笔| B[独立编辑器]
  B -->|照片 / 文字 / 可选心情| C[保存到本机]
  C --> D[只读详情]
  D -->|返回| A
  D -->|更多 → 编辑| B
  C --> E[有心情时更新趋势]
```

视觉延续米白纸纹、衬线标题、陶土色按钮、水彩心情与薄纸相框。设计参考、实现对照及验收记录见 [设计档案](docs/iterations/photo-journal/DESIGN.md) 和 [design-qa.md](design-qa.md)。这些需求仍是设计假设，尚无真实用户研究、留存或改善效果数据。

## 数据与能力边界

- 日记、照片和图文草稿保存在 **IndexedDB**；关怀反馈保存在 `localStorage`。没有上传日记的服务器接口，也没有账号、加密保险箱或云同步。
- 网页与 App、不同浏览器、不同设备各自保存数据。备份文件可手动转移；同 ID 导入时跳过，不覆盖本机编辑，也不进行冲突合并。
- 备份仅包含**已保存日记及照片**，不包含草稿和关怀反馈；支持 100 MB 以内的 JSON 文件。备份是明文文件，请自行妥善保存。
- 单张导入照片不超过 20 MB / 5,000 万像素；应用副本最长边压缩至 1,800px，有 EXIF 等元数据时重新编码，仅确认无相关元数据的小图直接复用，原图不变。HEIC 是否能导入取决于设备解码能力。
- 清除浏览器/应用数据、无痕模式或卸载可能丢失记录；先导出重要日记。安卓版仍使用 WebView 的 IndexedDB，并非原生数据库。
- 安卓测试应用可与旧版并存，二者数据独立；应用名称及安装条件见 [安卓文档](docs/ANDROID.md)。测试签名不保证后续覆盖安装，相机、系统分享及返回键仍需实机确认。
- 本项目提供日常记录与自我关怀，不提供诊断或专业咨询，也不宣称调节效果。

## 技术与目录

HTML、CSS、原生 JavaScript；Canvas 绘制趋势，HTML Audio 播放本地自然声，Capacitor 打包 Android / iOS。运行时不依赖在线模型服务。

```text
index.html                 页面与弹窗
styles.css / care.css      原有手帐与自我关怀样式
drinks.css / drinks.js     酒单、独立编辑、裁剪、详情与备份
drink-store.js             酒单数据库、字段校验与非破坏性裁剪
photo-*.js                 共用图片处理与后台队列
album.css / album.js       影集、独立编辑器、照片查看、草稿与备份入口
journal.js                 记录校验、日期、统计、推荐规则
journal-store.js           IndexedDB 事务、旧数据迁移、图文备份
trend.css / trend.js       首页图文入口、时间选择、曲线点位与联动统计
app.js                     页面路由、心情表单、关怀反馈
care.js / nature-audio.js   便签与自然声播放
android/                   Capacitor 安卓工程
ios/                       Xcode 工程与 Swift 插件配置
build-native.cjs           两个原生平台共用的本地页面构建
assets/                    本地图片、音频、图标与许可
scripts/archive-installers.py  校验、索引与仅保留最新版安装包
scripts/verify-apk.py       APK 内置资源与插件校验
scripts/verify-ipa.py       IPA 真机架构、版本、隐私与全部网页资源校验
tests/                     核心逻辑和浏览器回归
docs/                      PRD、实际截图、设计与安装说明
```

## 开发与验证

需要 Node.js 22+。在项目目录运行：

```bash
npm ci
npm run dev
```

打开 `http://127.0.0.1:4173`。请使用 HTTP 本地服务，以获得正确的浏览器存储和资源加载环境。

```bash
npm run check
npm test
npm run build
npm run android:sync
```

17 项单元测试覆盖记录、日期范围、缺失日、统计和音频状态。真实 Chromium 回归包含旧数据迁移、上传、刷新恢复、排序封面、长文编辑、失败保留、示例隔离、备份还原、删除及原有心情/自然声流程。

浏览器脚本需要启动本地服务，并设置 `AGENT_BROWSER_BIN`、`TEST_URL`；新版趋势测试另支持 `BROWSER_SESSION`。使用独立测试会话，脚本会清理该测试会话的测试日记数据。运行 `node tests/album-browser-check.cjs`、`node tests/album-layout-browser-check.cjs`、`node tests/care-browser-check.cjs` 、`node tests/shop-browser-check.cjs`、`node tests/shop-photo-browser-check.cjs`、`node tests/shop-card-browser-check.cjs` 或 `node tests/trend-browser-check.cjs`。实际验证范围和未验证项见 [验收记录](design-qa.md)。

## 部署与素材

GitHub `main` 分支联动原 Vercel 项目，构建 `node build.cjs`，发布 `dist/`，沿用 [固定公开域名](https://moodjournal-pi.vercel.app/)。Android 工作流手动生成 APK，操作见 [安装与构建文档](docs/ANDROID.md)。iOS 另有手动 macOS 构建流程，生成明确标注的未签名 IPA 和模拟器启动截图，见 [iOS 文档](docs/IOS.md)。

纸纹、水彩插画和演示照片由 Image Gen 生成；照片均为虚构素材。图标来自 [Phosphor Icons](https://github.com/phosphor-icons/core)，Capacitor 桥接代码使用 MIT 许可。详见 [素材说明](assets/CREDITS.md)、[图标许可](assets/icons/LICENSE)、[Capacitor 许可](assets/CAPACITOR-LICENSE) 和 [声音来源](assets/audio/CREDITS.html)。
