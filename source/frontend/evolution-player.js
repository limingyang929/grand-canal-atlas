'use strict';
window.CanalEraPlayer={create({getEras,getCurrent,onAdvance,onStatus,onProgress,delay=4000,clock={setTimeout:(fn,ms)=>setTimeout(fn,ms),clearTimeout:id=>clearTimeout(id),setInterval:(fn,ms)=>setInterval(fn,ms),clearInterval:id=>clearInterval(id),now:()=>performance.now()}}){
  let playing=false,sequence=[],index=0,timeout=null,interval=null,started=0;
  function status(reason){onStatus({playing,reason,era:sequence[index]||getCurrent(),next:sequence[index+1]||null});}
  function clear(){clock.clearTimeout(timeout);clock.clearInterval(interval);timeout=interval=null;}
  function stop(reason='paused'){if(!playing)return;playing=false;clear();onProgress(0);status(reason);}
  function show(){
    clear();onAdvance(sequence[index]);started=clock.now();onProgress(0);status('playing');
    interval=clock.setInterval(()=>onProgress(Math.min(1,(clock.now()-started)/delay)),100);
    timeout=clock.setTimeout(()=>{if(!playing)return;if(index===sequence.length-1){stop('complete');return;}index++;show();},delay);
  }
  return {start(){if(playing)return;sequence=getEras();if(sequence.length<2){index=0;status('single');return;}const current=sequence.indexOf(getCurrent());index=current>=0&&current<sequence.length-1?current+1:0;playing=true;show();},stop,isPlaying:()=>playing};
}};
