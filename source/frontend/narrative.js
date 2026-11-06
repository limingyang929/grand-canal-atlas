'use strict';
(async function(){
  const $=id=>document.getElementById(id),core=window.CanalEvolutionCore;
  const node=(tag,text,css)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(css)e.className=css;return e;};
  const localHistory='https://zx.huaian.gov.cn/col/14069_277241/art/17645184/1764558503453z8jJ0s1w.html';
  // Editorial chapters select existing, filtered evidence; they do not create historical geometries.
  const chapters=[
    {id:'water',word:'通',short:'开河设闸',title:'先让一条水路通起来',time:'1415年起 · 明代',era:'ha_ming',area:'清江浦',ids:['T001','T002','T003'],focus:'T001',
      lead:'城市的故事，先从船能不能通过开始。',
      paragraphs:['1415年，清江浦开河、设闸。河道承担通航，闸口调节水势。运送货物所需要的，首先是一条能够行船的水路。','明万历年间，越河开挖与中洲形成又给这片河岸带来变化。接下来，把目光从河道转向闸前：船若停下来，岸上会发生什么？'],
      thread:['开河','设闸控水','提供通航条件'],change:'这一幕看运输条件的形成。地图上的地点帮助定位，今天可见的闸体与街区不等同于1415年的完整面貌。'},
    {id:'waiting',word:'停',short:'候闸生意',title:'船在等闸，岸上开了门',time:'清代 · 清江大闸与中洲',era:'ha_qing_early_mid',area:'清江浦',ids:['T061','T004','T034'],focus:'T004',
      lead:'一段被耽搁的旅程，成了岸边人的生意。',quote:'欢船待放闸，系妾门前柳。',quoteCredit:'清 · 盛锦《中洲曲》；据淮安地方文史转引',quoteUrl:localHistory,
      paragraphs:['盛锦写的等待，有门前的柳，也有船上与岸上的人。地方文史进一步记述：商船漕艘停靠候闸，附近居民在岛上和堤岸建起客栈、酒楼、茶社，逐渐形成经营与休憩的场所。','这里能读到一条具体联系：通航节点带来停留需求，停留又联系住宿、饮食与交往。邻近的石码头街还留下了交通服务经营的记述，把水路与岸上的往来接在一起。'],
      thread:['候闸停泊','住宿与饮食','岸边经营与休憩'],change:'相较开河这一幕，阅读重点从水上工程转到岸边经营。虚线连接清江闸与中洲的参考位置，示意文史所述的活动联系。',relation:'R01'},
    {id:'gathering',word:'聚',short:'盐商会馆',title:'货物聚到岸上，人也聚来',time:'明清时期 · 与清江浦并读的河下支线',era:'ha_qing_early_mid',area:'河下',ids:['T050','T051','T046'],focus:'T050',
      lead:'换到河下，看交易之外，人们怎样组织自己的生活。',literary:'LIT-HUANG-MERCHANT',
      paragraphs:['河下的资料记述了盐业集散、检验抽税与分销，也记述了商人为维护同乡利益而建立会馆。货物流转与商人组织，在同一个运河城镇中相遇。','这是一条与清江浦候闸经营并行的支线：码头服务旅途中的停留，会馆联系经营者和同乡，萧湖则留下游赏活动的记述。它们让“商业繁华”有了不同的社会空间。'],
      thread:['集散与交易','同乡组织','游赏与交往'],change:'本幕与前一幕存在时期重叠，是空间上的换场。把盐业、会馆和游赏并读是项目综合解释；不同会馆的行业与成员需要分别理解。'},
    {id:'garden',word:'雅',short:'河务园林',title:'治水的人，也把书院留在城里',time:'1678年、1750年 · 清代清江浦的并行支线',era:'ha_qing_early_mid',area:'清江浦',ids:['T026','T062','T027'],focus:'T027',
      lead:'运河的文化影响，也沿着管理者的活动进入园林。',
      paragraphs:['清江浦承担河务管理。资料记述靳辅迁驻于此，又记述1750年河道总督高斌主持荷芳书院建造。这里能看到一条有具名人物和年代的联系：河务管理者参与了园林书院的营建。','与河下的商人会馆相比，这是另一类文化空间。商业往来、河务组织、园林营建各有主体，却共同构成了运河城市里超出装卸与交易的生活。'],
      thread:['河务管理','委建书院','园林文化空间'],change:'仍在清代，地图回到清江浦。此处展示河务与园林的具名联系，不把同一时代的所有文化活动归为同一个成因。'},
    {id:'public',word:'变',short:'公共生活',title:'一处河岸，容纳更多人生',time:'1853—1929年的记述 · 晚清民国',era:'ha_transition',area:'清江浦',ids:['T006','T020','T021','T028'],focus:'T020',
      lead:'钟声之外，还有救济、学堂和向公众打开的园林。',quote:'百八慈云钟，声声与肠断。',quoteCredit:'清 · 盛锦《中洲曲》；据淮安地方文史转引',quoteUrl:localHistory,
      paragraphs:['盛锦诗里的慈云钟，把人的情感带进水岸。翻到后来的记述，同一寺院又有新的用途：1904年办粥厂赈济，1906年举办警察学堂。宗教处所也曾容纳公共服务。','中洲1853年的栖贫所、清晏园1929年转为城南公园，则从另外两个地点补充了这幅图景。沿河生活有相遇与消费，也有困顿、救济、学习和公共游憩。'],
      thread:['既有处所','赈济与办学','公共生活用途'],change:'这次变化发生在用途上。点击1904年和1906年的记录，地图停在同一处，故事却不同；同址出现过的活动分别保留年份。'},
    {id:'working',word:'运',short:'码头转变',title:'水路继续运输，重心也会改变',time:'1958—1963年的记述 · 生产与公共生活',era:'ha_1949_1978',area:'清江浦',ids:['T038','T039','T009'],focus:'T009',archival:{url:'./assets/narrative/zhongzhou-1975.jpg',caption:'1975年里运河中洲岛（来源图注）',context:'同一时期的岸线旧影，非1963年事件现场',source_url:localHistory},
      lead:'一条河的历史，也包括新的桥和逐渐改变角色的码头。',
      paragraphs:['水门桥的记录从1958年木便桥开工，写到1960年建设钢筋混凝土大桥。船在水上行，桥把两岸的日常往来连接起来。','1963年新增码头投产后，中洲码头的装卸量及其在市区码头中的地位发生变化。沿河经济并非始终向一个地点集中，新的运输设施也会改变旧码头的角色。'],
      thread:['新设施投用','运输分工改变','旧码头角色变化'],change:'发展包含重心转变。这里以具体工程与码头记述说明变化，不把现有资料条数画成货运增长或人口增长。'},
    {id:'renewal',word:'续',short:'修复延续',title:'旧河岸，并没有只剩回忆',time:'20世纪80—90年代 · 改革开放后',era:'ha_1978_2000',area:'清江浦',ids:['T010','T024','T025','T031','T044'],focus:'T010',archival:{url:'./assets/narrative/zhongzhou-1980s.jpg',caption:'20世纪80年代的中洲岛俯拍照（来源图注）',context:'历史照片，具体拍摄日未载',source_url:localHistory},
      lead:'货船仍来，寺院与园林也开始修复。',
      paragraphs:['20世纪80年代的资料仍记述中洲承担货船停靠与联运任务。运输生活在延续，河岸的其他用途也在展开。','慈云寺有1986年批复修复开放、1990年冬开始全面修复的记述；清晏园在80年代整修，楚秀园在1989年以新名称开放。把这些地点一起看，可以读到生产、修复与公共游憩的并存。'],
      thread:['运输延续','寺院园林修复','公共游憩展开'],change:'本幕展示同时期的多种活动。批复、开工与开放各有自己的含义，记录按原有表述呈现。'},
    {id:'today',word:'今',short:'河岸新生',title:'货运的岸，成为讲故事的岸',time:'2003—2015年的记述 · 21世纪',era:'ha_2000_present',area:'清江浦',ids:['T011','T012','T013','T015','T033','T037'],focus:'T011',
      lead:'旧仓库相关地段有了新楼，街巷又迎来今天的生活。',quote:'别欢河南堤，思欢河北岸。',quoteCredit:'清 · 盛锦《中洲曲》；据淮安地方文史转引',quoteUrl:localHistory,
      paragraphs:['2003年，中洲岛原货运仓库相关地段建起清江浦楼；随后有中洲公园、博物馆群与清江浦记忆馆的建设记述。码头记忆被放进展览，水岸增加了被观看和被讲述的方式。','花街2011年的改造引入老字号与传统手工艺店铺，御码头美食街又有2014年的改造记述。运河孕育的经营、交往与文化，在今天以展示、饮食和休闲等形式继续进入生活。'],
      thread:['货运地点的记忆','展馆与街区更新','今天的消费与游赏'],change:'回看开篇：从水路条件、候闸经营到不同类型的公共与文化空间，运河的影响有延续，也有转用。今日照片展示今天，不代替清代街景。'}
  ];
  try{
    const responses=await Promise.all([fetch('/api/culture-evolution/huaian'),fetch('/api/cultural-atlas')]);
    if(responses.some(r=>!r.ok))throw Error('河岸资料接口暂不可用');
    const [raw,atlas]=await Promise.all(responses.map(r=>r.json())),data=core.presentation(raw);
    const assertions=new Map(data.assertions.map(a=>[a.id,a])),sites=new Map(data.sites.map(s=>[s.id,s])),entities=new Map(data.entities.map(e=>[e.id,e])),references=new Map(data.display_references.features.map(f=>[f.id,f]));
    for(const c of chapters){c.rows=c.ids.map(id=>assertions.get(id)).filter(Boolean);if(!c.rows.length)throw Error('本幕资料尚未就绪');}
    let index=0,selected='',playing=false,timer=0,started=0,photo=null;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const map=window.CanalEvolutionMap.create(data,atlas,sid=>{const a=chapters[index].rows.find(a=>a.site_id===sid);if(a){stop();select(a.id);}},props=>{$('narrative-feature').textContent=[props.name||'地理要素',props.category_label||props.kind,props.description].filter(Boolean).join(' · ');});
    map.setMotion(!reduced.matches);
    const relationSource=new ol.source.Vector(),relationLayer=new ol.layer.Vector({source:relationSource,zIndex:7,style:[new ol.style.Style({stroke:new ol.style.Stroke({color:'#fafbf7cc',width:8})}),new ol.style.Style({stroke:new ol.style.Stroke({color:'#976a32',width:3,lineDash:[7,7]})})]});map.map.addLayer(relationLayer);
    function evidenceUrl(sid){return './evidence.html?'+new URLSearchParams({source:sid});}
    function urlForChapter(c){const url=new URL(location.href);url.search='';url.searchParams.set('chapter',c.id);return url.pathname+url.search;}
    function setProgress(value){$('chapter-progress-fill').style.transform='scaleX('+value+')';document.querySelector('.chapter-progress').setAttribute('aria-valuenow',String(Math.round(value*100)));}
    function stop(message){playing=false;clearInterval(timer);timer=0;setProgress(0);$('chapter-play').textContent='播放河岸故事';$('chapter-play').setAttribute('aria-pressed','false');$('narrative-play-status').textContent=message||'已暂停 · 可选地点、看大图或继续读';}
    function readIndex(){const id=new URLSearchParams(location.search).get('chapter');return Math.max(0,chapters.findIndex(c=>c.id===id));}
    function select(id){const c=chapters[index],a=c.rows.find(a=>a.id===id)||c.rows[0];selected=a.id;const site=sites.get(a.site_id),ref=references.get(site.current_place_ref),p=ref.properties;photo=a.id===c.focus&&c.archival?c.archival:(p.appearances||[p.appearance]).find(Boolean);$('chapter-photo-fallback').hidden=true;$('chapter-photo').hidden=!photo;$('chapter-photo-open').disabled=!photo;
      if(photo){$('chapter-photo').src=photo.url;$('chapter-photo').alt=photo.caption;$('chapter-photo-caption').textContent=photo.caption+' · '+(photo.context||'地点资料图，非本幕历史场景复原');$('chapter-photo-source').href=photo.source_url;$('chapter-photo-source').hidden=!photo.source_url;}
      else{$('chapter-photo-caption').textContent='地点资料图暂缺';$('chapter-photo-source').hidden=true;}
      const coords=ref.geometry.coordinates;$('narrative-feature').textContent=site.name+' · 当前参考位置 '+coords.map(n=>Number(n).toFixed(5)).join('，');
      map.setRows(c.rows,a.site_id,true,a.id);$('chapter-dossier').href='./story.html?'+new URLSearchParams({scope:'all',place:site.current_place_ref,step:a.function_codes.includes('culture')?'culture':a.function_codes.includes('heritage')?'survival':'waterway'});
      $('chapter-explore').href='./evolution.html?'+new URLSearchParams({era:c.era,area:c.area,event:a.id});
      document.querySelectorAll('[data-record]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.record===a.id)));
    }
    function render(push=false){const c=chapters[index];if(push&&location.search!==new URL(urlForChapter(c),location.origin).search)history.pushState(null,'',urlForChapter(c));
      $('chapter-position').textContent='第'+(index+1)+'幕 / 共'+chapters.length+'幕';$('chapter-prev').disabled=index===0;$('chapter-next').disabled=index===chapters.length-1;
      for(const b of $('river-chapters').children){const current=b.dataset.chapter===c.id;if(current)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}
      $('chapter-time').textContent=c.time;$('chapter-title').textContent=c.title;$('chapter-lead').textContent=c.lead;$('chapter-area').textContent=c.area;
      $('chapter-quote').replaceChildren();const lit=c.literary&&data.literary_excerpts.find(q=>q.id===c.literary),quote=c.quote||lit?.text_display;
      $('chapter-quote').hidden=!quote;if(quote){const credit=node('p',c.quoteCredit||(lit.author+' · '+lit.work_title+'；据地方文史转引')),link=node('a','阅读引文出处');link.href=c.quoteUrl||lit.source_url;link.target='_blank';link.rel='noopener';$('chapter-quote').append(node('blockquote','“'+quote+'”'),credit,link);}
      $('chapter-prose').replaceChildren(...c.paragraphs.map(p=>node('p',p)));$('chapter-thread').replaceChildren(...c.thread.map(t=>node('li',t)));$('chapter-change').textContent=c.change;
      $('chapter-records').replaceChildren();for(const a of c.rows){const item=node('div',undefined,'chapter-record'),b=node('button');b.type='button';b.dataset.record=a.id;b.append(node('span',entities.get(a.entity_id).name),node('small',a.time.text));b.onclick=()=>{stop();select(a.id);};item.append(b,node('p',a.claim));for(const ev of a.evidence){const source=data.sources[ev.source_id],link=node('a',source?.title||'查阅相关资料');link.href=evidenceUrl(ev.source_id);link.onclick=()=>stop();item.append(link);}$('chapter-records').append(item);}
      const ids=[...new Set(c.rows.map(a=>a.site_id))];$('chapter-map-count').textContent='本幕关联 '+ids.length+' 处地点';relationSource.clear();
      if(c.relation){const r=data.relations.find(r=>r.id===c.relation);if(r){const coords=[r.from_id,r.to_id].map(id=>entities.get(id)?.site_id).map(id=>sites.get(id)?.current_place_ref).map(id=>references.get(id)?.geometry.coordinates).filter(Boolean);if(coords.length===2&&coords[0].join(',')!==coords[1].join(','))relationSource.addFeature(new ol.Feature({geometry:new ol.geom.LineString(coords.map(c=>ol.proj.fromLonLat(c)))}));}}
      select(c.focus);map.fit(ids);$('chapter-records').scrollTop=0;
      const next=chapters[index+1];if(next){const a=next.rows.find(a=>a.id===next.focus)||next.rows[0],site=sites.get(a.site_id),image=next.archival||references.get(site.current_place_ref)?.properties.appearance;if(image){const preload=new Image();preload.src=image.url;}}
      if(playing)$('narrative-play-status').textContent='正在播放 · '+c.title+' · 每幕10秒';
      window.dispatchEvent(new CustomEvent('canal:chapterchange',{detail:{chapter:c.id}}));
    }
    function go(i,push=true){index=Math.max(0,Math.min(chapters.length-1,i));render(push);}
    for(const c of chapters){const b=node('button');b.type='button';b.dataset.chapter=c.id;b.setAttribute('aria-label',c.short+'：'+c.title);b.append(node('span',c.word,'chapter-word'),node('span',c.short,'chapter-short'));b.onclick=()=>{stop();go(chapters.indexOf(c));};$('river-chapters').append(b);}
    $('chapter-prev').onclick=()=>{stop();go(index-1);};$('chapter-next').onclick=()=>{stop();go(index+1);};
    $('chapter-play').onclick=()=>{if(playing){stop();return;}if(index===chapters.length-1)go(0);playing=true;started=performance.now();$('chapter-play').textContent='暂停故事';$('chapter-play').setAttribute('aria-pressed','true');$('narrative-play-status').textContent='正在播放 · '+chapters[index].title+' · 每幕10秒';timer=setInterval(()=>{const p=(performance.now()-started)/10000;setProgress(Math.min(1,p));if(p>=1){if(index===chapters.length-1){stop('八幕读完了 · 可自由探索时空地图');return;}go(index+1,false);history.replaceState(null,'',urlForChapter(chapters[index]));started=performance.now();setProgress(0);}},100);};
    $('chapter-fit').onclick=()=>{stop();map.fit([...new Set(chapters[index].rows.map(a=>a.site_id))]);};
    $('chapter-share').onclick=async()=>{stop();try{const url=new URL(urlForChapter(chapters[index]),location.origin);await navigator.clipboard.writeText(url.href);$('narrative-play-status').textContent='本幕链接已复制，可在这台电脑的浏览器打开';}catch{$('narrative-play-status').textContent='请复制浏览器地址栏中的本幕链接';}};
    $('chapter-photo').onerror=()=>{$('chapter-photo-fallback').hidden=false;$('chapter-photo').hidden=true;};
    $('chapter-photo-open').onclick=()=>{stop();if(!photo)return;$('narrative-photo-title').textContent=photo.caption;$('narrative-large-photo').src=photo.url;$('narrative-large-photo').alt=photo.caption;$('narrative-large-caption').textContent=$('chapter-photo-caption').textContent;$('narrative-photo-dialog').showModal();};$('narrative-photo-close').onclick=()=>$('narrative-photo-dialog').close();
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop('已暂停 · 回来后可继续播放');});reduced.addEventListener?.('change',()=>{map.setMotion(!reduced.matches);if(reduced.matches)stop();});
    window.addEventListener('popstate',()=>{stop();go(readIndex(),false);});
    $('narrative-experience').hidden=false;$('narrative-status').hidden=true;index=readIndex();render(false);history.replaceState(null,'',urlForChapter(chapters[index]));
    window.CanalNarrative={chapters:()=>chapters.map(c=>({id:c.id,era:c.era,area:c.area,ids:c.rows.map(a=>a.id)})),state:()=>({chapter:chapters[index].id,index,selected,playing}),stop,map};
  }catch(error){$('narrative-status').replaceChildren(document.createTextNode('河岸故事暂未载入：'+error.message+'。 '));const retry=node('button','重新加载'),link=node('a','先打开时空演进');retry.onclick=()=>location.reload();link.href='./evolution.html';$('narrative-status').append(retry,document.createTextNode(' '),link);}
})();
