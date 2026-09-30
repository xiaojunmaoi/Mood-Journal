"""Copy verified installers into one version/platform library; never delete old downloads."""
from pathlib import Path
import argparse, hashlib, json, re, shutil
from datetime import date

PROJECT = Path(__file__).resolve().parents[1]
def checksum(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--version', required=True)
    parser.add_argument('--android-dir')
    parser.add_argument('--ios-dir')
    parser.add_argument('--source-sha', default='')
    parser.add_argument('--root', default=str(PROJECT / '安装包'))
    args = parser.parse_args()
    if not re.fullmatch(r'\d+\.\d+(?:\.\d+)?', args.version):
        parser.error('Use a numeric version, e.g. 1.3.1')
    if not args.android_dir and not args.ios_dir:
        parser.error('Provide --android-dir and/or --ios-dir')
    root = Path(args.root).resolve()
    release = root / ('v' + args.version)
    for platform, folder, suffix in [('Android', args.android_dir, '.apk'), ('iOS', args.ios_dir, '.ipa')]:
        if not folder:
            continue
        source = Path(folder).resolve()
        packages = list(source.glob('*' + suffix))
        if len(packages) != 1:
            raise SystemExit(f'{platform}: expected exactly one {suffix} in {source}')
        package = packages[0]
        digest = checksum(package)
        sums = source / 'SHA256SUMS.txt'
        if sums.exists():
            pairs = [line.split(maxsplit=1) for line in sums.read_text(encoding='utf-8').splitlines() if line.strip()]
            expected = next((sha for sha, filename in pairs if Path(filename.lstrip('*')).name == package.name), None)
            if expected != digest:
                raise SystemExit(f'{platform}: checksum does not match SHA256SUMS.txt')
        target = release / platform
        target.mkdir(parents=True, exist_ok=True)
        for file in source.iterdir():
            if file.name == 'SHA256SUMS.txt' or not file.is_file() or (file.name != package.name and file.suffix.lower() not in {'.txt', '.md', '.png'}):
                continue
            dest = target / file.name
            if dest.exists() and checksum(dest) != checksum(file):
                raise SystemExit(f'Refusing to overwrite different archived file: {dest}')
            if file.resolve() != dest.resolve():
                shutil.copy2(file, dest)
        (target / 'SHA256SUMS.txt').write_text(f'{digest}  {package.name}\n', encoding='utf-8')
        info = {'version': args.version, 'platform': platform, 'file': package.name, 'sha256': digest,
                'bytes': package.stat().st_size, 'source_commit': args.source_sha,
                'archived_on': date.today().isoformat(), 'unsigned': platform == 'iOS',
                'install_note': '需要苹果签名后安装' if platform == 'iOS' else '测试版，与旧版本数据独立'}
        (target / 'manifest.json').write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'Archived {platform} {args.version}: {target}')
    notes = PROJECT / 'docs' / 'releases' / ('v' + args.version + '.md')
    if notes.exists():
        shutil.copy2(notes, release / '更新说明.md')
    versions = sorted([p for p in root.iterdir() if p.is_dir() and re.fullmatch(r'v\d+\.\d+(?:\.\d+)?', p.name)],
                      key=lambda p: tuple(int(n) for n in p.name[1:].split('.')), reverse=True)
    lines = ['# 心晴安装包', '', '按版本和系统归档；最新版本排在最上面。旧文件保留。', '',
             'Android 测试版与旧版并存，升级前分别备份日记和酒单。iOS IPA 需要苹果签名后安装。', '',
             '| 版本 | Android | iOS | 更新说明 |', '|---|---|---|---|']
    for directory in versions:
        links = []
        for platform, suffix in [('Android', '.apk'), ('iOS', '.ipa')]:
            files = list((directory / platform).glob('*' + suffix))
            links.append(f'[{platform + ("（未签名）" if platform == "iOS" else "")}]({files[0].relative_to(root).as_posix()})' if files else '—')
        note = f'[更新说明]({directory.name}/更新说明.md)' if (directory / '更新说明.md').exists() else '历史版本'
        lines.append(f'| {directory.name} | {links[0]} | {links[1]} | {note} |')
    (root / 'README.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    latest = versions[0]
    files = {platform: [str(p.relative_to(root).as_posix()) for p in (latest / platform).glob('*' + suffix)]
             for platform, suffix in [('Android', '.apk'), ('iOS', '.ipa')]}
    (root / 'latest.json').write_text(json.dumps({'version': latest.name[1:], 'packages': files}, ensure_ascii=False, indent=2), encoding='utf-8')

if __name__ == '__main__':
    main()
