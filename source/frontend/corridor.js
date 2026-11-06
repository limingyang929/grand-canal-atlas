'use strict';
(async function(){
 const $=id=>document.getElementById(id),node=(tag,text,css)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(css)e.className=css;return e;};
 const colors={transport:'#277c8e',trade:'#a15e43',garden:'#567947',public:'#917442',people:'#985b76',museum:'#696393'};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 try{
  const responses=await Promise.all([fetch('./assets/data/canal-corridor.geojson'),fetch('./assets/data/corridor-land.geojson')]);
  if(responses.some(r=>!r.ok))throw Error('沿线资料暂未就绪');
  const [data,land]=await Promise.all(responses.map(r=>r.json())),all=data.features,byId=new Map(all.map(f=>[f.id,f])),format=new ol.format.GeoJSON();
  const p=new URLSearchParams(location.search);let city=p.get('city')||'',category=p.get('theme')||'',query=p.get('q')||'',selected=p.get('place')||'',page=0,visible=[],photo=null,backgroundTicket=0;
  const cityNames=[...new Set(all.map(f=>f.properties.city))].sort((a,b)=>{const lat=c=>all.filter(f=>f.properties.city===c).reduce((n,f)=>n+f.geometry.coordinates[1],0)/all.filter(f=>f.properties.city===c).length;return lat(b)-lat(a);});
  if(!cityNames.includes(city))city='';if(!data.categories[category])category='';
  const byCity=new Map(cityNames.map(c=>[c,all.filter(f=>f.properties.city===c)]));
  const source=new ol.source.Vector(),clusters=new ol.source.Cluster({distance:34,minDistance:16,source}),selectedSource=new ol.source.Vector(),localSource=new ol.source.Vector(),citySource=new ol.source.Vector(),lineSource=new ol.source.Vector();
  const landLayer=new ol.layer.Vector({source:new ol.source.Vector({features:format.readFeatures(land,{featureProjection:'EPSG:3857'}),attributions:'Natural Earth · Public domain'}),style:new ol.style.Style({fill:new ol.style.Fill({color:'#e9eee8'}),stroke:new ol.style.Stroke({color:'#a9c3c9',width:1})})});
  const localStyles=new Map();
  const localLayer=new ol.layer.Vector({source:localSource,declutter:true,style:(f,res)=>{const kind=f.get('kind'),show=res<9&&f.get('name'),key=kind+':'+show+':'+(show?f.get('name'):'');if(!localStyles.has(key))localStyles.set(key,new ol.style.Style({fill:['water','park','culture'].includes(kind)?new ol.style.Fill({color:kind==='water'?'#b5d6de':kind==='park'?'#d1dfce':'#ded9cc'}):undefined,stroke:new ol.style.Stroke({color:kind==='water'||kind==='waterway'?'#79afba':kind==='street'?'#b8c7c2':'#c1cdbf',width:kind==='waterway'?2.5:kind==='street'?1.8:.7}),text:show?new ol.style.Text({text:f.get('name'),font:'11px "Microsoft YaHei",sans-serif',placement:kind==='street'||kind==='waterway'?'line':'point',fill:new ol.style.Fill({color:'#526975'}),stroke:new ol.style.Stroke({color:'#f5f8f2',width:3})}):undefined}));return localStyles.get(key);}});
  const flowLayer=new ol.layer.Vector({source:lineSource,style:new ol.style.Style({stroke:new ol.style.Stroke({color:'#5a9aa58a',width:2,lineDash:[5,8]})})});
  const cityLayer=new ol.layer.Vector({source:citySource,declutter:true,style:(f,res)=>res>150?new ol.style.Style({text:new ol.style.Text({text:f.get('name'),font:'13px "Microsoft YaHei",sans-serif',offsetY:-25,fill:new ol.style.Fill({color:'#234b58'}),stroke:new ol.style.Stroke({color:'#f8fbf5',width:4})})}):undefined});
  const pointLayer=new ol.layer.Vector({source:clusters,style:f=>{const list=f.get('features')||[],count=list.length,color=count===1?colors[list[0].get('category')]||'#277c8e':'#277c8e';return new ol.style.Style({image:new ol.style.Circle({radius:count===1?7:Math.min(24,12+Math.log2(count)*2),fill:new ol.style.Fill({color:count===1?'#fafbf7':'#277c8eeb'}),stroke:new ol.style.Stroke({color:count===1?color:'#fafbf7',width:count===1?2.5:2})}),text:count>1?new ol.style.Text({text:String(count),font:'bold 12px "Microsoft YaHei",sans-serif',fill:new ol.style.Fill({color:'#fff'})}):undefined,zIndex:10});}});
  const selectedLayer=new ol.layer.Vector({source:selectedSource,declutter:true,style:f=>new ol.style.Style({image:new ol.style.Circle({radius:11,fill:new ol.style.Fill({color:colors[f.get('category')]||'#277c8e'}),stroke:new ol.style.Stroke({color:'#fafbf7',width:3})}),text:new ol.style.Text({text:f.get('name'),font:'bold 12px "Microsoft YaHei",sans-serif',offsetY:-27,padding:[5,7,5,7],backgroundFill:new ol.style.Fill({color:'#fafbf7f2'}),fill:new ol.style.Fill({color:'#833e33'}),stroke:new ol.style.Stroke({color:'#fafbf7',width:2})}),zIndex:30})});
  clusters.setAttributions('© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors · ODbL</a>');
  source.setAttributions('© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors · ODbL</a>');
  const view=new ol.View({center:ol.proj.fromLonLat([117.4,34.8]),zoom:5.5,minZoom:4,maxZoom:19});
  const map=new ol.Map({target:'corridor-map',view,layers:[landLayer,localLayer,flowLayer,pointLayer,cityLayer,selectedLayer],controls:ol.control.defaults.defaults({rotate:false})});
  new ResizeObserver(()=>map.updateSize()).observe($('corridor-map'));
  const backgrounds=new Map();
  async function loadBackground(name){const ticket=++backgroundTicket;localSource.clear();if(!name)return;const ids=[...new Set((byCity.get(name)||[]).map(f=>f.properties.region_id))].filter(Boolean);
   $('corridor-background-status').textContent='正在展开'+name+'的水系、街道与文化场所……';
   try{const features=(await Promise.all(ids.map(async id=>{if(!backgrounds.has(id))backgrounds.set(id,fetch(id==='huaian'?'/api/cultural-atlas':'./assets/data/corridor-'+id+'.geojson').then(r=>{if(!r.ok)throw Error('背景接口暂不可用');return r.json();}).catch(e=>{backgrounds.delete(id);throw e;}));return (await backgrounds.get(id)).features;}))).flat();
    if(ticket!==backgroundTicket)return;localSource.addFeatures(format.readFeatures({type:'FeatureCollection',features},{featureProjection:'EPSG:3857'}));$('corridor-background-status').textContent=name+' · 本地归档的当代水系、街道与场所；城市间虚线为导览示意。';
   }catch{if(ticket===backgroundTicket)$('corridor-background-status').textContent='地点与坐标已显示；本城局部背景暂未载入，可继续查阅来源。';}
  }
  function updateUrl(push=false){const q=new URLSearchParams();if(city)q.set('city',city);if(category)q.set('theme',category);if(query)q.set('q',query);if(selected)q.set('place',selected);const url=location.pathname+(q.size?'?'+q:'');if(url!==location.pathname+location.search)history[push?'pushState':'replaceState'](null,'',url);}
  function link(label,url){const a=node('a',label);a.href=url;if(/^https?:/.test(url)){a.target='_blank';a.rel='noopener';}return a;}
  function fact(label,value){if(value!==undefined&&value!==null&&value!=='')$('corridor-place-facts').append(node('dt',label),node('dd',String(value)));}
  function choose(id,zoom=false,push=true){const f=byId.get(id);if(!f)return;selected=id;const p=f.properties,t=p.tags||{},coord=f.geometry.coordinates;
   $('corridor-place-city').textContent=p.city+' · '+p.record_group;$('corridor-place-title').textContent=p.name;$('corridor-place-theme').textContent=p.category_label+' / '+p.relation_label;
   $('corridor-place-description').textContent=p.description||'';$('corridor-place-reading').textContent=p.canal_reading||p.reading_question||'';
   $('corridor-excerpt').hidden=!p.encyclopedia_excerpt||p.encyclopedia_excerpt===p.description;$('corridor-excerpt').textContent=p.encyclopedia_excerpt?'“'+p.encyclopedia_excerpt+'”':'';
   photo=p.photo||p.appearance;$('corridor-place-figure').hidden=!photo;
   if(photo){$('corridor-place-photo').src=photo.url;$('corridor-place-photo').alt=photo.caption||p.name;$('corridor-photo-caption').textContent=[photo.caption,photo.credit,photo.license].filter(Boolean).join(' · ');}
   $('corridor-place-facts').replaceChildren();fact('地点类型',p.category_label);fact('地图所记年代',p.start_date_as_reported);fact('地名别称',t.alt_name);fact('位置记述',[t['addr:street'],t['addr:housenumber']].filter(Boolean).join(' '));fact('宗教记述',({buddhist:'佛教',taoist:'道教',muslim:'伊斯兰教',christian:'基督宗教',confucian:'儒家'})[t.religion]||t.religion);fact('坐标性质',p.coordinate_role||p.coordinate_note);
   $('corridor-place-coordinate').textContent='经度 '+coord[0].toFixed(6)+' / 纬度 '+coord[1].toFixed(6)+(p.coordinate_crs?'\n'+p.coordinate_crs:'\n来源参考位置，基准说明见原图志');
   const links=$('corridor-place-sources');links.replaceChildren();if(p.source_url)links.append(link(p.record_group==='原有淮安图志'?'阅读淮安地点图志':'原始地图与对象记录',p.source_url));
   if(p.wikipedia){const i=p.wikipedia.indexOf(':'),language=i>0?p.wikipedia.slice(0,i):'zh',title=i>0?p.wikipedia.slice(i+1):p.wikipedia;links.append(link('百科资料与出处','https://'+language+'.wikipedia.org/wiki/'+encodeURIComponent(title)));}
   if(p.wikidata)links.append(link('Wikidata 数据条目','https://www.wikidata.org/wiki/'+p.wikidata));
   for(const item of p.detail_sources||[])links.append(link(item.title,item.url));if(photo?.source_url)links.append(link('图片出处与授权',photo.source_url));
   if(p.encyclopedia_excerpt){links.append(link('文字：维基百科贡献者',p.encyclopedia_url));links.append(link('文字授权 · CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'));}
   selectedSource.clear();selectedSource.addFeatures(format.readFeatures({type:'FeatureCollection',features:[f]},{featureProjection:'EPSG:3857'}));
   if(zoom){view.cancelAnimations();view.animate({center:ol.proj.fromLonLat(coord),zoom:16,duration:reduced.matches?0:320});loadBackground(p.city);}
   document.querySelectorAll('.corridor-item').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===id)));updateUrl(push);
  }
  function matches(f){const p=f.properties;return (!city||p.city===city)&&(!category||p.category===category)&&(!query||[p.name,p.city,p.category_label].join(' ').toLowerCase().includes(query.toLowerCase()));}
  function fit(){if(!visible.length)return;view.cancelAnimations();map.updateSize();const extent=ol.extent.boundingExtent(visible.map(f=>ol.proj.fromLonLat(f.geometry.coordinates)));view.fit(extent,{padding:[55,50,55,50],maxZoom:16,duration:reduced.matches?0:280});}
  function directory(){const pages=Math.max(1,Math.ceil(visible.length/20));page=Math.max(0,Math.min(pages-1,page));$('corridor-place-list').replaceChildren();for(const f of visible.slice(page*20,page*20+20)){const p=f.properties,b=node('button',undefined,'corridor-item');b.type='button';b.dataset.id=f.id;b.setAttribute('aria-pressed',String(f.id===selected));b.append(node('small',p.city+' · '+p.category_label),node('strong',p.name),node('span',p.start_date_as_reported?'地图所记年代 '+p.start_date_as_reported:'定位并阅读地点资料'));b.onclick=()=>{choose(f.id,true);$('corridor-map').scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'center'});};$('corridor-place-list').append(b);}
   if(!visible.length)$('corridor-place-list').append(node('p','没有匹配地点，请清空关键词或换一个城市。'));
   $('corridor-directory-count').textContent='当前 '+visible.length+' 处 / 全部 '+all.length+' 处';$('corridor-page-label').textContent=(page+1)+' / '+pages;$('corridor-page-prev').disabled=page===0;$('corridor-page-next').disabled=page===pages-1;
  }
  function render(zoom=true,push=true){visible=all.filter(matches);source.clear();source.addFeatures(format.readFeatures({type:'FeatureCollection',features:visible},{featureProjection:'EPSG:3857'}));citySource.clear();lineSource.clear();const cityCoords=[];
   for(const name of cityNames){const fs=visible.filter(f=>f.properties.city===name);if(!fs.length)continue;const center=[0,1].map(i=>fs.reduce((n,f)=>n+f.geometry.coordinates[i],0)/fs.length),coord=ol.proj.fromLonLat(center);cityCoords.push(coord);citySource.addFeature(new ol.Feature({geometry:new ol.geom.Point(coord),name}));}
   if(cityCoords.length>1)lineSource.addFeature(new ol.Feature({geometry:new ol.geom.LineString(cityCoords)}));
   $('corridor-city').value=city;$('corridor-category').value=category;$('corridor-search').value=query;$('corridor-results').textContent=visible.length+' 处地点 · '+new Set(visible.map(f=>f.properties.city)).size+' 座城市';
   for(const b of $('corridor-cities').children)b.setAttribute('aria-pressed',String(b.dataset.city===city));
   if(!visible.some(f=>f.id===selected)){selected=(visible.find(f=>f.properties.name==='拱宸桥')||visible.find(f=>f.properties.photo||f.properties.appearance)||visible[0])?.id||'';if(selected)choose(selected,false,false);else{selectedSource.clear();$('corridor-detail').hidden=true;}}
   $('corridor-detail').hidden=!visible.length;directory();if(zoom)fit();if(city)loadBackground(city);else{backgroundTicket++;localSource.clear();$('corridor-background-status').textContent='城市之间按阅读顺序串联，虚线为导览示意；选择城市展开当地水系与街道。';}updateUrl(push);
  }
  for(const name of cityNames){const o=node('option',name+'（'+byCity.get(name).length+'）');o.value=name;$('corridor-city').append(o);const b=node('button');b.type='button';b.dataset.city=name;b.append(node('span',name),node('small',String(byCity.get(name).length)));b.onclick=()=>{city=name;page=0;render();};$('corridor-cities').append(b);}
  for(const [key,label] of Object.entries(data.categories)){const o=node('option',label);o.value=key;$('corridor-category').append(o);const item=node('span'),dot=node('i');dot.style.background=colors[key];item.append(dot,document.createTextNode(label));$('corridor-legend').append(item);}
  $('corridor-city').onchange=()=>{city=$('corridor-city').value;page=0;render();};$('corridor-category').onchange=()=>{category=$('corridor-category').value;page=0;render();};
  $('corridor-filters').onsubmit=e=>e.preventDefault();$('corridor-search').oninput=()=>{query=$('corridor-search').value.trim();page=0;render(false,false);};$('corridor-search').onsearch=()=>{query=$('corridor-search').value.trim();page=0;render();};
  $('corridor-reset').onclick=()=>{city=category=query=selected='';page=0;render();};$('corridor-fit').onclick=fit;
  $('corridor-page-prev').onclick=()=>{page--;directory();};$('corridor-page-next').onclick=()=>{page++;directory();};
  map.on('singleclick',event=>{const f=map.forEachFeatureAtPixel(event.pixel,f=>f,{layerFilter:l=>l===pointLayer,hitTolerance:8});if(!f)return;const list=f.get('features');if(list.length===1)choose(list[0].getId(),true);else{const extent=ol.extent.boundingExtent(list.map(f=>f.getGeometry().getCoordinates()));view.cancelAnimations();view.fit(extent,{padding:[70,60,70,60],maxZoom:17,duration:reduced.matches?0:300});const names=[...new Set(list.map(f=>f.get('city')))];if(names.length===1)loadBackground(names[0]);}});
  map.on('pointermove',e=>{map.getTargetElement().style.cursor=map.hasFeatureAtPixel(e.pixel,{layerFilter:l=>l===pointLayer})?'pointer':'';});
  $('corridor-place-photo').onerror=()=>{$('corridor-place-figure').hidden=true;};$('corridor-photo-open').onclick=()=>{if(!photo)return;$('corridor-photo-title').textContent=photo.caption||$('corridor-place-title').textContent;$('corridor-large-photo').src=photo.url;$('corridor-large-photo').alt=photo.caption||'';$('corridor-large-caption').textContent=$('corridor-photo-caption').textContent;$('corridor-photo-dialog').showModal();};$('corridor-photo-close').onclick=()=>$('corridor-photo-dialog').close();
  window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.search);city=p.get('city')||'';category=p.get('theme')||'';query=p.get('q')||'';selected=p.get('place')||'';render(true,false);if(selected)choose(selected,false,false);});
  $('corridor-total').textContent='新增 '+data.new_points+' 处 · 原有淮安 '+data.existing_points+' 处 · 共 '+all.length+' 处地点，'+cityNames.length+' 座城市';$('corridor-experience').hidden=false;
  render(true,false);if(selected&&byId.has(selected))choose(selected,Boolean(p.get('place')),false);
  window.CanalCorridor={data,map,view,state:()=>({city,category,query,selected,visible:visible.map(f=>f.id),page}),select:id=>choose(id,true),fit};
 }catch(error){$('corridor-total').replaceChildren(document.createTextNode('地图暂未载入：'+error.message+'。 '));const retry=node('button','重新加载');retry.onclick=()=>location.reload();$('corridor-total').append(retry);}
})();
