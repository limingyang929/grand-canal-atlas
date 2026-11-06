'use strict';
// Dated events and coarse context remain different states in every reading mode.
window.CanalEvolutionCore = {
  presentation(data){
    const statisticalDrafts=new Set(data.quantitative_observations.filter(q=>!q.comparable_series_verified).map(q=>q.assertion_id));
    const assertions=data.assertions.filter(a=>a.time.type!=='unknown'&&!/待核|待补|待查/.test(a.time.text)&&!statisticalDrafts.has(a.id));
    const ids=new Set(assertions.map(a=>a.id)),relations=data.relations.filter(r=>r.assertion_ids.every(id=>ids.has(id)));
    const relationIds=new Set(relations.map(r=>r.id));
    return {...data,assertions,relations,
      scenes:data.scenes.map(s=>({...s,assertion_ids:s.assertion_ids.filter(id=>ids.has(id)),relation_ids:s.relation_ids.filter(id=>relationIds.has(id))})),
      same_site_cases:data.same_site_cases.map(c=>({...c,assertion_ids:c.assertion_ids.filter(id=>ids.has(id)),relation_ids:c.relation_ids.filter(id=>relationIds.has(id))}))};
  },
  eraForYear(data,year){return data.eras.find(e=>year>=e.start_year&&(e.end_year===null||year<e.end_year))?.id;},
  rows(data,state){
    const byEntity=new Map(data.entities.map(e=>[e.id,e]));
    const fixed=data.same_site_cases.find(c=>c.id===state.caseId);
    return data.assertions.filter(a=>a.era_ids.includes(state.era)&&(!state.area||a.area===state.area)
      &&(!state.functionCode||a.function_codes.includes(state.functionCode))&&(!fixed||byEntity.get(a.entity_id).site_id===fixed.site_id))
      .sort((a,b)=>(a.time.type==='point'?a.time.year:Infinity)-(b.time.type==='point'?b.time.year:Infinity)||a.id.localeCompare(b.id));
  },
  chooseEvent(rows,id){return rows.find(a=>a.id===id)||rows.find(a=>a.time.type==='point')||rows[0]||null;},
  query(data,era,year,site){
    if(year!==undefined){const e=this.eraForYear(data,year);if(!e||(era&&era!==e))throw Error('时代与年份不一致');era=e;}
    if(era&&!data.eras.some(e=>e.id===era))throw Error('未知时代');
    if(site&&!data.sites.some(s=>s.id===site))throw Error('未知处所');
    const rows=data.assertions.filter(a=>!site||a.site_id===site);
    return {dated_events:rows.filter(a=>a.time.type==='point'&&(!era||a.era_ids.includes(era))&&(year===undefined||a.time.year===year)),
      broad_period_context:rows.filter(a=>['period','approximate_range'].includes(a.time.type)&&(!era||a.era_ids.includes(era))),
      undated:rows.filter(a=>a.time.type==='unknown')};
  },
  scene(data,state){return !state.caseId&&data.scenes.find(s=>s.era_id===state.era&&s.area===state.area);}
};
