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

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 iResolution = u_resolution;
    float dt = u_time;
    vec2 mouse = u_mouse.xy / iResolution.xy;
    vec2 uv = fragCoord/iResolution.xy;// * 2.0 - 1.0;
    // uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x/iResolution.y;
    vec3 color = vec3(1.0);

    float grid = 0.6;
    vec2 cellId = floor((uv + 0.0) * grid);
    vec2 cellUV = uv; //fract((uv + 0.0) * grid);

    float frequency = 3.0;
    float lineWidth = 0.23;
    float waveAmplitude = 0.2;
    float waveFrequency = 4.0;
    float moveDt = dt * 1.0;
    float edgeFade = smoothstep(0.0, 0.3, cellUV.y);;

    cellUV.y += sin(moveDt + cellUV.x * waveFrequency + 0.2) * waveAmplitude  ;

    vec2 lightD = vec2(0.3, 0.4);
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
    vec3 rgbColor = pal( cellUV.x,  vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(2.0,1.0,0.0),vec3(0.5,0.20,0.25) );

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
  kuko-8.webm


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
  kuko-8-3.gif
*/
