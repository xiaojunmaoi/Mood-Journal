# 最新安装包

项目根目录的 `安装包/` 仅保留最新完整版本，仍按系统分类。历史更新说明保留在 `docs/releases/`，不保留旧 APK / IPA。

```text
安装包/
  README.md
  latest.json
  v1.3.2/
    更新说明.md
    Android/
      xinqing-album-v1.3.2-preview.apk
      manifest.json
      SHA256SUMS.txt
      package-info.txt
      signature.txt
    iOS/
      xinqing-v1.3.2-unsigned.ipa
      manifest.json
      SHA256SUMS.txt
      build-info.txt
      iphone-simulator.png
```

## 更新流程

1. 编译新版 Android 和 iOS，检查签名/架构、版本、SHA256 和内置页面资源。
2. 将两端下载到临时目录，使用归档脚本合并到新版目录。
3. 传入 `--prune-old`：仅在新版两端安装包和清单都校验成功后，删除归档根目录中更旧的版本目录。遇到目录链接、新版本号或校验失败时停止清理。
4. 清理本次项目中的旧安装包下载目录、安装包 ZIP 以及 GitHub Actions 上的旧安装包产物；保留代码历史、更新说明和构建日志。
5. 最后更新 `latest.json` 和安装包索引。安装包不提交进 Git；Actions 下载期限为30天，本地归档不受此限制。

```powershell
python scripts/archive-installers.py --version 1.3.2 --android-dir output/android-v1.3.2/v1.3.2/Android --ios-dir output/ios-v1.3.2/v1.3.2/iOS --source-sha <提交号> --prune-old
```

清理安装文件不会卸载手机上已经安装的 App，也不会处理日记数据库。Android 测试包使用独立包名，先从旧 App 导出日记与酒单，再导入新版本。iOS IPA 未签名，需要苹果签名后安装。

[Android 说明](ANDROID.md) · [iOS 说明](IOS.md) · [本版更新](releases/v1.3.2.md)
