'use strict';
const byId=id=>document.getElementById(id);
let content,selected='CASE-12',contextMode=true;
const status=byId('map-status');
const view=new ol.View({center:ol.proj.fromLonLat([118.955,33.56]),zoom:12,minZoom:9,maxZoom:16});
const archivalLayer=new ol.layer.Tile({cacheSize:256,preload:1});
const outlineSource=new ol.source.Vector();
const referenceCases={
  QK_MIDDLE_CANAL:['CASE-13','CASE-12'],QK_QINGJIANG_WATERWAY:['CASE-14','CASE-12'],
  QK_FORMER_LI:['CASE-12'],QK_CANAL_NORTH:['CASE-12'],QK_LEVEE_PREVIEW_EXCERPT:['CASE-15']
};
const referenceStyles=new Map();
function referenceStyle(feature){
  // The numbered focus layer already marks both locks; avoid duplicate point symbols.
  if(feature.getGeometry().getType()==='Point')return null;
  const active=(referenceCases[feature.getId()]||[feature.get('case_id')]).includes(selected);
  const key=String(feature.getId())+':'+active;
  if(!referenceStyles.has(key))referenceStyles.set(key,new ol.style.Style({zIndex:active?2:1,
    renderer:(coordinates,state)=>CanalReferenceEffects.drawLine(coordinates,state,active),
    hitDetectionRenderer:CanalReferenceEffects.hitLine}));
  return referenceStyles.get(key);
}
const referenceLayer=new ol.layer.Vector({source:outlineSource,visible:false,style:referenceStyle,renderBuffer:40});
const focusSource=new ol.source.Vector();
const haloStyles=new Map();
function haloStyle(feature){
  const active=feature.getId()===selected;
  if(!haloStyles.has(active))haloStyles.set(active,new ol.style.Style({
    renderer:(coordinate,state)=>CanalReferenceEffects.drawPointHalo(coordinate,state,active),
    hitDetectionRenderer:()=>{}}));
  return haloStyles.get(active);
}
const focusHaloLayer=new ol.layer.Vector({source:focusSource,visible:false,style:haloStyle,renderBuffer:45});
function focusStyle(feature){
  const active=feature.getId()===selected,number=feature.get('number');
  const accent=contextMode?'#a35b43':'#7560be',idle=contextMode?'#496f68':'#308c94';
  return new ol.style.Style({zIndex:active?20:10,
    image:new ol.style.Circle({radius:active?15:12,fill:new ol.style.Fill({color:active?accent:idle}),stroke:new ol.style.Stroke({color:'#fff',width:2.5})}),
    text:new ol.style.Text({text:number+'  '+feature.get('label'),textAlign:'left',offsetX:active?23:20,offsetY:0,
      font:(active?'bold ':'')+'12px "Microsoft YaHei",sans-serif',padding:[5,7,5,7],
      backgroundFill:new ol.style.Fill({color:'#fffffff0'}),fill:new ol.style.Fill({color:contextMode?(active?'#8a452f':'#35564e'):(active?'#6550a5':'#307982')}),stroke:new ol.style.Stroke({color:'#fff',width:2})})});
}
const focusLayer=new ol.layer.Vector({source:focusSource,style:focusStyle,declutter:true});
const map=new ol.Map({target:'map',layers:[archivalLayer,referenceLayer,focusHaloLayer,focusLayer],view,
  controls:ol.control.defaults.defaults({rotate:false}).extend([new ol.control.ScaleLine()])});
const core=[118.815,33.485,119.13,33.635];
const levee=[118.70,33.04,118.96,33.48];
const full=[118.69,33.025,119.185,33.646];
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function duration(){return reduceMotion?0:350;}
function fit(extent){view.cancelAnimations();view.fit(ol.proj.transformExtent(extent,'EPSG:4326','EPSG:3857'),{padding:[70,35,55,35],duration:duration(),maxZoom:14});}
function moveTo(target,animate=true){
  const center=ol.proj.fromLonLat(target.coordinate);
  view.cancelAnimations();
  const current=view.getCenter(),zoom=view.getZoom();
  if(current&&Math.hypot(current[0]-center[0],current[1]-center[1])<1&&Math.abs(zoom-target.zoom)<.01)return;
  // Move and zoom together; rapid clicks replace the preceding animation.
  view.animate({center,zoom:target.zoom,duration:animate?duration():0});
}
byId('core-view').onclick=()=>fit(core);
byId('levee-view').onclick=()=>fit(levee);
byId('full-view').onclick=()=>fit(full);
function setMode(context){
  contextMode=context;
  // Retain the archival basemap; only the reference overlay changes.
  referenceLayer.setVisible(!context);
  focusHaloLayer.setVisible(!context);
  referenceLayer.changed();focusHaloLayer.changed();focusLayer.changed();
  byId('context-mode').classList.toggle('active',context);
  byId('line-mode').classList.toggle('active',!context);
  byId('context-mode').setAttribute('aria-pressed',String(context));
  byId('line-mode').setAttribute('aria-pressed',String(!context));
  byId('reference-legend').hidden=context;
  byId('reference-point-legend').hidden=context;
  byId('map-caption').textContent=context?'2016 年附件资料图':'渐变线为核查叠加 · 光环为当前选择';
  renderPointMaterialLinks();
}
byId('context-mode').onclick=()=>setMode(true);byId('line-mode').onclick=()=>setMode(false);
function publicText(text){return String(text||'').split(/(?<=[。；])/).filter(part=>!/待核|未核|待补|待查|尚待|补核/.test(part)).join('').trim();}
function setText(id,text){byId(id).textContent=publicText(text);}
function evidenceLink(sid,page,point){return './evidence.html?source='+encodeURIComponent(sid)+(page?'&page='+page:'')+(point?'&point='+encodeURIComponent(point):'');}
function currentDossier(){return content?.dossiers.find(d=>d.id===selected);}
function renderPointMaterialLinks(){
  const dossier=currentDossier(),material=dossier?.related_materials;
  byId('point-materials').hidden=contextMode||!material;
  byId('detail-sources').hidden=!contextMode&&!!material;
  const list=byId('point-material-links');list.replaceChildren();
  if(!material)return;
  setText('point-material-count',material.documents.length+' 份 · 本点专属');
  for(const doc of material.documents){
    const a=document.createElement('a'),kind=document.createElement('small'),title=document.createElement('span');
    a.href=evidenceLink(doc.source_id,doc.page,dossier.id);a.title=doc.locator;
    kind.textContent=doc.kind;title.textContent=doc.title;a.append(kind,title);list.append(a);
  }
}
function showPointMaterials(){
  const dossier=currentDossier(),material=dossier?.related_materials;if(!material)return;
  setText('point-material-kicker','线位核查 / '+material.number+' 点位资料');
  setText('point-material-title',dossier.name);setText('point-material-subtitle',material.subtitle);
  setText('point-material-summary',material.summary);setText('point-map-reading',material.map_reading);
  const photo=material.appearance,appearance=byId('point-appearance-image');
  appearance.src=photo.url;appearance.alt=photo.caption;appearance.width=photo.width;appearance.height=photo.height;
  appearance.onerror=()=>setText('point-appearance-caption','图片暂不可用，请查看照片原始来源。');
  setText('point-appearance-caption',[photo.caption,photo.note,photo.photo_date_note,'图源 '+photo.source_id+' · '+photo.publication_date].filter(Boolean).join(' · '));
  byId('point-appearance-source').href=photo.source_url;
  setText('point-appearance-coordinate',material.coordinate_note);
  const preview=material.preview,image=byId('point-material-image');
  image.alt=dossier.name+' · '+preview.source_id+' 第 '+preview.page+' 页节选';
  image.width=preview.width;image.height=preview.height;image.src=preview.url;
  setText('point-material-caption',preview.caption);
  byId('point-map-source').href=evidenceLink(preview.source_id,preview.page,dossier.id);
  const facts=byId('point-material-facts');facts.replaceChildren();
  for(const fact of material.facts){
    const row=document.createElement('article'),label=document.createElement('strong'),p=document.createElement('p'),source=document.createElement('a');
    label.textContent=fact.label;p.textContent=publicText(fact.text);source.textContent=fact.source_id+(fact.page?' · 第 '+fact.page+' 页':'')+' →';
    source.href=evidenceLink(fact.source_id,fact.page,dossier.id);row.append(label,p,source);facts.append(row);
  }
  const documents=byId('point-material-documents');documents.replaceChildren();
  for(const doc of material.documents){
    const row=document.createElement('article'),a=document.createElement('a'),meta=document.createElement('small'),p=document.createElement('p');
    a.textContent=doc.title+' →';a.href=evidenceLink(doc.source_id,doc.page,dossier.id);
    meta.textContent=doc.source_id+' · '+content.sources[doc.source_id].publisher+' · '+doc.locator;p.textContent=publicText(doc.note);
    row.append(a,meta,p);documents.append(row);
  }
  byId('point-material-dialog').showModal();
}
byId('open-point-materials').onclick=showPointMaterials;
byId('open-point-appearance').onclick=showPointMaterials;
byId('close-point-materials').onclick=()=>byId('point-material-dialog').close();
function showDossier(dossier,animate=true){
  selected=dossier.id;setText('detail-title',dossier.name);setText('detail-theme',dossier.theme);setText('detail-question',dossier.guiding_question);setText('detail-text',dossier.interpretation);
  const sources=byId('detail-sources');sources.replaceChildren();
  const target=content.map_navigation.targets.find(t=>t.case_id===selected);
  for(const sid of dossier.source_ids){
    const source=content.sources[sid];if(!source?.url)continue;
    const a=document.createElement('a');a.textContent=sid+' 资料依据 →';
    const doc=dossier.related_materials?.documents.find(d=>d.source_id===sid);
    a.href=evidenceLink(sid,doc?.page||(sid==='S010'?4:target?.source_ids.includes(sid)?target.source_pdf_page:undefined),dossier.related_materials?dossier.id:undefined);a.title=source.title;sources.append(a);
  }
  setText('detail-note',target?'2016资料图 · '+target.label:'沿运河阅读文化遗产');
  document.querySelectorAll('.case-item').forEach(button=>{const active=button.dataset.id===selected;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  referenceLayer.changed();focusHaloLayer.changed();focusLayer.changed();
  renderPointMaterialLinks();
  byId('open-point-appearance').hidden=!dossier.related_materials;
  setText('detail-coordinate',dossier.related_materials?.coordinate_note||'');
  if(target){setText('map-place',target.label);moveTo(target,animate);}
}
map.on('singleclick',event=>map.forEachFeatureAtPixel(event.pixel,feature=>{
  const cases=referenceCases[feature.getId()];
  const id=feature.get('case_id')||(cases?.includes(selected)?selected:cases?.[0])||feature.getId();
  const dossier=content?.dossiers.find(d=>d.id===id||d.map_feature_id===id);
  if(dossier){showDossier(dossier);showPointMaterials();return true;}
},{hitTolerance:8}));
byId('open-inventory').onclick=()=>byId('inventory-dialog').showModal();byId('close-inventory').onclick=()=>byId('inventory-dialog').close();
byId('open-notes').onclick=()=>byId('notes-dialog').showModal();byId('close-notes').onclick=()=>byId('notes-dialog').close();
function renderInventory(){
  const query=byId('inventory-search').value.trim(),system=byId('system-filter').value;
  const records=content.inventory.records.filter(r=>(!query||r.name.includes(query))&&(!system||r.canal_system===system));
  setText('inventory-count',`当前显示 ${records.length} / 85 项要素`);
  const list=byId('inventory-list');list.replaceChildren();
  for(const record of records){
    const button=document.createElement('button');button.className='inventory-item';
    const title=document.createElement('strong');title.textContent=`${String(record.source_sequence).padStart(2,'0')}  ${record.name}`;
    const note=document.createElement('small');const dossier=content.dossiers.find(d=>d.element_id===record.id);note.textContent=record.canal_system+(dossier?' · 文化解读':' · 遗产名录');button.append(title,note);
    button.onclick=()=>{byId('inventory-dialog').close();if(dossier){showDossier(dossier);}else{showDossier({id:record.id,name:record.name,theme:record.canal_system,guiding_question:'这项遗产在运河系统中承担什么作用？',interpretation:'已核对该要素在原始名录中的名称。其具体年代、现状与地点档案将逐项补充；现阶段不填入未经核验的位置或故事。',source_ids:['S014'],region:'inventory'});}};
    list.append(button);
  }
}
byId('inventory-search').oninput=renderInventory;byId('system-filter').onchange=renderInventory;
function rememberView(){
  if(!content)return;
  try{sessionStorage.setItem('canal-map-view',JSON.stringify({selected,contextMode,center:view.getCenter(),zoom:view.getZoom()}));}catch{}
}
window.addEventListener('pagehide',rememberView);
document.addEventListener('click',event=>{if(event.target.closest('a'))rememberView();});
fetch('/api/heritage-content').then(r=>{if(!r.ok)throw new Error('内容暂不可用');return r.json();}).then(data=>{
  content=data;
  const navigation=data.map_navigation,tiles=navigation.tiles;
  const tileSource=new ol.source.XYZ({url:tiles.url,minZoom:tiles.min_zoom,maxZoom:tiles.max_zoom,wrapX:false,
    attributions:'资料：UNESCO 大运河附件 S010 · 2016',transition:150});
  archivalLayer.setExtent(tiles.extent);archivalLayer.setSource(tileSource);
  let pending=0,tileError=false;
  tileSource.on('tileloadstart',()=>{pending++;status.textContent='正在加载资料底图…';status.classList.remove('ready');});
  tileSource.on('tileloadend',()=>{pending=Math.max(0,pending-1);if(!pending&&!tileError){status.textContent='资料底图已加载';status.classList.add('ready');}});
  tileSource.on('tileloaderror',()=>{pending=Math.max(0,pending-1);tileError=true;status.textContent='局部瓦片加载失败，请刷新页面重试。';status.classList.remove('ready');});
  const format=new ol.format.GeoJSON();
  focusSource.addFeatures(format.readFeatures({type:'FeatureCollection',features:navigation.focus_features.features.filter(f=>f.geometry.type==='Point')},{featureProjection:'EPSG:3857'}));
  outlineSource.addFeatures(format.readFeatures({type:'FeatureCollection',features:navigation.focus_features.features.filter(f=>f.geometry.type!=='Point')},{featureProjection:'EPSG:3857'}));
  // Navigation and the base map work independently of the six database reference objects.
  fetch('/api/features?layer=qingkou-features').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(geojson=>{
    outlineSource.addFeatures(format.readFeatures(geojson,{featureProjection:'EPSG:3857'}));
  }).catch(()=>{status.textContent='底图可用；前期参考线暂未取到。';status.classList.remove('ready');});
  for(const [index,dossier] of data.dossiers.filter(d=>['qingkou','huaian'].includes(d.region)).entries()){
    const button=document.createElement('button');button.className='case-item';button.dataset.id=dossier.id;
    const number=document.createElement('span');number.className='index';number.textContent=String(index+1).padStart(2,'0');
    const body=document.createElement('span'),name=document.createElement('strong'),theme=document.createElement('small');name.textContent=dossier.name;theme.textContent=dossier.theme;body.append(name,theme);button.append(number,body);button.onclick=()=>showDossier(dossier);byId('case-list').append(button);
  }
  for(const system of new Set(data.inventory.records.map(r=>r.canal_system))){const option=document.createElement('option');option.value=system;option.textContent=system;byId('system-filter').append(option);}
  let saved;try{saved=JSON.parse(sessionStorage.getItem('canal-map-view'));}catch{}
  const initial=data.dossiers.find(d=>d.id===saved?.selected)||data.dossiers[0];
  renderInventory();showDossier(initial,false);setMode(saved?.contextMode!==false);
  if(saved&&Array.isArray(saved.center)&&saved.center.length===2&&saved.center.every(Number.isFinite)&&Number.isFinite(saved.zoom)){
    view.cancelAnimations();view.setCenter(saved.center);view.setZoom(Math.max(9,Math.min(16,saved.zoom)));
  }
}).catch(error=>{setText('detail-title','内容暂不可用');setText('detail-text',error.message);status.textContent='地图初始化失败，请检查本机 API。';});
