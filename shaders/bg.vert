#version 300 es
in vec2 p;
out vec2 uv;
void main(){ uv=p*.5+.5; gl_Position=vec4(p,0.0,1.0); }
