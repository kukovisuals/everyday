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

struct VoronoiResult {
    vec3 dists;        
    vec2 cellCenter;   
    vec2 toCenter;     
    vec2 cellId;       
};

VoronoiResult voronoiExtended(vec2 p, float dt)
{
    vec2 cellId, diff;
    float d;
    VoronoiResult result;
    result.dists = vec3(9.0);
    result.cellCenter = vec2(0.0);
    result.toCenter = vec2(0.0);
    result.cellId = vec2(0.0);
    
    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;

        vec2 cellCenter = H(cellId) + cellId;
        diff = H(cellId) + cellId - p; //+ 0.1 * cos(dt + 6.28 * H(cellId)) - p;
        
        d = dot(diff, diff);      

        if (d < result.dists.x) {
            result.dists.z = result.dists.y;
            result.dists.y = result.dists.x;
            result.dists.x = d;
            result.cellCenter = cellCenter;
            result.toCenter = diff;
            result.cellId = cellId;
        } else if (d < result.dists.y) {
            result.dists.z = result.dists.y;
            result.dists.y = d;
        } else if (d < result.dists.z) {
            result.dists.z = d;
        }
    }
    return result;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 iResolution = u_resolution;
    float dt = u_time;
    vec2 mouse = u_mouse.xy / iResolution.xy;
    vec2 uv = 3.0 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;// + dt * 0.01;   

    VoronoiResult voro = voronoiExtended(uv, dt);

    vec3 col1 = vec3(5.0) * sqrt(voro.dists);
    col1 -= vec3(col1.x);
    col1 += 10.0 * ( col1.y / (col1.y / col1.z + 1.0) - 0.5 ) - col1;

    vec3 finalColor = col1;

    fragColor = vec4( finalColor, 1.0 );
}

