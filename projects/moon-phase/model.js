/* Ideal circular synodic model, parallel sunlight and orthographic projection. */
const MoonModel = (() => {
  const PERIOD = 29.53;
  const names = ['新月', '娥眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月'];
  const english = ['NEW MOON', 'WAXING CRESCENT', 'FIRST QUARTER', 'WAXING GIBBOUS', 'FULL MOON', 'WANING GIBBOUS', 'LAST QUARTER', 'WANING CRESCENT'];
  function at(day) {
    if (!Number.isFinite(day) || day < 0 || day > PERIOD) throw new RangeError('时间必须在 0 至 29.53 天之间');
    const t = day / PERIOD * Math.PI * 2;
    const f = (1 - Math.cos(t)) / 2;
    const quarter = day / PERIOD * 4;
    let phase;
    if (Math.abs(quarter - Math.round(quarter)) < 0.002) phase = Math.round(quarter) % 4 * 2;
    else phase = Math.floor(quarter) % 4 * 2 + 1;
    return {day, t, fraction:f, phase, name:names[phase], english:english[phase], alpha:Math.acos(Math.max(-1,Math.min(1,-Math.cos(t)))) * 180 / Math.PI, x:-Math.cos(t), y:Math.sin(t), waxing:day < PERIOD/2};
  }
  function normalLight(x, y, t, south = false) {
    const r2=x*x+y*y;
    if(r2 > 1) return null;
    const z=Math.sqrt(1-r2);
    return (south ? -x : x)*Math.sin(t)-z*Math.cos(t);
  }
  function slice(alphaDegrees, height) {
    if(!Number.isFinite(alphaDegrees)||alphaDegrees<0||alphaDegrees>180||!Number.isFinite(height)||Math.abs(height)>1) throw new RangeError('切片或角度超出范围');
    const radius=Math.sqrt(Math.max(0,1-height*height));
    const cos=Math.cos(alphaDegrees*Math.PI/180);
    return {radius,terminator:-cos*radius,width:(1+cos)*radius};
  }
  return {PERIOD,names,english,at,normalLight,slice};
})();
if(typeof module!=='undefined') module.exports=MoonModel;
