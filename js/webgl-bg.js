let gl,program,loc={};let sceneIndex=0;let start=performance.now();let canvas;
const palettes=[
  [[.91,1.0,.96],[.46,.86,.77]],
  [[.98,.96,.97],[.53,.88,.80]],
  [[.91,.99,1.0],[.42,.88,.78]],
  [[.82,.94,.83],[.95,.87,.73]],
  [[.02,.03,.055],[.07,.16,.22]],
  [[.55,.0,.02],[1.0,.08,.04]],
  [[.01,.08,.035],[.08,.34,.12]],
  [[.015,.016,.023],[.15,.18,.16]]
];
const vert=`#version 300 es
in vec2 p;out vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const frag=`#version 300 es
precision highp float;in vec2 uv;out vec4 O;uniform float t;uniform float mode;uniform vec2 res;uniform vec3 ca;uniform vec3 cb;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+2.1;a*=.5;}return s;}
void main(){
 vec2 p=(uv-.5)*vec2(res.x/res.y,1.);
 float m=mode;
 float f=fbm(p*3.+vec2(t*.035,-t*.025));
 float wave=sin((p.x+p.y*.65+f*.75)*11.-t*.28)*.5+.5;
 vec3 col=mix(ca,cb,smoothstep(.18,.9,f*.72+wave*.26));
 if(m<3.5){
   float marble=abs(sin((f+p.y*.35)*18.+t*.12));
   col=mix(col,vec3(1.),pow(marble,9.)*.20);
   float halo=.28/(.05+abs(length(p-vec2(.12,.05))-.42));
   col+=cb*halo*.055;
 }else if(m<4.5){
   col*=.48+.55*pow(max(0.,1.-length(p)*.7),2.);
   col+=vec3(.12,.45,.58)*pow(max(0.,1.-length(p-vec2(.25,.0))*1.7),4.)*.35;
 }else if(m<5.5){
   col*=.78+.35*wave;
   col+=vec3(1.,.12,.04)*pow(max(0.,1.-abs(p.x*.5+p.y*.2)),8.)*.18;
 }else if(m<6.5){
   float grid=step(.965,fract((p.x+f*.05)*18.))+step(.965,fract((p.y+f*.03)*18.));
   col+=vec3(.1,.8,.22)*grid*.08;
   col*=.65+.45*(1.-length(p)*.4);
 }else{
   col*=.62+.3*f;
   col+=vec3(.08,.12,.09)*pow(max(0.,1.-length(p+vec2(.25,-.1))*1.5),3.);
 }
 O=vec4(col,1.);
}`;
function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s}
export async function initBackground(c){
 canvas=c;gl=canvas.getContext('webgl2',{antialias:false,powerPreference:'high-performance'});
 if(!gl)return;
 program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vert));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,frag));gl.linkProgram(program);gl.useProgram(program);
 const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
 const a=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
 loc.t=gl.getUniformLocation(program,'t');loc.mode=gl.getUniformLocation(program,'mode');loc.res=gl.getUniformLocation(program,'res');loc.ca=gl.getUniformLocation(program,'ca');loc.cb=gl.getUniformLocation(program,'cb');
 resize();addEventListener('resize',resize,{passive:true});draw();
}
function resize(){if(!gl)return;const d=Math.min(devicePixelRatio,1.4);canvas.width=innerWidth*d;canvas.height=innerHeight*d;gl.viewport(0,0,canvas.width,canvas.height)}
function draw(){
 if(!gl)return;requestAnimationFrame(draw);const p=palettes[sceneIndex]||palettes[0];
 gl.uniform1f(loc.t,(performance.now()-start)/1000);gl.uniform1f(loc.mode,sceneIndex);gl.uniform2f(loc.res,canvas.width,canvas.height);
 gl.uniform3fv(loc.ca,p[0]);gl.uniform3fv(loc.cb,p[1]);gl.drawArrays(gl.TRIANGLES,0,3);
}
export function setBackgroundScene(i){sceneIndex=i}
