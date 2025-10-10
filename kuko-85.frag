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

/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓               🌟  KuKo — Day 82  🌟                  ▓

        🟡 Point A  — Yellow
        🟢 Point C  — Green (both are vectors)
        ⚪ White dots — projections of A and C 
            using dot product

    ▓   Starting from the ground up with vector math.     ▓
    ▓   It's been over 10 years since school, so this     ▓
    ▓   is my fresh restart — rebuilding the foundation.  ▓

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/

const float PI = 3.1415926;
#define T u_time

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - u_resolution.xy) / u_resolution.y;
    vec3 color = vec3(-uv.y);

    vec2 cell = fract(uv * 2.0) - 0.5;
    float d = length(cell) - 0.4;
    d = smoothstep(0.02,0.0, d);
    color = vec3(d);

    O = vec4(color, 1.0);
}