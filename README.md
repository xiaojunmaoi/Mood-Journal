# 心晴 · 情绪日记与自我关怀

美团 AI Coding 项目实战。采用用户选定的第3版暖色手帐风格，记录感受、理解触发因素，再给自己一点关怀。

固定作品域名：https://moodjournal-pi.vercel.app

## 已实现

- 五档情绪、影响因素、500字内日记，支持新增、编辑、确认删除。
- 最近7天心情趋势、低落时常出现的标签、历史日记。
- 1分钟呼吸计时、细雨/海浪/森林/溪流四种自然白噪音、5分钟散步引导、活动后反馈。
- 首页三张关怀便签向右依次叠放，支持箭头、圆点、右侧分类边签、键盘和手机滑动。三个圆点固定对应呼吸、白噪音、散步；右侧最近的纸张始终是循环顺序中的下一张。
- 白噪音支持音量、暂停继续、柔和切换，以及5/15/30分钟定时停止。四种插画预加载并与所选声音同步，选中项显示勾选；加载失败可重试。
- 独立示例手帐，不改动个人记录；支持电脑与手机。

## 运行

直接打开 index.html，并保留同目录 CSS、JavaScript 与 assets 文件夹。

使用 Node.js 预览（无需安装依赖）：

```sh
npm run dev
# http://127.0.0.1:4173
npm test
npm run check
npm run build
```

浏览器交互验证位于 tests/browser-check.cjs、tests/care-browser-check.cjs 和 tests/stack-browser-check.cjs。先启动本地服务，设置 AGENT_BROWSER_BIN，并用 TEST_URL 指定地址（默认 http://127.0.0.1:4174）。脚本使用独立会话。

## 数据与边界

记录只保存在当前浏览器 localStorage，不上传服务器，不跨设备、浏览器或域名同步。清理浏览器数据可能丢失记录。示例数据与个人记录隔离。

情绪小结使用真实记录统计，推荐采用简单规则，未接入大模型，不把关联当作因果或诊断。产品用于日常自我关怀，不替代专业帮助。

自然声文件随站点部署，不依赖外部音频地址。进入页面和切换便签不会自动播放；点击播放后开始，关闭窗口停止。暂停同时暂停定时，换声音保留剩余时间，旧雨声记录仍可读取。

## 部署与素材

保留现有 Vercel 项目与域名；vercel.json 配置执行 node build.cjs，输出 dist/。发布目录只包含网页及静态资源。

水彩插画、纸张及表情由 Image Gen 生成。通用图标来自 [Phosphor Icons](https://github.com/phosphor-icons/core)，MIT 许可在 assets/icons/LICENSE。

参考图在 docs/design-reference.png，验证记录见 design-qa.md。

音频作者及授权见 [声音来源](assets/audio/CREDITS.html)。便签右侧叠放参考图在 docs/care-stack-reference.png，之前的双侧轮播参考保留在 docs/care-carousel-reference.png。
