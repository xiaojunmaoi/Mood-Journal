"""Validate a real unsigned iPhone binary and its bundled v1.3 web application."""
from pathlib import Path
import json
import plistlib
import struct
import sys
import zipfile

with zipfile.ZipFile(sys.argv[1]) as ipa:
    assert ipa.testzip() is None, 'Corrupt IPA archive'
    base = 'Payload/App.app/'
    names = set(ipa.namelist())
    info = plistlib.loads(ipa.read(base + 'Info.plist'))
    assert info['CFBundleIdentifier'] == 'com.xiaojunmaoi.xinqing'
    assert info['CFBundleShortVersionString'] == '1.3.0'
    assert info['CFBundleVersion'] == '5'
    assert info['MinimumOSVersion'] == '16.0'
    assert 'iPhoneOS' in info['CFBundleSupportedPlatforms'], 'Simulator app cannot be installed on iPhone'
    binary = ipa.read(base + info['CFBundleExecutable'])
    magic, cpu, subtype, filetype, commands = struct.unpack_from('<IIIII', binary)
    assert magic == 0xFEEDFACF and cpu == 0x0100000C and filetype == 2, 'Expected arm64 Mach-O executable'
    cursor = 32
    platforms = []
    for _ in range(commands):
        command, size = struct.unpack_from('<II', binary, cursor)
        assert size >= 8 and cursor + size <= len(binary)
        if command == 0x32:
            platforms.append(struct.unpack_from('<I', binary, cursor + 8)[0])
        cursor += size
    assert 2 in platforms and 7 not in platforms, 'Expected device iOS binary, not simulator'
    assert base + 'embedded.mobileprovision' not in names
    assert not any(n.startswith(base + '_CodeSignature/') for n in names), 'Expected explicitly unsigned application'
    config = json.loads(ipa.read(base + 'capacitor.config.json'))
    assert config['appId'] == 'com.xiaojunmaoi.xinqing'
    assert not config.get('server', {}).get('url'), 'The app must launch its local bundle'
    for plugin in ('AppPlugin', 'FilesystemPlugin', 'SharePlugin'):
        assert plugin in config.get('packageClassList', []), 'Missing native plugin: ' + plugin
    for name in ('drinks.js', 'drinks.css', 'drink-store.js', 'photo-codec.js', 'photo-tools.js', 'photo-worker.js', 'assets/drink-lime.webp', 'assets/drink-orange.webp', 'assets/drink-tea.webp', 'assets/shop-osmanthus.webp', 'index.html', 'app.js', 'trend.js', 'trend.css', 'journal.js', 'journal-store.js', 'album.js', 'album.css', 'care.js', 'nature-audio.js', 'assets/capacitor-core.js', 'assets/journal-entry.png'):
        assert base + 'public/' + name in names, 'Missing UI file: ' + name
    for sound in ('rain', 'ocean', 'forest', 'stream'):
        assert base + f'public/assets/audio/{sound}.m4a' in names
    for photo in ('lake', 'cafe', 'sunset'):
        assert base + f'public/assets/journal-demo-{photo}.webp' in names
    privacy = plistlib.loads(ipa.read(base + 'PrivacyInfo.xcprivacy'))
    assert privacy['NSPrivacyTracking'] is False
    assert any(x['NSPrivacyAccessedAPIType'] == 'NSPrivacyAccessedAPICategoryFileTimestamp' and 'C617.1' in x['NSPrivacyAccessedAPITypeReasons'] for x in privacy['NSPrivacyAccessedAPITypes'])
    for permission in ('NSCameraUsageDescription', 'NSPhotoLibraryUsageDescription'):
        assert info.get(permission)
    source = Path('dist')
    if source.exists():
        for file in source.rglob('*'):
            if file.is_file():
                name = file.relative_to(source).as_posix()
                assert ipa.read(base + 'public/' + name) == file.read_bytes(), 'Bundled UI mismatch: ' + name
    print('Verified: v1.3.0 (5), arm64 iPhone device binary, all web assets, privacy and three plugins. UNSIGNED: signing is required before installation.')
