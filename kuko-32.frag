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

void mainImage( out vec4 O, in vec2 I )
{
    float t = u_time;
    vec2 iResolution = u_resolution;
    vec2 uv = (2.0 * I - iResolution.xy);/// iResolution.y;

    O = vec4(uv.x, uv.y, 0.0, 1.0);
}

