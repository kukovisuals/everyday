#version 120
#ifdef GL_ES
precision highp float;
#endif
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform sampler2D u_text0;

void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

float random(in vec2 p )
{
    return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(in vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);

    // four corners in 2d tile
    float a = random( i );
    float b = random( i + vec2(1.0, 0.0));
    float c = random( i + vec2(0.0, 1.0));
    float d = random( i + vec2(1.0, 1.0));

    // cubic hermin curve 
    vec2 u = f * f * (3.0 - 2.0 * f);

    // mix 4 courenrs percentage 
    return mix(a, b, u.x) + 
        (c - a) * u.y * (1.0 - u.x) + 
        (d - b) * u.x * u.y;
}


vec2 grad( ivec2 z )  // replace this anything that returns a random vector
{
    // 2D to 1D  (feel free to replace by some other)
    int n = z.x+z.y*11111;

    // Hugo Elias hash (feel free to replace by another one)
    n = (n<<13)^n;
    n = (n*(n*n*15731+789221)+1376312589)>>16;

#if 0

    // simple random vectors
    return vec2(cos(float(n)),sin(float(n)));
    
#else

    // Perlin style vectors
    n &= 7;
    vec2 gr = vec2(n&1,n>>1)*2.0-1.0;
    return ( n>=6 ) ? vec2(0.0,gr.x) : 
           ( n>=4 ) ? vec2(gr.x,0.0) :
                              gr;
#endif                              
}

float noiseTwo( in vec2 p )
{
    ivec2 i = ivec2(floor( p ));
     vec2 f =       fract( p );
	
	vec2 u = f*f*(3.0-2.0*f); // feel free to replace by a quintic smoothstep instead

    return mix( mix( dot( grad( i+ivec2(0,0) ), f-vec2(0.0,0.0) ), 
                     dot( grad( i+ivec2(1,0) ), f-vec2(1.0,0.0) ), u.x),
                mix( dot( grad( i+ivec2(0,1) ), f-vec2(0.0,1.0) ), 
                     dot( grad( i+ivec2(1,1) ), f-vec2(1.0,1.0) ), u.x), u.y);
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 iResolution = u_resolution;
    vec2 uv = (2.0 * I - iResolution) / iResolution.y;
    float t = u_time;
    uv += t * 0.01;

    uv.y = sin(uv.y * 2.0) * 3.9  - 0.5;
    uv.y += cos(uv.y * 2.0);
    // 2- Value noise variations
    float noiseVar = sin( t * 0.5) * 3.0 + 6.0;
    // 1. - Implement basic noise from scratch
    float n = noise(uv * noiseVar);
    n = noiseTwo(uv * 3.0);
    // 3- Gradient noise experiments
    float wave = sin( n * uv.y * 2.0 + t * 4.0);
    
    wave = pow(abs(wave), 0.5);

    vec3 color = vec3(wave - 1.0, wave * 0.7, 1.9 - wave);

    O = vec4(color , 1.0);
}