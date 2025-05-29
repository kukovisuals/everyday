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

// 9
void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2. * I - u_resolution) / u_resolution.y;
    float circles = length(uv) - 0.5;
    circles = sin(circles * 40. - u_time * 3.);

    O = vec4(vec3(circles), 1.0);
}