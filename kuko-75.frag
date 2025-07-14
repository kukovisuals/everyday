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


/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓                KuKo Day - 75                 ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
#define T u_time
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21));p += dot(p, p+34.345);return fract(p.x*p.y);}
void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - u_resolution.xy) / u_resolution.y;
    // uv.y += u_time * 0.05;

    vec3 color = vec3(-uv.y);

    // dots grid
    float size = 25.0;
    vec2 cell = fract(uv * size) - 0.5;
    vec2 id   = floor(uv * size) - 0.5;

    float rand = fract(hash21(id));
    float phi  = fract(u_time * 0.07 + rand);
    float fx   = smoothstep(0.5, 0.001, length(phi) - 0.65513);

    float d1 = smoothstep(0.2, 0.09, length(cell) - 0.15);

    // background shape
    vec2 new_uv = uv; 
    new_uv.y  += sin(new_uv.x * 2.0 + T * 0.5) * 0.5 + 0.5;
    float repeat = mod(new_uv.y * 1.1, 0.4);
    float d2 = smoothstep(0.7,0.1, repeat) 
                - smoothstep(0.8 - 0.01, 0.8, repeat);

    color = vec3(d1) - fx * vec3(d2);
    // color = vec3(d2);
    O = vec4(color, 1.0);
}