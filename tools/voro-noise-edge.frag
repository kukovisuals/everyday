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


void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

#define H(n)  fract( 1e4 * sin( n.x+n.y/.7 +vec2(1,12.34)  ) )

// 2D Random
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
    int numOctaves = 10;
    for( int i=0; i<numOctaves; i++ )
    {
        t += a*noise(f*x);
        f *= 2.0;
        a *= G;
    }
    return t;
}
// fbm in [‑1,1] instead of [0,1]
float fbm11(vec2 p)
{
    return fbm(p, 0.9) * 1.9 - 1.0;
}


float rand(vec2 p) {                  // cheap 2‑D hash → [0,1)
    return fract(sin(dot(p, vec2(27.13, 91.17))) * 43758.5453);
}

// fabrice -> https://www.shadertoy.com/view/4dKSDV
#define H(n)  fract( 1e4 * sin( n.x+n.y/.7 +vec2(1,12.34)  ) )
vec3 voronoiDistSq(vec2 p, float dt)
{
    vec2 cellId, diff;
    float d;
    vec3 dists = vec3(1.5);       

    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        // diff   = H(cellId) + cellId - p;
        diff = H(cellId) + cellId + 0.05 * cos(dt + 6.28 * H(cellId)) - p;

        d = dot(diff, diff);      

        d < dists.x ? (dists.yz = dists.xy, dists.x = d) :
        d < dists.y ? (dists.z  = dists.y , dists.y = d) :
        d < dists.z ?               dists.z = d        :
                       d;
    }
    return dists;
}

vec3 voronoiDistSqEdge(vec2 p, float dt)
{
    vec2 cellId, diff;
    float d;
    vec3 dists = vec3(0.9);       

    p.y *= 0.4;
    p.x *= 0.8;
    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        // diff   = H(cellId) + cellId - p;
        diff = H(cellId) + cellId + 0.15 * cos(dt + 6.28 * H(cellId)) - p;
        // With this:

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
    vec2 uv = 2.5 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;

    uv.x += dt * 0.1;   
    // With this:
    vec2 distortion = vec2(fbm11(uv * 0.03), fbm11(uv * 0.03 + vec2(50.0))) * 1.0;

    vec3 d1 = voronoiDistSq(uv * 1.0 , dt);  
    vec3 d2 = voronoiDistSqEdge(uv * 5.0 * distortion, dt);  

    float w   = 3.0;
    float edgeDist = sqrt(d1.y) - sqrt(d1.x);
    float mask = smoothstep( w, 0.0, edgeDist ) *
                 smoothstep(-w, 9.0, -edgeDist);     
    
    vec3 col2 = 20.0 * sqrt(d2);
    col2 -= vec3(col2.x);
    col2 += 5.0 * ( col2.y / (col2.y / col2.z + 1.0) - 0.5 ) - col2;

    vec3 col1 = 4.0 * sqrt(d1);
    col1 -= vec3(col1.x );
    col1 += 8.0 * ( col1.y / (col1.y / col1.z + 1.0) - 0.5 ) - col1;

    

    vec3 finalColor = mix( col1, col2, mask );
    vec3 color = mix(vec3(1.0),vec3(0.0) , finalColor);

    fragColor = vec4( color, 1.0 );
}
