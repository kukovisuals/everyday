#version 120
#ifdef GL_ES
precision highp float;
#endif
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform sampler2D u_text0;

float t = u_time;

void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}


// sdf of a circle 
float sdCircle(in vec3 p, float r){ return length(p) - r; }
// sdf of box 
float sdBox(in vec3 p, vec3 wh)
{
    p = abs(p) - wh;
    return length(max(p, 0.0)) + min(max(p.x, max(p.y, p.z)), 0.0);
}
// unions
float sdUnion(float sdf1, float sdf2){ return min(sdf1, sdf2); }
// subtraction
float sdSubtract(float sdf1, float sdf2){ return max(-sdf1, sdf2); }
// intersection 
float sdIntersect(float sdf1, float sdf2){ return max(sdf1, sdf2); }
//
float sdXor(float sdf1, float sdf2){ return max(min(sdf1, sdf2), -max(sdf1, sdf2)); }
// Y-axis rotation matrix  
mat3 rotateY(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat3(
          c, 0.0,   s,
        0.0, 1.0, 0.0,
         -s, 0.0,   c
    );
}
// Add noise function first (put this before map function)
float noise(vec3 p) {
    return sin(p.x * 7.0) * sin(p.y * 13.0) * sin(p.z * 11.0);
}
// Scene SDFS
float map(vec3 p)
{
    float planeDist = p.y + 10.0;
    // don't distord uv make a copy of it
    float zAxis = 0.0;
    float size = 1.0;
    float offSet = 0.2;

    vec3 newUv = p;
    vec3 uv2 = p;

    newUv += vec3(
        sin(p.y * 5.0 + t) * 0.1 ,
        sin(p.x * 8.0 + t * 3.2) * 0.08 ,
        sin(p.z * 6.0 + t * 0.8) * 0.12 
    );  
    uv2 += vec3(
        sin(p.y * 10.0 + t * 4.) * 0.1 ,
        sin(p.x * 10.0 + t * 3.2) * 0.01 ,
        sin(p.z * 4.0 + t * 0.2) * 0.12 
    );  
    float d = sdCircle( newUv - vec3(0.0 - offSet, 0.0, zAxis), size);

    float d2 = sdCircle(uv2 - vec3(0.2 - offSet, 0.0, zAxis), size);
    float box = sdBox(uv2 - vec3(0.0 - offSet, 0.0, zAxis), vec3(0.0, 0.1, 0.4));
    float spheres = sdUnion(d, d2);
    // return sdUnion(spheres, box);
    return spheres;
}

// Raymarch 
float raycast(vec3 ro, vec3 rd)
{
    float t = 0.0;

    for(int i = 0; i < 64; i++)
    {
        vec3 p = ro + t * rd;
        float d = map(p);

        if(d < 0.001 || t > 100.0) break;

        t += d;
    }

    return t;
}

// create camera ray
vec3 getRayDirection(vec2 uv, vec3 ro, vec3 ta)
{
    vec3 forward = normalize(ta - ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);

    return normalize(uv.x * right + uv.y * up + 2.0 * forward);
}

vec3 GetNormal( vec3 p )
{
    vec2 e = vec2(1.0, -1.0) * 0.0005;
    vec3 n = normalize(
        e.xyy * map(p + e.xyy) +
        e.yyx * map(p + e.yyx) +
        e.yxy * map(p + e.yxy) +
        e.xxx * map(p + e.xxx)
    );
    return n;
}

float GetLight(vec3 p)
{
    //float lightZ = (sin(u_time * 1.1) * 10.5 + 10.5);
    vec3 lightPos = vec3(20, 10,20);
    //lightPos.xz += vec2(sin(u_time)*2.0, cos(u_time)*2.0);
    vec3 l = normalize(lightPos-p);
    vec3 n = GetNormal(p);
    float dif = clamp(dot(n, l), 0.0, 1.0);
    float d = raycast(p + n* 0.1 * 2.0, l);
    if (d < length(lightPos - p)) dif *= 0.2;
    return dif;
}



void  mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - u_resolution.xy) / u_resolution.y;
    
    float an = u_time * 0.3;
    vec3 ro = vec3(0.0, 0.0, 2.0);
    vec3 ta = vec3(0.0, 0.0, 0.0);

    vec3 rd = getRayDirection(uv, ro, ta);

    //Raymarch scene
    float t = raycast(ro, rd);

    // float specialFx = sin(u_time * 6.0) * 0.2 + 0.2;
    vec3 color = vec3(0.1);
    
    int dtFx = int(mod(u_time / 3.0, 6.0));

    if(t < 60.0)
    {
        vec3 p = ro + t * rd;
        float d = map(p);

        float diff = GetLight(p);

        vec3 baseColor = vec3(0.922,0.275,0.188);
       

        // simple coloring of 2d 
        // color += vec3(diff);
        // color *= 1.0 - exp(-6. * abs(d));
        // color += vec3(d);
        color = baseColor * vec3(diff);
        // color *= 0.8 + 1.2 * cos( d * 10.);
    }
    O = vec4(color, 1.0);
}

