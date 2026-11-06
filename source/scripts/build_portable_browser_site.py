"""Make the exported course site usable with file:// as well as static HTTP.

Keeps code, media, geography and sources intact. Fetch-only local JSON is also
provided as a script-backed snapshot for browsers that forbid file:// fetch.
No security flags, installed server, remote proxy or account are required.
"""
import argparse
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RELATIVE_PREFIXES = ('media', 'tiles', 'evidence-previews', 'point-materials', 'downloads', 'data-api')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--destination', type=Path, required=True)
    args = parser.parse_args()
    source, destination = args.source.resolve(), args.destination.resolve()
    if source == destination or source in destination.parents or destination in source.parents:
        raise SystemExit('Source and destination must be separate trees')
    if not (source / 'heritage-preview' / 'home.html').is_file():
        raise SystemExit('A complete exported site is required')
    destination.mkdir(parents=True, exist_ok=True)
    shutil.copytree(source, destination, dirs_exist_ok=True)
    for path in destination.rglob('*'):
        if not path.is_file() or path.suffix not in {'.html', '.js', '.css', '.json', '.geojson'} or 'vendor' in path.parts:
            continue
        text = path.read_text(encoding='utf-8')
        # Each application page is in heritage-preview. Data resource URLs are
        # consumed by those pages too, so use their document-relative location.
        for prefix in RELATIVE_PREFIXES:
            text = re.sub(r'(?<![\w./:])/('+re.escape(prefix)+r')/', r'../\1/', text)
        text = text.replace('new URL(urlForChapter(c),location.origin)', 'new URL(urlForChapter(c),location.href)')
        text = text.replace('new URL(urlForChapter(chapters[index]),location.origin)', 'new URL(urlForChapter(chapters[index]),location.href)')
        if path.name == 'atlas-map.js':
            text = text.replace("typeof ol.source.OSM==='function'?", "location.protocol!=='file:'&&typeof ol.source.OSM==='function'?")
        if path.name == 'evidence.js':
            text = text.replace('本机 PDF 原件', '发布机构 PDF 原件').replace('上方本机原件', '上方发布机构原件')
        if path.parent == destination / 'heritage-preview' and path.suffix == '.html':
            text = text.replace('<head>', '<head>\n  <script>if(location.protocol===\'file:\'){document.write(\'<script src="./portable-snapshot.js"><\\/script>\');}</script>', 1)
        path.write_text(text, encoding='utf-8')
    snapshot = {}
    for path in sorted(destination.rglob('*')):
        if path.is_file() and path.suffix in {'.json', '.geojson'}:
            snapshot[path.relative_to(destination).as_posix()] = json.loads(path.read_text(encoding='utf-8'))
    loader = r'''/* file:// support generated from the same public JSON/GeoJSON files. */
(() => {
  'use strict';
  const base = new URL('../', document.currentScript.src);
  const records = __SNAPSHOT__;
  const originalFetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    const raw = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    const url = new URL(raw, document.baseURI);
    if (url.href.startsWith(base.href) && (!init?.method || init.method.toUpperCase() === 'GET')) {
      const relative = decodeURIComponent(url.href.slice(base.href.length).split(/[?#]/)[0]);
      if (Object.prototype.hasOwnProperty.call(records, relative)) {
        return Promise.resolve(new Response(JSON.stringify(records[relative]), {
          status:200, headers:{'Content-Type':'application/json;charset=utf-8'}
        }));
      }
      if (url.protocol === 'file:') return Promise.reject(new Error('本地资料未收录：'+relative));
    }
    return originalFetch(input, init);
  };
})();
'''
    loader = loader.replace('__SNAPSHOT__', json.dumps(snapshot, ensure_ascii=False, separators=(',', ':')))
    (destination / 'heritage-preview' / 'portable-snapshot.js').write_text(loader, encoding='utf-8')
    entry = '''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>一河千年 · 打开作品</title><meta http-equiv="refresh" content="0;url=./heritage-preview/home.html"></head><body><h1>一河千年</h1><p><a href="./heritage-preview/home.html">进入运河文化图志</a></p><p>请先完整解压网站文件夹，再打开本页面。核心页面、地点数据、图片与清口资料图可在本机浏览；原文链接需要联网。</p></body></html>'''
    (destination / 'index.html').write_text(entry, encoding='utf-8')
    (destination / '打开网站.html').write_text(entry, encoding='utf-8')
    (destination / '免安装浏览说明.txt').write_text('一河千年 · 免安装浏览版\n\n1. 完整解压文件夹。\n2. 双击“打开网站.html”或“index.html”。\n3. 使用Edge或Chrome浏览，无需安装Python、数据库或启动服务器。\n\n核心地点、时间节点、图片、背景矢量和清口瓦片来自随包文件。外部原文、百科和机构PDF仍需要网络。宽范围的在线OSM底图在file浏览模式不加载，以免阻碍本地阅读；已有矢量和清口资料底图保留。\n\n本版不改变原资料的年代精度、来源和许可，不把参考坐标当作测绘成果。\n', encoding='utf-8')
    print(json.dumps({'destination':str(destination),'snapshots':len(snapshot),'loader_bytes':len(loader.encode('utf-8')),'entry':'打开网站.html'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
