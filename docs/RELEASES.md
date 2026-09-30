# 安装包归档

安装包统一放在项目根目录的 `安装包/`。打开其中的 `README.md` 可按版本和系统选择文件，`latest.json` 指向最新已归档版本。

```text
安装包/
  README.md
  latest.json
  v1.3.1/
    更新说明.md
    Android/
      xinqing-album-v1.3.1-preview.apk
      manifest.json
      SHA256SUMS.txt
      package-info.txt
      signature.txt
    iOS/
      xinqing-v1.3.1-unsigned.ipa
      manifest.json
      SHA256SUMS.txt
      build-info.txt
      iphone-simulator.png
  v1.3.0/
  v1.2.0/
  v1.1.1/
  v1.1.0/
  v1.0.0/
```

## 每次更新的流程

1. 更新网页和双端版本号，编译、校验通过后再归档。
2. GitHub Android/iOS 工作流自动运行 `scripts/archive-installers.py`；下载的 artifact 已含版本和系统目录。构建临时文件不进入归档。
3. 本地运行同一脚本将两端合并入总目录：先验证源 SHA256，再复制安装文件、签名/版本信息与更新说明。
4. 同版本同名文件内容不一致时拒绝覆盖；历史安装包和原下载目录保留。归档不会卸载应用或移动用户日记。
5. 提交源码与版本说明到 GitHub；安装包二进制不写入 Git 仓库。Actions 产物保留30天，本机归档无此下载期限。

```powershell
python scripts/archive-installers.py --version 1.3.1 --android-dir output/android-v1.3.1/v1.3.1/Android --ios-dir output/ios-v1.3.1/v1.3.1/iOS --source-sha <本次提交号>
```

同一版本先只传一个系统、另一个系统完成后再归档即可。脚本只用 Python 标准库。

## 安装与迁移

- Android 测试包目前使用独立版本包名，不能承诺覆盖升级。保留旧版，在旧版分别导出日记和酒单，再导入新版；两个应用的数据独立。
- iOS 归档明确标记为未签名，需要自己的苹果签名配置才能安装。
- 查看 [Android安装说明](ANDROID.md)、[iOS安装说明](IOS.md)、[v1.3.1更新说明](releases/v1.3.1.md)。
