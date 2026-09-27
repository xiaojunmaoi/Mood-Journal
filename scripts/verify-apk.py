"""Check the actual APK includes the app and offline sound assets."""
from pathlib import Path
import json
import sys
import zipfile

with zipfile.ZipFile(sys.argv[1]) as apk:
    required = ["AndroidManifest.xml", "classes.dex", "assets/public/index.html",
                "assets/public/app.js", "assets/public/care.js", "assets/public/journal.js",
                "assets/public/nature-audio.js", "assets/public/care.css",
                "assets/public/album.js", "assets/public/album.css", "assets/public/journal-store.js",
                "assets/public/assets/capacitor-core.js"]
    for photo in ("lake", "cafe", "sunset"):
        required.append(f"assets/public/assets/journal-demo-{photo}.webp")
    for sound in ("rain", "ocean", "forest", "stream"):
        required.extend([f"assets/public/assets/audio/{sound}.m4a", f"assets/public/assets/sound-{sound}.webp"])
    missing = [path for path in required if path not in apk.namelist()]
    if missing:
        raise SystemExit(f"Missing packaged files: {missing}")
    config = json.loads(apk.read("assets/capacitor.config.json"))
    assert config["appId"] == "com.xiaojunmaoi.xinqing"
    assert not config.get("server", {}).get("url"), "The app must load its bundled files."
    plugins = json.loads(apk.read("assets/capacitor.plugins.json"))
    for plugin in ("AppPlugin", "FilesystemPlugin", "SharePlugin"):
        assert any(plugin in item["classpath"] for item in plugins), f"Missing native plugin: {plugin}"
    assert apk.testzip() is None, "Corrupt APK archive"
    info_path = Path(sys.argv[1]).with_name("package-info.txt")
    if info_path.exists():
        info = info_path.read_text(encoding="utf-8")
        assert "name='com.xiaojunmaoi.xinqing.album'" in info, "Unexpected package ID"
        assert "versionName='1.1.0-preview'" in info, "Unexpected version"
    print("APK verified: photo journal, three native plugins, photos, four sounds, local start URL.")
