#version 120
#ifdef GL_ES
precision highp float;
#endif
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform sampler2D u_text0;
#define PI 3.14159265
void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (I - u_resolution.xy) / u_resolution.y;

    float d = length(uv) - 0.5;
    vec3 color = vec3(d);

    O = vec4(color, 1.0);
}
