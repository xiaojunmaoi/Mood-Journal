"""Check the actual APK includes the app and offline sound assets."""
from pathlib import Path
import json
import sys
import zipfile

with zipfile.ZipFile(sys.argv[1]) as apk:
    required = ["AndroidManifest.xml", "classes.dex", "assets/public/index.html",
                "assets/public/app.js", "assets/public/trend.js", "assets/public/trend.css", "assets/public/assets/journal-entry.png", "assets/public/assets/icons/calendar-blank.svg", "assets/public/care.js", "assets/public/journal.js",
                "assets/public/nature-audio.js", "assets/public/care.css",
                "assets/public/album.js", "assets/public/album.css", "assets/public/journal-store.js",
                "assets/public/assets/capacitor-core.js"]
    for name in ("drinks.js", "drinks.css", "drink-store.js", "photo-codec.js", "photo-tools.js", "photo-worker.js", "assets/drink-lime.webp", "assets/drink-orange.webp", "assets/drink-tea.webp", "assets/shop-osmanthus.webp"):
        required.append("assets/public/" + name)
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
    source = Path('dist')
    if source.exists():
        for file in source.rglob('*'):
            if file.is_file():
                name = file.relative_to(source).as_posix()
                actual, expected = apk.read('assets/public/' + name), file.read_bytes()
                if file.suffix in {'.html', '.js', '.css', '.svg', '.json', '.txt', '.md'}:
                    actual, expected = actual.replace(b'\r\n', b'\n'), expected.replace(b'\r\n', b'\n')
                assert actual == expected, 'Bundled UI mismatch: ' + name
    info_path = Path(sys.argv[1]).with_name("package-info.txt")
    if info_path.exists():
        info = info_path.read_text(encoding="utf-8")
        assert "name='com.xiaojunmaoi.xinqing.album.v132'" in info, "Unexpected package ID"
        assert "versionName='1.3.2-preview'" in info, "Unexpected version"
    print("APK verified: v1.3 drinks, photo pipeline, three native plugins, photos, four sounds, local start URL.")
