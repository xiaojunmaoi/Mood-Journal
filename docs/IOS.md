# iOS v1.3.1 · 工程与未签名 IPA

[返回 README](../README.md) · [iOS 构建工作流](https://github.com/xiaojunmaoi/Mood-Journal/actions/workflows/ios-ipa.yml) · [当前网页](https://moodjournal-pi.vercel.app/)

本版复用网页与 Android v1.3.1 的同一份界面，照片默认完整显示、口味可多选：新增解忧杂货店、个人酒单上传裁剪与日记多图后台处理；同时保留明显的图文日记入口、近 7 天 / 近 30 天 / 自定义心情轨迹、照片手帐、备份恢复与四种自然声。iOS 配置为 `com.xiaojunmaoi.xinqing`，版本 `1.3.1`，build `6`，最低 iOS 16。最低版本按本项目的原生弹层、动态视口与不可交互区域等页面特性设置，不仅取 Capacitor 的运行时最低要求。

## 下载文件与安装边界

工作流生成 **`xinqing-v1.3.1-unsigned.ipa`**。它包含 Xcode 编译的 iPhone arm64 应用及本地资源，**没有苹果证书签名和设备描述文件，不能直接点开或拷贝到 iPhone 安装，也不是 TestFlight 邀请**。

IPA 需要由拥有相应权限的苹果开发者使用有效证书与描述文件签名；设备直装必须匹配已登记的设备，TestFlight 则走 App Store Connect 的构建上传流程。不要把 `unsigned` 文件改名当作可安装正式包。工程已准备好，签名阶段仍需要你自己的 Apple 账号与相应配置。

仓库不保存 Apple 登录密码、证书私钥或描述文件。本次未配置签名账号，也未发布 App Store / TestFlight。

## 有 Mac 时从工程安装到自己的 iPhone

使用 macOS 和 Xcode 26 或更新版本；Node.js 22 或更新版本。克隆完整仓库后：

```bash
npm ci
npm run ios:sync
npm run ios:open
```

1. 在 Xcode 打开 `ios/App/App.xcodeproj`，选择 App target → Signing & Capabilities。
2. 登录自己的 Apple 账号并选择 Team，按 Xcode 提示完成自动签名；如包标识已被其他团队占用，为自己的团队改成唯一标识。
3. 用数据线连接 iPhone，按系统提示信任电脑；需要时启用开发者模式。
4. 选择连接的 iPhone 为运行目标并 Run。普通账号的自用开发安装有期限和能力限制，不能视为长期分发方案。
5. 若需要正式可分发 IPA，在配置有效签名后 Archive，再通过 Xcode 的分发流程选择适合的方式。设备直装与 TestFlight 的签名配置不同。

账号登录和私钥操作在你自己的 Xcode / 苹果账号中完成，不需要把密码发到聊天或写入公开 GitHub 仓库。

## 文件和原生配置

- iOS 使用 Swift Package Manager，锁定与网页、Android 相同的 Capacitor 8.5.2。
- 包内包含页面、插画、示例照片和自然声音频，`server.url` 留空；启动不依赖 Vercel 在线页面。
- `build-native.cjs` 共用于两个原生平台，调整本机存储文案；网页版继续由 `build.cjs` 构建。
- 保留 App、Filesystem、Share 三个插件；Android 实体返回键处理只在 Android 注册。
- iOS 自动调整安全区，使用浅色界面，复用心晴太阳图标和米白启动页。
- 相机与相册用途在 `Info.plist` 明确说明；Filesystem 的文件时间 API 用途加入 `PrivacyInfo.xcprivacy`。上传分发前仍需按实际功能填写 App Store 隐私信息。

## 云端构建及验证

手动运行 `iOS unsigned IPA` 工作流，不需要签名密钥。流程检查语法和单元测试、同步 iOS、在 macOS / Xcode 26.2 编译真机架构，再封装 IPA。

`verify-ipa.py` 检查 Mach-O arm64、iPhoneOS 平台、版本、三个插件、相机相册用途、隐私清单及全部网页资源。若本地存在本次 `dist`，逐个比较包内文件与构建输出，防止拿到旧版页面。

同一流程还编译 iPhone 模拟器版本，启动并保存 `iphone-simulator.png`。模拟器截图只证明当次启动页面，不等于真机安装、全部交互或系统权限流程通过。相册/拍照、原生日期选择器、系统分享、软键盘和长期本地存储仍需在真实 iPhone 验证。

下载 artifact `xinqing-ios-v1.3.1-unsigned`，其中按 `v1.3.1/iOS/` 归档，包含 IPA、SHA256、源码提交号、模拟器截图与这份说明。Actions 文件保留 30 天；下载到本地后不受该保留期限影响。

## 日记迁移

iOS、Android、网页分别保存本机数据，不会自动同步日记。可从旧端「我的手帐 → 备份与恢复 → 导出图文备份」，把 JSON 文件传到 iPhone 后导入。备份包含已保存日记和照片，不包含草稿、关怀反馈或时间筛选偏好；确认导入完整后再处理旧设备。当前公开网站与本机记录的边界没有改变。

参考：[Capacitor iOS 环境](https://capacitorjs.com/docs/ios)、[Swift Package Manager](https://capacitorjs.com/docs/ios/spm)、[Filesystem 隐私声明](https://capacitorjs.com/docs/apis/filesystem)、[苹果分发方式](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)。
