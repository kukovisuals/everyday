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

void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}


#define ANIMATE

vec2 hash2( vec2 p )
{
	// texture based white noise
	// return textured( u_text0, (p+0.5)/256.0, 0.0 ).xy;
	
    // procedural white noise	
	return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

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


vec3 voronoi( in vec2 uv, float dt )
{
    vec2 cellId    = floor(uv);   // which integer cell we’re in
    vec2 cellUV         = fract(uv);   // 0‑1 position inside that cell

    // --- pass 1: find the nearest seed (a.k.a. site) -------------------------
    vec2 bestVector  = vec2(0.0);   // vector from pixel → closest seed
    vec2 bestOffset  = vec2(0.0);   // grid offset of that closest seed
    float bestDist   = 8.0;         // squared distance to the closest seed

    for (int dy = -1; dy <= 1; dy++)
    for (int dx = -1; dx <= 1; dx++)
    {
        vec2 neighborOffset = vec2(float(dx), float(dy));
        vec2 seed           = hash2(cellId + neighborOffset);   // random point
    #ifdef ANIMATE
        seed = 0.5 + 0.5 * sin(dt + 6.28318 * seed);          // wiggle over dt
    #endif
        vec2 toSeed   = neighborOffset + seed - cellUV;
        float dist2   = dot(toSeed, toSeed);

        if (dist2 < bestDist)
        {
            bestDist   = dist2;
            bestVector = toSeed;
            bestOffset = neighborOffset;
        }
    }

    // --- pass 2: distance from the pixel to the nearest **edge** -------------
    bestDist = 8.0;   // reuse as “edge distance” now

    for (int dy = -2; dy <= 2; dy++)
    for (int dx = -2; dx <= 2; dx++)
    {
        vec2 neighborOffset = bestOffset + vec2(float(dx), float(dy));
        vec2 seed           = hash2(cellId + neighborOffset);
    #ifdef ANIMATE
        seed = 0.5 + 0.5 * sin(dt + 6.28318 * seed);
    #endif
        vec2 toSeed = neighborOffset + seed - cellUV;

        // skip the winner itself
        if (dot(bestVector - toSeed, bestVector - toSeed) > 0.00001)
        {
            // project pixel onto the bisector between the two seeds
            float edgeDist = dot(0.5 * (bestVector + toSeed),
                                 normalize(toSeed - bestVector));
            bestDist = min(bestDist, edgeDist);
        }
    }

    // return:  x = distance to nearest cell edge
    //          yz = vector toward nearest seed (can be used for coloring)
    float n = fbm11(uv * 5.0 + dt * 0.5329);   
    return vec3(bestDist   + n * 0.01, bestVector  + n * 0.04 );
}

int effectIndex = 0;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 iResolution = u_resolution;
    float dt = u_time;
    vec2 mouse = u_mouse.xy / iResolution.xy;
    vec2 uv = fragCoord/iResolution.xx;// * 2.0 - 1.0;

    vec2  scaledUV = 8.0 * uv;    
    vec3 c = voronoi( scaledUV, dt * 0.2 );
    vec3 col = vec3(1.0);
    // vec3 c = scaleFactor( 2.0*uv, dt * 0.1 );

    // float r = length(c.yz);                 // 0 at seed → 1 at far corner
    // vec3 col = c.x * (2.0 - 1.5 * sin(30 * noise(c.yz)) + sin(40.0 * c.y))*vec3(1.0);


    /* ---------- cell‑constant data ----------------------------------------- */
    vec2  cellId = c.zy;          // same 8× scale you already use
    vec2  cellUV = c.zy;          // 0‑1 coords inside that cell

    /* ---------- dot lattice ------------------------------------------------- */
    // 1. map the cell into a *hex‑friendly* coordinate system
    const float SQRT3 = 1.7320508;
    vec2  hexUV   = vec2( cellUV.x + cellUV.y* 0.1,
                        cellUV.y * SQRT3/1.5 );

    /* 2. pick a lattice spacing (≈ how many dots per cell edge) */
    float spacing = 0.50;                      // tweak: smaller = more dots
    vec2  gridId  = floor( hexUV / spacing );
    vec2  gv      = hexUV - gridId*spacing - spacing*0.5;

    /* 3. organic *jitter* using simple trig + hash --------------------------- */
    float ang = 6.28318 * hash2(cellId + gridId).x;    // random angle 0‑2π
    gv += 0.01 * vec2( cos(ang), sin(ang) );          // pull off the grid

    /* ---------- draw the circle -------------------------------------------- */
    float r     = length( gv );               // radial distance to this lattice point
    float mask  = 1.0 - smoothstep(0.0, 0.3, r);  // radius ≈0.04, soft edge

    /* ---------- fade dots near Voronoi walls so they stay inside ----------- */
    float wall  = smoothstep(0.02, 0.09, c.x);       // uses your existing edge dist

    /* ---------- colour blend ------------------------------------------------ */
    vec3 dotCol = vec3(0.35, 0.8, 0.25);             // leafy green
    col         = mix( col, dotCol, mask * wall );

    // borders	
    col = mix( vec3(0.9), col, smoothstep( 0.00, 0.02, c.x )  );
	fragColor = vec4(col,1.0);
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

  ffmpeg -framerate 30 -pattern_type glob -i '*.png' \
  -vf "fps=30,scale=1080:1350:force_original_aspect_ratio=decrease,pad=1080:1350:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p" \
  -c:v h264_videotoolbox -b:v 10M -maxrate 12M -bufsize 20M \
  -profile:v high -level 4.0 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  kuko-9.mp4

*/
