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

