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

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float sdCircle(vec3 p , float r)
{
    return length(p) - r;   
}
float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
    vec3 newPa = p;
    float speed = u_time * -0.521001;
    newPa += cos(2.0*newPa.x + speed)*sin(1.5*newPa.y + speed)*
        cos(1.5*newPa.z - speed);
    vec3 pa = newPa - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

float opOnion( in float sdf, in float thickness )
{
    return abs(sdf)-thickness;
}

float smin( float a, float b, float k )
{
    k *= log(2.0);
    float x = b-a;
    return a + x/(1.0-exp2(x/k));
}
mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}
float map(vec3 p)
{
    vec3 q = p;
    // q.xz = rotate2d(u_time * 0.2) * q.xz;
    q.xz = rotate2d(PI) * q.xz;
    float ground = q.y + 3.19394675;
    float ground_top = -q.y + 3.52594675;

    float d1 = sdCircle(q + vec3(0.0, 2.0, 0.0), 1.5);
    float d3 = sdCircle(q + vec3(0.0, -1.5, 0.0), 0.8);
    float d2 = sdCapsule(q + vec3(0.0, 0.0, 0.0), 
        vec3(2.5, 0.0, 0.15), vec3(-2.5, -0.0, -0.15), 0.44241235);

    return smin(ground_top, 
        smin(ground, 
        smin(d1,
        smin(d3, 
        opOnion(d2, 0.4), 0.257495), 0.7), 0.7), 0.7);
    // return  opOnion(d2, 0.02);
}

float rayMarch(vec3 ro, vec3 rd)
{
    float dist_travel = 0.0;
    for(int i = 0; i<100; i++)
    {
        vec3 p = ro + rd * dist_travel;
        float d = map(p);
        dist_travel += d;
        if(d < 0.00001 || dist_travel > 20.0) break;
    }
    return dist_travel;
}

vec3 calcNormal(vec3 p)
{
    vec2 e = vec2(0.1, 0.0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yyx) - map(p - e.yyx)
    ));
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - u_resolution.xy) / u_resolution.y;
    float dt = u_time;
    float pi = 3.14159;
    float pi2 = pi * 6.0;
    
    // camera setup
    vec3 ray_origin = vec3(0.0, 0.0, 6.5);
    vec3 ray_direction = normalize(vec3(uv, -1.0));

    // raycast scene 
    float dist_travel = rayMarch(ray_origin, ray_direction);

    // Enhanced coloring system
    vec3 color = vec3(0.0);

    if(dist_travel < 20.0)
    {
        vec3 p = ray_origin + ray_direction * dist_travel;
        
        if(p.y > -3.179344 && p.y < 3.484057){
            vec3 norm = calcNormal(p);
            float lightFx = sin(dt * 0.5) * -20.5 - 0.5;
            float lightFx2 = 1.2 * sin(dt * 0.5) * -0.5 - 0.5;
            vec3 sunDir = normalize(vec3(lightFx, lightFx2, 5.5));
            float diff = clamp(dot(norm, sunDir), 0.0, 1.0);
            vec2 center = p.zy + 0.0;            

            // Calculate wave merge
            float wave1 = sin(length(center) * 2.0 - dt * 0.40);
            float wave2 = sin(length(center) * 2.0 - dt * 0.38);
            float wave3 = sin(length(center) * 1.0 - dt * 0.3);

            // Combine waves (merge pattern)
            float merge = (wave1 + wave2 + wave3) / 3.0;
            float liq_pat = merge * 0.205 + 0.55;

            // 1. Distance-based oscillating brightness (like cos(d*pi2) in reference)
            float distance_osc = cos(dist_travel * pi2 * 2.0);
            float distance_fade = exp(-dist_travel * 0.08);
            
            // 2. Multi-layered base color with wave interaction
            vec3 base_color = hsv2rgb(vec3(0.5 + liq_pat * 0.242, 0.84, 1.0 + liq_pat * 0.5));
            
            // 3. Create the "k" vector equivalent (wave distances for lighting)
            vec3 k = vec3(liq_pat, merge, wave1 * wave2);
            
            // 4. Apply the reference's color mixing formula
            vec3 c = max(vec3(distance_osc) - vec3(dist_travel * 0.05) - k * 0.3, 0.0);
            
            // 5. Add cyan tint like c.gb += .1 in reference
            c.gb += 0.15;
            
            // 6. Apply the complex color blending: c*.4 + c.brg*.6 + c*c
            vec3 final_color = c * 0.4 + c.brg * 0.6 + c * c;
            
            // 7. Blend with original base color
            color = mix(base_color, final_color, 0.7);
            
            // 8. Enhanced glow system
            float enhanced_glow = exp(-dist_travel * 0.1) * (1.0 + distance_osc * 0.5);
            color *= enhanced_glow;
            
            // 9. Pattern-based highlights with oscillation
            float highlight = pow(liq_pat, 4.0) * (1.0 + sin(dt * 2.0) * 0.3);
            color += base_color * highlight * 0.58;
            
            // 10. Enhanced Fresnel with color shift
            float fresnel = 1.0 - abs(dot(norm, -ray_direction));
            vec3 fresnel_color = vec3(0.3, 0.8, 1.0) * pow(fresnel, 2.0);
            color += fresnel_color * 1.0;
            
            // 11. Add electric-like rim effects
            float rim = pow(fresnel, 8.0);
            color += vec3(1.0, 0.8, 0.4) * rim * 3.0 * (1.0 + sin(dt * 4.0) * 0.5);
            
            // 12. Depth-based color temperature shift
            float temp_shift = dist_travel * 0.02;
            color.r *= 1.0 + temp_shift;
            color.b *= 1.0 - temp_shift * 0.5;
            
        } else if (p.y < 1.957) {
            // Enhanced background with distance-based effects
            // float bg_osc = cos(dist_travel * pi2 * 0.3) * 0.5 + 0.5;
            // color += vec3(0.1, 0.05, 0.2) * bg_osc * exp(-dist_travel * 0.05);
        }
    } else {
        // Even the "miss" gets some color based on ray direction
        color = vec3(0.0);
    }
    
    // Enhanced gamma correction with slight color boost
    color = pow(color * 1.2, vec3(1.0/2.2));

    O = vec4(color, 1.0);
}

// float angle = atan(center.y, center.x) / (2.0 * 3.14159) + 0.5;

 // float rotating_hue = (angle + hue * 0.2 + 0.2) + (pattern2 * 0.02);
            // float controlled_hue = mod(rotating_hue, 0.1) * 0.01016 + 0.535757943;
            // vec3 base_color = hsv2rgb(vec3(controlled_hue, p.y + 0.5, 1.00))  * diff * 1.1;
            // Electric plasma colors
            // float pattern2 = sin(p.x * 8.0 + dt * 0.7) * 0.5 + 0.5;
            // float pattern3 = cos(p.y * 6.0 + dt * 0.5) * 0.5 + 0.5;

            // // Aurora colors with flowing waves
            // float aurora_flow = angle + hue * 0.3 + pattern2 * 0.3 + pattern3 * 0.2;
            // float wave1 = sin(aurora_flow * 6.28) * 0.5 + 0.5;
            // float wave2 = cos(aurora_flow * 6.28 + 2.0) * 0.5 + 0.5;

            // // Green-blue-purple aurora spectrum
            // float aurora_hue = mix(0.5, 0.6, wave1);  // Green to Purple
            // float aurora_sat = mix(0.3, 0.95, wave2); // Varying saturation
            // float aurora_val = 1.2 + wave1 * 0.5;     // Bright with variation

            // vec3 base_color = hsv2rgb(vec3(aurora_hue, aurora_sat, aurora_val)) * diff * 1.6;
            // float hue = dt * 0.1;
            // vec2 center = p.xy - 2.5;