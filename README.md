# 心晴 · 情绪日记与自我关怀

美团 AI Coding 项目实战。采用用户选定的第3版暖色手帐风格，记录感受、理解触发因素，再给自己一点关怀。

固定作品域名：https://moodjournal-pi.vercel.app

## 已实现

- 五档情绪、影响因素、500字内日记，支持新增、编辑、确认删除。
- 最近7天心情趋势、低落时常出现的标签、历史日记。
- 1分钟呼吸计时、可暂停并调节音量的合成雨声、5分钟散步引导、活动后反馈。
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

浏览器交互验证位于 tests/browser-check.cjs。先启动本地服务，并将 AGENT_BROWSER_BIN 指向本机 agent-browser 可执行文件，脚本使用独立的 xinqing-prototype 会话。

## 数据与边界

记录只保存在当前浏览器 localStorage，不上传服务器，不跨设备、浏览器或域名同步。清理浏览器数据可能丢失记录。示例数据与个人记录隔离。

情绪小结使用真实记录统计，推荐采用简单规则，未接入大模型，不把关联当作因果或诊断。产品用于日常自我关怀，不替代专业帮助。

雨声通过 Web Audio 在本机合成，用户点击后才播放，关闭练习时停止。

## 部署与素材

保留现有 Vercel 项目与域名；vercel.json 配置执行 node build.cjs，输出 dist/。发布目录只包含网页及静态资源。

水彩插画、纸张及表情由 Image Gen 生成。通用图标来自 [Phosphor Icons](https://github.com/phosphor-icons/core)，MIT 许可在 assets/icons/LICENSE。

参考图在 docs/design-reference.png，验证记录见 design-qa.md。