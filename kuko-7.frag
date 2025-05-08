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

vec2 rotate2D(vec2 _st, float _angle){
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

float random (vec2 st) {
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

vec3 triangle(vec2 cellUV){
    float d = 0.0;
    // Number of sides of your shape
    int N = 3;
    // Angle and radius from the current pixel
    float a = atan(cellUV.x,cellUV.y) + PI;
    float r = TWO_PI / float(N);
    // Shaping function that modulate the dicellUVance
    d = cos(floor(0.5 + a/r) * r-a) * length(cellUV);
    vec3 shape = vec3(1.0 - smoothstep(0.4, 0.41, d));

    return shape;
}

vec2 tileAnimation(vec2 cellUV, vec2 tileIndex, float dt) {
    float speed = 1.0;

    float modX = mod(tileIndex.x + 5.0, 4.0); // shift to positive range
    float phase = mod(floor(dt), 2.0); // 0 or 1 every second
    
    if(phase == 0.0){
        // go up and down 
        if (modX == 0.0) {
            cellUV = fract((cellUV * 0.5 + 0.5) + vec2(0.0, dt * speed)) * 2.0 - 1.0;
        } else if (modX == 2.0) {
            cellUV = fract((cellUV * 0.5 + 0.5) - vec2(0.0, dt * speed)) * 2.0 - 1.0;
        }
    } else {
        // go side ways 
        if (modX == 0.0) {
            cellUV = fract((cellUV * 0.5 + 0.5) + vec2(dt * speed, 0.0)) * 2.0 - 1.0;
        } else if (modX == 2.0) {
            cellUV = fract((cellUV * 0.5 + 0.5) - vec2( dt * speed, 0.0)) * 2.0 - 1.0;
        }
    }

    return cellUV;
}

vec3 trianglePattern(vec2 cellUV){
    vec2 p1 = cellUV - vec2(-1.0, -0.6);
    
    cellUV = rotate2D(cellUV, PI);
    vec2 p2 = cellUV - vec2(0.0, 0.4);

    cellUV = rotate2D(cellUV, TWO_PI);
    vec2 p3 = cellUV - vec2(2.0, 0.4);

    cellUV = rotate2D(cellUV, PI);
    vec2 p4 = cellUV - vec2(1.0, -0.6);

    return triangle(p1) + triangle(p2) + triangle(p3) + triangle(p4);
}

vec3 colombianFlagColor(float y) {
    if (y > 1.0 / 3.0) {
        return vec3(1.0, 1.0, 0.0); // yellow
    } else if (y > -1.0 / 3.0) {
        return vec3(0.0, 0.0, 1.0); // blue
    } else {
        return vec3(1.0, 0.0, 0.0); // red
    }
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 iResolution = u_resolution;
    float dt = u_time;
    vec2 mouse = u_mouse.xy / iResolution.xy;
    vec2 uv = fragCoord/iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x/iResolution.y;
    vec3 color = vec3(0.0);

    vec2 grid = vec2(3.0);  // how many tiles you want * 2 
    vec2 tileIndex = floor(uv * grid) * 2.0 - 1.0;
    vec2 cellUV = fract(uv * grid) * 2.0 - 1.0;

    cellUV = tileAnimation(cellUV, tileIndex, dt);

    color = trianglePattern(cellUV);

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
  kuko-7.gif
*/
