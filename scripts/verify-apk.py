"""Check the actual APK includes the app and offline sound assets."""
import json
import sys
import zipfile

with zipfile.ZipFile(sys.argv[1]) as apk:
    required = ["AndroidManifest.xml", "classes.dex", "assets/public/index.html",
                "assets/public/app.js", "assets/public/care.js", "assets/public/journal.js",
                "assets/public/nature-audio.js", "assets/public/care.css"]
    for sound in ("rain", "ocean", "forest", "stream"):
        required.extend([f"assets/public/assets/audio/{sound}.m4a", f"assets/public/assets/sound-{sound}.webp"])
    missing = [path for path in required if path not in apk.namelist()]
    if missing:
        raise SystemExit(f"Missing packaged files: {missing}")
    config = json.loads(apk.read("assets/capacitor.config.json"))
    assert config["appId"] == "com.xiaojunmaoi.xinqing"
    assert not config.get("server", {}).get("url"), "The app must load its bundled files."
    assert apk.testzip() is None, "Corrupt APK archive"
    print("APK package verified: bundled app and four sounds, no remote start URL.")
