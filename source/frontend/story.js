'use strict';
const el=id=>document.getElementById(id);
let story,stepIndex=0,activePlace='',activeSample='',sampleType='',sampleQuery='',galleryGroup='';
let map,view,atlas;
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const initialParams=new URLSearchParams(location.search);
const node=(tag,text,css)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(css)n.className=css;return n;};
function stateParams(){const p=new URLSearchParams();p.set('step',story.steps[stepIndex].id);p.set('place',activePlace);if(atlas?.scope()==='all')p.set('scope','all');if(activeSample)p.set('sample',activeSample);if(sampleType)p.set('kind',sampleType);if(sampleQuery)p.set('q',sampleQuery);return p;}
function remember(){const p=stateParams();history.replaceState(null,'','?'+p);try{sessionStorage.setItem('canal-huaian-story',p.toString());}catch{}el('story-evidence').href=evidenceLink('S039');el('story-basemap-source').href=evidenceLink('S010',4);document.querySelectorAll('.claim-source').forEach(a=>{a.href=evidenceLink(a.dataset.source);});}
function evidenceLink(sid,page){const p=stateParams();p.set('story','huaian');p.set('source',sid);if(page)p.set('page',page);return './evidence.html?'+p;}
function placeFeature(id){return story.places.features.find(f=>f.id===id);}
function moveToPlace(id,animate=true,zoom){
  const feature=placeFeature(id);if(!feature)return;activePlace=id;
  atlas.move(id,animate,zoom||feature.properties.preferred_zoom||(id==='qingjiang'?16.8:story.steps[stepIndex].map_zoom));
  el('story-place-open').onclick=()=>atlas.openPlace(id);
  document.querySelectorAll('.story-place-choice').forEach(b=>{const on=b.dataset.id===id;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
}
function initMap(){
  atlas=window.CanalAtlas.create(story,{evidence:evidenceLink,reduceMotion,zoom:()=>story.steps[stepIndex].map_zoom,scopeChanged:remember,
    selectPlace:id=>{atlas.modern();moveToPlace(id);remember();}});
  map=atlas.map;view=atlas.view;
}
function renderClaims(step){
  const container=el('step-claims');container.replaceChildren();
  for(const id of step.claim_ids){
    const claim=story.claims.find(c=>c.id===id),inference=claim.evidence_status==='interpretation';
    const card=node('article',undefined,'claim-card'+(inference?' interpretation':'')),heading=node('div',undefined,'claim-heading');
    heading.append(node('strong',claim.label),node('small',inference?'本章解读':'资料转述'));
    const links=node('div',undefined,'claim-links');for(const sid of claim.source_ids){const a=node('a','阅读出处 '+sid+' →','claim-source');a.dataset.source=sid;a.href=evidenceLink(sid);a.title=claim.locator;links.append(a);}
    card.append(heading,node('p',claim.text),links);container.append(card);
  }
}
function renderLiterature(step){
  const quotes=story.literary_excerpts.filter(q=>(step.literary_ids||[]).includes(q.id)),list=el('literary-cards');list.replaceChildren();el('story-literature').hidden=!quotes.length;
  for(const q of quotes){
    const card=node('article',undefined,'literary-card');card.append(node('h3',q.title));
    card.append(node('blockquote','“'+q.text_display+'”','literary-quote'));
    card.append(node('p',q.period+' · '+q.author+' '+q.work_title+(q.composition_date?' · '+q.composition_date:''),'literary-byline'),node('p',q.interpretation,'literary-reading'));
    if(q.place_id){const b=node('button','循文字，在地图上看 ↑','outline');b.onclick=()=>{atlas.modern();moveToPlace(q.place_id);remember();el('story-map').scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'center'});};card.append(b);}
    const details=node('details',undefined,'literary-source');details.append(node('summary','出处与文字说明'),node('p',q.quotation_route+'。'+q.locator));
    const a=node('a','查看归档出处 →','claim-source');a.dataset.source=q.source_id;a.href=evidenceLink(q.source_id);const original=node('a','打开原文页面 ↗');original.href=q.source_url;original.target='_blank';original.rel='noopener';details.append(a,original);card.append(details);list.append(card);
  }
}
function openSubject(subject){
  atlas.open({title:subject.title,description:subject.description,mediaList:subject.media,coordinate:subject.location_text,fields:[['专题',subject.group],['图像数',subject.media.length],['位置记述',subject.location_text]],sources:subject.source_ids,panorama:subject.panorama_url});
}
function showFeaturedSubject(subject){
  const media=subject.media[0];if(!media)return;
  el('story-place-title').textContent=subject.title;el('story-place-intro').textContent=subject.description+' 位置记述：'+subject.location_text+'。地图显示相关街区范围。';
  el('story-place-card').dataset.orientation=media.height>media.width?'portrait':'landscape';
  el('story-photo-kind').textContent=atlas.photoLabel(media);atlas.image(el('story-place-photo'),el('story-place-caption'),media);el('story-place-open').onclick=()=>openSubject(subject);
}
function renderGallery(step){
  const subjects=story.subjects.filter(s=>(step.subject_ids||[]).includes(s.id)),visible=subjects.filter(s=>!galleryGroup||s.group===galleryGroup);
  el('story-gallery').hidden=!subjects.length;el('gallery-title').textContent=step.gallery_title||'';el('gallery-intro').textContent=step.gallery_intro||'';
  const groups=el('gallery-groups');groups.replaceChildren();
  for(const group of ['',...new Set(subjects.map(s=>s.group))]){const b=node('button',group||'全部专题','gallery-group');b.setAttribute('aria-pressed',String(group===galleryGroup));b.onclick=()=>{galleryGroup=group;renderGallery(step);};groups.append(b);}
  const uniqueImages=new Set(visible.flatMap(s=>s.media.map(m=>m.sha256))).size;
  el('gallery-count').textContent=visible.length+' 组对象档案 · '+uniqueImages+' 幅图像 · 照片、古图与文献摘图分别标注';
  const list=el('gallery-cards');list.replaceChildren();
  for(const s of visible){
    const card=node('article',undefined,'gallery-card'),button=node('button',undefined,'gallery-open');button.setAttribute('aria-label','阅读'+s.title+'图文档案');button.dataset.subject=s.id;
    const media=s.media[0];
    if(media){const img=node('img');img.src=media.url;img.alt=media.caption;img.loading='lazy';img.decoding='async';img.width=media.width;img.height=media.height;button.append(img,node('span',atlas.photoLabel(media),'photo-kind'));}
    else button.append(node('span','文献档案','document-mark'),node('p','位置与经营活动，循文字阅读','document-strap'));
    button.append(node('span',s.group,'gallery-category'),node('h3',s.title),node('p',s.description),node('span',s.media.length>1?'阅读全文 · '+s.media.length+'幅图像 ↗':'阅读全文 ↗','card-open'));button.onclick=()=>openSubject(s);card.append(button);
    const footer=node('div',undefined,'gallery-card-footer');footer.append(node('small',s.media[0]?.publication_date?'来源发布 '+s.media[0].publication_date:'文献／场景时间见档案'));
    if(s.place_id){const b=node('button','地图上看 ↑','gallery-map');b.onclick=()=>{atlas.modern();moveToPlace(s.place_id);remember();el('story-map').scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'center'});};footer.append(b);}
    card.append(footer);list.append(card);
  }
}
function renderChapterPlaces(step,expanded=false){
  const ids=step.related_place_ids||[],places=ids.map(placeFeature).filter(Boolean).sort((a,b)=>Number(!a.properties.media_ids)-Number(!b.properties.media_ids));
  const list=el('chapter-place-cards');list.replaceChildren();el('chapter-places-intro').textContent='本章关联 '+places.length+' 处地点 · 全图 '+story.places.features.length+' 处，可在地图目录按片区和类型寻找。';
  for(const f of expanded?places:places.slice(0,6)){
    const p=f.properties,b=node('button',undefined,'chapter-place-card');b.dataset.id=f.id;b.setAttribute('aria-label','阅读'+p.name+'并在地图上定位');
    const img=node('img');img.src=p.appearance.url;img.alt=p.appearance.caption;img.width=p.appearance.width;img.height=p.appearance.height;img.loading='lazy';img.decoding='async';
    b.append(img,node('small',p.area+' · '+p.category_label),node('h3',p.name),node('p',p.description),node('span','地图定位与图文档案 ↗','card-open'));
    b.onclick=()=>{atlas.modern();moveToPlace(f.id);remember();atlas.openPlace(f.id);};list.append(b);
  }
  if(places.length>6){const b=node('button',expanded?'收起地点图志 ↑':'展开本章全部 '+places.length+' 处地点 ↓','chapter-places-more outline');b.onclick=()=>renderChapterPlaces(step,!expanded);list.append(b);}
}
function showStep(index,animate=true,restorePlace){
  if(!Number.isInteger(index)||index<0||index>=story.steps.length)return;
  stepIndex=index;const step=story.steps[index];el('story-content').dataset.chapter=step.id;
  galleryGroup='';atlas.filterPlaces(step.related_place_ids||[step.place_id]);
  atlas.modern();moveToPlace(placeFeature(restorePlace)?restorePlace:step.place_id,animate);
  el('step-number').textContent=String(index+1).padStart(2,'0');el('step-period').textContent=step.period;
  for(const [id,key] of [['step-title','title'],['step-lead','lead'],['step-body','body'],['story-map-note','map_note']])el(id).textContent=step[key];
  document.querySelectorAll('.story-step').forEach((b,i)=>{const on=index===i;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'step':'false');});
  const chapterRail=el('story-steps'),chapterButton=chapterRail.children[index];
  if(chapterButton&&chapterRail.scrollWidth>chapterRail.clientWidth)chapterRail.scrollTo({left:Math.max(0,chapterButton.offsetLeft-chapterRail.offsetLeft-(chapterRail.clientWidth-chapterButton.offsetWidth)/2),behavior:'auto'});
  el('story-prev').disabled=index===0;el('story-next').disabled=index===story.steps.length-1;
  el('story-progress').textContent=(index+1)+' / '+story.steps.length;
  const relations=el('merchant-links');relations.hidden=!step.relationships;relations.replaceChildren();
  for(const r of step.relationships||[]){const card=node('article',undefined,'merchant-card');card.append(node('strong',r.name),node('span',r.trade),node('small','行业记述 · '+r.source_id));relations.append(card);}
  const choices=el('story-place-choices');choices.hidden=!step.related_place_ids?.length;choices.replaceChildren();
  for(const id of (step.related_place_ids||[]).slice(0,5)){const button=node('button',placeFeature(id).properties.name,'story-place-choice');button.dataset.id=id;const on=id===activePlace;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));button.onclick=()=>{atlas.modern();moveToPlace(id);remember();};choices.append(button);}
  el('step-takeaway').hidden=!step.takeaway;el('step-takeaway').textContent=step.takeaway||'';
  el('story-samples').hidden=!step.show_samples;
  el('story-evidence-details').hidden=!step.claim_ids.length;el('story-evidence-details').open=false;
  remember();renderClaims(step);renderLiterature(step);renderGallery(step);renderChapterPlaces(step);if(step.show_samples)renderSamples();
  if(step.featured_subject_id&&(!restorePlace||restorePlace===step.place_id))showFeaturedSubject(story.subjects.find(s=>s.id===step.featured_subject_id));
}
function showSample(record,open=false){
  activeSample=record.id;el('sample-detail').hidden=false;
  el('sample-selection-text').textContent='当前选中：'+record.name+' · '+record.location_text_as_reported;
  const openSample=()=>atlas.open({title:record.name,media:record.appearance,description:record.appearance.intro,
    coordinate:'原表位置：'+record.location_text_as_reported,
    fields:[['原表编号',record.source_building_id+' · 序号 '+record.source_sequence],['建筑类型',record.type_as_reported],['建筑年代',record.construction_period_as_reported],['原表位置',record.location_text_as_reported],['建筑面积',record.reported_building_area_m2===null?'未提供':record.reported_building_area_m2+' 平方米'],['名录公布',record.inventory_publication_year+' 年'],['市井生活线索（项目解读）',record.reading_link]],sources:['S041']});
  el('sample-open').onclick=openSample;if(open)openSample();
  el('sample-source').href=evidenceLink('S041');el('sample-source').title=record.source_locator;
  document.querySelectorAll('.sample-record').forEach(b=>{const on=b.dataset.id===record.id;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});remember();
}
function renderSamples(){
  const records=story.sample.records,filtered=records.filter(r=>(!sampleType||r.type_as_reported===sampleType)&&[r.name,r.location_text_as_reported,r.construction_period_as_reported].join(' ').includes(sampleQuery));
  const kinds=['',...Object.keys(story.sample.counts.hexia_types_as_reported)],typeButtons=el('sample-types');typeButtons.replaceChildren();
  for(const kind of kinds){const b=node('button',undefined,kind===sampleType?'active':'');b.append(node('strong',kind||'全部'),node('span',kind?story.sample.counts.hexia_types_as_reported[kind]:records.length));b.setAttribute('aria-pressed',String(kind===sampleType));b.onclick=()=>{sampleType=kind;renderSamples();remember();};typeButtons.append(b);}
  el('sample-count').textContent=`当前 ${filtered.length} / ${records.length} 条河下记录 · 原批次共 ${story.sample.counts.all_inventory_records} 条`;
  const list=el('sample-list');list.replaceChildren();
  for(const r of filtered){
    const b=node('button',undefined,'sample-record');b.dataset.id=r.id;
    b.append(node('strong',r.name),node('small',r.type_as_reported+' · '+r.construction_period_as_reported),node('small',r.location_text_as_reported));
    const thumb=node('img');thumb.src=r.appearance.url;thumb.alt=r.name+' · '+atlas.photoLabel(r.appearance);thumb.loading='lazy';thumb.decoding='async';thumb.width=r.appearance.width;thumb.height=r.appearance.height;
    const kind=node('span',atlas.photoLabel(r.appearance),'photo-kind sample-photo-kind');kind.dataset.reference=String(r.appearance.photo_kind==='neighborhood_environment_only');
    b.append(thumb,kind,node('span','阅读图文档案 ↗','card-open'));b.onclick=()=>showSample(r,true);list.append(b);
  }
  if(!filtered.length){list.append(node('p','没有匹配记录。可清空关键词或选择“全部”。','sample-empty'));activeSample='';el('sample-detail').hidden=true;remember();}
  else showSample(filtered.find(r=>r.id===activeSample)||filtered[0]);
}
el('story-prev').onclick=()=>showStep(stepIndex-1);el('story-next').onclick=()=>showStep(stepIndex+1);
el('story-map-reset').onclick=()=>{const step=story.steps[stepIndex];atlas.modern();moveToPlace(step.place_id);if(step.featured_subject_id)showFeaturedSubject(story.subjects.find(s=>s.id===step.featured_subject_id));remember();};
el('sample-search').oninput=()=>{sampleQuery=el('sample-search').value.trim();renderSamples();remember();};
el('sample-region').onclick=()=>{atlas.modern();moveToPlace('hexia');remember();el('story-map').scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'center'});};
fetch('/api/culture-story/huaian').then(r=>{if(!r.ok)throw Error('故事资料暂不可用，请检查本地服务后刷新。');return r.json();}).then(data=>{
  story=data;const clean=window.CanalAtlas.publicText;
  for(const step of story.steps)for(const field of ['map_note','gallery_intro'])step[field]=clean(step[field]);
  for(const f of story.places.features)f.properties.description=clean(f.properties.description);
  for(const subject of story.subjects){subject.description=clean(subject.description);subject.location_text=subject.location_text.split(/[，；。]/).map(clean).filter(Boolean).join('，');}
  for(const q of story.literary_excerpts)q.locator=clean(q.locator);
  el('story-intro').textContent=story.intro;el('story-basemap-note').textContent=story.map.caption;
  el('atlas-directory-title').textContent='全部地图地点 · '+story.places.features.length+'处';
  let restored=initialParams;try{if(!initialParams.has('step'))restored=new URLSearchParams(sessionStorage.getItem('canal-huaian-story')||'');}catch{}
  const wanted=story.steps.findIndex(s=>s.id===restored.get('step'));
  activeSample=restored.get('sample')||'';sampleType=restored.get('kind')||'';
  if(!Object.keys(story.sample.counts.hexia_types_as_reported).includes(sampleType))sampleType='';
  sampleQuery=(restored.get('q')||'').slice(0,100);el('sample-search').value=sampleQuery;
  for(let i=0;i<story.steps.length;i++){const step=story.steps[i],b=node('button',undefined,'story-step'),mark=node('span',['壹','贰','叁','肆','伍'][i],'step-scroll-mark');mark.setAttribute('aria-hidden','true');b.append(node('small',String(i+1).padStart(2,'0')),node('strong',step.short_title),mark);b.onclick=()=>showStep(i);el('story-steps').append(b);}
  el('story-content').hidden=false;initMap();showStep(wanted>=0?wanted:0,false,restored.get('place'));if(restored.get('scope')==='all')atlas.setScope('all');el('story-status').textContent='';
}).catch(error=>{el('story-status').textContent=error.message;});
