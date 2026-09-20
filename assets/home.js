(() => {
  'use strict';
  const count=document.querySelectorAll('[data-project]').length;
  const badge=document.querySelector('.project-count');
  if(badge){badge.textContent=String(count).padStart(2,'0');badge.setAttribute('aria-label',`${count} 个项目`);}
  const links=[...document.querySelectorAll('.nav-link')];
  const sections=[...document.querySelectorAll('main>section[id]')];
  function setActive(id){links.forEach(link=>{if(link.hash===`#${id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}
  function updateActive(){
    let active=sections[0];
    const marker=Math.max(130,window.innerHeight*.3);
    sections.forEach(section=>{if(section.getBoundingClientRect().top<=marker)active=section;});
    if(sections.length && scrollY+innerHeight>=document.documentElement.scrollHeight-3)active=sections[sections.length-1];
    if(active)setActive(active.id);
  }
  let framePending=false;
  window.addEventListener('scroll',()=>{
    if(framePending)return;
    framePending=true;
    requestAnimationFrame(()=>{updateActive();framePending=false;});
  },{passive:true});
  window.addEventListener('resize',updateActive);
  updateActive();
  links.forEach(link=>link.addEventListener('click',()=>setActive(link.hash.slice(1))));
})();
