(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const P=MoonModel.PERIOD;
  let day=P/6, playing=false, lastTime=0, frame=0, lastPaint=0;
  const canvas=$('moon-canvas'),ctx=canvas.getContext('2d');
  const S=400, data=ctx.createImageData(S,S);
  const samples=[];
  // Geometry is rendered from sphere normals; this is a model, not lunar imagery.
  for(let py=0;py<S;py++) for(let px=0;px<S;px++) {
    const x=(px+.5-S/2)/(S/2-2), y=(py+.5-S/2)/(S/2-2), rr=x*x+y*y;
    if(rr<=1) samples.push({i:(py*S+px)*4,x,y,z:Math.sqrt(1-rr),edge:Math.min(1,(1-Math.sqrt(rr))*S/2)});
  }
  function drawMoon(target,t,south=false,helper=false){
    const c=target.getContext('2d'),size=target.width;
    if(target===canvas){
      const sin=Math.sin(t)*(south?-1:1),cos=Math.cos(t);
      for(const p of samples){
        const light=p.x*sin-p.z*cos;
        const bright=light>0?Math.pow(light,.38):0;
        const value=light>0?70+172*bright:25+7*p.z;
        data.data[p.i]=value;data.data[p.i+1]=value*.965;data.data[p.i+2]=value*.895;data.data[p.i+3]=p.edge*255;
      }
      c.putImageData(data,0,0);
      if(helper && Math.abs(Math.sin(t))>.04){
        c.beginPath();
        for(let j=0;j<=180;j++){
          const y=-1+j/90;
          const x=Math.sign(Math.sin(t))*Math.cos(t)*Math.sqrt(Math.max(0,1-y*y))*(south?-1:1);
          const px=S/2+x*(S/2-2),py=S/2+y*(S/2-2);
          j?c.lineTo(px,py):c.moveTo(px,py);
        }
        c.strokeStyle='#e4bf8070';c.lineWidth=1.5;c.stroke();
      }
    } else {
      const image=c.createImageData(size,size);
      for(let j=0;j<size;j++)for(let i=0;i<size;i++){
        const x=(i+.5-size/2)/(size/2-1),y=(j+.5-size/2)/(size/2-1);
        const light=MoonModel.normalLight(x,y,t,south);
        if(light===null)continue;
        const k=(j*size+i)*4,v=light>0?217:49;
        image.data[k]=v;image.data[k+1]=v*.96;image.data[k+2]=v*.87;image.data[k+3]=Math.min(1,(1-Math.hypot(x,y))*size/2)*255;
      }
      c.putImageData(image,0,0);
    }
  }
  function descriptions(m,south){
    const side=m.waxing?(south?'左':'右'):(south?'右':'左');
    return [
      '受光的一半背向地球，我们几乎看不到太阳照亮的月面。',
      `月球正在远离太阳的视方向，${side}侧亮面逐渐增加。`,
      `太阳方向与地月视线垂直，恰好能看到${side}半个月盘受光。`,
      `朝向地球的月面大部分受到光照，亮区还在继续增加。`,
      '受光的一半几乎正对地球，整个月盘明亮。此处忽略月食。',
      `月球走过满月位置，${side}侧仍亮，亮区逐渐缩小。`,
      `再次看到半个月盘受光；这次亮的是${side}半边。`,
      `${side}侧只剩一弯亮月，继续运动就将回到新月。`
    ][m.phase];
  }
  function render(){
    const m=MoonModel.at(day),south=$('hemisphere').value==='south',helper=$('geometry-toggle').checked;
    const mx=357+m.x*146,my=212+m.y*146;
    $('moon-position').setAttribute('transform',`translate(${mx} ${my})`);
    $('observer-dot').setAttribute('cx',-m.x*17);$('observer-dot').setAttribute('cy',-m.y*17);
    const sight=$('sight-line');sight.setAttribute('x1',357+m.x*30);sight.setAttribute('y1',212+m.y*30);sight.setAttribute('x2',mx-m.x*19);sight.setAttribute('y2',my-m.y*19);
    $('sight-wedge').setAttribute('d',`M357 212L${mx-m.y*16} ${my+m.x*16}L${mx+m.y*16} ${my-m.x*16}Z`);
    const solar=$('solar-ray');solar.setAttribute('x1',Math.max(18,mx-111));solar.setAttribute('y1',my);solar.setAttribute('x2',mx-24);solar.setAttribute('y2',my);
    // At the Moon, the small arc joins the solar direction to the Earth direction.
    const solarAngle=Math.PI,earthAngle=Math.atan2(-m.y,-m.x);
    let delta=earthAngle-solarAngle;while(delta>Math.PI)delta-=2*Math.PI;while(delta<-Math.PI)delta+=2*Math.PI;
    const ar=39,ex=mx+Math.cos(earthAngle)*ar,ey=my+Math.sin(earthAngle)*ar;
    $('angle-arc').setAttribute('d',Math.abs(delta)<.003?'':`M${mx-ar} ${my}A${ar} ${ar} 0 0 ${delta>0?1:0} ${ex} ${ey}`);
    const mid=solarAngle+delta/2;
    $('angle-label').setAttribute('x',mx+Math.cos(mid)*57-9);$('angle-label').setAttribute('y',my+Math.sin(mid)*57+4);$('angle-label').textContent='α';
    $('geometry-layer').style.display=helper?'':'none';
    $('terminator-label').style.display=helper&&Math.abs(Math.sin(m.t))>.1?'':'none';
    drawMoon(canvas,m.t,south,helper);
    canvas.setAttribute('aria-label',`${m.name}，亮面面积 ${(m.fraction*100).toFixed(1)}%，${south?'南':'北'}半球示意`);
    $('phase-name').textContent=m.name;$('phase-en').textContent=m.english;
    $('illumination').innerHTML=(m.fraction*100).toFixed(1)+'<span>%</span>';
    $('phase-description').textContent=descriptions(m,south);
    $('day-value').textContent=day.toFixed(2);
    $('day-slider').value=day;$('day-slider').style.setProperty('--progress',`${day/P*100}%`);
    $('day-slider').setAttribute('aria-valuetext',`新月后 ${day.toFixed(2)} 天，${m.name}`);
    $('phase-angle').textContent=m.alpha.toFixed(1)+'°';$('formula-k').textContent=(m.fraction*100).toFixed(1)+'%';
    MoonOptics.render(m,south);
    document.querySelectorAll('.phase-button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===m.phase)));
  }
  function pause(){playing=false;cancelAnimationFrame(frame);$('play-icon').textContent='▶';$('play-text').textContent='播放周期';$('play').setAttribute('aria-label','播放月相变化');MoonOptics.setPlaying(false);}
  function setDay(value){day=Math.max(0,Math.min(P,value));render();}
  function tick(time){
    if(!playing)return;
    const dt=Math.max(0,Math.min((time-lastTime)/1000,.1));lastTime=time;
    day=(day+dt*(P/24)*Number($('speed').value))%P;
    if(time-lastPaint>40){render();lastPaint=time;}
    frame=requestAnimationFrame(tick);
  }
  function play(){if(playing)return;playing=true;lastTime=performance.now();$('play-icon').textContent='Ⅱ';$('play-text').textContent='暂停播放';$('play').setAttribute('aria-label','暂停月相变化');MoonOptics.setPlaying(true);frame=requestAnimationFrame(tick);}
  $('play').addEventListener('click',()=>playing?pause():play());
  $('reset').addEventListener('click',()=>{pause();setDay(0);});
  $('day-slider').addEventListener('input',e=>{pause();setDay(Number(e.target.value));});
  $('day-slider').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowDown'||e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();pause();setDay(day+((e.key==='ArrowLeft'||e.key==='ArrowDown')?-1:1)*(e.shiftKey?1:.1));}});
  $('geometry-toggle').addEventListener('change',render);
  function drawShortcuts(){document.querySelectorAll('.phase-button canvas').forEach((c,i)=>drawMoon(c,i*Math.PI/4,$('hemisphere').value==='south'));}
  $('hemisphere').addEventListener('change',()=>{render();drawShortcuts();});
  for(let i=0;i<8;i++){
    const b=document.createElement('button');b.className='phase-button';b.setAttribute('aria-label',`跳转到${MoonModel.names[i]}，新月后 ${(i*P/8).toFixed(2)} 天`);
    b.innerHTML=`<canvas width="60" height="60" aria-hidden="true"></canvas><span>${MoonModel.names[i]}</span><span class="phase-day">${(i*P/8).toFixed(2)} 天</span>`;
    b.addEventListener('click',()=>{pause();setDay(i*P/8);});$('phase-shortcuts').appendChild(b);
    const a=i*Math.PI/4,c=document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx',357-Math.cos(a)*146);c.setAttribute('cy',212+Math.sin(a)*146);c.setAttribute('r','4');c.setAttribute('fill','#6c7682');$('orbit-dots').appendChild(c);
  }
  let dragging=false;
  function orbitPosition(e){const p=$('orbit').createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform($('orbit').getScreenCTM().inverse());}
  function moveMoon(e){const p=orbitPosition(e);if(Math.hypot(p.x-357,p.y-212)<38)return;let a=Math.atan2(p.y-212,357-p.x);if(a<0)a+=Math.PI*2;setDay(a/(Math.PI*2)*P);}
  $('orbit').addEventListener('pointerdown',e=>{const p=orbitPosition(e);if(Math.abs(Math.hypot(p.x-357,p.y-212)-146)>43)return;pause();dragging=true;$('orbit').setPointerCapture(e.pointerId);moveMoon(e);});
  $('orbit').addEventListener('pointermove',e=>{if(dragging)moveMoon(e);});
  $('orbit').addEventListener('pointerup',()=>dragging=false);$('orbit').addEventListener('pointercancel',()=>dragging=false);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  MoonOptics.init({selectDay:value=>{pause();setDay(value);},togglePlaying:()=>playing?pause():play()});
  drawShortcuts();render();
  const context=document.modelContext;
  if(context?.registerTool){
    const life=new AbortController();
    const spec={name:'set_moon_phase_day',title:'查看指定月龄的月相',description:'设置新月后经过的天数并暂停动画，同时更新月相、轨道位置和受光面积。',inputSchema:{type:'object',properties:{day:{type:'number',minimum:0,maximum:P}},required:['day'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||Object.keys(input).some(k=>k!=='day'))throw new TypeError('仅接受 day 参数');const m=MoonModel.at(input.day);pause();setDay(m.day);return{day:m.day,phase:m.name,illuminatedFraction:m.fraction,phaseAngleDegrees:m.alpha};}};
    try{Promise.resolve(context.registerTool(spec,{signal:life.signal})).catch(()=>{});}catch{}
    addEventListener('pagehide',e=>{if(!e.persisted)life.abort();},{once:true});
  }
})();
