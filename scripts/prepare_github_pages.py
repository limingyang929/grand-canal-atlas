"""Reassemble verified site archive parts and prepare a GitHub Pages artifact."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / '.site-package'
DEST = ROOT / '_site'


def main():
    manifest = json.loads((PACKAGE / 'manifest.json').read_text(encoding='utf-8'))
    archive = ROOT / '.site-build.zip'
    digest = hashlib.sha256()
    with archive.open('wb') as output:
        for part in manifest['parts']:
            path = PACKAGE / part['name']
            if path.parent != PACKAGE:
                raise ValueError('Invalid package part path')
            data = path.read_bytes()
            if len(data) != part['bytes'] or hashlib.sha256(data).hexdigest() != part['sha256']:
                raise ValueError('Part verification failed: ' + part['name'])
            output.write(data)
            digest.update(data)
    if digest.hexdigest() != manifest['archive_sha256']:
        raise ValueError('Archive verification failed')
    DEST.mkdir(exist_ok=True)
    with zipfile.ZipFile(archive) as z:
        for entry in z.infolist():
            target = (DEST / entry.filename).resolve()
            if not target.is_relative_to(DEST.resolve()):
                raise ValueError('Archive contains an invalid path')
        if z.testzip():
            raise ValueError('Archive CRC verification failed')
        z.extractall(DEST)
    for filename in ['index.html', 'heritage-preview/home.html', 'heritage-preview/evolution.html']:
        if not (DEST / filename).is_file():
            raise ValueError('Missing required page: ' + filename)
    (DEST / '.nojekyll').write_text('', encoding='utf-8')
    print(f"Prepared {len(list(DEST.rglob('*')))} site entries from verified package")


if __name__ == '__main__':
    main()
