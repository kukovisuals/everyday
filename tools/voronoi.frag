#version 120
#ifdef GL_ES
precision highp float;
#endif
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform sampler2D u_text0;
#define PI 3.14159265358979323846
#define TWO_PI 6.28318530718
#define ANIMATE
#define H(n)  fract( 1e4 * sin( n.x+n.y/.7 +vec2(1,12.34)  ) )

void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

// fabrice -> https://www.shadertoy.com/view/4dKSDV

vec3 voronoiDistSq(vec2 p, float dt)
{
    vec2 cellId, diff;
    float d;
    vec3 dists = vec3(9.0);       

    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        diff   = H(cellId) + cellId - p;


        d = dot(diff, diff);      

        d < dists.x ? (dists.yz = dists.xy, dists.x = d) :
        d < dists.y ? (dists.z  = dists.y , dists.y = d) :
        d < dists.z ?               dists.z = d        :
                       d;
    }
    return dists;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 iResolution = u_resolution;
    float dt = u_time;
    vec2 mouse = u_mouse.xy / iResolution.xy;
    vec2 uv = 3.0 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;// + dt * 0.01;   

    vec3 d1 = voronoiDistSq(uv, dt);

    vec3 col1 = vec3(5.0) * sqrt(d1); 
    col1 -= vec3(col1.x);
    col1 += 10.0 * ( col1.y / (col1.y / col1.z + 1.0) - 0.5 ) - col1;

    vec3 finalColor = col1;

    fragColor = vec4( finalColor, 1.0 );
}


/*
    glslViewer kuko-16.frag -w 1080 -h 1920 --headless \
    -E "record,reel.mp4,0,60,300"

glslViewer kuko-16.frag -w 1080 -h 1920 --headless \
  -E record,reel.mp4,0,5,60


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

  ffmpeg -framerate 30 -pattern_type glob -i '*.png' \
  -vf "fps=30,scale=1080:1350:force_original_aspect_ratio=decrease,pad=1080:1350:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p" \
  -c:v h264_videotoolbox -b:v 10M -maxrate 12M -bufsize 20M \
  -profile:v high -level 4.0 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  kuko-9.mp4

*/
