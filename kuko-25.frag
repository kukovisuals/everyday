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
    result.dists = vec3(0.2);
    result.cellCenter = vec2(0.0);
    result.toCenter = vec2(0.0);
    result.cellId = vec2(0.0);
    
    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;

        vec2 cellCenter = H(cellId) + cellId;
        diff = H(cellId) + cellId + 0.1 * cos(dt + 6.28 * H(cellId)) - p;
        
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

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + 
            (c - a)* u.y * (1.0 - u.x) + 
            (d - b) * u.x * u.y;
}

float radiatingLines(vec2 toCenter, float numLines, float sharpness, float dt)
{
    float dist = length(toCenter);
    float angle = atan(toCenter.y, toCenter.x);
    // Noise = n, position = p, value = v, L = Layer
    vec2 noiseP = toCenter * 2.5;
    
    float nL1 = noise(noiseP * 1.0) * 0.95;
    float nL2 = noise(noiseP * 1.0 + vec2(5.2, 1.3)) * 1.25;
    float nL3 = noise(noiseP * 5.0 + vec2(1.7, 8.9)) * 0.125;

    float nV = nL1 + nL2 + nL3;
    
    float distAttenuator = smoothstep(1.0, 0.9, dist * 1.0);
    angle += nV * 7.5 * distAttenuator;
    
    float pattern = abs(fract(angle * numLines / (0.5 * PI) + dt * 0.25) - 0.5) * 2.0;
    pattern = pow(pattern, sharpness);
    pattern = 1.0 - pattern;
    pattern *= 0.7 + nV * 5.6;
    pattern *= mix(1.0, 0.4, smoothstep(0.0, 0.7, dist));
    
    return pattern;
}

float lightningStrike(vec2 cellId, float dt) {
    // Cell randomization - keep as is for good distribution
    float cellS = fract(cellId.x * 127.1 + cellId.y * 311.7 * sin(dt * 3.1));
    float secondSeed = fract(sin(dot(cellId, vec2(12.9898, 78.233))) * 43758.5453);
    cellS = fract(cellS + secondSeed * 0.1);

    // Reduced period for more frequent cycling
    float period = 3.0;  // Changed from 10.0 to 3.0
    
    // Increased time offset range for better distribution
    float tOffset = fract(cellId.x * 0.37 + cellId.y * 0.091) * 8.0;  // Changed from 5.0 to 8.0
    float dtAdjust = dt + tOffset;
    
    // Adjusted timing pattern for more frequent high peaks
    float dtPattern = sin(dtAdjust * 2.2) * 0.5 + 0.2;  // Doubled frequency, raised base level
    dtPattern *= cos(dtAdjust * 0.6 + 3.3) * 3.5 + 0.1;  // Doubled frequency, raised base level
    
    // Lowered threshold to allow more cells to be struck
    float lightTh = 0.025;  // Changed from 0.38985 to 0.25 (75% of cells eligible vs 61%)
    
    // Lowered pattern threshold to make strikes happen more often in the time cycle
    float isBoom = cellS > lightTh && dtPattern > 0.5 ? 1.0 : 0.0;  // Changed from 0.7 to 0.5
    
    float lightDt = mod(dtAdjust, period);
    
    // Shorter strike duration so they flash quicker
    float lightLife = 1.0;  // Changed from 5.0 to 0.8
    float lightFade = smoothstep(lightLife, 0.0, lightDt);
    
    return isBoom * lightFade;
}

vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}

void colorPalette(int effectIndex, vec2 uv, out vec3 bg, out vec3 rgbColor){
    float hue = mod(uv.y / 0.6 + uv.x, 1.0);
    rgbColor = vec3(0.051,0.043,0.043);
    // bg = vec3(0.416,0.153,0.208);
    // rgbColor = pal(uv.y,vec3(0.067,0.051,0.047),vec3(0.373,0.,0.039),vec3(0.04114,0.098,0.102),vec3(0.9647,0.055,0.102) );
    if(effectIndex == 0){
        bg = vec3(0.631,0.847,0.969);
        rgbColor = pal(uv.x,vec3(0.129,0.404,0.49),vec3(0.153,0.024,0.002),vec3(0.169,0.514,0.549),vec3(0.153,0.424,0.502) );
    }   else if(effectIndex == 1) {
        bg = vec3(0.416,0.153,0.208);
        rgbColor = pal(uv.x,vec3(0.067,0.051,0.047),vec3(0.373,0.,0.039),vec3(0.114,0.098,0.102),vec3(0.647,0.055,0.102) );
    }   else if(effectIndex == 2){
        bg = vec3(0.933,0.298,0.231);
        rgbColor = pal(uv.x,vec3(0.0017,0.0241,0.165),vec3(0.01133,0.0907,0.0619),vec3(0.57, 0.239, 0.232),vec3(0.1, 0.15, 0.3) );
    }   else if(effectIndex == 3){
        bg = vec3(0.922,0.275,0.188);
        rgbColor = pal(uv.x, vec3(0.275,0.173,0.208),vec3(0.13,0.033,0.003), vec3(0.384,0.212,0.188),vec3(0.31,0.173,0.184) );
    }   else if(effectIndex == 4){
        bg = vec3(0.333,0.373,0.49);
        rgbColor = pal(uv.x,vec3(0.063,0.035,0.176),vec3(0.094,0.09,0.325),vec3(0.094,0.067,0.298),vec3(0.333,0.373,0.49) );
    }   else {
        bg = vec3(0.416,0.153,0.208);
        rgbColor = pal(uv.x,vec3(0.067,0.051,0.047),vec3(0.082,0.067,0.071),vec3(0.114,0.098,0.102),vec3(0.157,0.161,0.157) );
    }
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 iResolution = u_resolution;
    float dt = u_time;
    vec2 mouse = u_mouse.xy / iResolution.xy;
    vec2 uv = 4.0 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;
    uv.y += dt * 0.3;

    VoronoiResult voro = voronoiExtended(uv, dt);
    
    float centerDist = length(voro.toCenter);
    float maxDist = sqrt(voro.dists.y) * 0.5;
    float normDist = centerDist / maxDist;
    normDist = clamp(normDist, 0.0, 1.0);
    
    float numLines = 1.5 + fract(voro.cellId.x * voro.cellId.y * 0.1) * 0.35;
    float lines = radiatingLines(voro.toCenter, numLines, 5.9, dt * 1.5);

    float distFactor = smoothstep(0.1, 0.5, normDist);
    lines *= mix(0.0, 0.9, distFactor);
    
    float noise = fract(sin(dot(voro.toCenter * 50.0, vec2(12.9898, 78.233))) * 43758.5453);
    lines = mix(lines, lines * (2.0 + noise * 0.4), 0.3);
    
    float centerRaise = smoothstep(1.1, 0.0, normDist);
    
    float lightPower = lightningStrike(voro.cellId, dt);
    
    float lightLines = 0.0;
    if (lightPower > 0.0) {
        lightLines = radiatingLines(voro.toCenter, numLines, 2.0, dt * 10.0);
        lightLines *= smoothstep(0.0, 0.5, normDist);
        lightLines *= lightPower;
    }
    
    float lightDark = 1.1;
    float lightBright = 1.5;
    float dist1 = sqrt(voro.dists.x);
    float dist2 = sqrt(voro.dists.y);
    float edgeDist = dist2 - dist1;
    float edgeFactor = smoothstep(0.0, 0.1, edgeDist);
    
    /*–‑‑ colors –‑‑*/
    vec3 bg, rgbColor;
    int effectIndex = int(mod(dt / 10.0, 6.0));
    colorPalette(effectIndex, uv, bg, rgbColor);
    float lightFinal = mod(effectIndex, 2.0) != 0.0 ? lightDark : lightBright;
    float edgeDark = smoothstep(0.8, 0.0, edgeDist) * lightFinal;

    vec3 baseColor = vec3(0.631,0.847,0.969);
    vec3 lightColor = mix(baseColor, vec3(0.0), 1.3);
    vec3 tempColor = mix(baseColor, lightColor, lines + centerRaise);
    vec3 finalColor = mix(rgbColor,bg , tempColor);
    
    vec3 centerColor = vec3(0.2, 0.6, 0.8);
    finalColor = mix(finalColor, centerColor, centerRaise * 0.6);
    
    vec3 lightningColor = vec3(0.7, 0.5, 0.2);
    finalColor = mix(finalColor, lightningColor, lightLines);
    finalColor *= (1.0 - edgeDark);
    
    vec3 edgeColor = vec3(0.0);
    finalColor = mix(finalColor, edgeColor, 1.0 - edgeFactor);
    
    fragColor = vec4(finalColor, 1.0);
}