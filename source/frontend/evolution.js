'use strict';
(async function(){
  const $=id=>document.getElementById(id),core=window.CanalEvolutionCore;
  const node=(tag,text,css)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(css)e.className=css;return e;};
  try{
    const responses=await Promise.all([fetch('/api/culture-evolution/huaian'),fetch('/api/cultural-atlas'),fetch('./assets/data/canal-spread.json')]);
    if(responses.some(r=>!r.ok))throw Error('地图资料接口暂不可用');
    const [rawData,atlas,spreadData]=await Promise.all(responses.map(r=>r.json())),data=core.presentation(rawData);
    const entities=new Map(data.entities.map(e=>[e.id,e])),sites=new Map(data.sites.map(s=>[s.id,s]));
    const assertions=new Map(data.assertions.map(a=>[a.id,a])),relations=new Map(data.relations.map(r=>[r.id,r]));
    const places=new Map(data.display_references.features.map(f=>[f.id,f])),mediaQuery=matchMedia('(prefers-reduced-motion: reduce)');
    let state,rows=[],selected=null,photos=[],photoIndex=0,player,rendering=false,hasInitialView=false,initializing=true;
    const eraLabels=['明代','清前中期','晚清民国','生产与公共生活','改革开放后','21世纪'];
    function readState(){
      const p=new URLSearchParams(location.search),fallback=data.scenes.find(s=>s.id===data.default_scene_id);
      const value={era:p.get('era')||fallback.era_id,area:p.get('area')||'清江浦',functionCode:p.get('function')||'',caseId:p.get('case')||'',event:p.get('event')||'',locked:p.get('locked')==='1',motion:p.get('motion')!=='0'&&!mediaQuery.matches,view:p.get('view')||''};
      if(!data.eras.some(e=>e.id===value.era))value.era=fallback.era_id;
      if(!['清江浦','河下','淮安古城'].includes(value.area))value.area='清江浦';
      if(value.functionCode&&!data.functions.some(f=>f.id===value.functionCode))value.functionCode='';
      const c=data.same_site_cases.find(c=>c.id===value.caseId);if(!c)value.caseId='';else value.area=sites.get(c.site_id).area;
      return value;
    }
    state=readState();
    function params(){const p=new URLSearchParams({era:state.era,area:state.area});for(const [key,value] of [['function',state.functionCode],['case',state.caseId],['event',state.event],['view',state.view]])if(value)p.set(key,value);p.set('motion',state.motion?'1':'0');if(state.locked)p.set('locked','1');return p;}
    function updateUrl(push=false){if(initializing||window.CanalSpread?.isActive())return;const url='?'+params();if(url!==location.search)history[push?'pushState':'replaceState'](null,'',url);$('nav-evidence').href=evidenceLink('S096');document.querySelectorAll('[data-evidence-source]').forEach(a=>{a.href=evidenceLink(a.dataset.evidenceSource);});}
    function evidenceLink(sid){const p=params();p.set('context','evolution');p.set('source',sid);return './evidence.html?'+p;}
    function stop(){player?.stop();}
    function sourceLink(sid){const a=node('a','资料 '+sid+' ↗');a.dataset.evidenceSource=sid;a.href=evidenceLink(sid);a.addEventListener('click',stop);return a;}
    const map=window.CanalEvolutionMap.create(data,atlas,sid=>{const a=rows.find(a=>a.site_id===sid);if(a)selectEvent(a.id);},props=>{const tags=props.tags||{};$('feature-info').textContent=[props.name||'未命名要素',props.category_label||props.kind,props.description,'OSM '+props.osm_id,tags.landuse||tags.leisure||tags.waterway||tags.building].filter(Boolean).join(' · ');});
    map.map.on('moveend',()=>{if(!rendering&&!window.CanalSpread?.isActive()){state.view=map.getView().join(',');updateUrl();}});
    for(const f of data.functions){const o=node('option',f.label);o.value=f.id;$('function').append(o);const key=node('span');const dot=node('i','●');dot.style.color=f.color;key.append(dot,document.createTextNode(f.label));$('map-legend').append(key);}
    for(const c of data.same_site_cases){const o=node('option',c.title.split('：')[0]);o.value=c.id;$('case').append(o);}
    data.eras.forEach((era,i)=>{const b=node('button');b.type='button';b.dataset.era=era.id;b.append(node('small',era.end_year?String(era.start_year)+'—'+String(era.end_year-1):era.start_year+'年以后'),node('strong',eraLabels[i]));b.onclick=()=>{stop();setEra(era.id,true);};$('era-tabs').append(b);});
    $('area').onchange=()=>{stop();state.area=$('area').value;state.caseId='';state.event='';state.view='';render(true,true);};
    $('function').onchange=()=>{stop();state.functionCode=$('function').value;state.event='';render(true,false);};
    $('case').onchange=()=>{stop();state.caseId=$('case').value;state.event='';state.functionCode='';const c=data.same_site_cases.find(c=>c.id===state.caseId);if(c){state.area=sites.get(c.site_id).area;state.locked=true;}state.view='';render(true,true);};
    $('locked').onchange=()=>{state.locked=$('locked').checked;updateUrl(true);};
    $('motion').onchange=()=>{state.motion=$('motion').checked&&!mediaQuery.matches;map.setMotion(state.motion);updateUrl(true);};
    function respectMotion(){if(mediaQuery.matches)state.motion=false;$('motion').checked=state.motion;$('motion').disabled=mediaQuery.matches;map.setMotion(state.motion&&!window.CanalSpread?.isActive());updateUrl();}
    mediaQuery.addEventListener?.('change',respectMotion);
    $('reset-view').onclick=()=>map.fit([...new Set(rows.map(a=>a.site_id))]);
    function setEra(id,push){state.era=id;state.event='';render(push,!state.locked);}
    function nextEra(offset,push=true){const i=data.eras.findIndex(e=>e.id===state.era),j=Math.max(0,Math.min(data.eras.length-1,i+offset));setEra(data.eras[j].id,push);}
    $('era-prev').onclick=()=>{stop();nextEra(-1);};$('era-next').onclick=()=>{stop();nextEra(1);};
    const eraName=id=>eraLabels[data.eras.findIndex(e=>e.id===id)];
    player=window.CanalEraPlayer.create({getEras:()=>data.eras.filter(e=>core.rows(data,{...state,era:e.id}).length).map(e=>e.id),getCurrent:()=>state.era,onAdvance:id=>setEra(id,false),
      onProgress:value=>{$('play-progress-fill').style.transform='scaleX('+value+')';$('play-progress').setAttribute('aria-valuenow',String(Math.round(value*100)));},
      onStatus:status=>{$('play').textContent=status.playing?'暂停播放':'播放时代';$('play').setAttribute('aria-pressed',String(status.playing));$('era-tabs').classList.toggle('is-playing',status.playing);$('play-status').textContent=status.playing?'正在播放 · '+eraName(status.era)+(status.next?' → '+eraName(status.next):' · 最后一幕'):status.reason==='complete'?'播放结束 · 可再次从头观看':status.reason==='single'?'当前选项仅有一个时代，试试全部活动':'已暂停 · '+eraName(status.era);}});
    $('play').onclick=()=>{if(player.isPlaying()){stop();return;}player.start();if(player.isPlaying()&&matchMedia('(min-width:931px)').matches)$('scene-title').scrollIntoView({behavior:state.motion?'smooth':'auto',block:'start'});};
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    $('share-state').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('share-state').textContent='链接已复制';}catch{$('share-state').textContent='可复制地址栏链接';}setTimeout(()=>{$('share-state').textContent='复制当前链接';},2200);};
    function selectEvent(id){stop();state.event=id;render(true,false);}
    function photo(){const m=photos[photoIndex];$('event-figure').hidden=!m;if(!m)return;$('event-photo').src=m.url;$('event-photo').alt=m.caption;$('event-photo-caption').textContent=m.caption+' · 地点资料配图';$('photo-count').textContent=(photoIndex+1)+' / '+photos.length;$('photo-prev').disabled=photoIndex===0;$('photo-next').disabled=photoIndex===photos.length-1;}
    $('photo-prev').onclick=()=>{stop();if(photoIndex>0){photoIndex--;photo();}};$('photo-next').onclick=()=>{stop();if(photoIndex<photos.length-1){photoIndex++;photo();}};
    $('event-photo').onerror=()=>{$('event-photo-caption').textContent='图片暂未载入，可继续从资料依据查看原始页面。';};
    $('open-photo').onclick=()=>{stop();const m=photos[photoIndex];if(!m)return;$('photo-dialog-title').textContent=m.caption;$('large-photo').src=m.url;$('large-photo').alt=m.caption;$('large-photo-caption').textContent=$('event-photo-caption').textContent;$('photo-dialog').showModal();};
    $('close-photo').onclick=()=>$('photo-dialog').close();
    function detail(a){
      $('event-extra').replaceChildren();$('event-sources').replaceChildren();photos=[];photoIndex=0;
      $('event-detail').hidden=!a;if(!a){photo();return;}
      const entity=entities.get(a.entity_id),site=sites.get(a.site_id),ref=places.get(site.current_place_ref),p=ref.properties;
      $('event-title').textContent=entity.name;$('event-time').textContent=a.time.text;$('event-claim').textContent=a.claim;
      $('event-state').textContent=a.time.type==='point'?'时代事件':'时期记述';
      photos=p.appearances||[p.appearance];photo();const c=ref.geometry.coordinates;
      $('event-coordinate').hidden=!p.coordinate_crs;$('event-coordinate').textContent=p.coordinate_crs?site.name+' · 地点参考\n经度 '+c[0].toFixed(6)+' / 纬度 '+c[1].toFixed(6):'';
      for(const ev of a.evidence)$('event-sources').append(sourceLink(ev.source_id));
      for(const id of a.literary_ids||[]){const q=data.literary_excerpts.find(q=>q.id===id);if(!q)continue;const box=node('div',undefined,'literary-card');box.append(node('strong',[q.author,q.work_title].filter(Boolean).join(' · ')),node('p','“'+(q.text_display||q.text_original)+'”'),sourceLink(q.source_id));$('event-extra').append(box);}
      $('open-dossier').hidden=false;$('open-dossier').href='./story.html?'+new URLSearchParams({step:a.function_codes.includes('culture')?'culture':'waterway',place:site.current_place_ref,scope:'all'});$('open-dossier').onclick=stop;
    }
    function renderRelations(scene){
      $('relation-list').replaceChildren();const caseInfo=data.same_site_cases.find(c=>c.id===state.caseId),ids=caseInfo?.relation_ids||scene?.relation_ids||[];
      for(const id of ids){const r=relations.get(id),b=node('button',undefined,'relation');const labels={source_documented:'来源明确记述',project_interpretation:'项目综合解释',co_occurrence:'同地记述'};b.append(node('strong',entities.get(r.from_id).name+' → '+entities.get(r.to_id).name),node('span',r.explanation),node('small',labels[r.evidence_level]+' · '+r.evidence.map(e=>e.source_id).join(' / ')));b.onclick=()=>{const a=rows.find(a=>r.assertion_ids.includes(a.id)&&a.entity_id===r.to_id)||rows.find(a=>r.assertion_ids.includes(a.id));if(a)selectEvent(a.id);else{$('feature-info').textContent=r.explanation+' · 本期没有可定位的对应节点，参见'+r.evidence.map(e=>e.source_id).join('、');stop();}};$('relation-list').append(b);}
      if(!ids.length)$('relation-list').append(node('p','选择地图上的地点，或从下方生活脉络继续阅读这一时代的故事。'));
    }
    function renderMatrix(){
      const head=$('function-matrix').querySelector('thead'),body=$('function-matrix').querySelector('tbody');head.replaceChildren();body.replaceChildren();
      const hr=node('tr');hr.append(node('th',state.area));for(const f of data.functions){const th=node('th',f.label);th.scope='col';th.style.borderBottom='3px solid '+f.color;hr.append(th);}head.append(hr);
      data.eras.forEach((era,i)=>{const tr=node('tr'),th=node('th',eraLabels[i]);th.scope='row';tr.append(th);for(const f of data.functions){
        const matching=core.rows(data,{era:era.id,area:state.area,functionCode:f.id,caseId:''}),unique=matching.filter((a,i,list)=>list.findIndex(b=>b.entity_id===a.entity_id)===i),td=node('td');
        if(!unique.length){td.append(node('span','—','matrix-blank'));tr.append(td);continue;}
        const label=a=>entities.get(a.entity_id).name.replace(/记述|历史设施|及历次工程|的交通与经营/g,''),b=node('button',undefined,'matrix-story');
        for(const a of unique.slice(0,2)){const item=node('span',undefined,'matrix-item');item.append(node('strong',label(a)),node('small',a.time.text.split(/[；，]/)[0].replace('概括','')));b.append(item);}
        if(unique.length>2)b.append(node('span','另有'+(unique.length-2)+'项内容 →','matrix-more'));
        b.title=unique.map(a=>a.time.text+' '+label(a)).join('；');b.setAttribute('aria-label',eraLabels[i]+' '+f.label+'：'+unique.map(label).join('、'));b.setAttribute('aria-pressed',String(state.era===era.id&&state.functionCode===f.id));
        b.onclick=()=>{stop();state.era=era.id;state.functionCode=f.id;state.caseId='';state.event=matching[0].id;render(true,!state.locked);$('scene-title').scrollIntoView({behavior:state.motion?'smooth':'auto',block:'start'});};td.append(b);tr.append(td);
      }body.append(tr);});
    }
    function renderCases(){
      $('same-site-timeline').replaceChildren();for(const c of data.same_site_cases){const section=node('section',undefined,'same-case');section.append(node('h3',c.title),node('p',c.note));const list=node('ol');for(const id of c.assertion_ids){const a=assertions.get(id),li=node('li'),b=node('button');b.append(node('strong',a.time.text),document.createTextNode(a.claim));b.onclick=()=>{stop();state.caseId=c.id;state.area=sites.get(c.site_id).area;state.era=a.era_ids[0];state.event=a.id;state.functionCode='';state.locked=true;render(true,true);$('evolution-map').scrollIntoView({behavior:state.motion?'smooth':'auto',block:'center'});};li.append(b);list.append(li);}section.append(list);$('same-site-timeline').append(section);}
    }
    function render(push=false,fit=false){
      rendering=true;rows=core.rows(data,state);const scene=core.scene(data,state),fixed=data.same_site_cases.find(c=>c.id===state.caseId);
      if(!state.event&&scene)state.event=scene.assertion_ids.find(id=>rows.some(a=>a.id===id))||'';
      selected=core.chooseEvent(rows,state.event);state.event=selected?.id||'';
      const era=data.eras.find(e=>e.id===state.era),eraIndex=data.eras.indexOf(era),dated=rows.filter(a=>a.time.type==='point').length;
      if(!player?.isPlaying())$('play-status').textContent='当前 · '+eraLabels[eraIndex]+' · 点击播放每4秒推进';
      $('area').value=state.area;$('function').value=state.functionCode;$('case').value=state.caseId;$('locked').checked=state.locked;$('motion').checked=state.motion;$('motion').disabled=mediaQuery.matches;
      $('era-prev').disabled=eraIndex===0;$('era-next').disabled=eraIndex===data.eras.length-1;
      document.querySelectorAll('#era-tabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.era===state.era)));
      const rail=$('era-tabs'),bookmark=rail.querySelector('[aria-pressed="true"]');
      if(bookmark&&rail.scrollWidth>rail.clientWidth)rail.scrollTo({left:Math.max(0,bookmark.offsetLeft-rail.offsetLeft-(rail.clientWidth-bookmark.offsetWidth)/2),behavior:'auto'});
      $('scene-kicker').textContent=era.label+' / '+state.area;$('scene-title').textContent=fixed?.title||scene?.title||state.area+'的活动与用途';
      $('scene-question').textContent=scene?.question||'选择本期记录，比较地点、功能与有依据的变化。';
      $('scene-reading').textContent=fixed?.note||scene?.reading||'在所选时代与片区中阅读记录，活动类别和时间精度分别标注。';
      $('coverage-status').textContent=rows.length+'段故事 · '+new Set(rows.map(a=>a.site_id)).size+'处沿河地点';$('map-period').textContent=eraLabels[eraIndex]+' · '+state.area;
      $('event-count').textContent=rows.length+'条记录';$('event-list').replaceChildren();
      for(const a of rows){const b=node('button',undefined,'event-card');b.setAttribute('aria-pressed',String(a.id===state.event));b.append(node('small',a.time.text),node('strong',entities.get(a.entity_id).name),node('span',a.claim));b.onclick=()=>selectEvent(a.id);$('event-list').append(b);}
      $('empty-state').hidden=rows.length>0;$('empty-state').textContent='换一个时代或活动，继续阅读沿河故事。';
      detail(selected);renderRelations(scene);renderMatrix();map.setMotion(state.motion);map.setRows(rows,selected?.site_id,Boolean(selected),selected?.id);
      if(fit)map.fit(rows.length?[...new Set(rows.map(a=>a.site_id))]:data.sites.filter(s=>s.area===state.area).map(s=>s.id));
      rendering=false;updateUrl(push);
    }
    $('experience').hidden=false;$('load-status').textContent='';$('load-status').hidden=true;
    render(false,false);renderCases();hasInitialView=map.restoreView(state.view);if(!hasInitialView)map.fit([...new Set(rows.map(a=>a.site_id))]);
    window.CanalSpread=window.CanalSpreadPlayer.create({data,sequence:spreadData,atlasMap:map,onMode:on=>{stop();if(on){map.setRows([],'',false);map.setMotion(false);}else render(false,true);},onSelect:a=>{state.event=a.id;state.area=a.area;state.era=a.era_ids[0];detail(a);}});
    initializing=false;if(!window.CanalSpread.isActive())updateUrl();
    window.addEventListener('popstate',()=>{stop();state=readState();if(window.CanalSpread.restoreFromUrl())return;render(false,false);if(!map.restoreView(state.view))map.fit([...new Set(rows.map(a=>a.site_id))]);});
    window.CanalEvolution={state:()=>({...state}),data,selectEra:id=>setEra(id,true),selectEvent,stop};
  }catch(error){$('load-status').hidden=false;$('load-status').textContent='时空资料暂未就绪：'+error.message+'。可先从顶部运河图志继续阅读。';}
})();
