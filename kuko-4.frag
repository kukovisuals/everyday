#version 120

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

void mainImage(out vec4 fragColor, in vec2 fragCoord);

// Adapter to match glslViewer expectations
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

// using for functions -> https://www.desmos.com/calculator
int effectIndex = 0;
float PI = 3.1416;

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

mat2 scale(vec2 _scale){
    return mat2(_scale.x,0.0,
                0.0,_scale.y);
}

float modulatedSine(float time, float baseOffset, float amplitude, 
                    float frequency1, float frequency2, float phase) {
    return baseOffset + amplitude * (sin(phase + frequency1 * time) * sin(frequency2 * time));
}

float powSine(float time, float power, float frequency, float phase) {
    return pow(sin(phase + frequency * time), power);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 iResolution = u_resolution;
    float dt = u_time;
    vec2 mouse = u_mouse.xy / iResolution.xy;
    vec2 uv = fragCoord/iResolution.y * 2.0 - 0.0;
    vec3 color = vec3(0.0);

    vec2 gridId = vec2(0.0);
    vec2 cellUv = vec2(0.0);
    float gridSize = 3.0;

    // float rowHeight = 1.0/gridSize; // If you're using a 3×3 grid
    // First find which row we're in
    float rowIndex = floor(uv.y * gridSize);
    if (mod(rowIndex, 2.0) == 0.0) { 
        // Offset the input coordinates before grid calculation
        vec2 offset = vec2(powSine(dt, 8.0, 0.4, 3.34), 0.0);
        vec2 offsetUv = uv + offset * 1.0;
        
        // Then calculate grid with offset coordinates
        gridId = floor(offsetUv * gridSize);
        cellUv = fract(offsetUv * gridSize);
    } else if (mod(rowIndex, 1.0) == 0.0) { 
        // Offset the input coordinates before grid calculation
        vec2 offset = -vec2(powSine(dt, 8.0, 0.4, 4.34), 0.0);
        vec2 offsetUv = uv + offset * 1.0;
        
        // Then calculate grid with offset coordinates
        gridId = floor(offsetUv * gridSize);
        cellUv = fract(offsetUv * gridSize);
    } else {
        // Normal grid calculation for other rows
        gridId = floor(uv * gridSize);
        cellUv = fract(uv * gridSize);
    }

    cellUv -= 0.5;
    cellUv = rotate2d(modulatedSine(dt, 1.4, 1.4, 0.76 + gridId.x, 0.6 + gridId.y, 6.9 )) * cellUv;
    cellUv += 0.5;

    float rectL = smoothstep(0.45, 0.5, cellUv.x);
    float rectB = smoothstep(0.15, 0.5, cellUv.y);
    float rectR = smoothstep(0.65, 0.6, cellUv.x);
    float rectT = smoothstep(0.95, 0.5, cellUv.y);
    float pct = rectL * rectB * rectR * (rectT);

    color = vec3(pct);
    fragColor = vec4(color, 1.0);
}




    
    
    // vec2 bl = smoothstep(vec2(0.25), vec2(0.3), cellUv);
    // vec2 tr = smoothstep(vec2(0.75), vec2(.7), cellUv);

    // vec2 bl = step(vec2(0.2), cellUv);
    // vec2 tr = step(cellUv, vec2(0.8));
    // uv -= vec2(0.5);
    // uv = scale( vec2( sin(2.5) ) ) * uv;
    // uv = rotate2d(radians(45.0)) * uv;
    // uv += vec2(0.5);
    // uv = fract(uv * 3.0); 
    // modulatedSine(dt, 0.4, 0.4, 1.76, 5.0, 2.9 )
    // Example of different rotation per cell
    // float rotationAngle = radians(45.0 * (gridId.x + gridId.y + 1.0));
    // Or animated rotation
    // float rotationAngle = radians(45.0 + 30.0 * sin(dt + gridId.x * 0.5 + gridId.y * 0.7));
    