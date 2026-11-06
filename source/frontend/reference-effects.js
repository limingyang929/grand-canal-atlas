/* Canvas renderers use screen pixels only: halos are selection symbols, not buffers. */
(function(root){
  'use strict';
  function trace(context,coordinates){
    context.beginPath();context.moveTo(coordinates[0][0],coordinates[0][1]);
    for(let i=1;i<coordinates.length;i++)context.lineTo(coordinates[i][0],coordinates[i][1]);
  }
  function ramp(context,start,end,alpha){
    const gradient=context.createLinearGradient(start[0],start[1],end[0],end[1]);
    gradient.addColorStop(0,`rgba(18,166,157,${alpha})`);
    gradient.addColorStop(.48,`rgba(57,132,201,${alpha})`);
    gradient.addColorStop(1,`rgba(133,85,201,${alpha})`);
    return gradient;
  }
  function drawLine(coordinates,state,active){
    if(!coordinates||coordinates.length<2)return;
    const context=state.context,ratio=state.pixelRatio||1;
    const start=coordinates[0],end=coordinates[coordinates.length-1];
    context.save();context.lineCap='round';context.lineJoin='round';context.setLineDash([]);
    trace(context,coordinates);
    // Soft translucent shoulders, a white keyline, then the cyan-to-violet core.
    for(const [width,opacity] of active?[[23,.08],[17,.14],[12,.20]]:[[17,.045],[12,.08],[9,.12]]){
      context.lineWidth=width*ratio;context.strokeStyle=ramp(context,start,end,opacity);context.stroke();
    }
    context.lineWidth=(active?8.5:6.5)*ratio;context.strokeStyle=active?'rgba(255,255,255,.97)':'rgba(255,255,255,.88)';context.stroke();
    context.lineWidth=(active?5.5:4)*ratio;context.strokeStyle=ramp(context,start,end,active?1:.8);context.stroke();
    if(active){
      context.lineWidth=1.3*ratio;context.strokeStyle='rgba(255,255,255,.78)';
      context.setLineDash([2*ratio,12*ratio]);context.stroke();
    }
    context.restore();
  }
  function hitLine(coordinates,state){
    if(!coordinates||coordinates.length<2)return;
    const context=state.context;context.save();context.lineCap='round';context.lineJoin='round';
    context.setLineDash([]);context.lineWidth=12*(state.pixelRatio||1);context.strokeStyle='#000';
    trace(context,coordinates);context.stroke();context.restore();
  }
  function drawPointHalo(coordinate,state,active){
    const context=state.context,ratio=state.pixelRatio||1,[x,y]=coordinate;
    const radius=(active?34:23)*ratio;
    context.save();
    const gradient=context.createRadialGradient(x,y,8*ratio,x,y,radius);
    gradient.addColorStop(0,active?'rgba(112,88,195,.31)':'rgba(23,157,158,.13)');
    gradient.addColorStop(.65,active?'rgba(112,88,195,.16)':'rgba(23,157,158,.06)');
    gradient.addColorStop(1,'rgba(112,88,195,0)');
    context.fillStyle=gradient;context.beginPath();context.arc(x,y,radius,0,Math.PI*2);context.fill();
    if(active){
      context.beginPath();context.arc(x,y,23*ratio,0,Math.PI*2);
      context.setLineDash([3*ratio,5*ratio]);context.lineWidth=1.3*ratio;context.strokeStyle='rgba(115,91,195,.68)';context.stroke();
    }
    context.restore();
  }
  const effects={drawLine,hitLine,drawPointHalo};
  if(typeof module==='object'&&module.exports)module.exports=effects;
  else root.CanalReferenceEffects=effects;
})(typeof window!=='undefined'?window:globalThis);
