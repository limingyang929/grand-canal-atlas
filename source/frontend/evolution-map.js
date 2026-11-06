'use strict';
window.CanalEvolutionMap={create(data,atlas,onSite,onFeature){
  const features=new ol.format.GeoJSON().readFeatures({type:'FeatureCollection',features:atlas.features},{featureProjection:'EPSG:3857'});
  const references=new Map(data.display_references.features.map(f=>[f.id,f]));
  const sites=new Map(data.sites.map(s=>[s.id,s]));
  const palette=new Map(data.functions.map(f=>[f.id,f.color]));
  const cache=new Map();let activeSite='',motion=false,pulseStart=0,frame=0;
  const background=new ol.layer.Vector({source:new ol.source.Vector({features,attributions:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors · ODbL</a>'}),declutter:true,style:(f,resolution)=>{
    const kind=f.get('kind'),water=['water','waterway'].includes(kind),street=kind==='street';
    const selected=f.get('place_id')&&[...sites.values()].some(s=>s.id===activeSite&&s.current_place_ref===f.get('place_id'));
    const name=f.get('name'),show=f.get('named')&&(resolution<4||water&&resolution<9);
    const key=kind+':'+selected+':'+show+':'+(show?name:'');
    if(!cache.has(key))cache.set(key,new ol.style.Style({fill:street||kind==='waterway'?undefined:new ol.style.Fill({color:water?'#b5d6de':kind==='park'?'#d1dfce':kind==='building'?'#d7dfdb':kind==='education'?'#e4dec9':'#e2e8df'}),stroke:new ol.style.Stroke({color:selected?'#277c8e':water?'#79afba':street?'#bdcbc8':'#c3d0c9',width:water?2.4:street?1.7:selected?1.6:.7}),text:show?new ol.style.Text({text:name,font:'11px "Microsoft YaHei",sans-serif',placement:water&&kind==='waterway'||street?'line':'point',fill:new ol.style.Fill({color:water?'#285b6a':'#52686b'}),stroke:new ol.style.Stroke({color:'#f7faf5',width:3}),overflow:false}):undefined}));
    return cache.get(key);
  }});
  const markerSource=new ol.source.Vector();
  function markerStyle(f){
    const selected=f.getId()===activeSite,color=f.get('color')||'#55d9d0',broad=f.get('broad');
    const phase=selected&&pulseStart?Math.min(1,(performance.now()-pulseStart)/850):1;
    const radius=selected?11:7,styles=[];
    if(selected)styles.push(new ol.style.Style({image:new ol.style.Circle({radius:radius+7+(phase<1?phase*15:0),fill:new ol.style.Fill({color:'#277c8e12'}),stroke:new ol.style.Stroke({color:'#193743b0',width:phase<1?2:1.5})}),zIndex:20}));
    styles.push(new ol.style.Style({image:new ol.style.Circle({radius:radius+2,fill:new ol.style.Fill({color:'#fafbf7'}),stroke:new ol.style.Stroke({color:'#19374399',width:1})}),zIndex:selected?39:29}));
    styles.push(new ol.style.Style({image:new ol.style.Circle({radius,fill:new ol.style.Fill({color:selected?color:'#fafbf7'}),stroke:new ol.style.Stroke({color,width:2.5,lineDash:broad?[4,3]:undefined})}),text:new ol.style.Text({text:f.get('label'),font:(selected?'bold ':'')+'12px "Microsoft YaHei",sans-serif',offsetY:-28,padding:[5,7,5,7],backgroundFill:new ol.style.Fill({color:'#fafbf7f5'}),fill:new ol.style.Fill({color:selected?'#923b30':'#193743'}),stroke:new ol.style.Stroke({color:'#fafbf7',width:2})}),zIndex:selected?40:30}));return styles;
  }
  const markers=new ol.layer.Vector({source:markerSource,style:markerStyle,declutter:'historical-references',zIndex:10});
  const view=new ol.View({center:ol.proj.fromLonLat([119.035,33.592]),zoom:16,minZoom:12,maxZoom:19});
  const map=new ol.Map({target:'evolution-map',layers:[background,markers],view,controls:ol.control.defaults.defaults({rotate:false})});
  const resize=()=>map.updateSize();window.addEventListener('resize',resize);if(typeof ResizeObserver==='function')new ResizeObserver(resize).observe(document.getElementById('evolution-map'));
  map.on('singleclick',event=>{
    // A filled background polygon must not win over a nearby small historical marker.
    const reference=map.forEachFeatureAtPixel(event.pixel,f=>f,{hitTolerance:10,layerFilter:layer=>layer===markers});
    if(reference){onSite(reference.getId());return;}
    map.forEachFeatureAtPixel(event.pixel,f=>{onFeature(f.getProperties());return true;},{hitTolerance:7,layerFilter:layer=>layer===background});
  });
  function stopPulse(){cancelAnimationFrame(frame);frame=0;pulseStart=0;markers.changed();}
  function pulse(){stopPulse();if(!motion||document.hidden)return;pulseStart=performance.now();const tick=()=>{markers.changed();if(performance.now()-pulseStart<850)frame=requestAnimationFrame(tick);else stopPulse();};frame=requestAnimationFrame(tick);}
  function setRows(rows,selectedSite,animate,selectedAssertion){
    activeSite=selectedSite||'';const groups=new Map();for(const a of rows){if(!groups.has(a.site_id))groups.set(a.site_id,[]);groups.get(a.site_id).push(a);}
    markerSource.clear();for(const [sid,items] of groups){const site=sites.get(sid),ref=references.get(site.current_place_ref);if(!ref)continue;
      const active=items.find(a=>a.id===selectedAssertion),display=active||items.find(a=>a.function_codes.length);
      const f=new ol.Feature({geometry:new ol.geom.Point(ol.proj.fromLonLat(ref.geometry.coordinates)),label:site.name.replace('相关处所','').replace('相关片区',' · 片区'),color:palette.get(display?.function_codes[0]),broad:active?active.time.type!=='point':items.every(a=>a.time.type!=='point')});f.setId(sid);markerSource.addFeature(f);}
    background.changed();if(animate)pulse();
  }
  function fit(siteIds){const coords=siteIds.map(id=>sites.get(id)).filter(Boolean).map(s=>references.get(s.current_place_ref)?.geometry.coordinates).filter(Boolean).map(c=>ol.proj.fromLonLat(c));if(!coords.length)return;map.updateSize();view.cancelAnimations();view.fit(ol.extent.boundingExtent(coords),{size:map.getSize(),padding:[65,50,65,50],maxZoom:16.8,duration:motion?330:0});}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopPulse();view.cancelAnimations();}});
  return {map,view,setRows,fit,setMotion(on){motion=on;if(!on){stopPulse();view.cancelAnimations();}},getView(){const c=ol.proj.toLonLat(view.getCenter());return [...c,view.getZoom()].map(n=>Number(n.toFixed(5)));},restoreView(raw){const v=raw?.split(',').map(Number);if(v?.length===3&&v.every(Number.isFinite)&&v[0]>118&&v[0]<120&&v[1]>33&&v[1]<34&&v[2]>=12&&v[2]<=19){view.cancelAnimations();view.setCenter(ol.proj.fromLonLat(v.slice(0,2)));view.setZoom(v[2]);return true;}return false;}};
}};
