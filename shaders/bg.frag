#version 300 es
precision highp float;
in vec2 uv;
out vec4 fragColor;
/* Runtime shader lives in js/webgl-bg.js so GitHub Pages works without extra fetch latency.
   This file documents the fragment stage used by the experience. */
void main(){ fragColor=vec4(uv,0.5,1.0); }
