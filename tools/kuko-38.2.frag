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


float sphere(vec3 p)
{
    // float spxTime = sin(u_time * 0.5) * 0.05 + 1.16;
    // its okay
    // float d = length(
    //     cos(p) + 0.125*atan(5.0*p.x*p.x) + 
    //     0.015*sin(15.0*(1.08*p.x - p.y + p.z + u_time * 0.2))) - 
    //     1.0 - 0.05;
    float d = length(
        cos((p +(p.x* 0.4))) + 0.125 *atan(9.0*p.x*p.x) + 
        0.015*sin(15.0*(3.08*p.x - p.y + p.z + u_time * 0.2))) - 
        1.0 - 0.05;
    return d;
}

float sdBox(in vec3 p, vec3 wh)
{
    p = abs(p) - wh;
    return length(max(p, 0.0)) + min(max(p.x, max(p.y, p.z)), 0.0);
}

mat3 rotateY(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat3(
          c, 0.0,   s,
        0.0, 1.0, 0.0,
         -s, 0.0,   c
    );
}

// Rotate around X-axis
mat3 rotateX(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat3(
        1.0, 0.0, 0.0,
        0.0,   c,  -s,
        0.0,   s,  c
    );
}


mat3 rotateZ(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat3(
        c,   -s,  0.0,
        s,   c,  0.0,
        0.0, 0.0, 1.0
    );
}

float map(vec3 p)
{
    p = rotateX(u_time * 0.0001) * p;
    float spxTime = sin(p.y * 0.002716) * 0.15 + 0.5;
    return sphere(p - vec3(4.5, 0.0 + u_time * spxTime , -1.0));
    // return sdBox(
    //     cos(p) + 0.03*cos(2.4*p.y*p.x) - 
    //     0.2*cos(10.0*(spxTime*p.x - p.z + p.z + u_time * 0.3)) -
    //     vec3(0.0, 0.0, -0.1), vec3(1.5, 0.8, 0.2));
}

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

vec3 getRayDirection(vec2 uv, vec3 ro, vec3 ta)
{
    vec3 forward = normalize(ta - ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    
    return normalize(uv.x * right + uv.y * up + 2.0 * forward);
}

vec3 getNormal(vec3 p)
{
    float eps = 0.001;
    return normalize(vec3(
        map(p + vec3(eps, 0, 0)) - map(p - vec3(eps, 0, 0)),
        map(p + vec3(0, eps, 0)) - map(p - vec3(0, eps, 0)),
        map(p + vec3(0, 0, eps)) - map(p - vec3(0, 0, eps))
    ));
}


void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - u_resolution.xy) / u_resolution.y;
    float dt = u_time;
    // camera static
    //vec3 ro = vec3(0.0, 0.0, 2.0);
    //vec3 ta = vec3(0.0, 0.0, 0.0);
    // camera moving
    float angle = dt * 0.2;  // Speed of rotation
    float cmrSpeed = 1.0;
    vec3 ro = vec3(0.0, 0.0, 2.0 - dt * cmrSpeed);
    vec3 ta = vec3(0.0, 0.0, -2.0 - dt * cmrSpeed); 

    vec3 rd = getRayDirection(uv, ro, ta);

    //Raymarch scene
    float t = raycast(ro, rd);

    vec3 color = vec3(0.1);
    if(t < 60.0)
    {
        vec3 p = ro + t * rd + 0.01;
        float d = map(p);

        // Simple lighting based on position
        //float lighting = 0.5 + 0.5 * sin(p.x) * cos(p.y);
        vec3 normal = getNormal(p);
        
        float lighting = max(0.0, dot(normal, normalize(vec3(0.0, 0.5, 1.0))));
        
        vec3 baseColor = vec3(0.922,0.275,0.188);

        int dtFx = int(mod(u_time / 5.0, 2.0));
        
        float ringDist = length(p.xy - vec2(0.0, -7.0)); 
        float rings = tan(ringDist * 0.80 + u_time * 0.1);
        baseColor = mix(
            vec3(0.4, 0.1, 0.1),  // Red rings
            vec3(0.1, 0.1, 0.8),  // Blue rings
            0.5 + 0.5 * rings
        );
        
        color = baseColor * lighting;
       
        
        

    }
    // color = vec3(uv.x);
    // O = vec4(color, 1.0);
    float ldt = sin(u_time * 3.1) * 1.6 + 6.6;
    ldt = clamp(1.0, 6.0,ldt);
    O = vec4(4.5 * color * exp(-t/(ldt)), 1.0);
}


// if(dtFx == 0){
        //     baseColor = vec3(
        //         (0.22,0.275,0.6188),
        //         0.5 + 0.5 * sin(p.x * 3.0 + u_time + 0.1),
        //         1.5 + 0.5 * sin(p.x * 3.0 + u_time + 0.5)
        //     );
        // } else if (dtFx == 1 ){
        //     // 🔥 EXAMPLE 2: Fire colors - hot at top, cool at bottom
        //     float heat = (p.y + 2.0) / 4.0; // Normalize height
        //     baseColor = mix(
        //         vec3(0.1, 0.0, 0.5),  // Cool blue/purple at bottom
        //         vec3(1.0, 0.5, 0.0),  // Hot orange at top
        //         heat
        //     );
        // } else if( dtFx == 2){
        //         // gummy    
        //     float pattern1 = sin(p.x * 2.0 + u_time) * cos(p.y * 3.0);
        //     float pattern2 = sin(p.z * 4.0 + u_time * 0.5);
        //     float combined = pattern1 + pattern2;
        //     baseColor = vec3(
        //         0.6 + 0.4 * sin(combined),
        //         0.4 + 0.6 * cos(combined + 1.0),
        //         0.5 + 0.5 * sin(combined + 2.0)
        //     );
        // } else if( dtFx == 3){
        //     // 🌊 EXAMPLE 4: Animated wave pattern
        //     float wave = sin(p.x * 5.0 + u_time) * cos(p.z * 5.0 + u_time * 0.7);
        //     baseColor = vec3(
        //         0.3 + 0.7 * wave,
        //         0.5 + 0.3 * wave,
        //         0.8 - 0.3 * wave
        //     );
        // } else if( dtFx == 4){
        //     float noise = sin(p.x * 3.0) * sin(p.y * 2.0) * cos(p.z * 4.0);
        //     float marble = 0.5 + 0.5 * sin(6.0 * (p.x + 0.5 * noise));
        //     baseColor = mix(
        //         vec3(0.9, 0.9, 0.8),  // Light marble
        //         vec3(0.4, 0.3, 0.2),  // Dark veins
        //         marble
        //     );
        // } else if( dtFx == 5){            
           
        // } else if( dtFx == 6){
        //     // 🌟 EXAMPLE 10: Complex multi-layered pattern
        //     float pattern1 = sin(p.x * 4.0 + u_time) * cos(p.y * 3.0);
        //     float pattern2 = sin(p.z * 6.0 + u_time * 0.5);
        //     float combined = pattern1 + pattern2;
        //     baseColor = vec3(
        //         0.6 + 0.4 * sin(combined),
        //         0.4 + 0.6 * cos(combined + 1.0),
        //         0.5 + 0.5 * sin(combined + 2.0)
        //     );
        // }