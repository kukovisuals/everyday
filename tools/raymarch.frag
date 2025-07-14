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

// SDF of a sphere
float sdSphere(vec3 p, float r) { 
    return length(p) - r; 
}

// Scene - ONLY the sphere
float map(vec3 p) {
    return sdSphere(p, 1.0); // 1.0 radius sphere at origin
}

// Simple raymarching
float raycast(vec3 ro, vec3 rd) {
    float t = 0.0;
    
    for(int i = 0; i < 32; i++) { // Reduced iterations
        vec3 p = ro + t * rd;
        float d = map(p);
        
        if(d < 0.001 || t > 20.0) break;
        t += d;
    }
    
    return t;
}

// Camera ray direction
vec3 getRayDirection(vec2 uv, vec3 ro, vec3 ta) {
    vec3 forward = normalize(ta - ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    
    return normalize(uv.x * right + uv.y * up + 2.0 * forward);
}

void mainImage(out vec4 O, in vec2 I) {
    vec2 uv = (2.0 * I - u_resolution.xy) / u_resolution.y;
    
    // Camera setup
    vec3 ro = vec3(0.0, 0.0, 3.0);  // Camera position
    vec3 ta = vec3(0.0, 0.0, 0.0);  // Look at origin
    
    vec3 rd = getRayDirection(uv, ro, ta);
    
    // Raycast the scene
    float t = raycast(ro, rd);
    
    // Simple coloring
    vec3 color = vec3(0.1, 0.1, 0.2); // Dark background
    
    if(t < 20.0) {
        color = vec3(0.8, 0.4, 0.2); // Orange sphere
    }
    
    O = vec4(color, 1.0);
}

// #version 120
// #ifdef GL_ES
// precision highp float;
// #endif
// uniform vec2 u_resolution;
// uniform float u_time;
// uniform vec2 u_mouse;
// uniform sampler2D u_text0;

// void mainImage(out vec4 fragColor, in vec2 fragCoord);

// void main() 
// {
//     mainImage(gl_FragColor, gl_FragCoord.xy);
// }

// float map(vec3 p)
// {
//     return length(p) - 1.0;
// }
// void mainImage(out vec4 O, in vec2 I)
// {
//     vec2 uv = (2. * I - u_resolution) / u_resolution.y;

//     // init camera 
//     vec3 rayOrigin    = vec3(0.0, 0.0, -3.0); // ray origin
//     vec3 rayDirection = normalize(vec3(uv, 1.0)); // ray direction  

//     // total distance travel 
//     float distTravel = 0.0;
//     // Raymarching 
//     for(int i=0; i<100; i++)
//     {
//         vec3 p = rayOrigin + rayDirection * distTravel; // position along the ray

//         float d = map(p); // current distance to the scen 

//         distTravel += d;// march ray

//         if(d < 0.001 || distTravel > 20.0) break;
//     }
    
//     vec3 color = vec3(-uv.y);

//     if(distTravel < 16.0){
//         color = vec3(1.0);
//     }
//     O = vec4(color, 1.0 );
// }