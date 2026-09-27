# Android v1.1.1 测试版：安装与构建

心晴使用 Capacitor 将同一份网页代码打包为 Android App。页面、插画、示例照片和自然声音频都在 APK 中，启动不需要远程网站。

## 用数据线安装

1. 将 `xinqing-album-v1.1.1-preview.apk` 下载到电脑。
2. 用可传输数据的 USB 线连接手机，解锁后选择「文件传输」。
3. 把 APK 复制到手机 `Download` / 下载目录。
4. 在手机文件管理器打开 APK，按系统提示允许该来源安装应用。
5. 安装后打开 **心晴·影集 1.1.1**。复制安装不需要开启 USB 调试。

本版包名为 `com.xiaojunmaoi.xinqing.album.v111`，版本 `1.1.1-preview`。可与 v1.1 的 `com.xiaojunmaoi.xinqing.album` 和 v1.0 的 `com.xiaojunmaoi.xinqing` 并存，避免为签名冲突卸载旧 App；两个应用的数据独立。**不要为了安装测试版删除有重要日记的旧版。**

## 从已安装的 v1.1 转移日记

1. 在旧版「心晴·影集」中打开「我的手帐 → 备份与恢复 → 导出图文备份」。通过系统分享保存 JSON 文件。
2. 安装并打开「心晴·影集 1.1.1」，进入「备份与恢复」，选择刚才的 JSON，核对预览后确认导入。
3. 确认照片和正文都在后继续使用新版。旧版仍保留原记录，不需要卸载；草稿需先保存为日记，关怀反馈不在图文备份范围内。

本版沿用测试签名，没有旧 APK 的固定签名私钥，因此使用不同包名并存，不承诺覆盖安装。

## 本版新增

- 修复多篇日记混排：每篇独占一行，多图在同一篇内拼贴，长标题与纯文字记录保持完整归属。

- 手机影集、独立图文编辑器与只读详情。
- 最多 9 张照片、5,000 字正文、可选心情、补记日期。
- 原生文件选择器 / 拍照入口，经设备支持后返回照片给同一编辑器。
- IndexedDB 本机图文草稿和记录，不使用 base64 localStorage 存图。
- 备份写入 App 缓存，再通过 Filesystem + Share 打开系统保存/分享窗口；恢复时选择 JSON 文件。
- App 插件处理 Android 返回键：先关闭弹窗，再退出编辑/详情，根页面最小化。

网页与 App 不会自动互相读取记录。v1.1 之间可以主动导出图文备份、传输 JSON，再导入；旧 v1.0 App 没有图文备份入口，也不会自动把旧包数据搬到这个并存测试包。

## 签名、数据与验证边界

- 本版使用调试签名；未配置固定发布密钥。不同构建的签名可能不同，未来覆盖更新前需要核对，不能保证直接覆盖安装。
- 最低 API 为 24；需要支持当前网页特性的较新 Android System WebView。仅声明构建最低版本不等于已在所有 Android 7+ 设备上实测。
- 记录在 WebView 的 IndexedDB 中，关怀反馈在 localStorage；不是原生数据库，也没有云同步或后台上传。
- 清除应用数据或卸载会丢失本机内容，请先导出重要日记。备份不包含草稿、关怀反馈，最大 100 MB。
- 浏览器响应式、功能回归、APK 编译和资源/签名校验不能替代真机测试。相机、文件选择、系统分享、返回键、软键盘遮挡和应用重启恢复需在你的手机上确认。
- 不承诺锁屏持续播放、通知提醒或应用商店发布。

## 本地构建

需要 Node.js 22+、JDK 21、Android SDK 36 / Build Tools 36.0.0。

```bash
npm ci
npm run android:sync
npm run android:open
```

或在 `android` 目录运行：

```powershell
.\gradlew.bat assembleAlbumPreview
```

输出：`android/app/build/outputs/apk/albumPreview/app-albumPreview.apk`。

`android:sync` 先构建前端、调整 Android 的本地存储提示，再复制到原生工程并同步 App、Filesystem、Share 插件。网页发布继续运行 `npm run build`。

## GitHub 构建和下载

打开 [Android APK 工作流](https://github.com/xiaojunmaoi/Mood-Journal/actions/workflows/android-apk.yml)，选择 `main` 手动运行。

工作流执行语法检查、单元测试、前端构建、Capacitor 同步、Gradle 编译，然后验证 APK 签名、包信息、照片与音频资源、三个原生插件。成功产物位于 **xinqing-album-v1.1.1-preview** artifact，包含 APK、`SHA256SUMS.txt`、签名与包信息。

Actions 产物保留 30 天，下载到本地后不受该期限影响。下载 GitHub Actions artifact 通常需要登录 GitHub；网站仍可公开访问。本工作流不自动发布应用商店或 GitHub Release。

参考：[Capacitor Filesystem](https://capacitorjs.com/docs/apis/filesystem)、[Share](https://capacitorjs.com/docs/apis/share)、[App](https://capacitorjs.com/docs/apis/app)。