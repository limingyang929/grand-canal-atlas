"""Export the read-only course experience to a standalone static hosting tree."""
import argparse
import hashlib
import json
import re
import shutil
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTTP = urllib.request.build_opener(urllib.request.ProxyHandler({}))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    dest = args.destination.resolve()
    dest.mkdir(parents=True, exist_ok=True)
    shutil.copytree(ROOT/'frontend', dest/'heritage-preview', dirs_exist_ok=True)
    mapping = {}
    def copy(url, source, target):
        source = Path(source)
        if not source.is_file():
            raise FileNotFoundError(str(source))
        output = dest/target
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, output)
        mapping[url] = '/'+target
    # Only the media actually registered for display; no runtime databases or secrets.
    for mid, record in json.loads((ROOT/'data/metadata/atlas-media-files.json').read_text(encoding='utf-8')).items():
        source = ROOT/record['local_path']
        if source.is_file():
            copy('/api/atlas-media/'+mid, source, 'media/'+mid+source.suffix)
    for case, record in json.loads((ROOT/'data/processed/point-material-previews.json').read_text(encoding='utf-8')).items():
        copy('/api/point-materials/'+case+'.webp', ROOT/record['local_path'], 'point-materials/'+case+'.webp')
    for page in range(1,7):
        copy('/api/evidence/S010/preview/'+str(page), ROOT/'.runtime/evidence-previews'/f'S010-{page}.webp', f'evidence-previews/S010-{page}.webp')
    tiles = json.loads((ROOT/'data/processed/heritage-map.json').read_text(encoding='utf-8'))['tiles']['version']
    shutil.copytree(ROOT/'.runtime/heritage-tiles'/tiles, dest/'tiles'/tiles, dirs_exist_ok=True)
    mapping['/api/heritage-tiles/'] = '/tiles/'
    endpoints = ['/api/heritage-content','/api/features?layer=qingkou-features','/api/cultural-atlas',
                 '/api/culture-story/huaian','/api/culture-evolution/huaian','/api/evidence']
    for endpoint in endpoints:
        name = re.sub('[^a-zA-Z0-9-]+','-', endpoint.removeprefix('/api/'))+'.json'
        target = 'data-api/'+name
        with HTTP.open('http://127.0.0.1:18081'+endpoint, timeout=30) as response:
            data = json.load(response)
        if endpoint == '/api/evidence':
            # Full external documents stay with their original publishers.
            for source in data['sources']:
                if source.get('document_url'):
                    mapping[source['document_url']] = source['url']
                    source['document_url'] = source['url']
        output = dest/target
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8')
        mapping[endpoint] = '/'+target
    copy('/api/culture-evolution/huaian/evidence.csv', ROOT/'data/processed/huaian-temporal-evidence.csv', 'downloads/huaian-temporal-evidence.csv')
    sample = json.loads((ROOT/'data/processed/huaian-story.json').read_text(encoding='utf-8'))['sample']
    (dest/'downloads/story-sample.json').write_text(json.dumps(sample,ensure_ascii=False),encoding='utf-8')
    mapping['/api/culture-story/huaian/sample'] = '/downloads/story-sample.json'
    for path in dest.rglob('*'):
        if not path.is_file() or path.suffix not in {'.html','.js','.json','.geojson','.css'} or 'vendor' in path.parts:
            continue
        text = path.read_text(encoding='utf-8')
        for old,new in sorted(mapping.items(),key=lambda pair:-len(pair[0])):
            text = text.replace(old,new)
        text = text.replace('本机课程预览','课程作品展示').replace('请检查本地服务后刷新','请稍后刷新')
        path.write_text(text,encoding='utf-8')
    (dest/'index.html').write_text('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./heritage-preview/home.html"><title>一河千年</title></head><body><a href="./heritage-preview/home.html">进入一河千年</a></body></html>',encoding='utf-8')
    shutil.copy2(ROOT/'THIRD_PARTY_NOTICES.md', dest/'THIRD_PARTY_NOTICES.md')
    files = [p for p in dest.rglob('*') if p.is_file()]
    report = {'files':len(files),'bytes':sum(p.stat().st_size for p in files),'api_snapshots':endpoints,
              'source':'original course data; read-only publication snapshot',
              'external_documents':'publisher URLs, not rehosted',
              'no_local_services_required':True}
    (dest.parent/'export-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False))

if __name__ == '__main__': main()
