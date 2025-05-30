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

float hash21(vec2 p){
    p = fract(p*vec2(123.34, 456.21));
    p += dot(p, p+34.345);
    return fract(p.x*p.y);
}
vec2 hash22(vec2 p){ return vec2(hash21(p), hash21(p+17.1)); }

float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

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

float fbm( in vec2 x, in float H )
{    
    float G = exp2(-H);
    float f = 1.0;
    float a = 1.0;
    float t = 0.0;
    float numOctaves = 10.0;
    for( int i=0; i<numOctaves; i++ )
    {
        const mat2 m = mat2( 1.6, 1.2, -1.2, 1.6 );
        x = m * x;               // inside each octave loop
        t += a*noise(f*x);
        f *= 2.0;
        a *= G;
    }
    return t;
}

float fbm11(vec2 p)
{
    return fbm(p, 0.9) * 1.9 - 1.0;
}

float simpleLine(vec2 uv, float dt){

    float frequency = 0.2525;
    float lineWidth = 0.2123683;
    float waveAmplitude = 0.05;
    float waveFrequency = 1.1;
    float moveDt = dt * 1.0;

    float n = fbm11(uv * 1.0 + dt * 0.0329);   
    uv.y += sin(moveDt + uv.x * waveFrequency + 0.0) * waveAmplitude + n * 0.5923;
    
    float xRepeat = mod(uv.y * frequency, 0.4);
    float line = smoothstep(0.0, 0.1, xRepeat) 
                - smoothstep(lineWidth - 0.01, lineWidth, xRepeat);

    return line;
}

vec2 rotate2D(vec2 _st, float _angle){
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

float rose(vec2 p, float a, float k, float stroke, float dt){
    float r = length(p) * (5.0 + hash22(p).x * 10.0);                 // actual radius
    float t = atan(p.y, p.x);            // angle θ
    float n = fbm11(p * 9.0 + dt * 0.5);   // ≈ soft, slow ripple
    float target = -3.1 * a * abs(sin(k*t));    // desired rose radius (abs → always ≥0)
    return abs(r - target) - stroke;     // signed distance to the curve
}


void colorPalette(int effectIndex, vec2 uv, out vec3 bg, out vec3 rgbColor){
    float hue = mod(uv.y / 0.6 + uv.x, 1.0);
    rgbColor = vec3(0.051,0.043,0.043);
    // bg  = vec3(0.149,0.129,0.133);         
    
    bg = vec3(0.631,0.847,0.969);
    rgbColor = pal(uv.y,vec3(0.129,0.404,0.49),vec3(0.153,0.024,0.002),vec3(0.169,0.514,0.549),vec3(0.153,0.424,0.502) );
}

void initRose(vec2 uv, float dt, out float d, out float stroke, out float edge){
    float grid = 20.0;                        // 10 × 10 rose tiles
    vec2  cellId = floor(uv * grid);          // integer ID per cell
    vec2  cellUv = fract(uv * grid) - 0.5;    // local coords (‑0.5…0.5)
    vec2 jitter   = (hash22(cellId) - 0.5) * 0.6;
    cellUv += jitter;

    /*–‑‑ rose parameters –‑‑*/
    float petals  = 6.0;   
    float radius  = 0.6;   
    stroke  = 0.3;  

    /*–‑‑ distance to flower outline –‑‑*/
    cellUv += 0.5;
    cellUv = rotate2D(cellUv, dt * 0.2);
    cellUv -= 0.5;
    d = rose(cellUv, radius, petals, stroke, dt);
    edge = smoothstep(0.0, -stroke, d);
}

void randomLightEffect(out vec3 glowColor, out float glowMask, out float glowBoost, float d){
    float glowWidth   = 0.12;                       
    glowMask    = 1.0 - smoothstep(0.0, glowWidth, d);
    glowColor   = vec3(1.00, 0.65, 0.85);     
    glowBoost   = 1.3;  
}
int effectIndex = 0;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 iResolution = u_resolution;
    float dt = u_time;
    vec2 mouse = u_mouse.xy / iResolution.xy;
    vec2 uv = fragCoord/iResolution.xy;// * 2.0 - 1.0;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;   // keep circle round

    float line = simpleLine(uv, dt);
    int effectIndex = int(mod(dt / 2.0, 6.0));

    float d, stroke, edge;
    initRose(uv, dt, d, stroke, edge);  

    /*–‑‑ glow –‑‑*/
    vec3 glowColor;
    float glowMask, glowBoost;
    randomLightEffect(glowColor, glowMask, glowBoost, d);                 

    /*–‑‑ colors –‑‑*/
    vec3 bg, rgbColor;
    colorPalette(effectIndex, uv, bg, rgbColor);

    vec3 baseColor = mix(bg, rgbColor, line);  
    vec3 col  = mix(baseColor, vec3(1.0), edge); // pink line
    col += glowColor * glowMask * glowBoost;   
    fragColor = vec4(col, 1.0);
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
  kuko-15.gif

  ffmpeg -framerate 30 -pattern_type glob -i '*.png' \
  -vf "fps=30,scale=1080:1350:force_original_aspect_ratio=decrease,pad=1080:1350:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p" \
  -c:v h264_videotoolbox -b:v 10M -maxrate 12M -bufsize 20M \
  -profile:v high -level 4.0 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  kuko-9.mp4

*/
