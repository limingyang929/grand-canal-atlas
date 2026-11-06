'use strict';
(async function(){
 const host=document.getElementById('corridor-related');if(!host)return;
 const themes={water:'transport',waiting:'trade',gathering:'trade',garden:'garden',public:'public',working:'trade',renewal:'museum',today:'museum'};
 let chapter=new URLSearchParams(location.search).get('chapter')||'water';
 const res=await fetch('./assets/data/canal-corridor.geojson');if(!res.ok)return;const data=await res.json();
 function render(){
  const theme=themes[chapter]||'transport',fs=data.features.filter(f=>f.properties.record_group==='新增沿线地点'&&f.properties.category===theme),seen=new Set();
  fs.sort((a,b)=>Number(Boolean(b.properties.photo))-Number(Boolean(a.properties.photo)));
  const chosen=fs.filter(f=>{if(seen.has(f.properties.city))return false;seen.add(f.properties.city);return true;}).slice(0,6);
  const heading=document.createElement('h3');heading.textContent='同一条河，别的城市呢？';
  const intro=document.createElement('p');intro.textContent='从淮安的本幕故事，读向沿线城市的'+data.categories[theme]+'。';
  const list=document.createElement('div');list.className='corridor-related-list';
  for(const f of chosen){const p=f.properties,a=document.createElement('a');a.href='./corridor.html?'+new URLSearchParams({theme,place:f.id});
   const photo=p.photo;if(photo){const img=document.createElement('img');img.src=photo.url;img.alt=p.name+'资料照片';img.loading='lazy';img.decoding='async';a.append(img);}
   const span=document.createElement('span'),small=document.createElement('small'),strong=document.createElement('strong');small.textContent=p.city;strong.textContent=p.name;span.append(small,strong);a.append(span);list.append(a);}
  const link=document.createElement('a');link.className='corridor-all-link';link.href='./corridor.html';link.textContent='展开沿线'+data.total_points+'处地点 · '+new Set(data.features.map(f=>f.properties.city)).size+'城 →';
  host.replaceChildren(heading,intro,list,link);host.hidden=false;
 }
 window.addEventListener('canal:chapterchange',e=>{chapter=e.detail.chapter;render();});
 chapter=window.CanalNarrative?.state().chapter||chapter;render();
})().catch(()=>{});
