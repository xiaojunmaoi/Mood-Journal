"""Regression checks for the explicitly requested installer cleanup boundary."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('archive_installers', Path(__file__).resolve().parents[1] / 'scripts/archive-installers.py')
archive = importlib.util.module_from_spec(spec)
spec.loader.exec_module(archive)

class RetentionTests(unittest.TestCase):
    def complete(self, root):
        for platform, suffix in [('Android', '.apk'), ('iOS', '.ipa')]:
            folder = root / 'v1.3.2' / platform
            folder.mkdir(parents=True, exist_ok=True)
            file = folder / ('test' + suffix)
            file.write_bytes(b'fixture')
            (folder / 'manifest.json').write_text(json.dumps({'version':'1.3.2','sha256':archive.checksum(file)}),encoding='utf-8')

    def test_only_older_version_directories_are_removed(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); self.complete(root)
            (root / 'v1.3.1').mkdir(); (root / 'notes').mkdir()
            (root / 'notes' / 'keep.txt').write_text('keep')
            archive.prune_old_versions(root, '1.3.2')
            self.assertFalse((root / 'v1.3.1').exists())
            self.assertTrue((root / 'v1.3.2').exists())
            self.assertTrue((root / 'notes' / 'keep.txt').exists())

    def test_missing_or_invalid_current_packages_preserve_history(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); (root / 'v1.3.1').mkdir()
            with self.assertRaises(SystemExit): archive.prune_old_versions(root, '1.3.2')
            self.complete(root)
            (root / 'v1.3.2' / 'iOS' / 'test.ipa').write_bytes(b'changed')
            with self.assertRaises(SystemExit): archive.prune_old_versions(root, '1.3.2')
            self.assertTrue((root / 'v1.3.1').exists())

    def test_newer_version_aborts_before_deletion(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); self.complete(root)
            (root / 'v1.3.1').mkdir(); (root / 'v1.4.0').mkdir()
            with self.assertRaises(SystemExit): archive.prune_old_versions(root, '1.3.2')
            self.assertTrue((root / 'v1.3.1').exists())
            self.assertTrue((root / 'v1.4.0').exists())

if __name__ == '__main__':
    unittest.main()
