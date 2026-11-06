'use strict';
window.CanalSpreadPlayer={create({data,sequence,atlasMap,onMode,onSelect}){
 const $=id=>document.getElementById(id),el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const assertions=new Map(data.assertions.map(a=>[a.id,a])),sites=new Map(data.sites.map(s=>[s.id,s])),entities=new Map(data.entities.map(e=>[e.id,e])),refs=new Map(data.display_references.features.map(f=>[f.id,f]));
 const colors={transport:'#217b89',trade:'#a66936',administration:'#466f99',public_life:'#927e37',culture:'#a8423b',heritage:'#5e7852'},labels=new Map(data.functions.map(f=>[f.id,f.label]));
 const {map,view}=atlasMap,mq=matchMedia('(prefers-reduced-motion: reduce)');
 let active=false,focus='riverbank',frames=[],index=0,playing=false,raf=0,started=0,entered=0,lastDraw=0,speed=3600,selected='',seenRows=[],pastSites=[],scopeSites=[],hits=[];
 const canvas=el('canvas');canvas.className='spread-canvas';canvas.setAttribute('aria-hidden','true');map.getViewport().append(canvas);canvas.hidden=true;
 const ctx=canvas.getContext('2d');let width=0,height=0;
 const scopes=[{id:'riverbank',name:'清江大闸与周围河岸',sites:sequence.riverbank_site_ids},{id:'all',name:'淮安全部发展地点',sites:[...sites.keys()]}];
 for(const site of data.sites){if(sequence.frames.some(f=>f.assertion_ids.some(id=>assertions.get(id)?.site_id===site.id)))scopes.push({id:site.id,name:site.name.replace('相关处所','').replace('相关片区',''),sites:[site.id]});}
 for(const s of scopes){const o=el('option',s.name);o.value=s.id;$('spread-focus').append(o);}
 function syncSize(){const size=map.getSize();if(!size)return;width=size[0];height=size[1];const ratio=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);canvas.style.width=width+'px';canvas.style.height=height+'px';}ctx.setTransform(ratio,0,0,ratio,0,0);}
 const coords=id=>refs.get(sites.get(id)?.current_place_ref)?.geometry.coordinates;
 const pixel=id=>{const c=coords(id);return c&&map.getPixelFromCoordinate(ol.proj.fromLonLat(c));};
 const name=id=>sites.get(id)?.name.replace('及相关水路','').replace('相关处所','').replace('相关片区','').replace('相关处所','')||id;
 function writeUrl(push=false){if(!active)return;const q=new URLSearchParams({mode:'spread',focus,frame:frames[index]?.id||'',record:selected});if(mq.matches)q.set('motion','0');const url=location.pathname+'?'+q;if(url!==location.pathname+location.search)history[push?'pushState':'replaceState'](null,'',url);}
 function stop(message){playing=false;cancelAnimationFrame(raf);raf=0;$('spread-play').textContent=index===frames.length-1?'重新播放':'播放发展';$('spread-play').setAttribute('aria-pressed','false');$('spread-progress').style.transform='scaleX(0)';$('spread-play-status').textContent=message||'已暂停 · 可拖动时间轴或点击节点';if(active)draw(performance.now());}
 function prepare(){
  const scope=scopes.find(s=>s.id===focus)||scopes[0];focus=scope.id;scopeSites=scope.sites.filter(id=>coords(id));
  frames=sequence.frames.map(f=>({...f,assertion_ids:f.assertion_ids.filter(id=>scopeSites.includes(assertions.get(id)?.site_id))})).filter(f=>f.assertion_ids.length);
  index=Math.max(0,Math.min(index,frames.length-1));$('spread-focus').value=focus;$('spread-range').max=String(Math.max(0,frames.length-1));$('spread-frame-rail').replaceChildren();
  for(const [i,f] of frames.entries()){const b=el('button');b.type='button';b.dataset.frame=f.id;b.append(el('small',f.label+(f.precision==='period'?' · 时期记述':'')),el('span',f.title));b.onclick=()=>{stop();step(i,true);};$('spread-frame-rail').append(b);}
  $('spread-range').disabled=frames.length<2;$('spread-play').disabled=frames.length<2;
 }
 function fit(){const cs=scopeSites.map(pixel);if(!cs.length)return;const points=scopeSites.map(coords).map(c=>ol.proj.fromLonLat(c));map.updateSize();view.cancelAnimations();view.fit(ol.extent.boundingExtent(points),{padding:[70,60,65,60],maxZoom:16.6,duration:mq.matches?0:300});}
 function select(id){const a=assertions.get(id);if(!a)return;selected=id;onSelect(a);const evidenceUrl=source=>'./evidence.html?'+new URLSearchParams({context:'evolution',mode:'spread',focus,frame:frames[index].id,record:selected,source});$('nav-evidence').href=evidenceUrl(a.evidence[0]?.source_id||'S096');document.querySelectorAll('[data-evidence-source]').forEach(link=>{link.href=evidenceUrl(link.dataset.evidenceSource);});$('spread-place-play').hidden=false;$('spread-place-play').textContent='单独回放'+name(a.site_id);$('spread-place-play').onclick=()=>{stop();focus=a.site_id;index=0;prepare();step(0,true);fit();};
  for(const b of $('spread-current-list').children)b.setAttribute('aria-pressed',String(b.dataset.assertion===id));entered=performance.now();requestDraw();
 }
 function step(i,push=false,syncUrl=true){if(!frames.length)return;index=Math.max(0,Math.min(i,frames.length-1));const f=frames[index];entered=performance.now();
  seenRows=frames.slice(0,index+1).flatMap(f=>f.assertion_ids).map(id=>assertions.get(id));pastSites=[...new Set(seenRows.map(a=>a.site_id))];
  $('spread-time').textContent=f.label;$('spread-time-kind').textContent=f.precision==='year'?'有年份的史事':'时期记述 · 不指定发生年份';$('spread-title').textContent=f.title;
  $('spread-description').textContent=focus.startsWith('SITE-')?'同一个地点，随时间读它的活动、机构与用途变化。':'从水运设施向岸上经营、公共生活和文化展示逐段展开，保留此前已读的地点。';
  $('spread-stat').textContent='已展开 '+pastSites.length+' 处地点 / '+seenRows.length+' 条资料';$('spread-range').value=String(index);$('spread-range').setAttribute('aria-valuetext',f.label+'，'+f.title);$('spread-position').textContent=(index+1)+' / '+frames.length;
  $('spread-start').textContent=frames[0].label;$('spread-end').textContent=frames.at(-1).label;$('map-period').textContent=f.label+' · '+(focus.startsWith('SITE-')?name(focus):'河岸发展');
  $('spread-prev').disabled=index===0;$('spread-next').disabled=index===frames.length-1;
  for(const [j,b] of [...$('spread-frame-rail').children].entries()){if(j===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');b.dataset.past=String(j<=index);}
  const rail=$('spread-frame-rail'),button=rail.children[index];if(button)rail.scrollLeft=Math.max(0,rail.scrollLeft+button.getBoundingClientRect().left-rail.getBoundingClientRect().left-(rail.clientWidth-button.clientWidth)/2);
  $('spread-current-list').replaceChildren();for(const id of f.assertion_ids){const a=assertions.get(id),b=el('button');b.type='button';b.dataset.assertion=id;b.append(el('small',a.time.text+' · '+name(a.site_id)),el('strong',entities.get(a.entity_id).name),el('span',a.claim));b.onclick=()=>{stop();select(id);writeUrl(true);};$('spread-current-list').append(b);}
  const functions=[...new Set(seenRows.flatMap(a=>a.function_codes))],currentFunctions=new Set(f.assertion_ids.flatMap(id=>assertions.get(id).function_codes));$('spread-thread').replaceChildren();for(const code of functions){const n=el('span',labels.get(code)||code);n.dataset.current=String(currentFunctions.has(code));n.style.borderColor=colors[code];$('spread-thread').append(n);}
  select(f.assertion_ids[0]);$('feature-info').textContent=focus.startsWith('SITE-')?'同址用途变化：地图保留同一个位置，时间轴展开不同事件。':'点击已展开的地点看介绍；浅色空心点是后续资料地点。';
  if(playing)$('spread-play-status').textContent='正在播放 · '+f.label+' · '+f.title;else{$('spread-play').textContent=index===frames.length-1?'重新播放':'播放发展';$('spread-play-status').textContent=frames.length===1?'此处收录一个时间节点，可切换地点继续阅读。':'拖动时间轴，或点击“播放发展”观看地点逐步展开';}
  if(syncUrl)writeUrl(push);requestDraw();
 }
 function curvePoint(a,b,bend,t){const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,c=[(a[0]+b[0])/2-dy/length*bend,(a[1]+b[1])/2+dx/length*bend];return [(1-t)*(1-t)*a[0]+2*(1-t)*t*c[0]+t*t*b[0],(1-t)*(1-t)*a[1]+2*(1-t)*t*c[1]+t*t*b[1]];}
 function curve(a,b,{solid=false,fresh=false,color='#70918b',bend=18,title=''},now){if(!a||!b||Math.hypot(a[0]-b[0],a[1]-b[1])<7)return;
  const progress=fresh&&!mq.matches?Math.min(1,(now-entered)/1300):1;ctx.save();ctx.beginPath();for(let j=0;j<=45*progress;j++){const c=curvePoint(a,b,bend,j/45);if(j===0)ctx.moveTo(...c);else ctx.lineTo(...c);}ctx.lineWidth=solid?3:1.25;ctx.setLineDash(solid?[]:[4,7]);
  if(solid){ctx.save();ctx.strokeStyle='#f7faf2dc';ctx.lineWidth=7;ctx.stroke();ctx.restore();const grad=ctx.createLinearGradient(...a,...b);grad.addColorStop(0,'#217b89');grad.addColorStop(.5,'#b58a4a');grad.addColorStop(1,color);ctx.strokeStyle=grad;ctx.lineWidth=3.5;ctx.shadowColor=color+'50';ctx.shadowBlur=7;}else ctx.strokeStyle='#8da69b90';ctx.stroke();ctx.setLineDash([]);ctx.shadowBlur=0;
  if(solid&&progress>0){const t=progress<1?progress:playing&&!mq.matches?(now%2600)/2600:1,c=curvePoint(a,b,bend,t);ctx.beginPath();ctx.arc(...c,3.5,0,Math.PI*2);ctx.fillStyle='#fffdf4';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=1.3;ctx.stroke();}
  if(title){const c=curvePoint(a,b,bend,.5);ctx.font='11px "Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#f0f5ed';ctx.strokeText(title,c[0],c[1]-7);ctx.fillStyle='#4d6d6f';ctx.fillText(title,c[0],c[1]-7);}ctx.restore();
 }
 function draw(now){if(!active)return;syncSize();ctx.clearRect(0,0,width,height);hits=[];const current=new Set(frames[index]?.assertion_ids),root=scopeSites.includes(sequence.root_site_id)?sequence.root_site_id:scopeSites[0],phase=mq.matches?1:Math.min(1,(now-entered)/1200);
  for(let j=1;j<pastSites.length;j++)curve(pixel(pastSites[j-1]),pixel(pastSites[j]),{fresh:current&&frames[index].assertion_ids.some(id=>assertions.get(id).site_id===pastSites[j]),bend:12},now);
  const seenIds=new Set(seenRows.map(a=>a.id));for(const rid of sequence.relation_ids){const r=data.relations.find(r=>r.id===rid);if(!r||r.evidence_level!=='source_documented'||!r.assertion_ids.every(id=>seenIds.has(id)))continue;const from=entities.get(r.from_id)?.site_id,to=entities.get(r.to_id)?.site_id;
   if(!pastSites.includes(from)||!pastSites.includes(to)||from===to)continue;curve(pixel(from),pixel(to),{solid:true,fresh:r.assertion_ids.some(id=>current.has(id)),bend:rid==='R02'?-38:32,color:rid==='R02'?'#917342':'#ad6734',title:rid==='R01'?'候闸与岸边经营':rid==='R02'?'过闸与船民信俗':''},now);}
  const pendingLabels=[];
  for(const sid of [...scopeSites.filter(id=>!pastSites.includes(id)),...pastSites.filter(id=>id!==assertions.get(selected)?.site_id),assertions.get(selected)?.site_id].filter((id,i,list)=>id&&list.indexOf(id)===i)){
   const c=pixel(sid);if(!c||c[0]<-70||c[1]<-40||c[0]>width+70||c[1]>height+40)continue;
   const records=seenRows.filter(a=>a.site_id===sid),shown=records.length>0,chosen=sid===assertions.get(selected)?.site_id,fresh=frames[index].assertion_ids.some(id=>assertions.get(id).site_id===sid),funcs=[...new Set(records.flatMap(a=>a.function_codes))],color=colors[(records.find(a=>a.id===selected)||records.at(-1))?.function_codes[0]]||'#217b89',radius=chosen?10:shown?7:4;
   ctx.save();if(shown&&(chosen||fresh)){ctx.beginPath();ctx.arc(...c,radius+9+(phase<1?phase*18:0),0,2*Math.PI);ctx.strokeStyle=color+(phase<1?'65':'45');ctx.fillStyle=color+'10';ctx.lineWidth=phase<1?2:1;ctx.fill();ctx.stroke();}
   ctx.beginPath();ctx.arc(...c,radius+2,0,Math.PI*2);ctx.fillStyle='#f6f9f2';ctx.fill();ctx.lineWidth=shown?2:1;ctx.strokeStyle=shown?color:'#9aafa7';ctx.stroke();ctx.beginPath();ctx.arc(...c,radius,0,Math.PI*2);ctx.fillStyle=shown?color:'#e8eee8';ctx.fill();
   if(chosen){ctx.beginPath();ctx.arc(...c,3,0,Math.PI*2);ctx.fillStyle='#fffdf6';ctx.fill();}
   if(funcs.length>1){const span=Math.PI*2/funcs.length;funcs.forEach((code,i)=>{ctx.beginPath();ctx.arc(...c,radius+5,span*i+.09,span*(i+1)-.09);ctx.strokeStyle=colors[code];ctx.lineWidth=2.5;ctx.stroke();});}
   if(shown){hits.push({site:sid,c,assertion:(records.find(a=>a.id===selected)||records.at(-1)).id});pendingLabels.push({sid,c,chosen,text:(sid===root?'起点 · ':'')+name(sid)});}
   ctx.restore();
  }
  const usedLabels=[],overlaps=(a,b)=>a[0]<b[0]+b[2]&&a[0]+a[2]>b[0]&&a[1]<b[1]+b[3]&&a[1]+a[3]>b[1];
  for(const item of pendingLabels.sort((a,b)=>Number(b.chosen)-Number(a.chosen)||Number(b.sid===root)-Number(a.sid===root))){
   const {c,chosen,text,sid}=item;ctx.save();ctx.font=(chosen?'bold ':'')+'12px "Microsoft YaHei",sans-serif';const w=ctx.measureText(text).width+12;
   const candidates=[[c[0]-w/2,c[1]-44,w,23],[c[0]+22,c[1]-12,w,23],[c[0]-w-22,c[1]-12,w,23],[c[0]-w/2,c[1]+25,w,23]];
   const rect=candidates.find(r=>r[0]>4&&r[1]>4&&r[0]+r[2]<width-4&&r[1]+r[3]<height-4&&!usedLabels.some(b=>overlaps(r,b))&&!hits.some(h=>h.site!==sid&&overlaps(r,[h.c[0]-15,h.c[1]-15,30,30])));
   if(rect){usedLabels.push(rect);ctx.fillStyle='#f7faf2f2';ctx.fillRect(...rect);ctx.fillStyle=chosen?'#a14637':'#315863';ctx.textAlign='center';ctx.fillText(text,rect[0]+w/2,rect[1]+16);}ctx.restore();
  }
 }
 function tick(now){raf=0;if(!active)return;if(playing){const progress=(now-started)/speed;$('spread-progress').style.transform='scaleX('+Math.min(1,progress)+')';if(progress>=1){if(index===frames.length-1){stop('播放结束 · 可以重新播放或选择其他地点');writeUrl();return;}step(index+1,false);started=now;}}
  if(now-lastDraw>30){draw(now);lastDraw=now;}if(playing||!mq.matches&&now-entered<1400)raf=requestAnimationFrame(tick);
 }
 function requestDraw(){if(active&&!raf)raf=requestAnimationFrame(tick);}
 function activate(on,push=false){if(active===on)return;stop();active=on;document.body.classList.toggle('is-spread-mode',on);canvas.hidden=!on;$('spread-heading').hidden=!on;$('spread-timeline').hidden=!on;$('spread-current-records').hidden=!on;$('spread-map-key').hidden=!on;$('spread-place-play').hidden=!on;
  $('mode-spread').setAttribute('aria-selected',String(on));$('mode-eras').setAttribute('aria-selected',String(!on));$('mode-spread').tabIndex=on?0:-1;$('mode-eras').tabIndex=on?-1:0;
  const previous=location.pathname+location.search;onMode(on);map.updateSize();if(on){prepare();step(index,false,false);fit();if(push)history.replaceState(null,'',previous);writeUrl(push);}else{cancelAnimationFrame(raf);raf=0;if(push){const q=new URLSearchParams(location.search);q.delete('focus');q.delete('frame');q.set('mode','eras');const target=location.pathname+'?'+q;history.replaceState(null,'',previous);history.pushState(null,'',target);}}
 }
 $('mode-spread').onclick=()=>activate(true,true);$('mode-eras').onclick=()=>activate(false,true);
 for(const b of [$('mode-spread'),$('mode-eras')])b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const on=e.key==='Home'||e.key==='ArrowLeft';activate(on,true);$(on?'mode-spread':'mode-eras').focus();}};
 $('spread-focus').onchange=()=>{stop();focus=$('spread-focus').value;index=0;prepare();step(0,true);fit();};
 $('spread-range').oninput=()=>{stop();step(Number($('spread-range').value),false,false);};$('spread-range').onchange=()=>writeUrl(true);
 $('spread-prev').onclick=()=>{stop();step(index-1,true);};$('spread-next').onclick=()=>{stop();step(index+1,true);};$('spread-fit').onclick=fit;
 $('spread-speed').onchange=()=>{speed=Number($('spread-speed').value);started=performance.now();};
 $('spread-play').onclick=()=>{if(playing){stop();return;}if(frames.length<2)return;step(index===frames.length-1?0:index+1,false);playing=true;started=performance.now();$('spread-play').textContent='暂停播放';$('spread-play').setAttribute('aria-pressed','true');$('spread-play-status').textContent='正在播放 · '+frames[index].label+' · '+frames[index].title;writeUrl();requestDraw();};
 $('spread-share').onclick=async()=>{stop();try{await navigator.clipboard.writeText(location.href);$('spread-play-status').textContent='当前节点链接已复制';}catch{$('spread-play-status').textContent='可复制浏览器地址栏中的当前节点链接';}};
 map.on('postrender',()=>{if(active)requestDraw();});new ResizeObserver(()=>{if(active){map.updateSize();requestDraw();}}).observe($('evolution-map'));
 map.on('singleclick',e=>{if(!active)return;const h=hits.map(h=>({...h,d:Math.hypot(h.c[0]-e.pixel[0],h.c[1]-e.pixel[1])})).filter(h=>h.d<20).sort((a,b)=>a.d-b.d)[0];if(h){stop();select(h.assertion);writeUrl(true);$('feature-info').textContent=name(h.site)+' · 点击右侧按钮可单独回放这里的用途变化。';}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){stop('已暂停 · 返回后可继续播放');view.cancelAnimations();}});mq.addEventListener('change',()=>{if(active){stop('动态效果设置已更新，可手动切换节点');draw(performance.now());}});
 document.addEventListener('click',e=>{if(active&&e.target.closest('#event-detail a,#event-detail button:not(#spread-place-play)'))stop();},true);
 function restoreFromUrl(){const p=new URLSearchParams(location.search),on=p.get('mode')==='spread'||!p.has('era')&&p.get('mode')!=='eras';if(!on){if(active)activate(false);$('mode-spread').setAttribute('aria-selected','false');$('mode-eras').setAttribute('aria-selected','true');$('mode-spread').tabIndex=-1;$('mode-eras').tabIndex=0;return false;}focus=scopes.some(s=>s.id===p.get('focus'))?p.get('focus'):'riverbank';index=0;prepare();const requested=frames.findIndex(f=>f.id===p.get('frame'));index=Math.max(0,requested);if(!active)activate(true);else{stop();step(index);fit();}if(seenRows.some(a=>a.id===p.get('record'))){select(p.get('record'));writeUrl();}return true;}
 restoreFromUrl();
 return {isActive:()=>active,restoreFromUrl,stop,state:()=>({active,focus,index,frame:frames[index]?.id,playing,selected,visibleSites:[...pastSites],assertionIds:seenRows.map(a=>a.id),frames:frames.map(f=>({id:f.id,label:f.label,year:f.year,precision:f.precision,assertion_ids:f.assertion_ids}))}),selectFrame:i=>{stop();step(i,true);},draw:()=>draw(performance.now()),map,view};
}};
