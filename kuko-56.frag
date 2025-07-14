
// Spikes from FabriceNeyret2 
// https://www.shadertoy.com/view/wsXGWM

// colors from blackjero
// https://www.shadertoy.com/view/XtGGzG
mat2 rotate2d(float a){ return mat2(cos(a),-sin(a), sin(a),cos(a)); }
vec3 viridis(float t) 
{
    t = clamp(t, 0.0, 0.8);
    vec4 x1 = vec4(1.0, t, t * t, t * t * t);
    vec4 x2 = x1 * x1.w * t;
    return vec3(
        dot(x1, vec4(0.280268003, -0.143510503, 2.225793877, -14.815088879)) + dot(x2.xy, vec2(25.212752309, -11.772589584)),
        dot(x1, vec4(-0.002117546, 1.617109353, -1.909305070, 2.701152864)) + dot(x2.xy, vec2(-1.685288385, 0.178738871)),
        dot(x1, vec4(0.300805501, 2.614650302, -12.019139090, 28.933559110)) + dot(x2.xy, vec2(-33.491294770, 13.762053843))
    );
}
vec3 plasma_quintic( float t )
{
    t = clamp(t, 0.0, 1.0);
    vec4 x1 = vec4(1.0, t, t * t, t * t * t);
    vec4 x2 = x1 * x1.w * t;
	return vec3(
		dot( x1.xyzw, vec4( +0.063861086, +1.992659096, -1.023901152, -0.490832805 ) ) + dot( x2.xy, vec2( +1.308442123, -0.914547012 ) ),
		dot( x1.xyzw, vec4( +0.049718590, -0.791144343, +2.892305078, +0.811726816 ) ) + dot( x2.xy, vec2( -4.686502417, +2.717794514 ) ),
		dot( x1.xyzw, vec4( +0.513275779, +1.580255060, -5.164414457, +4.559573646 ) ) + dot( x2.xy, vec2( -1.916810682, +0.570638854 ) ) );
}
vec3 inferno_quintic( float t )
{
    t = clamp(t, 0.0, 1.0);
    vec4 x1 = vec4(1.0, t, t * t, t * t * t);
    vec4 x2 = x1 * x1.w * t;
	return vec3(
		dot( x1.xyzw, vec4( -0.027780558, +1.228188385, +0.278906882, +3.892783760 ) ) + dot( x2.xy, vec2( -8.490712758, +4.069046086 ) ),
		dot( x1.xyzw, vec4( +0.014065206, +0.015360518, +1.605395918, -4.821108251 ) ) + dot( x2.xy, vec2( +8.389314011, -4.193858954 ) ),
		dot( x1.xyzw, vec4( -0.019628385, +3.122510347, -5.893222355, +2.798380308 ) ) + dot( x2.xy, vec2( -3.608884658, +4.324996022 ) ) );
}
vec3 magma_quintic( float t )
{
    t = clamp(t, 0.0, 1.0);
    vec4 x1 = vec4(1.0, t, t * t, t * t * t);
    vec4 x2 = x1 * x1.w * t;
	return vec3(
		dot( x1.xyzw, vec4( -0.023226960, +1.087154378, -0.109964741, +6.333665763 ) ) + dot( x2.xy, vec2( -11.640596589, +5.337625354 ) ),
		dot( x1.xyzw, vec4( +0.010680993, +0.176613780, +1.638227448, -6.743522237 ) ) + dot( x2.xy, vec2( +11.426396979, -5.523236379 ) ),
		dot( x1.xyzw, vec4( -0.008260782, +2.244286052, +3.005587601, -24.279769818 ) ) + dot( x2.xy, vec2( +32.484310068, -12.688259703 ) ) );
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

float smoothNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    
    return mix(
        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

float organicFbm(vec3 p) {
    float value = 0.0;
    float amplitude = .54;
    float frequency = 1.30;
    
    for(int i = 0; i < 5; i++) {
        value += amplitude * smoothNoise(p * frequency);
        amplitude *= 0.55;
        frequency *= 1.68;
        // Rotate the coordinates for more organic variation
        p = p * 1.11 + vec3(0.5, 0.3, 0.1);
    }
    return value;
}

const float PHI = 1.618033988749895;
float sdIcosahedronSpiky(vec3 p, float r, float t) {
    vec3 original_p = p;
    float phi = length(original_p) - 1.23760;
    if(phi < 1.5) {
        vec3 bump_p = original_p;
        // Large scale bumps (like the virus bulges)
        float largeBumps = organicFbm(bump_p * 0.652 + t * 0.101) * 0.323;
        // Medium scale texture
        float mediumBumps = fbm(bump_p * 5.0 + t * 0.201) * 0.15;
        // Fine scale surface roughness
        float fineBumps = noise3D(bump_p * 2.5 + t * 0.2401) * 0.305;
        // Very fine detail
        float microBumps = noise3D(bump_p * 3.0) * 0.02;
        // Combine all bump scales
        float totalBumps = largeBumps + mediumBumps + fineBumps + microBumps;
        phi -= totalBumps;
    }
    phi -= 0.0;
    
    // Add spikes - displacement near surface
    if(phi < 2.0) {
        vec3 new_p = original_p;
        float v;
        // Rotate for animation
        //new_p.xz = rotate2d(iTime * 0.15) * new_p.xz;
        new_p /= length(new_p);
        new_p.x = atan(new_p.x, new_p.z);
        new_p.y = asin(new_p.y);
        
        // Create spike pattern
        v = ceil(4.0 * abs(new_p.y) / 1.57) / 4.0;
        v = 8.0 * sqrt(1.0 - v * v);
        new_p.x *= floor(v + 0.1);
        new_p.y *= 8.0;
        
        // Generate spike displacement
        new_p = sin(new_p * 1.0);
        v = new_p.x * new_p.y;
        //v *= abs(v);
        v *= v < 0.0 ? 0.0 : v;
        //v += sin(new_p.y * new_p.x * 1.0) * 0.5 + 1.5; 
        phi -= v * 0.436;
    }
    
    return phi;
}
float map(vec3 p )
{
    vec3 new_p = p; 
    new_p.xz = rotate2d(iTime * 0.05) * new_p.xz;
    return sdIcosahedronSpiky(new_p, 0.31275, iTime);
}
float rayDirection(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    for(int i=0; i<80; i++)
    {
        vec3 p = ro + rd * dt;
        float d = map(p);
        dt += d;
        if(d < 0.0001 || dt > 20.0) break;
    }
    return dt;
}
vec2 getIcosahedronUV(vec3 p) {
    vec3 norm = normalize(p);
    float u = 0.5 + atan(norm.z, norm.x) / (2.0 * 3.14159);
    float v = 0.5 - asin(norm.y) / 3.14159;
    return vec2(u, v);
}
vec3 sdColor(vec3 ro, vec3 rd, float dt)
{
    vec3 color = vec3(0.0);
    vec3 proColor = vec3(0.0);
    vec3 p = ro + rd * dt;
    vec3 new_p = p;
    // new_p /= length(new_p);
    // float d = map(new_p);
    //float d = length(new_p);
    
    // Calculate UV coordinates for texture sampling
    vec2 uv = getIcosahedronUV(p); 
    uv.yx = rotate2d(-iTime * 0.01) * uv;    
    // Scale UV for texture tiling
    uv *= 2.0; 
    
    vec3 texColor = texture(iChannel0, uv).rgb;
    
    float d = length(p);
    float colorV = sin(d * 8.0);
    float colorInit = (colorV + 0.35) * 0.45;
    
    vec3 proColor = vec3(0.0);
    int color_fx = int(mod(t / 3.0, 4.0));
    proColor = plasma_quintic(colorInit); 
    
    if(color_fx == 0) { proColor = viridis(colorInit); }
    else if(color_fx == 1) { proColor = inferno_quintic(colorInit); }
    else if(color_fx == 2) { proColor = magma_quintic(colorInit); }
    else if(color_fx == 3) { proColor = plasma_quintic(colorInit); }
    
    // Blend texture with procedural color
    color = mix(proColor, texColor, 0.435);

    return color;
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    vec3 color = vec3(0.002);

    vec3 ro = vec3(0.0, 0.0, 3.0);
    vec3 rd = normalize(vec3(uv, -1.0));

    float dt = rayDirection(ro, rd);

    if(dt < 10.0){
        color = sdColor(ro, rd, dt);
    }
    color = pow(color * 1.0, vec3(1.0/2.2));
    // color = vec3(dt * 0.2);
    O = vec4(color, 1.0);
}