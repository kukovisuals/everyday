#version 120
#ifdef GL_ES
precision highp float;
#endif
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform sampler2D u_text0;
void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
#define PI 3.14159265
#define T u_time

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓                KuKo Day - 72                 ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21));p += dot(p, p+34.345);return fract(p.x*p.y);}
void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - u_resolution.xy) / u_resolution.y;
    vec2 new_uv = uv;
    vec3 color  = vec3(0.0);

    float size = 10.0;
    vec2 cell  = fract(new_uv * size) - 0.5;
    vec2 id    = floor(new_uv * size) - 0.5;

    float rnd = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
    float phi = fract(u_time * 0.015 + rnd);
    float fx = step(0.9, phi);
    // circle
    float d1  = smoothstep(0.43, 0.3, length(cell) - 0.0);

    color = d1 * fx * vec3(1.0);
    // color = vec3(cell, 1.0);
    O = vec4(color,1.0); 
}