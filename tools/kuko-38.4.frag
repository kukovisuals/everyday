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
    float d = length(cos(p) + 0.05*cos(9.0*p.y*p.x) - 0.1*cos(9.0*(0.3*p.x - p.y + p.z + u_time))) - 0.4614;

    return d;
}

float sdOctahedron( vec3 p, float s )
{
  p = abs(cos(p) + .095*cos(1.0*p.y*p.x) - 0.01*cos(1.0*(0.3*p.x - p.y + p.z + u_time)));
//   p = abs(cos(p) - .01 + .3 * sin(p.yzx/10.6 + 0.21*sin(p.zxy/.1) - p.z + u_time));
//   p = .01 + .3 * abs( cos( dot( cos(p), sin(p.yzx/.6 + .1*sin(p.zxy/.1) ) /.1) ));
//   .01 + .3 * abs(cos(dot(cos(p), sin(p.yzx/.6 + .1*sin(p.zxy/.1))/.1)))
  float m = p.x+p.y+p.z-s;
  vec3 q;
       if( 3.0*p.x < m ) q = p.xyz;
  else if( 3.0*p.y < m ) q = p.yzx;
  else if( 3.0*p.z < m ) q = p.zxy;
  else return m*0.57735027;
    
  float k = clamp(0.5*(q.z-q.y+s),0.0,s); 
  return length(vec3(q.x,q.y-s+k,q.z-k)); 
}

float tunnel(vec3 p)
{
    // Move along Z
    p.z -= u_time;
    

    float d = .001 + 0.5 * abs(
        cos(dot(cos(p), sin(p.xyy/.48 + 
        0.1*cos(p.zxy/.9))/1.1)));
    
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
    p = rotateZ(u_time * 0.1) * p;
    // return sphere(p - vec3(0.0, 0.0, -3.0 + u_time * 0.1));
    // return tunnel(1.5 * p - vec3(5.0, 1.0, 1.0 + u_time * 0.1));
    float rad = 0.1*(0.5+0.5*sin(u_time*2.0));
    return sdOctahedron(p - vec3(0.0, 0.0 + u_time * 0.03, -3.0),1.1-rad) - rad;
    float spxTime = sin(u_time * 0.5) * 0.3 + 0.5;
    /*
        Box effect
    */
    // return sdBox(
    //     cos(p + 0.0) + 0.043 * sin(0.025 * p.z * p.x ) - 
    //     0.42 * cos(1.5 *( 0.15 * p.y * p.y + p.y + u_time * 0.5)) - 
    //     vec3(2.3, 0.0, 0.1), vec3(1.6, 0.7, 0.5));
    // return complexSDF(p - vec3(0.0, 0.0, -3.0 + u_time * 0.1));
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
    vec2 uv = (4.0 * I - u_resolution.xy) / u_resolution.y;
    float dt = u_time;
    // camera static
    //vec3 ro = vec3(0.0, 0.0, 2.0);
    //vec3 ta = vec3(0.0, 0.0, 0.0);
    // camera moving
    float angle = dt * 0.2;  // Speed of rotation
    vec3 ro = vec3(0.0, 0.0, 2.0 - dt * 0.3);
    vec3 ta = vec3(0.0, 0.0, -3.0 - dt * 0.3); 

    vec3 rd = getRayDirection(uv, ro, ta);

    //Raymarch scene
    float t = raycast(ro, rd);

    vec3 color = vec3(0.1);
    if(t < 60.0)
    {
        vec3 p = ro + t * rd;
        float d = map(p);

        // Simple lighting based on position
        //float lighting = 0.5 + 0.5 * sin(p.x) * cos(p.y);
        vec3 normal = getNormal(p);
        
        float lighting = max(0.0, dot(normal, normalize(vec3(1.0, 1.0, 1.0))));
        
        vec3 baseColor = vec3(0.922,0.275,0.188);

        int dtFx = int(mod(u_time / 3.0, 6.0));
        if(dtFx == 0){
            float pattern1 = sin(p.z * 4.0 + u_time) * cos(p.y * 3.0);
            float pattern2 = sin(p.x * 6.0 + u_time * 0.5);
            float combined = pattern1 + pattern2;
            baseColor = vec3(
                0.6 + 0.4 * sin(combined),
                0.5 + 0.5 * sin(p.z * 3.0 + u_time + 0.1),
                1.5 + 0.5 * sin(p.y * 3.0 + u_time + 0.5)
            );
        } else if (dtFx == 1 ){
            // 🔥 EXAMPLE 2: Fire colors - hot at top, cool at bottom
            float heat = (p.y + 2.0) / 4.0; // Normalize height
            baseColor = mix(
                vec3(0.1, 0.0, 0.5),  // Cool blue/purple at bottom
                vec3(1.0, 0.5, 0.0),  // Hot orange at top
                heat
            );
        } else if( dtFx == 2){
                // gummy    
            float pattern1 = sin(p.y * 2.0 + u_time) * cos(p.y * 3.0);
            float pattern2 = sin(p.z * 4.0 + u_time * 0.5);
            float combined = pattern1 + pattern2;
            baseColor = vec3(
                0.6 + 0.4 * sin(combined),
                0.4 + 0.6 * cos(combined + 1.0),
                0.5 + 0.5 * sin(combined + 2.0)
            );
        } else if( dtFx == 3){
            // 🌊 EXAMPLE 4: Animated wave pattern
            float wave = sin(p.z * 5.0 + u_time) * cos(p.z * 5.0 + u_time * 0.7);
            baseColor = vec3(
                0.3 + 0.7 * wave,
                0.5 + 0.3 * wave,
                0.8 - 0.3 * wave
            );
        } else if( dtFx == 4){
            float noise = sin(p.z * 3.0) * sin(p.y * 2.0) * cos(p.z * 4.0);
            float marble = 0.5 + 0.5 * sin(6.0 * (p.x + 0.5 * noise));
            baseColor = mix(
                vec3(0.9, 0.9, 0.8),  // Light marble
                vec3(0.4, 0.3, 0.2),  // Dark veins
                marble
            );
        } else if( dtFx == 5){            
            // 🎯 EXAMPLE 9: Concentric rings (target pattern)
            float ringDist = length(p.yz - vec2(0.0, -7.0)); // Distance from center in XZ plane
            float rings = sin(ringDist * 8.0 + u_time * 4.0);
            baseColor = mix(
                vec3(0.8, 0.1, 0.1),  // Red rings
                vec3(0.1, 0.1, 0.8),  // Blue rings
                0.5 + 0.5 * rings
            );
        } else if( dtFx == 6){
            // 🌟 EXAMPLE 10: Complex multi-layered pattern
            float pattern1 = sin(p.z * 4.0 + u_time) * cos(p.y * 3.0);
            float pattern2 = sin(p.z * 6.0 + u_time * 0.5);
            float combined = pattern1 + pattern2;
            baseColor = vec3(
                0.6 + 0.4 * sin(combined),
                0.4 + 0.6 * cos(combined + 1.0),
                0.5 + 0.5 * sin(combined + 2.0)
            );
        }

        // 🔥 EXAMPLE 2: Fire colors - hot at top, cool at bottom
            // float heat = (p.y + 2.0) / 4.0; // Normalize height
            // baseColor = mix(
            //     vec3(0.8, 0.2, 0.5),  // Cool blue/purple at bottom
            //     vec3(0.1, 0.5, 0.5),  // Hot orange at top
            //     heat
            // );
        
        color = baseColor * lighting;
        
        

    }
    // color = vec3(uv.x);
    // normal 
    // O = vec4(color, 1.0);
    // playfull
    float ldt = sin(u_time * 3.1) * 1.6 + 1.6;
    O = vec4(3. * color * exp(-t/(ldt + 10.1)), 1.0);
}