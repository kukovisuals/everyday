#version 120

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
#define PI 3.14159265358979323846
#define TWO_PI 6.28318530718

void mainImage(out vec4 fragColor, in vec2 fragCoord);

// Adapter to match glslViewer expectations
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

// using for functions -> https://www.desmos.com/calculator
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}
// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

vec2 noiseGradient(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // Corner random values
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Gradient calculation
    float fx = f.x;
    float fy = f.y;

    float dx = 6.0 * fx * (1.0 - fx) * (
        (a - b) * (1.0 - fy) +
        (d - b) * fy -
        (c - a) * fy
    );

    float dy = 6.0 * fy * (1.0 - fy) * (
        (c - a) * (1.0 - fx) +
        (d - b) * fx
    );

    return vec2(dx, dy);
}

float modulatedSine(float time, float baseOffset, float amplitude, 
                    float frequency1, float frequency2, float phase) {
    return baseOffset + amplitude * (sin(phase + frequency1 * time) * sin(frequency2 * time));
}

vec2 simulatedMouse(float time, float scale) {
    float x = sin(time * 0.07);
    float y = cos(time * 0.09);
    return vec2(x, y) * scale;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 iResolution = u_resolution;
    float dt = u_time;
    vec2 mouse = u_mouse.xy / iResolution.xy;
    vec2 uv = fragCoord/iResolution.xy;// * 2.0 - 1.0;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x/iResolution.y;
    vec3 color = vec3(0.0);
    
    
    float dc1 = modulatedSine(dt, 3.14, 0.01, 1.0, 1.0, 1.9);
    float dc2 = modulatedSine(dt, 0.32, 0.2, 1.76, 1.0, 2.9);
    float dc3 = modulatedSine(dt, 0.32, 0.2, 1.76, 1.0, 2.9);
    // float dc1 = compositeSine(dt, 0.5, 0.434, 3.0, 0.17, 1.0);
    vec2 pos = vec2((uv + (mouse * 10.0)) * 1.5 * dc1);// * uv.x + 0.4;
    vec2 fakeMouse = simulatedMouse(dt, 1.0); // 0.3 controls how much it "moves"
    pos = (uv + fakeMouse) * 1.5 * dc1;


    float grid = 0.6;
    vec2 cellId = floor((uv + 1.0) * grid);
    /*
        * Change to look at the shape pre noise 
    */
    // vec2 cellUV = uv; //fract((uv + 0.0) * grid);
    vec2 cellUV = vec2(noise(pos), noise(pos));

    float frequency = 0.45;
    float lineWidth = 0.09123;
    float waveAmplitude = 0.341;
    // float waveFrequency = 10.0;
    float waveFrequency = 30.0;
    float moveDt = dt * 0.8;
    float edgeFade = smoothstep(0.0, 0.3, cellUV.y);;

    cellUV.y += sin(moveDt + cellUV.x * waveFrequency + 0.2) * waveAmplitude;
    // float angle = atan(cellUV.y, cellUV.x);
    // float radius = length(cellUV);
    // cellUV.y += sin(radius * 10.0 + angle * 1.0 - moveDt);

    vec2 lightD = vec2(dc2, 0.4);
    float gradientY =  cos(moveDt + waveFrequency * cellUV.x) * waveAmplitude *edgeFade;
    vec2 normal = normalize(vec2(-gradientY, 1.0));
    float hitPoint = pow(dot(normal, normalize(lightD)), 8.0);

    float xRepeat = mod(cellUV.y * frequency, 0.4);
    float line = smoothstep(0.0, 0.1, xRepeat) 
                - smoothstep(lineWidth - 0.01, lineWidth, xRepeat);
    
    float fade = 0.2;
    float verticalFade = smoothstep(fade, 0.0, cellUV.y) 
                    * (1.0 - smoothstep(1.0 - fade, 1.0, cellUV.y));
    line += hitPoint;

    float hue = mod(uv.y / grid + uv.x, 1.0);
    // vec3 rgbColor = pal( cellUV.x,  vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(2.0,1.0,0.0),vec3(0.5,0.20,0.25) );
    // vec3 rgbColor = pal( cellUV.x,  vec3(0.008,0.286,0.349), vec3(0.012,0.498,0.549), vec3(0.5,0.5,0.5) , vec3(0.012,0.549,0.549) );
    vec3 rgbColor = pal( cellUV.x,  vec3(0.008,0.5286,0.8349), vec3(0.8,0.7,0.7), vec3(0.286,0.694,0.592) , vec3(0.012,0.549,0.549) );
    // vec3 rgbColor = pal( cellUV.x,  vec3(0.8,0.5,0.4),vec3(0.2,0.4,0.2),vec3(2.0,1.0,1.0),vec3(0.0,0.25,0.25) );

    color = rgbColor * line; 
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
  kuko-10.gif

  ffmpeg -framerate 30 -pattern_type glob -i '*.png' \
  -vf "fps=30,scale=1080:1350:force_original_aspect_ratio=decrease,pad=1080:1350:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p" \
  -c:v h264_videotoolbox -b:v 10M -maxrate 12M -bufsize 20M \
  -profile:v high -level 4.0 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  kuko-9.mp4

*/
