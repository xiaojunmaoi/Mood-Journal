"""Launch the shared app in an available iPhone simulator; not a full UI test."""
from pathlib import Path
import json
import subprocess
import time


def run(*args):
    return subprocess.check_output(args, text=True).strip()


def version(runtime):
    return tuple(int(x) for x in runtime.split('iOS-')[-1].split('-'))


devices = json.loads(run('xcrun', 'simctl', 'list', 'devices', 'available', '--json'))['devices']
runtimes = sorted((x for x in devices if 'iOS-' in x), key=version, reverse=True)
target = next(d for r in runtimes for d in devices[r] if d.get('isAvailable') and d['name'].startswith('iPhone'))
uid = target['udid']
try:
    if target['state'] != 'Booted':
        run('xcrun', 'simctl', 'boot', uid)
    run('xcrun', 'simctl', 'bootstatus', uid, '-b')
    run('xcrun', 'simctl', 'install', uid, 'build/ios-simulator/Build/Products/Release-iphonesimulator/App.app')
    result = run('xcrun', 'simctl', 'launch', uid, 'com.xiaojunmaoi.xinqing')
    print(result, flush=True)
    time.sleep(10)
    subprocess.run(['xcrun', 'simctl', 'io', uid, 'screenshot', 'output/ios-ipa/iphone-simulator.png'], check=True)
    Path('output/ios-ipa/simulator-info.txt').write_text(target['name'] + '\n' + result + '\nLaunch and screenshot only; no physical iPhone or complete native interaction validation.\n')
finally:
    subprocess.run(['xcrun', 'simctl', 'shutdown', uid], check=False)
