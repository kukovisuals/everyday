#define H(n)  fract( 1e4 * sin( n.x+n.y/.7 +vec2(1,12.34)  ) )
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
        diff = H(cellId) + cellId - p;
        
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

void mainImage(out vec4 o, vec2 u) 
{
    float
    i,
    d,
    s,
    n,
    t=iTime*.15;
    vec3 p = iResolution;
    u = (u-p.xy/2.)/p.y;
    
    vec4 clouds = vec4(0.0);
    for(clouds*=i; i++<1e2; ) {
        p = vec3(u * d, d + t*4.);
        p += cos(p.z+t+p.yzx*.5)*.5;
        s = 5.-length(p.xy);
        for (n = .06; n < 2.;
            p.xy *= mat2(cos(t*.1+vec4(0,33,11,0))),
            s -= abs(dot(sin(p.z+t+p * n * 20.), vec3( .05))) / n,
            n += n);
        d += s = .02 + abs(s)*.1;
        clouds += 1. / s;
    }
    clouds = tanh(clouds / d / 9e2 / length(u));
    
    float
    i2,
    d2,
    s2,
    n2;
    vec3 p2 = iResolution;
    vec4 lightning = vec4(0.0);
    
    for(lightning*=i2; i2++<1e2; ) {
        p2 = vec3(u * d2, d2 + t*10.);
        p2 += cos(p2.z+t+p2.yzx*.5)*.5;
        s2 = 5.-length(p2.xy);
        
        vec2 lightningUV = p2.xy * 1.0 + p2.z * 0.7;
        VoronoiResult voro = voronoiExtended(lightningUV, iTime);
        vec3 lightningPattern = vec3(5.0) * sqrt(voro.dists);
        lightningPattern -= vec3(lightningPattern.x);
        lightningPattern += 10.0 * ( lightningPattern.y / (lightningPattern.y / lightningPattern.z + 1.0) - 0.7 ) - lightningPattern;
        
        float wallMask = smoothstep(0.5, 1.0, 10.-length(p2.xy));
        
        d2 += s2 = .02 + abs(s2)*0.11;
        lightning += vec4(lightningPattern * wallMask, wallMask) / s2;
    }
    lightning = tanh(lightning / d2 / 9e2 / length(u));
    
    vec3 finalColor = clouds.rgb + lightning.rgb * 0.55;
    o = vec4(finalColor, 1.0);
}


#define H(n)  fract( 1e4 * sin( n.x+n.y/.7 +vec2(1,12.34)  ) )
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
    result.dists = vec3(2.4);
    result.cellCenter = vec2(0.0);
    result.toCenter = vec2(0.0);
    result.cellId = vec2(0.0);
    
    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        vec2 cellCenter = H(cellId) + cellId;
        diff = H(cellId) + cellId - p;
        
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

void mainImage(out vec4 o, vec2 u) 
{
    float
    i,
    d,
    s,
    n,
    t=iTime*.15;
    vec3 p = iResolution;
    u = (u-p.xy/2.)/p.y;
    
    vec4 clouds = vec4(0.0);
    for(clouds*=i; i++<1e2; ) {
        p = vec3(u * d, d + t*4.);
        p += cos(p.z+t+p.yzx*.5)*.5;
        s = 5.-length(p.xy);
        for (n = .06; n < 2.;
            p.xy *= mat2(cos(t*.1+vec4(0,33,11,0))),
            s -= abs(dot(sin(p.z+t+p * n * 20.), vec3( .05))) / n,
            n += n);
        d += s = .02 + abs(s)*.1;
        clouds += 1. / s;
    }
    clouds = tanh(clouds / d / 9e2 / length(u));
    
    float
    i2,
    d2,
    s2,
    n2;
    vec3 p2 = iResolution;
    vec4 lightning = vec4(0.0);
    
    for(lightning*=i2; i2++<1e2; ) {
        p2 = vec3(u * d2, d2 + t*6.);
        p2 += cos(p2.z+t+p2.yzx*.5)*1.1;
        s2 = 5.-length(p2.xy);
        
        vec2 lightningUV = p2.xy * 0.3 + p2.z * 4.525;
        VoronoiResult voro = voronoiExtended(lightningUV, iTime);
        
        // Create lightning along Voronoi edges
        float edge1 = abs(sqrt(voro.dists.x) - sqrt(voro.dists.y));
        float edge2 = abs(sqrt(voro.dists.y) - sqrt(voro.dists.z));
        
        // Main lightning bolt along primary edge
        float mainBolt = 1.0 - smoothstep(0.0, 0.0554, edge1);
        
        // Secondary lightning along secondary edge  
        float secBolt = 1.0 - smoothstep(0.0, 0.01425, edge2);
        
        // Lightning flicker and animation
        float flicker = pow(abs(sin(iTime * 1.5 + voro.cellId.x * 6.28 + voro.cellId.y * 3.14)), 100.0);
        float slowPulse = sin(iTime * 2.0 + p2.z * 2.0) * 3.0 + 1.0;
        
        // Add electrical crackling based on cell properties
        float crackle = sin(voro.cellId.x * 1.45 + iTime * 0.2) * 
                       sin(voro.cellId.y * 67.89 + iTime * 1.0);
        crackle = pow(abs(crackle), 3.0);
        
        // Lightning branching effect
        float branch = sin(sqrt(voro.dists.x) * 30.0 + iTime * 0.5) * 0.5 + 0.5;
        mainBolt *= (0.6 + branch * 0.8);
        
        // Create lightning colors
        vec3 coreColor = vec3(1.0, 1.0, 1.0) * mainBolt * 1.5 * flicker;
        vec3 branchColor = vec3(0.7, 0.85, 1.0) * secBolt * 0.126 * slowPulse;
        vec3 crackleColor = vec3(0.9, 0.95, 1.0) * crackle * 0.1;
        
        vec3 lightningPattern = coreColor + branchColor + crackleColor;
        
        // Add directional flow for storm effect
        vec2 stormDir = normalize(vec2(sin(iTime * 0.5), cos(iTime * 0.5)));
        float dirFlow = dot(normalize(voro.toCenter), stormDir) * 0.5 + 0.5;
        lightningPattern *= dirFlow;
        
        float wallMask = smoothstep(0.5, 1.0, 50.-length(p2.xy));
        
        d2 += s2 = 0.0054 + abs(s2)*0.1131;
        lightning += vec4(lightningPattern * wallMask, wallMask) / s2;
    }
    lightning = tanh(lightning / d2 / 9e2 / length(u));
    
    // Enhanced storm atmosphere
    vec3 stormClouds = clouds.rgb * vec3(0.3, 0.35, 0.5);
    
    // Add atmospheric glow around lightning
    float lightningGlow = length(lightning.rgb) * 2.2;
    vec3 atmosphereGlow = vec3(0.2, 0.3, 0.6) * lightningGlow * 
                         smoothstep(2.0, 0.0, length(u));
    
    // Occasional screen flash
    float globalFlash = pow(abs(sin(iTime * 0.0)), 20.0) * 0.5;
    vec3 flashColor = vec3(0.8, 0.9, 1.0) * globalFlash;
    
    vec3 finalColor = stormClouds + lightning.rgb * 1.85 + atmosphereGlow + flashColor;
    o = vec4(finalColor, 1.0);
}



#define H(n)  fract( 1e4 * sin( n.x+n.y/.7 +vec2(1,12.34)  ) )
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
    result.dists = vec3(2.7);
    result.cellCenter = vec2(0.0);
    result.toCenter = vec2(0.0);
    result.cellId = vec2(0.0);
    
    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        vec2 cellCenter = H(cellId) + cellId;
        diff = H(cellId) + cellId - p;
        
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

void mainImage(out vec4 o, vec2 u) 
{
    float
    i,
    d,
    s,
    n,
    t=iTime*.415;
    vec3 p = iResolution;
    u = (u-p.xy/2.)/p.y;
    
    vec4 clouds = vec4(0.0);
    for(clouds*=i; i++<1e2; ) {
        p = vec3(u * d, d + t*1.);
       
        d += s = 0.0 + abs(s)*.0;

    }
    clouds = tanh(clouds / d / 9e2 / length(u));
    
    float
    i2,
    d2,
    s2,
    n2;
    vec3 p2 = iResolution;
    vec4 lightning = vec4(0.0);
    
    for(lightning*=i2; i2++<1e2; ) {
        p2 = vec3(u * d2, d2 + t*4.);
        p2 += cos(p2.z+t+p2.yzx*.5)*1.21;
        s2 = 8.-length(p2.xy);
        
        vec2 lightningUV = p2.xy * 0.3 + p2.z * 1.525;
        VoronoiResult voro = voronoiExtended(lightningUV, iTime);
        
        // Create lightning along Voronoi edges
        float edge1 = abs(sqrt(voro.dists.x) - sqrt(voro.dists.y));
        float edge2 = abs(sqrt(voro.dists.y) - sqrt(voro.dists.z));
        
        // Main lightning bolt along primary edge
        float mainBolt = 2.5 - smoothstep(0.0, 0.30554, edge1);
        
        // Secondary lightning along secondary edge  
        float secBolt = 1.0 - smoothstep(0.0, 0.21425, edge2);
        
        // Lightning flicker and animation
        float flicker = pow(abs(sin(iTime * 1.5 + voro.cellId.x * 6.28 + voro.cellId.y * 3.14)), 100.0);
        float slowPulse = sin(iTime * 2.0 + p2.z * 2.0) * 3.0 + 1.0;
        
        // Add electrical crackling based on cell properties
        float crackle = sin(voro.cellId.x * 1.45 + iTime * 0.2) * 
                       sin(voro.cellId.y * 67.89 + iTime * 1.0);
        crackle = pow(abs(crackle), 3.0);
        
        // Lightning branching effect
        float branch = sin(sqrt(voro.dists.x) * 30.0 + iTime * 0.5) * 0.5 + 0.5;
        mainBolt *= (0.6 + branch * 0.8);
        
        // Create lightning colors
        vec3 coreColor = vec3(1.0, 1.0, 1.0) * mainBolt * 1.5 * flicker;
        vec3 branchColor = vec3(0.7, 0.85, 1.0) * secBolt * 1.126 * slowPulse;
        vec3 crackleColor = vec3(0.820,0.839,0.859) * crackle * 0.1;
        
        // Create random lighting masks based on Voronoi cells
        float cellNoise1 = fract(sin(dot(voro.cellId, vec2(12.9898, 78.233))) * 43758.5453);
        float cellNoise2 = fract(sin(dot(voro.cellId, vec2(93.9898, 67.345))) * 28462.1847);

        // Time-based flickering for different regions
        float timeOffset1 = cellNoise1 * 6.28;
        float timeOffset2 = cellNoise2 * 6.28;

        // Create masks that turn on/off different sections
        float regionMask1 = step(0.3813, sin(iTime * 0.0 + timeOffset1) * .5 + 0.415);
        float regionMask2 = step(0.816, sin(iTime * 1.0 + timeOffset2) * .5 + 0.35);
        float regionMask3 = step(0.714, cellNoise1 * sin(iTime * 4.5 + timeOffset1));

        // Combine masks for varied lighting patterns
        float finalMask = max(regionMask1 * 0.8, max(regionMask2 * 0.6, regionMask3 * 0.4));
        
        vec3 lightningPattern = coreColor + branchColor + crackleColor;
        lightningPattern *= finalMask;
        
        // Add directional flow for storm effect
        vec2 stormDir = normalize(vec2(sin(iTime * 0.5), cos(iTime * 0.5)));
        float dirFlow = dot(normalize(voro.toCenter), stormDir) * 0.5 + 0.5;
        lightningPattern *= dirFlow;
        
        float wallMask = smoothstep(0.5, 1.0, 50.-length(p2.xy));
        
        d2 += s2 = 0.0054 + abs(s2)*0.1131;
        lightning += vec4(lightningPattern * wallMask, wallMask) / s2;
    }
    lightning = tanh(lightning / d2 / 9e2 / length(u));
    
    // Enhanced storm atmosphere
    vec3 stormClouds = clouds.rgb * vec3(0.000,0.000,0.000);
    vec3 blendedLightning = lightning.rgb * (0.5 + clouds.a * 5.5); // Lightning intensity modulated by cloud density
    vec3 cloudGlow = stormClouds * length(lightning.rgb) * 0.8;
    
    // Add atmospheric glow around lightning
    float lightningGlow = length(lightning.rgb) * 2.2;
    vec3 atmosphereGlow = vec3(0.416,0.608,0.651) * lightningGlow * 
                         smoothstep(2.0, 0.0, length(u));
    atmosphereGlow *= (2.3 + clouds.a * 0.7);
    
    // Occasional screen flash
    float globalFlash = pow(abs(sin(iTime * 0.0)), 20.0) * 0.5;
    vec3 flashColor = vec3(0.8, 0.9, 1.0) * globalFlash;
    
    vec3 finalColor = stormClouds + cloudGlow + blendedLightning * 1.85 + atmosphereGlow + flashColor;
    o = vec4(finalColor, 1.0);
}


#define H(n)  fract( 1e4 * sin( n.x+n.y/.7 +vec2(1,12.34)  ) )
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
    result.dists = vec3(2.7);
    result.cellCenter = vec2(0.0);
    result.toCenter = vec2(0.0);
    result.cellId = vec2(0.0);
    
    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        vec2 cellCenter = H(cellId) + cellId;
        diff = H(cellId) + cellId - p;
        
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

void mainImage(out vec4 o, vec2 u) 
{
    float
    i,
    d,
    s,
    n,
    t=iTime*.9415;
    vec3 p = iResolution;
    u = (u-p.xy/2.)/p.y;
    
    vec4 clouds = vec4(0.0);
    for(clouds*=i; i++<1e2; ) {
        p = vec3(u * d, d + t*1.);
       
        d += s = 0.0 + abs(s)*.0;

    }
    clouds = tanh(clouds / d / 9e2 / length(u));
    
    float
    i2,
    d2,
    s2,
    n2;
    vec3 p2 = iResolution;
    vec4 lightning = vec4(0.0);
    
    for(lightning*=i2; i2++<1e2; ) {
        p2 = vec3(u * d2, d2 + t*5.);
        p2 += cos(p2.z+t+p2.yzx*.5)*1.21;
        s2 = 9.-length(p2.xy);
        
        vec2 lightningUV = p2.xy * 0.3 + p2.z * 1.525;
        VoronoiResult voro = voronoiExtended(lightningUV, iTime);
        
        // Create lightning along Voronoi edges
        float edge1 = abs(sqrt(voro.dists.x) - sqrt(voro.dists.y));
        float edge2 = abs(sqrt(voro.dists.y) - sqrt(voro.dists.z));
        
        // Main lightning bolt along primary edge
        float mainBolt = 2.5 - smoothstep(0.0, 0.30554, edge1);
        
        // Secondary lightning along secondary edge  
        float secBolt = 1.0 - smoothstep(0.0, 0.21425, edge2);
        
        // Lightning flicker and animation
        float flicker = pow(abs(sin(iTime * 1.5 + voro.cellId.x * 6.28 + voro.cellId.y * 3.14)), 100.0);
        float slowPulse = sin(iTime * 2.0 + p2.z * 2.0) * 3.0 + 1.0;
        
        // Add electrical crackling based on cell properties
        float crackle = sin(voro.cellId.x * 1.45 + iTime * 0.2) * 
                       sin(voro.cellId.y * 67.89 + iTime * 1.0);
        crackle = pow(abs(crackle), 3.0);
        
        // Lightning branching effect
        float branch = sin(sqrt(voro.dists.x) * 30.0 + iTime * 0.5) * 0.5 + 0.5;
        mainBolt *= (0.6 + branch * 0.8);
        
        // Create lightning colors
        vec3 coreColor = vec3(1.0, 1.0, 1.0) * mainBolt * 1.5 * flicker;
        vec3 branchColor = vec3(0.7, 0.85, 1.0) * secBolt * 1.126 * slowPulse;
        vec3 crackleColor = vec3(0.820,0.839,0.859) * crackle * 0.1;
        
        // Create random lighting masks based on Voronoi cells
        float cellNoise1 = fract(sin(dot(voro.cellId, vec2(12.9898, 78.233))) * 43758.5453);
        float cellNoise2 = fract(sin(dot(voro.cellId, vec2(93.9898, 67.345))) * 28462.1847);

        // Time-based flickering for different regions
        float timeOffset1 = cellNoise1 * 6.28;
        float timeOffset2 = cellNoise2 * 6.28;

        // Create masks that turn on/off different sections
        float regionMask1 = step(0.3813, sin(iTime * 0.0 + timeOffset1) * .5 + 0.415);
        float regionMask2 = step(0.816, sin(iTime * 1.0 + timeOffset2) * .5 + 0.35);
        float regionMask3 = step(0.714, cellNoise1 * sin(iTime * 4.5 + timeOffset1));

        // Combine masks for varied lighting patterns
        float finalMask = max(regionMask1 * 0.8, max(regionMask2 * 0.6, regionMask3 * 0.4));
        
        vec3 lightningPattern = coreColor + branchColor + crackleColor;
        lightningPattern *= finalMask;
        
        // Add directional flow for storm effect
        vec2 stormDir = normalize(vec2(sin(iTime * 0.5), cos(iTime * 0.5)));
        float dirFlow = dot(normalize(voro.toCenter), stormDir) * 0.5 + 0.5;
        lightningPattern *= dirFlow;
        
        float wallMask = smoothstep(0.5, 1.0, 50.-length(p2.xy));
        
        d2 += s2 = 0.0054 + abs(s2)*0.1131;
        lightning += vec4(lightningPattern * wallMask, wallMask) / s2;
    }
    lightning = tanh(lightning / d2 / 9e2 / length(u));
    
    // Enhanced storm atmosphere
    vec3 stormClouds = clouds.rgb * vec3(0.000,0.000,0.000);
    vec3 blendedLightning = lightning.rgb * (0.5 + clouds.a * 5.5); // Lightning intensity modulated by cloud density
    vec3 cloudGlow = stormClouds * length(lightning.rgb) * 0.8;
    
    // Add atmospheric glow around lightning
    float lightningGlow = length(lightning.rgb) * 2.2;
    vec3 atmosphereGlow = vec3(0.416,0.608,0.651) * lightningGlow * 
                         smoothstep(2.0, 0.0, length(u));
    atmosphereGlow *= (2.3 + clouds.a * 0.7);
    
    float globalFlash = pow(abs(sin(iTime * 0.0)), 20.0) * 0.5;
    vec3 flashColor = vec3(0.8, 0.9, 1.0) * globalFlash;
    
    vec3 finalColor = stormClouds + cloudGlow + blendedLightning * 1.85 + atmosphereGlow + flashColor;
    o = vec4(finalColor, 1.0);
}
