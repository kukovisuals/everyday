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
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓                KuKo Day - 75                 ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
#define T u_time
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21));p += dot(p, p+34.345);return fract(p.x*p.y);}
mat2 rotate2D(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - u_resolution.xy) / u_resolution.y;

    uv = rotate2D(T * 0.2) * uv;
    vec3 color  = vec3(-uv.y);
    vec2 p = uv;

    p.x += sin(p.y * 2.0 - u_time * 0.1) * 0.5 + 0.5;
    p.x += cos(p.x * 2.0) * 0.5 + 0.5;

    float f_x = sin(p.y + T * 0.2) * 2.5 + 2.5;
    vec2 cell = fract(p * vec2(f_x, 0.0)) - 0.5;

    float d1 = length(cell.x) * exp(-length(uv));
    float edgeWidth = max(0.4, fwidth(d1));
    d1 = smoothstep(0.2 - edgeWidth, 0.2 + edgeWidth,  d1);
    // d1 = smoothstep(0.5, 0.01,  d1);

    d1 = mod(d1 * 3.0 - T * 0.3, 1.0);
    d1 = pow(0.09 / d1, 1.0);
    color = vec3(d1);
    O = vec4(color, 1.0);
}