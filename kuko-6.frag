#version 120

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
#define PI 3.14159265358979323846

void mainImage(out vec4 fragColor, in vec2 fragCoord);

// Adapter to match glslViewer expectations
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

// using for functions -> https://www.desmos.com/calculator
int effectIndex = 0;

vec2 rotate2D(vec2 _st, float _angle){
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

mat2 scale(vec2 _scale){
    return mat2(_scale.x,0.0,
                0.0,_scale.y);
}

float modulatedSine(float time, float baseOffset, float amplitude, 
                    float frequency1, float frequency2, float phase) {
    return baseOffset + amplitude * (sin(phase + frequency1 * time) * sin(frequency2 * time));
}

float powSine(float time, float power, float frequency, float phase) {
    return pow(sin(phase + frequency * time), power);
}

float random (vec2 st) {
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

float shapeA (vec2 cellUv, float borderLeft, float borderRight, float columnRight, float borderWidth){
    float wave =  0.2 * sin(cellUv.y * 10.0) - 0.28; // amplitude * sin(freq * y + time)
    float distortedX = cellUv.x + wave;
    float waveTwo =  0.5 * cos(cellUv.y * 9.0) ;
    float distortedY = cellUv.y + waveTwo;

    float left = step(borderLeft, distortedX) - step(borderLeft + borderWidth, distortedX);
    float row = step(columnRight, cellUv.y) - step(columnRight + borderWidth, cellUv.y); //- step(0.99 , cellUv.x);
    float colR =  step(borderRight, distortedX) - step(borderRight + borderWidth, distortedX) ;

    row *= step(0.99 , cellUv.x);
    float finalShape = left + row + colR;

    return finalShape;
}

vec2 tilePattern( vec2 cellUv, vec2 cellId, float dt){
    float index  = 0.0;
    index += step(0.5, mod(cellUv.x, 2.0));
    index += step(0.5, mod(cellUv.y, 1.0)) * 2.0;

    float speed = 0.15;

    if(index == 1.0){
        cellUv = rotate2D(cellUv, PI);
        cellUv = fract( vec2(cellUv.x, cellUv.y + (dt * speed))  * 1.0);
    } else if(index == 2.0){
        cellUv = rotate2D(cellUv, PI * 2.0  );
        cellUv = fract( vec2(cellUv.x, cellUv.y + (dt * speed))  * 1.0);
    } else if(index == 3.0){
        cellUv = rotate2D(cellUv, PI * 0.5);
        cellUv = fract( vec2(cellUv.x, cellUv.y + (dt * speed))  * 1.0);
    } else if(index == 0.0){
        cellUv = rotate2D(cellUv, PI * - 0.5);
        cellUv = fract( vec2(cellUv.x, cellUv.y + (dt * speed))  * 1.0);
    }

    return cellUv;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 iResolution = u_resolution;
    float dt = u_time;
    vec2 mouse = u_mouse.xy / iResolution.xy;
    vec2 uv = fragCoord/iResolution.xy;// * 2.0 - 0.0;
    vec3 color = vec3(0.0);

    float gridSize = 6.0;
    vec2 cellId = floor(uv * gridSize);
    vec2 cellUv = fract(uv * gridSize);

    cellUv = tilePattern(cellUv, cellId, dt);

    float borderLeft = 0.2;
    float borderRight = 0.7;
    float columnRight = 0.5;
    float borderWidth = 0.1;

    float finalShape = shapeA(cellUv, borderLeft, borderRight, columnRight, borderWidth);

    color = vec3(finalShape);

    fragColor = vec4(color, 1.0);
}




    
    


/*
    ffmpeg -framerate 60 -pattern_type glob -i '*.png' \
  -c:v libvpx-vp9 \
  -b:v 0 -crf 30 \
  -row-mt 1 \
  -tile-columns 2 -tile-rows 2 \
  -threads 8 \
  -speed 1 \
  -frame-parallel 0 \
  -auto-alt-ref 1 \
  -lag-in-frames 25 \
  -g 240 \
  -pix_fmt yuv420p \
  -an \
  kuko-4.webm


    ffmpeg -framerate 60 -pattern_type glob -i '*.png' \
  -c:v libx264 -preset medium \
  -crf 18 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  -an \
  -threads 8 \
  kuko.mp4


  ffmpeg -framerate 60 -pattern_type glob -i '*.png' -vf "fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=full:reserve_transparent=0[p];[s1][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle" kuko-4.gif

  ffmpeg -framerate 60 -pattern_type glob -i '*.png' \
  -vf "fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=full:reserve_transparent=0[p];[s1][p]paletteuse=dither=floyd_steinberg:diff_mode=rectangle" \
  -threads 8 \
  -loop 0 \
  kuko-6.gif
*/
