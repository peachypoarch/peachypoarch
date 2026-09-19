import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/postprocessing/UnrealBloomPass.js';

let renderer,camera,scene,composer,bloom,hand,wrist,shards,rings;
let pointer={x:.5,y:.5}, smooth={x:.5,y:.5}, pressed=false, currentScene=0;
const clock=new THREE.Clock();

const palettes=[
  {c:0x69e7b7,e:0x1e8f73,bloom:.65,opacity:1},
  {c:0x69e7b7,e:0x2c9b76,bloom:.8,opacity:1},
  {c:0x69f04c,e:0x2cae2f,bloom:.95,opacity:1},
  {c:0x8ddd63,e:0x3a8038,bloom:.75,opacity:.93},
  {c:0xb6f2ff,e:0x276c7f,bloom:1.05,opacity:.86},
  {c:0xff5a36,e:0x7b0500,bloom:1.35,opacity:1},
  {c:0x78ff91,e:0x1d832d,bloom:1.25,opacity:1},
  {c:0xe4e0d4,e:0x4b4c44,bloom:.65,opacity:.9}
];

function capsule(r,l,mat){
  const g=new THREE.CapsuleGeometry(r,l,8,16);
  const m=new THREE.Mesh(g,mat); m.castShadow=true; m.receiveShadow=true; return m;
}

function makeFinger(mat, lengths, radius, bend=[0,0,0]){
  const root=new THREE.Group();
  let parent=root;
  lengths.forEach((len,i)=>{
    const joint=new THREE.Group();
    joint.rotation.x=bend[i]||0;
    parent.add(joint);
    const seg=capsule(radius*(1-i*.11),len,mat);
    seg.position.y=len/2;
    joint.add(seg);
    const knuckle=new THREE.Mesh(new THREE.SphereGeometry(radius*(1-i*.08),16,12),mat);
    knuckle.position.y=len;
    joint.add(knuckle);
    const next=new THREE.Group();
    next.position.y=len;
    joint.add(next);
    parent=next;
  });
  return root;
}

function buildHand(){
  const mat=new THREE.MeshPhysicalMaterial({
    color:0x69e7b7, emissive:0x1e8f73, emissiveIntensity:.18,
    roughness:.22, metalness:.04, clearcoat:1, clearcoatRoughness:.15,
    transparent:true, opacity:1
  });
  const group=new THREE.Group();

  const palm=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),mat);
  palm.scale.set(1.18,.72,.46);
  palm.position.set(0,0,0);
  group.add(palm);

  // back-of-hand volume
  const back=new THREE.Mesh(new THREE.SphereGeometry(.78,28,20),mat);
  back.scale.set(1.05,.8,.55); back.position.set(.03,.36,.02); group.add(back);

  // wrist
  wrist=capsule(.52,1.55,mat);
  wrist.position.set(.05,-1.25,0); wrist.rotation.z=.03;
  group.add(wrist);

  // index - long and extended
  const index=makeFinger(mat,[.86,.70,.52],.22,[-.03,.08,.09]);
  index.position.set(.53,.54,0); index.rotation.z=-.10; index.rotation.x=.08; group.add(index);
  // middle
  const middle=makeFinger(mat,[.92,.72,.51],.23,[.20,.38,.30]);
  middle.position.set(.12,.66,-.02); middle.rotation.z=.02; group.add(middle);
  // ring
  const ring=makeFinger(mat,[.84,.66,.48],.215,[.35,.46,.35]);
  ring.position.set(-.30,.58,-.02); ring.rotation.z=.12; group.add(ring);
  // pinky
  const pinky=makeFinger(mat,[.67,.52,.39],.18,[.50,.58,.42]);
  pinky.position.set(-.67,.39,-.03); pinky.rotation.z=.24; group.add(pinky);
  // thumb
  const thumb=makeFinger(mat,[.65,.52],.24,[.18,.32]);
  thumb.position.set(.84,-.20,.02); thumb.rotation.z=-1.00; thumb.rotation.y=-.20; group.add(thumb);

  // soft palm pad
  const pad=new THREE.Mesh(new THREE.SphereGeometry(.45,24,18),mat);
  pad.scale.set(1.2,.75,.45); pad.position.set(.55,-.18,.12); group.add(pad);

  group.userData.mat=mat;
  group.userData.fingers={index,middle,ring,pinky,thumb};
  group.rotation.set(.2,-.35,-.2);
  return group;
}

function buildShards(){
  const g=new THREE.Group();
  const mat=new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.20,roughness:.05,metalness:.1,transmission:.5,side:THREE.DoubleSide});
  for(let i=0;i<18;i++){
    const geo=new THREE.BufferGeometry();
    const w=.25+Math.random()*.6,h=.4+Math.random()*.9;
    const verts=new Float32Array([0,0,0,w,0,0,w*Math.random(),h,0]);
    geo.setAttribute('position',new THREE.BufferAttribute(verts,3));
    geo.computeVertexNormals();
    const m=new THREE.Mesh(geo,mat);
    m.position.set((Math.random()-0.5)*5,(Math.random()-0.5)*5,(Math.random()-0.5)*2);
    m.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);
    m.userData.speed=.15+Math.random()*.35;
    g.add(m);
  }
  g.visible=false; return g;
}
function buildRings(){
  const g=new THREE.Group();
  for(let i=0;i<5;i++){
    const mat=new THREE.MeshBasicMaterial({color:0x75ff91,transparent:true,opacity:.18+.05*i,side:THREE.DoubleSide});
    const m=new THREE.Mesh(new THREE.TorusGeometry(1.2+i*.38,.012,8,96),mat);
    m.rotation.x=Math.PI/2*(i%2); m.rotation.y=i*.3; g.add(m);
  }
  g.visible=false; return g;
}

export async function initHand3D(host){
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(34,innerWidth/innerHeight,.1,100);
  camera.position.set(0,0,9);

  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff,0x22443a,2.1));
  const key=new THREE.PointLight(0xffffff,75,18,2); key.position.set(3,4,5); scene.add(key);
  const rim=new THREE.PointLight(0x4dffb1,60,16,2); rim.position.set(-4,1,3); scene.add(rim);
  const low=new THREE.PointLight(0xff7f6a,35,15,2); low.position.set(2,-4,2); scene.add(low);

  hand=buildHand();
  hand.scale.setScalar(1.45);
  scene.add(hand);

  shards=buildShards(); scene.add(shards);
  rings=buildRings(); scene.add(rings);

  composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.75,.55,.18);
  composer.addPass(bloom);

  animate();
}
export function setHandPointer(x,y){ pointer.x=x; pointer.y=y; }
export function setHandPressed(v){ pressed=v; }
export function setHandScene(i){
  currentScene=i;
  if(!hand)return;
  const p=palettes[i]||palettes[0];
  const mat=hand.userData.mat;
  mat.color.setHex(p.c); mat.emissive.setHex(p.e); mat.opacity=p.opacity;
  bloom.strength=p.bloom;
  shards.visible=i===5; rings.visible=i===6;

  const poses=[
    {s:1.15,z:-.5,rx:.3,ry:-.25,rz:-.3},
    {s:1.3,z:-.2,rx:.18,ry:-.35,rz:-.22},
    {s:1.45,z:0,rx:.15,ry:-.5,rz:-.25},
    {s:1.2,z:-.1,rx:.25,ry:-.5,rz:-.35},
    {s:.72,z:-1.2,rx:.1,ry:-.2,rz:-.1},
    {s:1.55,z:.1,rx:.05,ry:-.15,rz:.1},
    {s:1.15,z:-.2,rx:.15,ry:-.55,rz:-.25},
    {s:.85,z:-.7,rx:.2,ry:-.4,rz:-.2}
  ][i];
  hand.userData.pose=poses;
}
export function resizeHand(){
  if(!renderer)return;
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6)); renderer.setSize(innerWidth,innerHeight);
  composer.setSize(innerWidth,innerHeight);
}
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);
  smooth.x+=(pointer.x-smooth.x)*(1-Math.pow(.0008,dt));
  smooth.y+=(pointer.y-smooth.y)*(1-Math.pow(.0008,dt));

  if(hand){
    const mobile=innerWidth<760;
    const nx=(smooth.x-.5)*2, ny=(.5-smooth.y)*2;
    let baseX=mobile?1.05:1.45, baseY=mobile?-.35:-.05;
    if(currentScene===1){baseX=mobile?.7:1.75;baseY=.05}
    if(currentScene===3){baseX=mobile?.9:1.55;baseY=.1}
    if(currentScene===4){baseX=mobile?.6:1.7;baseY=-.2}
    if(currentScene===5){baseX=mobile?.75:1.45;baseY=.15}
    if(currentScene===6){baseX=mobile?.8:1.65;baseY=.25}
    if(currentScene===7){baseX=mobile?1.4:2.4;baseY=-.55}

    const targetX=baseX+nx*(mobile?1.0:1.85);
    const targetY=baseY+ny*(mobile?1.0:1.35);
    hand.position.x+=(targetX-hand.position.x)*.085;
    hand.position.y+=(targetY-hand.position.y)*.085;

    const pose=hand.userData.pose||{s:1.2,z:0,rx:.2,ry:-.3,rz:-.2};
    hand.position.z+=(pose.z-hand.position.z)*.08;
    const s=pose.s*(pressed?1.04:1);
    hand.scale.x+=(s-hand.scale.x)*.07; hand.scale.y+=(s-hand.scale.y)*.07; hand.scale.z+=(s-hand.scale.z)*.07;
    hand.rotation.x+=(pose.rx+ny*.18-hand.rotation.x)*.08;
    hand.rotation.y+=(pose.ry+nx*.32-hand.rotation.y)*.08;
    hand.rotation.z+=(pose.rz-nx*.18-hand.rotation.z)*.08;

    const f=hand.userData.fingers;
    // subtle life-like motion; pointer down becomes a pinch/grab
    const t=performance.now()*.001;
    f.index.rotation.x+=( (pressed?.28:-.03) + Math.sin(t*1.7)*.015 - f.index.rotation.x)*.12;
    f.thumb.rotation.z+=( (pressed?-.62:-1.0) - f.thumb.rotation.z)*.12;
    f.middle.rotation.x+=( (.18+Math.sin(t*1.2)*.02) - f.middle.rotation.x)*.08;
  }

  if(shards?.visible){
    shards.rotation.y+=dt*.10;
    shards.children.forEach((m,i)=>{
      m.rotation.x+=dt*m.userData.speed;
      m.rotation.y+=dt*m.userData.speed*.7;
      m.position.y+=Math.sin(performance.now()*.001+i)*dt*.03;
    });
  }
  if(rings?.visible){
    rings.rotation.z+=dt*.12; rings.rotation.y+=dt*.07;
    rings.children.forEach((r,i)=>r.rotation.z+=dt*(.05+i*.015));
  }
  composer.render();
}
