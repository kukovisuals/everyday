#version 120
#ifdef GL_ES
precision highp float;
#endif
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform sampler2D u_text0;
#define PI 3.14159265
void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}


float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    return mix(
        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 6; i++) {
        value += amplitude * noise3D(p * frequency);
        amplitude *= 0.35;
        frequency *= 1.0;
    }
    return value;
}
vec3 viridis(float t) 
{
    t = clamp(t, 0.0, 1.0);
    vec4 x1 = vec4(1.0, t, t * t, t * t * t);
    vec4 x2 = x1 * x1.w * t;
    return vec3(
        dot(x1, vec4(0.280268003, -0.143510503, 2.225793877, -14.815088879)) + dot(x2.xy, vec2(25.212752309, -11.772589584)),
        dot(x1, vec4(-0.002117546, 1.617109353, -1.909305070, 2.701152864)) + dot(x2.xy, vec2(-1.685288385, 0.178738871)),
        dot(x1, vec4(0.300805501, 2.614650302, -12.019139090, 28.933559110)) + dot(x2.xy, vec2(-33.491294770, 13.762053843))
    );
}
mat2 rotate2d(float a){
    return mat2(cos(a),-sin(a),sin(a),cos(a));
}
float sdCircle(vec3 p)
{
    float d = length(p) - 1.4632;

    if(d < 2.0)
    {
        vec3 new_p = p; float v;
        
        vec3 orig_p = p;
        // Large scale bumps (like the virus bulges)
        float largeBumps = fbm(orig_p * 0.9652 + u_time * 0.3101) * 0.2323;
        float fineBumps = noise3D(orig_p * 2.5 + u_time * 0.2401) * 0.305;
        d -= largeBumps + fineBumps;

        new_p.xz = rotate2d(u_time * 0.1) * new_p.xz;
        new_p /= length(new_p);
        // new_p.z += cos(new_p.x * 1.5) * 0.4 + 1.5;
        new_p.x = atan(new_p.x, new_p.z); new_p.y = asin(new_p.y);
        #if 0
            q.x *= v;
        #else 
            v = ceil(3.0 * abs(new_p.y) / 1.57 ) / 4.0;
            v = 12.0 * sqrt(1.0 - v*v);
            new_p.x *= floor(v + 0.1);
        #endif
        new_p.y *= 12.0;
        new_p = sin(new_p * 2.0);
        v = new_p.x * new_p.y;
        // v *= abs(v);
        v *= v < 0. ? 0.0 : v;
        v += sin(new_p.y * new_p.x * 0.3) * 0.4 + 0.5; 
        v = smoothstep(0.0, 0.8, v); // Ensures bounded, smooth transitions
        d -= v * 0.136531;
    }
    return d;
}

float map(vec3 p)
{
    return sdCircle(p);
}

float rayDirection(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    for(int i=0; i<80; i++)
    {
        vec3 p = ro + rd * dt;
        float d = map(p);
        dt += d;
        if(d<0.001 || dt>20.0) break;
    }
    return dt;
}

vec3 sdColor(vec3 ro, vec3 rd, float dt)
{
    vec3 color = vec3(0.0);
    vec3 p = ro + rd * dt;
    vec3 new_p = p;
    new_p /= length(new_p);
    float d = map(new_p);
    //float d = length(new_p);

    float colorV = sin(d * 8.0);
    float colorInit = (colorV + 0.6) * 0.5;

    // int color_fx = int(mod(t / 4.0, 6.0));
    color = viridis(colorInit); 
    return color;
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - u_resolution.xy) / u_resolution.y;
    vec3 color = vec3(0.0);

    vec3 ro = vec3(0.0,0.0,3.0);
    vec3 rd = normalize(vec3(uv,-1.0));

    float dt = rayDirection(ro, rd);
    if(dt < 10.0){
        color = sdColor(ro, rd, dt); // offset A
        //color += sdColor(ro, rd, dt, t, -B); // offset B
    }
    color = pow(color * 1.0, vec3(1.0/2.2));
    // color = vec3(dt * 0.2);

    O = vec4(color, 1.0);
}