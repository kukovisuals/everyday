#version 120
#ifdef GL_ES
precision highp float;
#endif
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform sampler2D u_text0;
#define PI 3.1415926535897323846

void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

float sdBox( in vec2 p, in vec2 b)
{
    p -= 2.0;
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
void mainImage( out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - u_resolution) / u_resolution.y;
    uv *= 5.0 - 1.0;
    float t = u_time;

    float a = PI * t * 0.02;
    float aTwo = PI * t * 0.05;
    float aThree = PI * t * 0.1;
    float sinFx = sin(t * 0.2) * 1.5 + 2.5;
    float sinFxTwo = sin(t * 0.5) * 0.5 + 1.0;

    mat2 sFx = mat2(sinFx);
    mat2 sfxTwo = mat2(sinFxTwo);
    uv.x += t * 0.01;
    
    float c = cos(a);
    float s = sin(a);
    float cos45 = cos(PI/5);// + t * 0.5;
    float sin45 = sin(PI/5);// + t * 0.5;
    float cNew = c * cos45 - s * sin45;
    float sNew = s * cos45 + s * sin45;

    vec2 rotate2D = mat2(cos(a), -sin(a), sin(a), cos(a)) * uv;
    vec2 rotate2DTwo = mat2(cNew, sNew, -sNew, cNew) * uv;
    vec2 rotate2DOne = mat2(cos(-aTwo), sin(-aTwo), -sin(-aTwo), cos(-aTwo)) * uv;
    vec2 rotate2DThree = mat2(cos(-aThree), sin(-aThree), -sin(-aThree), cos(-aThree)) * uv;
    vec2 rotate2DFour = mat2(cos(-aThree), sin(-aThree), -sin(-aThree), cos(-aThree)) * uv;

    vec2 rotate2DClock = mat2(cos(a), sin(a), -sin(a), cos(a)) * uv;
    vec2 rotate2DClockOne = mat2(cos(aTwo), sin(aTwo), -sin(aTwo), cos(aTwo)) * uv;
    vec2 rotate2DClockThree = mat2(cos(aThree), sin(aThree), -sin(aThree), cos(aThree)) * uv;
    vec2 rotate2DClockTwo = mat2(cos(aThree), sin(aThree), -sin(aThree), cos(aThree)) * uv;
    vec2 reflection = mat2(cos(a), sin(a), sin(a), -cos(a)) * sFx * uv;

    int dtFx = int(mod(t / 1.0, 10.0 ));

    if(dtFx == 0){
        uv = rotate2DClockTwo;
    } else if(dtFx == 1){
        uv = rotate2DClock * sFx;
    } else if(dtFx == 2){
        uv = rotate2DClockOne;
    } else if(dtFx == 3){
        uv = rotate2DClockThree;
    } else if(dtFx == 4){
        uv = rotate2DClockTwo;
    } else if(dtFx == 5){
        uv = rotate2D * sinFxTwo;
    } else if(dtFx == 6){
        uv = rotate2DTwo;
    } else if(dtFx == 7){
        uv = rotate2DOne;
    } else if(dtFx == 8){
        uv = rotate2DThree;
    }  else {
        uv = rotate2DFour * sfxTwo;
    }
    
    float sqScale = sin(t) * 0.5 + 0.5;
    float sqScaleTwo = cos(t * 5.0) * 0.5 + 0.5;

    float clap = mod(3.0, t);
    uv.x += cos(uv.x * clap * 1.0);
    uv.x += sin(uv.y * clap * 1.0);
    uv.y += t * 0.5;
    uv += cos(uv.y * clap * 1.0);
    float scale = 4.0;
    vec2 id = floor(uv) * scale;
    uv = fract(uv) * scale;

    if(mod(id.x + id.y, 2.0) == 0.0){
        uv.x += clap * 0.5;
    }
    
    float d = sdBox(uv, vec2(sqScaleTwo,2.0));
    

    vec3 color = mix(vec3(1.0,1.,1.), vec3(d), 1.0);
    O = vec4(color, 1.0);
}