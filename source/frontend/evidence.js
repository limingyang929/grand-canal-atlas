'use strict';
const el=id=>document.getElementById(id);
let catalog=[],current,pageNumber=4,scale=100;
const readingPoint=new URLSearchParams(location.search).get('point');
const contextParams=new URLSearchParams(location.search),readingStory=contextParams.get('story')==='huaian';
const readingEvolution=contextParams.get('context')==='evolution';
const evolutionContext=()=>{const p=new URLSearchParams();for(const k of ['era','area','function','case','event','locked','motion','view','mode','focus','frame','record'])if(contextParams.has(k))p.set(k,contextParams.get(k).slice(0,160));return p;};
const readingStep=contextParams.get('step');
const storyContext=()=>{const p=new URLSearchParams();for(const k of ['step','place','sample','kind','q'])if(contextParams.has(k))p.set(k,contextParams.get(k).slice(0,100));return p;};
if(readingStory){el('reader-return').textContent='返回故事原步骤 →';el('reader-return').href='./story.html?'+storyContext();}
if(readingEvolution){el('reader-return').textContent='返回时空演进原节点 →';el('reader-return').href='./evolution.html?'+evolutionContext();}
function link(label,url){const a=document.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener';return a;}
function renderList(){
  const query=el('source-search').value.trim().toLowerCase();
  const sources=catalog.filter(s=>[s.id,s.title,s.publisher].join(' ').toLowerCase().includes(query));
  el('source-count').textContent=`${sources.length} / ${catalog.length} 份已归档资料`;
  el('source-list').replaceChildren();
  for(const source of sources){
    const button=document.createElement('button');button.className='source-item'+(source.id===current?.id?' active':'');
    button.setAttribute('aria-pressed',String(source.id===current?.id));
    const id=document.createElement('small');id.textContent=source.id+' · '+source.format.toUpperCase();
    const title=document.createElement('strong');title.textContent=source.title;button.append(id,title);
    button.onclick=()=>select(source,source.id==='S010'?4:1);el('source-list').append(button);
  }
}
function setScale(value){scale=Math.max(50,Math.min(250,value));const img=el('source-viewer').querySelector('img');if(img)img.style.width=scale+'%';}
function showPage(number){
  pageNumber=number;setScale(100);
  const preview=current.previews.find(p=>p.page===number);if(!preview)return;
  const viewer=el('source-viewer'),image=document.createElement('img');
  image.className='evidence-image';image.alt=current.title+' · 第 '+number+' 页';
  image.decoding='async';image.style.width='100%';
  el('reader-status').textContent='正在加载第 '+number+' 页预览…';
  image.onload=()=>{el('reader-status').textContent=`第 ${number} / 6 页 · 轻量预览 · 可放大阅读；原件见上方入口`;};
  image.onerror=()=>{el('reader-status').textContent='该页预览暂不可用，可通过上方原件入口阅读。';};
  image.src=preview.url;viewer.replaceChildren(image);viewer.scrollTop=0;viewer.scrollLeft=0;
  document.querySelectorAll('.page-choice').forEach(b=>{b.classList.toggle('active',Number(b.dataset.page)===number);b.setAttribute('aria-pressed',String(Number(b.dataset.page)===number));});
  const original=el('source-actions').querySelector('a.pdf-original');
  if(original)original.href=current.document_url+'#page='+number;
  updateUrl();
}
function updateUrl(){const p=readingEvolution?evolutionContext():readingStory?storyContext():new URLSearchParams();p.set('source',current.id);p.set('page',pageNumber);if(readingEvolution)p.set('context','evolution');if(readingStory)p.set('story','huaian');if(readingPoint)p.set('point',readingPoint);history.replaceState(null,'','?'+p);}
function select(source,page=1){
  current=source;pageNumber=page;scale=100;renderList();
  el('source-title').textContent=source.title;el('source-publisher').textContent=source.id+' / '+source.publisher;
  el('source-description').textContent=source.id==='S010'?'2016 年边界修改附件，共 6 页；第 4 页为清口完整资料图。先读逐页预览，需要时再打开原件。':'保留发布机构、原始链接与归档标识，便于核对地图和文化解读。';
  const readings=(source.point_readings||[]).filter(p=>!readingPoint||p.case_id===readingPoint);
  const storyReadings=(source.story_readings||[]).filter(p=>!readingStory||!readingStep||p.step_id===readingStep);
  if(readingPoint&&readings.length){const reading=readings[0];el('source-description').textContent=reading.number+' '+reading.name+' · '+reading.locator+'。'+reading.note;}
  if(readingStory&&storyReadings.length)el('source-description').textContent='因河成市 / '+storyReadings[0].title+' · '+storyReadings[0].period+'。下方为本步采用的材料摘要与定位。';
  el('source-rights').textContent=source.rights_note||'按原发布机构的使用条件引用。';
  const metadata=el('source-metadata');metadata.replaceChildren();
  for(const [key,value] of [['原始格式',source.format],['原件大小',source.bytes?(source.bytes/1000000).toFixed(2)+' MB':'—'],['归档时间',source.fetched_at||source.retrieved_at||'见原件凭据'],['SHA-256',source.sha256||'—']]){
    const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;metadata.append(dt,dd);
  }
  const actions=el('source-actions');actions.replaceChildren(link('发布机构原页 ↗',source.url));
  if(source.document_url){const original=link(source.id==='S010'?'完整 PDF 原件 · 157.5 MB ↗':'本机 PDF 原件 ↗',source.document_url+'#page='+page);original.className='pdf-original';actions.append(original);}
  const tools=el('page-tools');tools.hidden=!source.previews.length;
  el('page-list').replaceChildren();el('source-viewer').replaceChildren();el('reader-status').textContent='';
  if(source.previews.length){
    for(const preview of source.previews){const b=document.createElement('button');b.className='page-choice';b.dataset.page=String(preview.page);b.textContent='第 '+preview.page+' 页';b.onclick=()=>showPage(preview.page);el('page-list').append(b);}
    showPage(source.previews.some(p=>p.page===page)?page:4);
  }else if(source.document_url){
    const iframe=document.createElement('iframe');iframe.title=source.title;iframe.src=source.document_url+'#page='+page;
    iframe.className='evidence-pdf';el('source-viewer').append(iframe);el('reader-status').textContent='PDF 使用浏览器阅读器；若未显示，可打开上方本机原件。';updateUrl();
  }else{
    const article=document.createElement('article');article.className='source-abstract';
    for(const reading of storyReadings){
      const heading=document.createElement('h3');heading.textContent='因河成市 · '+reading.title;
      const time=document.createElement('p');time.className='reading-locator';time.textContent=reading.period;article.append(heading,time);
      for(const excerpt of reading.excerpts||[]){
        const quote=document.createElement('blockquote'),byline=document.createElement('p'),note=document.createElement('p');
        quote.textContent='“'+excerpt.text_display+'”';byline.textContent=excerpt.period+' · '+excerpt.author+' '+excerpt.work_title;note.className='reading-locator';note.textContent=excerpt.quotation_route+'。'+excerpt.locator+'。'+excerpt.variants_note;article.append(quote,byline,note);
      }
      for(const subject of reading.subjects||[]){const name=document.createElement('strong'),text=document.createElement('p');name.textContent=subject.title;text.textContent=subject.description+' 位置记述：'+subject.location_text;article.append(name,text);}
      for(const claim of reading.claims){
        const title=document.createElement('strong'),p=document.createElement('p'),locator=document.createElement('p');
        title.textContent=claim.label+' / '+(claim.evidence_status==='interpretation'?'本章解读':'资料转述');p.textContent=claim.text;locator.className='reading-locator';locator.textContent='资料定位：'+claim.locator;
        article.append(title,p,locator);
      }
    }
    for(const reading of readings){
      const heading=document.createElement('h3');heading.textContent=reading.number+' '+reading.name;
      const locator=document.createElement('p');locator.className='reading-locator';locator.textContent=reading.locator;
      const p=document.createElement('p');p.textContent=reading.note;
      article.append(heading,locator,p);
      if(reading.facts.length){const list=document.createElement('ul');list.className='reading-facts';for(const fact of reading.facts){const item=document.createElement('li');item.textContent=fact.label+' · '+fact.text;list.append(item);}article.append(list);}
    }
    if(!readings.length&&!storyReadings.length){const heading=document.createElement('h3');heading.textContent='资料用途';const p=document.createElement('p');p.textContent=source.rights_note||'用于核查名称、历史事实、方法或数据条件。';article.append(heading,p);}
    const note=document.createElement('p');note.textContent='原文与数据由发布机构提供，可通过上方“发布机构原页”核对。此页保存归档信息，不自动加载外部网页。';
    article.append(note);el('source-viewer').append(article);updateUrl();
  }
}
el('source-search').oninput=renderList;
el('preview-in').onclick=()=>setScale(scale+25);el('preview-out').onclick=()=>setScale(scale-25);el('preview-fit').onclick=()=>setScale(100);
fetch('/api/evidence').then(r=>{if(!r.ok)throw new Error('资料目录暂不可用');return r.json();}).then(data=>{
  catalog=data.sources.sort((a,b)=>a.id==='S010'?-1:b.id==='S010'?1:a.id.localeCompare(b.id));
  const params=new URLSearchParams(location.search),source=catalog.find(s=>s.id===params.get('source'))||catalog.find(s=>s.id==='S010');
  const requested=Number(params.get('page'));select(source,Number.isInteger(requested)&&requested>0?requested:source.id==='S010'?4:1);
}).catch(error=>{el('source-title').textContent='资料暂不可用';el('reader-status').textContent=error.message;});
