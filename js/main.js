import { initBackground, setBackgroundScene } from './webgl-bg.js';
import { initHand3D, setHandScene, setHandPointer, setHandPressed, resizeHand } from './hand3d.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

const scenes=[...document.querySelectorAll('.scene')];
const nav=[...document.querySelectorAll('.scene-index a')];
const body=document.body;
const cursor=document.querySelector('#cursor-ring');
const holdBtn=document.querySelector('#holdBtn');
const holdProgress=holdBtn.querySelector('.hold-progress');
const audioBtn=document.querySelector('#audioBtn');
const ambient=document.querySelector('#ambient');
const archiveBtn=document.querySelector('#archiveBtn');
const dialog=document.querySelector('#archiveDialog');
const closeArchive=document.querySelector('#closeArchive');

await Promise.all([initBackground(document.querySelector('#bg')), initHand3D(document.querySelector('#hand-stage'))]);

let sceneIndex=0;
function activate(index){
  sceneIndex=index;
  body.dataset.scene=String(index);
  scenes.forEach((s,i)=>s.classList.toggle('is-active',i===index));
  nav.forEach((a,i)=>a.classList.toggle('active',i===index));
  setBackgroundScene(index);
  setHandScene(index);
}
activate(0);

const io=new IntersectionObserver(entries=>{
  const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
  if(visible){
    const i=Number(visible.target.dataset.scene);
    if(i!==sceneIndex) activate(i);
  }
},{threshold:[.45,.6,.75]});
scenes.forEach(s=>io.observe(s));

let px=.5,py=.5;
function pointerMove(e){
  px=clamp(e.clientX/innerWidth,0,1); py=clamp(e.clientY/innerHeight,0,1);
  setHandPointer(px,py);
  cursor.style.left=e.clientX+'px';
  cursor.style.top=e.clientY+'px';
}
addEventListener('pointermove',pointerMove,{passive:true});
addEventListener('touchmove',e=>{
  const t=e.touches[0]; if(!t)return;
  setHandPointer(t.clientX/innerWidth,t.clientY/innerHeight);
},{passive:true});

addEventListener('pointerdown',()=>setHandPressed(true));
addEventListener('pointerup',()=>setHandPressed(false));
addEventListener('pointercancel',()=>setHandPressed(false));

let holdStart=0, holdRaf=0, entered=false;
function holdTick(t){
  const p=clamp((t-holdStart)/900,0,1);
  holdProgress.style.transform=`scaleX(${p})`;
  if(p<1) holdRaf=requestAnimationFrame(holdTick);
  else{
    entered=true;
    holdBtn.classList.add('done');
    holdBtn.querySelector('b').textContent='ENTERED';
    setTimeout(()=>document.querySelector('#s1').scrollIntoView({behavior:'smooth'}),160);
  }
}
function beginHold(){
  if(entered)return;
  holdStart=performance.now(); cancelAnimationFrame(holdRaf); holdRaf=requestAnimationFrame(holdTick);
}
function cancelHold(){
  if(entered)return;
  cancelAnimationFrame(holdRaf); holdProgress.style.transform='scaleX(0)';
}
['pointerdown','touchstart'].forEach(ev=>holdBtn.addEventListener(ev,beginHold,{passive:true}));
['pointerup','pointerleave','touchend','touchcancel'].forEach(ev=>holdBtn.addEventListener(ev,cancelHold,{passive:true}));

audioBtn.addEventListener('click',async()=>{
  if(ambient.paused){
    try{ await ambient.play(); audioBtn.textContent='SOUND ON'; }
    catch{ audioBtn.textContent='TAP AGAIN'; }
  }else{ ambient.pause(); audioBtn.textContent='SOUND OFF'; }
});

archiveBtn.addEventListener('click',()=>dialog.showModal());
closeArchive.addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{ if(e.target===dialog) dialog.close(); });

function petals(){
  const host=document.querySelector('#petals');
  for(let i=0;i<26;i++){
    const p=document.createElement('i'); p.className='petal';
    p.style.left=(Math.random()*100)+'%';
    p.style.top=(-10-Math.random()*30)+'vh';
    p.style.animationDuration=(5+Math.random()*7)+'s';
    p.style.animationDelay=(-Math.random()*8)+'s';
    p.style.transform=`scale(${.5+Math.random()})`;
    host.appendChild(p);
  }
}
petals();

addEventListener('resize',()=>resizeHand(),{passive:true});
