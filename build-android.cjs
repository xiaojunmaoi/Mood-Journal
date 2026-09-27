const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
execFileSync(process.execPath, [path.join(__dirname, 'build.cjs')], { stdio: 'inherit' });
const html = path.join(__dirname, 'dist/index.html');
let page = fs.readFileSync(html, 'utf8');
page = page.replaceAll('当前浏览器', '这台设备的 App')
  .replace('不同设备、浏览器或网址之间不会自动同步。', 'App 与网页版、其他设备之间不会自动同步。')
  .replace('清理浏览器数据或使用无痕模式，可能导致记录丢失。', '卸载 App 或清除应用数据，会删除本机记录。');
fs.writeFileSync(html, page);
const app = path.join(__dirname, 'dist/app.js');
fs.writeFileSync(app, fs.readFileSync(app, 'utf8').replaceAll('浏览器存储', 'App 本地存储').replaceAll('保存到浏览器', '保存到 App'));
console.log('Android bundle prepared; source web files unchanged.');
