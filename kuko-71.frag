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
    
    ▓                KuKo Day - 70                 ▓
    ▓                 SDF Circle                   ▓
    ▓                 Shapes id                    ▓
    ▓                    Map                       ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21));p += dot(p, p+34.345);return fract(p.x*p.y);}
void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - u_resolution.xy) / u_resolution.y;
    vec2 cell_uv = uv;
    // uv.y += u_time * 0.02;
    vec3 color = vec3(0.0);
    
    float speed = 2.0;
    float fx3 = atan(uv.x + u_time * speed / 4.0) * sin(uv.x + u_time * speed / 4.0) * 0.2 + 0.2;
    
    float fx = sin(u_time * speed) * 0.5 + 0.5;
    float fx2 = sin(0.5 + u_time * speed) * 0.5 + 0.5;
    float fx4 = sin(1.5 + uv.x + u_time * speed) * 0.5 + 0.2;
    float fx5 = sin(2.0 + uv.x + u_time * speed) * 0.5 + 0.2;

    cell_uv.y += fx3; 

    float size = 5.0;
    vec2 p = fract(cell_uv * size) - 0.5;
    vec2 id = floor(cell_uv * size) - 0.5;

    float ran_r = mix(0.01,0.3, hash21(id));

    float d1 = length(p) - (ran_r * fx);
    float d2 = length(p) - (ran_r * fx2);
    float d3 = length(p) - (ran_r * fx4);
    float d4 = length(p) - (ran_r * fx5);


    d1 = smoothstep( 0.03, 0.0, d1);
    d2 = smoothstep( 0.03, 0.0, d2);
    d3 = smoothstep( 0.03, 0.0, d3);
    d4 = smoothstep( 0.03, 0.0, d4);

    if(id.x > -1.0 && id.y > 0.0){
        color += vec3(d1);
    } else if(id.x > -1.0 && id.y < 0.0){
        color += vec3(d2);
    } else if(id.x < 1.0 && id.y > 0.0){
        color += vec3(d3);
    } else {
        color += vec3(d4);
    }
    // color = vec3(p, 0.0);
    O = vec4(color, 1.0);
}