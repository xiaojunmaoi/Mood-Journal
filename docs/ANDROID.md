# 安卓测试版：APK 安装与构建

心晴安卓版复用现有 HTML / CSS / JavaScript，通过 Capacitor 打包为 Android App。页面、插画与四种自然声音频随安装包提供，不依赖在线首页启动。

## 用数据线复制安装

1. 下载 `xinqing-android-preview.apk` 到电脑。
2. 用支持传输数据的 USB 线连接手机，解锁手机，在 USB 用途里选择「文件传输」。
3. 在电脑文件管理器里打开手机，将 APK 复制到手机的 `Download` / 「下载」目录。
4. 打开手机的「文件管理」，找到 APK 并点击。
5. 如系统提示，允许当前文件管理应用「安装未知应用」或「安装此来源的应用」，再继续安装。菜单名称因品牌而异。
6. 安装后桌面出现「心晴」。安装完成后可按需关闭文件管理器的安装权限。

复制文件后在手机上安装不需要开启 USB 调试。通过 Android Studio / adb 由电脑直接安装调试，才需要相应调试授权。

## 数据与版本范围

- 安装包是 `1.0.0-preview` 测试版，应用 ID 为 `com.xiaojunmaoi.xinqing`，最低 Android API 为 24；需要支持当前网页功能的较新系统 WebView。
- App 的记录与网页版分开保存，不自动读取电脑、手机浏览器或其他设备中的日记。
- 当前仍沿用 WebView 本地记录方式，尚未接入原生数据库、云同步或日记导入导出。
- 卸载 App 或清除应用数据会删除本机记录；不要把测试版作为重要日记的唯一备份。
- 本版使用测试签名，仅用于安装体验。首次云端构建会生成调试签名；不同构建的签名可能不同，后续覆盖安装前必须核对签名，不要为解决安装冲突直接卸载有重要记录的旧版。
- APK 构建和签名校验不代表已在你的手机上完成真机验收。安装后请检查记录保存、重新打开后的记录、声音播放暂停和页面切换。
- 暂未承诺锁屏 / 后台持续播放、通知提醒或应用商店发布。

## 本地构建

需要 Node.js 22+、JDK 21、Android SDK 与 Android Studio。使用与 Capacitor 8 配套的 SDK 和构建工具。

```bash
npm ci
npm run android:sync
npm run android:open
```

在 Android Studio 中生成 Debug APK，或在 Android 目录运行：

```powershell
.\gradlew.bat assembleDebug
```

默认产物：`android/app/build/outputs/apk/debug/app-debug.apk`。

`npm run android:sync` 会先生成网页资源，再将 Android 专用的存储提示写入生成文件并复制到原生工程。网页源文件不受影响；构建网站继续使用 `npm run build`。

## GitHub 构建

仓库 Actions 中提供手动触发的 **Android APK** 工作流：

1. 选择主分支运行工作流。
2. 工作流执行网页检查与测试、Android 资源同步和 Gradle 编译。
3. 校验 APK 签名、资源完整性和应用 ID。
4. 在成功运行的 Artifacts 中下载 `xinqing-android-preview`，解压获得 APK、SHA-256 校验值与包信息。

构建产物保留 30 天；本地下载后的文件不受该保留时间影响。此工作流不自动发布应用商店或 GitHub Release。

参考：[Capacitor 接入文档](https://capacitorjs.com/docs/getting-started) · [Android 文件传输说明](https://support.google.com/android/answer/9064445?hl=zh-Hans)。
