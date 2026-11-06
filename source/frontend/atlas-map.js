'use strict';
// Modern vectors and archival tiles are separate reading modes, never precision overlays.
window.CanalAtlas={publicText(text){return String(text||'').replace(/（[^）]*(?:待核|未核|待查|未查证)[^）]*）/g,'').split(/(?<=[。；])/).filter(part=>!/待核|未核|待补|待查|尚待|未查证/.test(part)).join('').trim();},create(data,ui){
  const $=id=>document.getElementById(id),n=(tag,text,css)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(css)e.className=css;return e;};
  let active='',archive=false,returnFocus=null,chapterPlaces=null,scope='chapter',query='',category='',area='';const layers={},enabled={},styleCache=new Map();
  const palette={transport:'#3f7b8a',trade:'#a15e43',garden:'#567947',museum:'#67628a',heritage:'#9b773a',people:'#9b536c'};
  const matches=f=>(!category||f.properties.category===category)&&(!area||f.properties.area===area)&&(!query||[f.properties.name,f.properties.category_label,f.properties.area,f.properties.description].join(' ').toLowerCase().includes(query));
  const inChapter=f=>scope==='all'||!chapterPlaces||chapterPlaces.has(f.id);
  const source=fc=>new ol.source.Vector({features:new ol.format.GeoJSON().readFeatures(fc,{featureProjection:'EPSG:3857'})});
  const tile=data.map.tiles,archival=new ol.layer.Tile({visible:false,extent:tile.extent,source:new ol.source.XYZ({url:tile.url,minZoom:tile.min_zoom,maxZoom:tile.max_zoom,attributions:'资料图 © UNESCO / 提交方 · S010 第4页'})});
  const view=new ol.View({center:ol.proj.fromLonLat([119.129,33.53]),zoom:16,minZoom:12,maxZoom:19});
  const grouping={water:['water','waterway'],land:['landuse','park','education','heritage_area'],buildings:['building'],streets:['street']};
  const colors={water:['#b5d6de','#79afba'],waterway:['#b5d6de','#79afba'],park:['#d1dfce','#afc5ae'],education:['#e4dec9','#c4b994'],heritage_area:['#e5d5ca','#b99987'],building:['#d7dfdb','#b5c3bd'],landuse:['#e2e8df','#c3d0c9'],street:['#fafbf7','#bdcbc8']};
  function vectorStyle(f,resolution){
    const kind=f.get('kind'),name=f.get('name'),tags=f.get('tags')||{},named=f.get('named');
    const showName=named&&(kind!=='street'||resolution<5),key=f.getId()+':'+showName;
    if(!styleCache.has(key)){
      let [fill,stroke]=colors[kind];if(kind==='landuse'&&tags.landuse==='residential')fill='#e6ebe3';
      const text=showName?new ol.style.Text({text:name,font:'11px "Microsoft YaHei",sans-serif',placement:kind==='street'||kind==='waterway'?'line':'point',overflow:false,fill:new ol.style.Fill({color:kind==='water'||kind==='waterway'?'#285461':'#3e5545'}),stroke:new ol.style.Stroke({color:'#ffffffee',width:3}),padding:[2,3,2,3]}):undefined;
      styleCache.set(key,new ol.style.Style({fill:kind==='street'||kind==='waterway'?undefined:new ol.style.Fill({color:fill}),stroke:new ol.style.Stroke({color:stroke,width:kind==='waterway'?3:kind==='street'?(tags.highway==='primary'||tags.highway==='secondary'?4:1.6):1}),text}));
    }
    return styleCache.get(key);
  }
  for(const [key,kinds] of Object.entries(grouping)){
    enabled[key]=true;layers[key]=new ol.layer.Vector({source:source({type:'FeatureCollection',features:data.atlas.features.filter(f=>kinds.includes(f.properties.kind))}),declutter:true,style:vectorStyle,
      properties:{atlasGroup:key},attributions:'© OpenStreetMap contributors · ODbL-1.0'});
  }
  // Attribution belongs to the source in OpenLayers.
  for(const layer of Object.values(layers))layer.getSource().setAttributions?.('© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors · ODbL</a>');
  const pointLayer=new ol.layer.Vector({source:source(data.places),declutter:true,style:f=>{
    const raw=data.places.features.find(p=>p.id===f.getId());
    if(f.getId()!==active&&(!matches(raw)||!inChapter(raw)))return null;
    const selected=f.getId()===active,uncertain=!f.get('coordinate_crs'),color=palette[f.get('category')]||'#9e5d43';
    return new ol.style.Style({zIndex:selected?30:20,image:new ol.style.Circle({radius:selected?12:7,fill:new ol.style.Fill({color:selected?color:'#fffef9'}),stroke:new ol.style.Stroke({color,width:2.5,lineDash:uncertain?[3,3]:undefined})}),text:new ol.style.Text({text:f.get('name'),font:(selected?'bold ':'')+'11px "Microsoft YaHei",sans-serif',offsetY:selected?-28:-20,padding:[4,5,4,5],backgroundFill:new ol.style.Fill({color:'#fffffff0'}),fill:new ol.style.Fill({color}),stroke:new ol.style.Stroke({color:'#fff',width:2})})});
  }});
  const map=new ol.Map({target:'story-map',layers:[archival,layers.land,layers.water,layers.streets,layers.buildings,pointLayer],view,controls:ol.control.defaults.defaults({rotate:false})});
  // The detailed local snapshots cover individual neighborhoods. At city scale,
  // ordinary online OSM tiles supply geographic continuity, never historical evidence.
  const regional=typeof ol.source.OSM==='function'?new ol.layer.Tile({source:new ol.source.OSM(),opacity:.48,zIndex:-1,visible:false}):null;
  if(regional){map.addLayer(regional);view.on('change:resolution',()=>regional.setVisible(!archive&&view.getZoom()<15));}
  const updateMapSize=()=>map.updateSize();
  window.addEventListener('resize',updateMapSize);
  if(typeof ResizeObserver==='function')new ResizeObserver(updateMapSize).observe($('story-map'));
  function coordinateText(f){const p=f.properties,c=f.geometry.coordinates;return (p.coordinate_crs?'经度 '+c[0].toFixed(6)+' · 纬度 '+c[1].toFixed(6)+' ｜ '+p.coordinate_crs:p.name+' · 地点图文')+(p.capture_time?'\n全景记录时间：'+p.capture_time:'');}
  function photoLabel(media){
    const kind=media.photo_kind;
    if(kind==='neighborhood_environment_only')return '街巷环境参考 · 非单体';
    if(kind==='exterior_detail')return '外观局部 · 屋脊细部';
    if(kind==='named_heritage_site_reference')return '遗产设施资料照';
    if(kind==='town_aerial_environment')return '街区整体环境资料图';
    if(kind==='street_environment'||kind==='street_aerial_environment')return '街巷环境资料图';
    if(kind?.startsWith('park_')||kind?.startsWith('lake_'))return '滨水环境资料图';
    if(kind==='food')return '饮食资料图';
    if(kind==='historical_map')return '古图录影 · 未配准';
    if(kind==='historical_distribution')return '文献分布示意 · 非精确定位';
    if(kind==='heritage_plaque')return '保护标志 / 匾额资料图';
    if(kind==='heritage_detail')return '遗址 / 碑刻细部';
    if(kind==='memorial_structure')return '纪念景观资料照';
    if(kind==='document_photo')return '报纸所载照片';
    if(kind==='panorama_face')return '官方全景 · 局部视角';
    if(kind==='map_excerpt')return '现势位置图 · 非实景照片';
    if(kind==='interior')return '室内 / 展陈资料照';
    return '外观 / 院落资料照';
  }
  function image(e,caption,media){e.src=media.url;e.alt=media.caption;e.width=media.width;e.height=media.height;e.decoding='async';e.onerror=()=>{caption.textContent='图片暂不可用，可从下方原始来源查看。';};caption.textContent=[media.caption,media.note,media.photo_date_note,media.publication_date?'页面发布：'+media.publication_date:''].filter(Boolean).join(' · ');}
  function open({title,description,media,mediaList=[],coordinate,fields=[],sources=[],panorama}){
    const dialog=$('atlas-dialog');returnFocus=document.activeElement;
    const photos=mediaList.length?mediaList:media?[media]:[];media=photos[0];
    dialog.style.width='min('+(media?Math.min(840,Math.max(560,media.width+56)):760)+'px, calc(100vw - 32px))';
    $('atlas-dialog-title').textContent=title;$('atlas-dialog-description').textContent=description||media?.intro||'';
    $('atlas-dialog-figure').hidden=!media;if(media){
      image($('atlas-dialog-photo'),$('atlas-dialog-caption'),media);
      $('atlas-dialog-photo-kind').textContent=photoLabel(media);$('atlas-dialog-photo-kind').dataset.reference=String(media.photo_kind==='neighborhood_environment_only');
      $('atlas-dialog-original').href=media.url;
    }
    if($('atlas-photo-pager')){
      let index=0;const update=()=>{const m=photos[index];image($('atlas-dialog-photo'),$('atlas-dialog-caption'),m);$('atlas-dialog-photo-kind').textContent=photoLabel(m);$('atlas-dialog-photo-kind').dataset.reference=String(m.photo_kind==='neighborhood_environment_only');$('atlas-dialog-original').href=m.url;$('atlas-photo-count').textContent=(index+1)+' / '+photos.length;$('atlas-photo-prev').disabled=index===0;$('atlas-photo-next').disabled=index===photos.length-1;};
      $('atlas-photo-pager').hidden=photos.length<2;
      $('atlas-photo-prev').onclick=()=>{if(index>0){index--;update();}};$('atlas-photo-next').onclick=()=>{if(index<photos.length-1){index++;update();}};if(photos.length)update();
    }
    $('atlas-dialog-coordinates').textContent=coordinate||'';
    const dl=$('atlas-dialog-fields');dl.replaceChildren();for(const [k,v] of fields)dl.append(n('dt',k),n('dd',String(v??'未提供')));
    const links=$('atlas-dialog-sources');links.replaceChildren();
    for(const sid of [...new Set([...sources,...photos.map(m=>m.source_id)])]){const a=n('a','查看资料 '+sid+' →');a.href=ui.evidence(sid);links.append(a);}
    for(const url of [...new Set(photos.map(m=>m.source_url).filter(Boolean))]){const a=n('a','图片原始页面 ↗');a.href=url;a.target='_blank';a.rel='noopener';links.append(a);}
    $('atlas-dialog-panorama').hidden=!panorama;if(panorama){$('atlas-dialog-panorama').href=panorama;$('atlas-dialog-panorama').target='_blank';$('atlas-dialog-panorama').rel='noopener';}
    dialog.showModal();
  }
  function openPlace(id){const f=data.places.features.find(f=>f.id===id);if(!f)return;const p=f.properties;
    open({title:p.name,description:p.description,media:p.appearance,mediaList:p.appearances||[],coordinate:coordinateText(f),fields:[['片区',p.area],['阅读类型',p.category_label]],sources:p.source_ids,panorama:p.panorama_url});}
  function move(id,animate=true,zoom){
    const f=data.places.features.find(f=>f.id===id);if(!f)return;active=id;const center=ol.proj.fromLonLat(f.geometry.coordinates),z=zoom||f.properties.preferred_zoom||(id==='qingjiang'?16.8:17);
    view.cancelAnimations();const prev=view.getCenter();if(!prev||Math.hypot(prev[0]-center[0],prev[1]-center[1])>1||Math.abs(view.getZoom()-z)>.01)view.animate({center,zoom:z,duration:animate&&!ui.reduceMotion?350:0});
    pointLayer.changed();$('story-map-place').textContent=f.properties.name;$('story-place-coordinate').textContent=coordinateText(f);
    $('story-place-title').textContent=f.properties.name;
    const uncertain=!f.properties.coordinate_crs;
    $('story-coordinate-kind').textContent=uncertain?(f.properties.panorama_url?'全景拍摄点':'公开百科参考'):f.properties.geometry_role==='provider_poi_converted_reference'?'公开 POI · 地点参考':'现势地图参考 · WGS84';
    $('story-coordinate-kind').dataset.uncertain=String(uncertain);
    $('story-photo-kind').textContent=photoLabel(f.properties.appearance);
    $('story-place-card').dataset.orientation=f.properties.appearance.height>f.properties.appearance.width?'portrait':'landscape';
    image($('story-place-photo'),$('story-place-caption'),f.properties.appearance);$('story-place-intro').textContent=f.properties.description;
    document.querySelectorAll('.atlas-place').forEach(b=>{b.classList.toggle('active',b.dataset.id===id);b.setAttribute('aria-pressed',String(b.dataset.id===id));});
    updateVisibleCount();
  }
  map.on('singleclick',e=>map.forEachFeatureAtPixel(e.pixel,f=>{
    if(archive)return;
    const id=f.getId(),place=data.places.features.find(p=>p.id===id);
    if(place){ui.selectPlace(id);openPlace(id);return true;}
    const raw=data.atlas.features.find(p=>p.id===id);if(!raw)return;
    const p=raw.properties,link=data.places.features.find(pf=>pf.id===p.place_id);
    open({title:p.name,description:p.description+(link?' '+link.properties.description:''),media:link?.properties.appearance,
      coordinate:'要素坐标：WGS84 / EPSG:4326；实际边界节点可下载 GeoJSON 查阅。',
      fields:[['地理要素',p.category_label],['OSM 对象','way / '+p.osm_id],['版本',p.osm_version],['编辑时间',p.osm_timestamp],['原始用途',p.tags.landuse||p.tags.leisure||p.tags.natural||p.tags.waterway||p.tags.building||p.tags.highway||'未单独标注']],sources:p.source_ids});return true;
  },{hitTolerance:6}));
  for(const [key,label] of [['water','水域 / 水道'],['land','用地 / 绿地'],['buildings','建筑'],['streets','街道']]){
    const b=n('button',label,'atlas-layer');b.setAttribute('aria-pressed','true');b.onclick=()=>{enabled[key]=!enabled[key];layers[key].setVisible(!archive&&enabled[key]);b.setAttribute('aria-pressed',String(enabled[key]));};$('atlas-layer-controls').append(b);
  }
  function updateVisibleCount(){const count=data.places.features.filter(f=>(matches(f)&&inChapter(f))||f.id===active).length;$('atlas-visible-count').textContent=archive?'资料图模式 · 现势地点已隐藏':(scope==='all'?'全图':'本章')+'显示 '+count+' / '+data.places.features.length+' 处'+(category||area||query?' · 已筛选，保留当前选点':'');}
  function fitPlaces(){const fs=data.places.features.filter(f=>matches(f)&&inChapter(f));if(!fs.length)return;const cs=fs.map(f=>f.geometry.coordinates),xs=cs.map(c=>c[0]),ys=cs.map(c=>c[1]);view.cancelAnimations();view.fit(ol.proj.transformExtent([Math.min(...xs)-.0004,Math.min(...ys)-.0004,Math.max(...xs)+.0004,Math.max(...ys)+.0004],'EPSG:4326','EPSG:3857'),{padding:[42,40,42,40],maxZoom:17,duration:ui.reduceMotion?0:280});}
  function renderDirectory(){const fs=data.places.features.filter(matches),list=$('atlas-place-list');list.replaceChildren();
    $('atlas-place-results').textContent=fs.length+' / '+data.places.features.length+' 处 · 点击图文卡片定位';
    for(const f of fs){const p=f.properties,b=n('button',undefined,'atlas-place');b.dataset.id=f.id;b.classList.toggle('active',active===f.id);b.setAttribute('aria-pressed',String(active===f.id));
      const img=n('img');img.src=p.appearance.url;img.alt=p.appearance.caption;img.loading='lazy';img.decoding='async';img.width=72;img.height=54;
      const text=n('span');text.append(n('strong',p.name),n('small',p.area+' · '+p.category_label));b.append(img,text);b.style.borderLeftColor=palette[p.category];
      b.onclick=()=>{ui.selectPlace(f.id);openPlace(f.id);$('atlas-directory').open=false;};list.append(b);}
    if(!fs.length)list.append(n('p','没有匹配地点，可清空筛选后继续沿河寻找。','atlas-empty'));
    pointLayer.changed();updateVisibleCount();
  }
  function setScope(next,fit=true){scope=next;$('atlas-scope-chapter').setAttribute('aria-pressed',String(scope==='chapter'));$('atlas-scope-all').setAttribute('aria-pressed',String(scope==='all'));pointLayer.changed();updateVisibleCount();if(fit){if(archive)setArchive(false);fitPlaces();}ui.scopeChanged?.();}
  for(const [id,key,title] of [['atlas-place-area','area','全部片区'],['atlas-place-category','category','全部类型']]){
    const select=$(id),values=new Map(data.places.features.map(f=>[f.properties[key],key==='area'?f.properties.area:f.properties.category_label]));
    const option=n('option',title);option.value='';select.append(option);for(const [value,label] of values){const o=n('option',label);o.value=value;select.append(o);}
    select.onchange=()=>{if(key==='area')area=select.value;else category=select.value;if(archive)setArchive(false);setScope('all',false);renderDirectory();fitPlaces();};
  }
  $('atlas-place-search').oninput=()=>{query=$('atlas-place-search').value.trim().toLowerCase();if(archive)setArchive(false);setScope('all',false);renderDirectory();};
  $('atlas-place-clear').onclick=()=>{query=category=area='';$('atlas-place-search').value=$('atlas-place-category').value=$('atlas-place-area').value='';renderDirectory();fitPlaces();};
  $('atlas-scope-all').onclick=()=>setScope('all');$('atlas-scope-chapter').onclick=()=>{query=category=area='';$('atlas-place-search').value=$('atlas-place-category').value=$('atlas-place-area').value='';renderDirectory();setScope('chapter');};
  renderDirectory();
  function setArchive(on){archive=on;archival.setVisible(on);regional?.setVisible(!on&&view.getZoom()<15);for(const [key,l] of Object.entries(layers))l.setVisible(!on&&enabled[key]);pointLayer.setVisible(!on);
    updateMapSize();
    $('atlas-modern-mode').setAttribute('aria-pressed',String(!on));$('atlas-archive-mode').setAttribute('aria-pressed',String(on));
    const tag=$('story-map-tag');tag.replaceChildren();if(on)tag.textContent='2016 资料图 · 现代要素已隐藏';else{tag.textContent='';for(const [key,label] of [...new Map(data.places.features.map(f=>[f.properties.category,f.properties.category_label]))]){const mark=n('span','● '+label);mark.style.color=palette[key];tag.append(mark);}}
    $('atlas-mode-note').textContent=on?'阅读2016资料图；返回现势矢量可查看地点。':'浅蓝为水域，浅绿为绿地 / 居住用地，米黄为教育用地，灰色为建筑；点击要素查看名称与类型。';
    if(on){$('story-coordinate-kind').textContent='2016 资料图';$('story-coordinate-kind').dataset.uncertain='true';view.cancelAnimations();view.fit(ol.proj.transformExtent([118.69,33.025,119.185,33.646],'EPSG:4326','EPSG:3857'),{padding:[20,20,20,20],duration:0});}
    else move(active,false,data.places.features.find(f=>f.id===active)?.properties.preferred_zoom||(active==='qingjiang'?16.8:ui.zoom()));
    updateVisibleCount();
  }
  $('atlas-modern-mode').onclick=()=>setArchive(false);$('atlas-archive-mode').onclick=()=>setArchive(true);
  $('atlas-dialog-close').onclick=()=>$('atlas-dialog').close();$('story-place-open').onclick=()=>openPlace(active);
  $('atlas-dialog').addEventListener?.('close',()=>{if(returnFocus?.isConnected!==false)returnFocus?.focus?.();});
  $('atlas-dialog').addEventListener?.('click',e=>{if(e.target!==$('atlas-dialog'))return;const rect=$('atlas-dialog').getBoundingClientRect?.();if(rect&&(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom))$('atlas-dialog').close();});
  setArchive(false);
  return {move,openPlace,open,image,photoLabel,coordinateText,filterPlaces:ids=>{chapterPlaces=new Set(ids);pointLayer.changed();updateVisibleCount();},scope:()=>scope,setScope,modern:()=>{if(archive)setArchive(false);},map,view};
}};
