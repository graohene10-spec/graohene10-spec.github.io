/* Linked cross-section, orthographic disk geometry and synodic area curve. */
const MoonOptics = (() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const P = MoonModel.PERIOD;
  let current, southern = false, sliceY = .35, selectDay, chartWidth = 900, chartHeight = 300;
  const attrs = (node, values) => Object.entries(values).forEach(([key, value]) => node.setAttribute(key, value));
  const node = (name, attributes, text) => { const el = document.createElementNS(NS, name); attrs(el, attributes); if(text !== undefined) el.textContent = text; return el; };
  const pathFrom = points => points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(3)} ${p[1].toFixed(3)}`).join(' ');
  const sample = (f, count = 90) => Array.from({length:count + 1}, (_,i) => f(i/count));
  function section(m, south) {
    const C = [226,190], R = 82;
    // Screen horizontal = toward Earth (+z); screen vertical = negative disk x.
    const s = [-Math.cos(m.t), -Math.sin(m.t)*(south ? -1 : 1)];
    const beta = Math.atan2(s[1], s[0]);
    const point = (a, r = R) => [C[0]+r*Math.cos(a), C[1]+r*Math.sin(a)];
    const lit = sample(q => point(beta-Math.PI/2+q*Math.PI));
    $('section-lit-half').setAttribute('d', pathFrom(lit)+'Z');
    $('section-terminator').setAttribute('d', pathFrom([point(beta-Math.PI/2),point(beta+Math.PI/2)]));
    const sunEnd = point(beta,138);
    attrs($('section-sun-vector'), {x2:sunEnd[0], y2:sunEnd[1]});
    attrs($('section-sun-label'), {x:sunEnd[0], y:sunEnd[1]+(s[1] > .35 ? 27 : -15)});
    $('section-phase-arc').setAttribute('d', Math.abs(beta)<.0001 ? '' : pathFrom(sample(q=>point(q*beta,32),40)));
    const anglePos = point(beta/2,48);
    attrs($('section-alpha'), {x:anglePos[0]-5, y:anglePos[1]+5});
    $('section-alpha').textContent = Math.abs(beta)<.03 ? '' : 'α';
    const low = Math.max(-Math.PI/2,beta-Math.PI/2), high = Math.min(Math.PI/2,beta+Math.PI/2);
    const hasOverlap = high-low > 1e-7;
    const angles = [.2,.5,.8].map(q=>hasOverlap ? low+(high-low)*q : beta+(q-.5)*1.8);
    const rays = $('section-rays'); rays.replaceChildren();
    angles.forEach(a=>{
      const p = point(a), start = [p[0]+s[0]*69,p[1]+s[1]*69];
      rays.append(node('line',{x1:start[0],y1:start[1],x2:p[0],y2:p[1],stroke:'#e4bf80','stroke-width':2.2,'marker-end':'url(#opt-gold-arrow)'}));
      if(hasOverlap) rays.append(node('line',{x1:p[0],y1:p[1],x2:478,y2:p[1],stroke:'#82bbcf','stroke-width':1.7,'stroke-dasharray':'6 4','marker-end':'url(#opt-blue-arrow)'}));
      rays.append(node('circle',{cx:p[0],cy:p[1],r:3,fill:hasOverlap?'#b9d7e0':'#e4bf80'}));
    });
    const a = angles[1], p = point(a), normalEnd = point(a,R+34);
    $('section-normal').replaceChildren(node('line',{x1:p[0],y1:p[1],x2:normalEnd[0],y2:normalEnd[1],stroke:'#a6c7a5','stroke-width':1.5}),node('text',{x:normalEnd[0]+7,y:normalEnd[1]+24,class:'opt-normal-text'},'n'));
    $('ray-explanation').textContent = !hasOverlap ? '新月：受光半球背向地球，没有同时受光且可见的月面点。' : m.fraction>.9999 ? '满月：受光半球正对地球，入射光与朝向地球的出射光近乎反向共线。' : '黄色入射光照到月面后，一部分光沿蓝色方向散射到地球；只画出三个代表性表面点。';
    $('light-section').setAttribute('aria-label',`光路截面，相位角 ${m.alpha.toFixed(1)} 度，${hasOverlap?'展示三个受光且可见点的光路':'受光面背向地球'}`);
  }
  function projection(m, south) {
    const C = [260,180], R = 120, c = Math.cos(m.alpha*Math.PI/180);
    const side = (m.waxing?1:-1)*(south?-1:1);
    const at = (u,y) => [C[0]+side*u*R,C[1]-y*R];
    const limb = sample(q=>{const y=1-2*q;return at(Math.sqrt(Math.max(0,1-y*y)),y);});
    const front = sample(q=>{const y=1-2*q;return at(-c*Math.sqrt(Math.max(0,1-y*y)),y);});
    const back = sample(q=>{const y=1-2*q;return at(c*Math.sqrt(Math.max(0,1-y*y)),y);});
    $('disk-lit-area').setAttribute('d',pathFrom([...limb,...[...front].reverse()])+'Z');
    $('disk-front-terminator').setAttribute('d',pathFrom(front));
    $('disk-hidden-terminator').setAttribute('d',Math.abs(c)<.01?'':pathFrom(back));
    attrs($('disk-u-axis'),{x1:C[0]-side*140,x2:C[0]+side*157});
    attrs($('disk-u-label'),{x:C[0]+side*166});
    const sl=MoonModel.slice(m.alpha,sliceY),y=C[1]-sliceY*R,xT=C[0]+side*sl.terminator*R,xL=C[0]+side*sl.radius*R;
    const strip=$('disk-strip'); strip.replaceChildren();
    strip.append(node('line',{x1:C[0]-sl.radius*R,y1:y,x2:C[0]+sl.radius*R,y2:y,stroke:'#a8b1bd','stroke-dasharray':'3 5',opacity:.7}));
    // The finite-width rectangle is an illustrative dy; the formula integrates infinitesimal strips.
    strip.append(node('rect',{x:Math.min(xT,xL),y:y-4,width:Math.abs(xL-xT),height:8,fill:'#82bbcf',opacity:.6,'clip-path':'url(#projection-disk-clip)'}));
    strip.append(node('circle',{cx:xT,cy:y,r:3.5,fill:'#f0cd8c'}),node('circle',{cx:xL,cy:y,r:3.5,fill:'#b4deed'}));
    if(Math.abs(xL-xT)>28){
      strip.append(node('text',{x:xT-side*8,y:y+25,'text-anchor':side>0?'end':'start',class:'opt-gold-text'},'T'),node('text',{x:xL+side*9,y:y+25,'text-anchor':side>0?'start':'end',class:'opt-blue-text'},'L'));
      strip.append(node('text',{x:(xL+xT)/2,y:y-12,'text-anchor':'middle',class:'opt-blue-text'},'w(y)'));
    }else strip.append(node('text',{x:xL+side*12,y:y+25,'text-anchor':side>0?'start':'end',class:'opt-blue-text'},'T / L'));
    $('slice-value').textContent=`y = ${sliceY.toFixed(2)}R`;
    $('strip-readout').textContent=`切片半宽 r = ${sl.radius.toFixed(3)}R，亮带宽 w = ${sl.width.toFixed(3)}R。`;
    const shape = Math.abs(c)<.002?'直线':Math.abs(c)>.9999?'与月缘重合的圆弧':'半椭圆';
    $('disk-shape-label').textContent=`可见交界线：${shape}`;
    $('coordinate-orientation').textContent=`当前 u 向${side>0?'右':'左'}；换到另一侧时图形镜像，面积公式不变。`;
    $('disk-projection').setAttribute('aria-label',`${m.name}投影：亮区 ${(m.fraction*100).toFixed(1)}%，可见交界线为${shape}，切片高度 ${sliceY.toFixed(2)}R`);
  }
  const plot = () => ({left:49,right:chartWidth-19,top:31,bottom:chartHeight-61});
  function chartXY(day,fraction){const p=plot();return [p.left+(p.right-p.left)*day/P,p.bottom-(p.bottom-p.top)*fraction];}
  function chartBase(){
    const svg=$('phase-curve-svg'),width=svg.getBoundingClientRect().width;
    if(width<1)return;
    chartWidth=Math.max(220,width); chartHeight=width<500?280:300;
    attrs(svg,{viewBox:`0 0 ${chartWidth} ${chartHeight}`});
    const p=plot(),grid=$('curve-grid'),landmarks=$('curve-landmarks'); grid.replaceChildren();landmarks.replaceChildren();
    for(const k of [0,.25,.5,.75,1]){
      const y=chartXY(0,k)[1];grid.append(node('line',{x1:p.left,y1:y,x2:p.right,y2:y,stroke:'#333d49','stroke-dasharray':k===0?'0':'3 5'}),node('text',{x:p.left-9,y:y+4,'text-anchor':'end'},`${k*100}%`));
    }
    grid.append(node('text',{x:p.left,y:15,class:'curve-axis-caption'},'月盘亮区比例 k'));
    const steps=chartWidth<520?[0,.5,1]:[0,.25,.5,.75,1];
    for(const phase of [0,.25,.5,.75,1]){
      const d=phase*P,k=MoonModel.at(d).fraction,[x,y]=chartXY(d,k);
      landmarks.append(node('circle',{cx:x,cy:y,r:3.5,fill:'#b69b71'}));
      if(steps.includes(phase)){
        const anchor=phase===0?'start':phase===1?'end':'middle';
        grid.append(node('text',{x,y:p.bottom+23,'text-anchor':anchor},`${d.toFixed(2)} 天`),node('text',{x,y:p.bottom+44,'text-anchor':anchor},MoonModel.names[(phase*8)%8]));
      }
    }
    const points=sample(q=>chartXY(q*P,MoonModel.at(q*P).fraction),180);
    const curve=pathFrom(points);$('curve-line').setAttribute('d',curve);
    $('curve-area').setAttribute('d',`${curve}L${p.right} ${p.bottom}L${p.left} ${p.bottom}Z`);
    if(current)chartMarker(current);
  }
  function chartMarker(m){
    const [x,y]=chartXY(m.day,m.fraction),p=plot();
    attrs($('curve-cursor'),{x1:x,y1:p.top,x2:x,y2:p.bottom});attrs($('curve-marker'),{cx:x,cy:y});
    $('curve-day').textContent=`${m.day.toFixed(2)} 天`;$('curve-percent').textContent=`${(m.fraction*100).toFixed(1)}%`;
    attrs($('phase-curve-svg'),{'aria-valuenow':m.day.toFixed(3),'aria-valuetext':`新月后 ${m.day.toFixed(2)} 天，月盘亮区 ${(m.fraction*100).toFixed(1)}%`});
  }
  function render(m,south){
    current=m;southern=south;
    $('optics-day-value').textContent=m.day.toFixed(2);$('optics-day').value=m.day;
    $('optics-day').style.setProperty('--progress',`${m.day/P*100}%`);
    $('optics-day').setAttribute('aria-valuetext',`${m.day.toFixed(2)} 天，${m.name}`);
    $('optics-state').textContent=`${m.name} · ${south?'南':'北'}半球示意`;
    section(m,south);projection(m,south);chartMarker(m);
  }
  function setPlaying(value){$('optics-play').textContent=value?'Ⅱ 暂停播放':'▶ 播放周期';$('optics-play').setAttribute('aria-label',value?'在推导区暂停月相变化':'在推导区播放月相变化');}
  function init(actions){
    selectDay=actions.selectDay;
    $('optics-play').addEventListener('click',actions.togglePlaying);
    $('optics-day').addEventListener('input',e=>selectDay(Number(e.target.value)));
    function keyDay(e){
      let value=current?.day??0;
      if(['ArrowLeft','ArrowDown'].includes(e.key))value-=e.shiftKey?1:.1;
      else if(['ArrowRight','ArrowUp'].includes(e.key))value+=e.shiftKey?1:.1;
      else if(e.key==='Home')value=0;
      else if(e.key==='End')value=P;
      else return;
      e.preventDefault();selectDay(Math.max(0,Math.min(P,value)));
    }
    $('optics-day').addEventListener('keydown',keyDay);
    $('slice-height').addEventListener('input',e=>{sliceY=Number(e.target.value);if(current)projection(current,southern);});
    const svg=$('phase-curve-svg');svg.addEventListener('keydown',keyDay);
    let held=false;
    function pick(e){const point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;const pos=point.matrixTransform(svg.getScreenCTM().inverse()),p=plot();selectDay(Math.max(0,Math.min(P,(pos.x-p.left)/(p.right-p.left)*P)));}
    svg.addEventListener('pointerdown',e=>{held=true;svg.setPointerCapture(e.pointerId);svg.focus({preventScroll:true});pick(e);});
    svg.addEventListener('pointermove',e=>{if(held)pick(e);});
    svg.addEventListener('pointerup',()=>held=false);svg.addEventListener('pointercancel',()=>held=false);
    new ResizeObserver(chartBase).observe(svg);
    $('optics-details').addEventListener('toggle',chartBase);
    chartBase();
  }
  return {init,render,setPlaying};
})();
