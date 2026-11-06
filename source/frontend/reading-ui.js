/* Progressive enhancement only: pages remain readable without these transitions. */
(()=>{
 'use strict';
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 let trigger=null,pointer=false;
 document.addEventListener('click',event=>{trigger=event.target.closest('button,a');pointer=event.detail>0;},true);
 document.querySelectorAll('dialog').forEach(dialog=>{
  let opener=null;
  new MutationObserver(()=>{if(dialog.open){opener=trigger;if(pointer&&!reduced())dialog.animate([{opacity:.6,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.23,1,.32,1)'});}}).observe(dialog,{attributes:true,attributeFilter:['open']});
  dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});
 });
 ['event-photo','story-place-photo','atlas-dialog-photo'].forEach(id=>{
  const img=document.getElementById(id);if(!img)return;
  img.addEventListener('load',()=>{if(!reduced())img.animate([{opacity:.65},{opacity:1}],{duration:200,easing:'ease-out'});});
 });
 const directory=document.querySelector('.source-directory');
 if(directory){const mq=matchMedia('(max-width:760px)');const sync=()=>{directory.open=!mq.matches;};sync();mq.addEventListener('change',sync);document.getElementById('source-list').addEventListener('click',e=>{if(mq.matches&&e.target.closest('button'))directory.open=false;});}
})();
