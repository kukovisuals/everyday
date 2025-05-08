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

float pulsate(float time, float amplitude, float frequency, float phase) {
    return amplitude * abs(sin(time * frequency + phase));
}

float powSine(float time, float power, float frequency, float phase) {
    return pow(sin(phase + frequency * time), power);
}

float modulatedSine(float time, float baseOffset, float amplitude, 
                    float frequency1, float frequency2, float phase) {
    return baseOffset + amplitude * (sin(phase + frequency1 * time) * sin(frequency2 * time));
    // 0.4, 0.4, 1.0, 5.0, 2.9
}


float compositeSine(float time, float baseOffset, float amplitude1, float frequency1,
                    float amplitude2, float frequency2) {
    return baseOffset + amplitude1 * sin(frequency1 * time) + 
           amplitude2 * sin(frequency2 * time);
        // 0.5, 0.434, 3.0, 0.17, 1.0
}

// Function to create a rectangular mask
float rectMask(vec2 uv, vec2 bottomLeft, vec2 topRight) {
    vec2 steps = step(bottomLeft, uv) * step(uv, topRight);
    return steps.x * steps.y;
}

float circleMask(vec2 uv, vec2 center, float radius, float smoothness) {
    float dist = length(uv - center);
    return 1.0 - smoothstep(radius - smoothness, radius, dist);
}

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}


// Add this Perlin-like noise function
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth interpolation
    vec2 u = f * f * (3.0 - 2.0 * f);

    // Mix 4 corners percentages
    return mix(a, b, u.x) + 
            (c - a)* u.y * (1.0 - u.x) + 
            (d - b) * u.x * u.y;
}

float noisyRectMask(vec2 uv, vec2 bottomLeft, vec2 topRight, float noiseScale, float noiseAmount) {
    // Get the basic rect mask
    float mask = rectMask(uv, bottomLeft, topRight);
    
    // Only apply noise if we're inside the rectangle
    if (mask > .0) {
        // Generate noise at the current position (scaled)
        float noiseValue = noise(uv * noiseScale);
        
        // Apply the noise to the mask (subtract a bit from the edges)
        mask = mask - noiseAmount * noiseValue;
        
        // Ensure we don't go below 0
        mask = max(0.0, mask);
    }
    
    return mask;
}


// Cell data structure to hold position and color index
struct Cell {
    int x;      // Column index
    int y;      // Row index
    int colorIndex;  // Index into color palette array
};

// Function to get cell mask from a Cell structure
float getCellMask(vec2 uv, float hBorders[6], float vBorders[6], Cell cell) {
    float left = hBorders[cell.x];
    float right = hBorders[cell.x + 1];
    float bottom = vBorders[cell.y];
    float top = vBorders[cell.y + 1];

    float angletwo =0.0;
    
    // // Create a copy of UV for rotation
    vec2 rotatedUV = uv;
    
    // // Translate to origin, rotate, translate back
    rotatedUV = mat2(cos(angletwo), -sin(angletwo), sin(angletwo), cos(angletwo)) * rotatedUV;
    

    return rectMask(rotatedUV, vec2(left, bottom), vec2(right, top));
}

// Create aspect-ratio corrected UVs centered in the window
vec2 getAspectCorrectedUV(vec2 fragCoord, vec2 resolution) {
    vec2 uv = fragCoord/resolution.y;
    vec2 center = resolution.xy / resolution.y * 0.5;
    return uv - center * vec2(1.0, 1.0) + vec2(0.5, 0.5);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 iResolution = u_resolution;
    float dt = u_time;
    vec2 mouse = u_mouse.xy / iResolution.xy;

    // vec2 uv = getAspectCorrectedUV(fragCoord, iResolution);
    vec2 uv = fragCoord/iResolution.xy;

    vec3 colorPalette[11] = vec3[11](
        vec3(0.008,0.059,0.349),
        vec3(0.008,0.075,0.451),
        vec3(0.224,0.314,0.722),
        vec3(0.388,0.463,0.835),
        vec3(0.729,0.773,0.949),
        vec3(0.216, 0.251, 0.09),    // darkGreen - forest/military green, good for shadows
        vec3(0.898, 0.949, 0.714),   // lightGreen - pale mint green, excellent for highlights
        vec3(0.682, 0.749, 0.435),   // midGreen - olive/sage green, versatile mid-tone
        vec3(0.396, 0.451, 0.196), 
        vec3(0.443, 0.851, 0.502),   // lightCyan - mint/aqua, fresh looking accent color
        vec3(0.553, 0.651, 0.337)
    );


    // animate color 
    float dc1 = pulsate(dt, 1.0, 1.14, 2.0);
    float dc2 = powSine(dt, 8.0, 0.4, 4.34);
    float dc3 = modulatedSine(dt, 0.4, 0.4, 2.9, 1.76, 2.9);
    float dc4 = compositeSine(dt, 0.5, 0.434, 3.0, 0.17, 1.0);

    // mix of colors 
    vec3 colMix1 = mix(colorPalette[0], colorPalette[4], dc1);
    vec3 colMix2 = mix(colorPalette[1], colorPalette[4], dc2);
    vec3 colMix3 = mix(colorPalette[4], colorPalette[5], dc3);
    vec3 colMix4 = mix(colorPalette[4], colorPalette[5], dc3);
    vec3 colMix5 = mix(colorPalette[1], colorPalette[9], dc4);
    vec3 colMix6 = mix(colorPalette[1], colorPalette[9], dc4);

    // Define your grid borders (6 values for 5 cells in each dimension)
    float hBorders[6] = float[6](0.0, 0.2, 0.4, 0.6, 0.8, 1.0);
    float vBorders[6] = float[6](0.0, 0.2, 0.4, 0.6, 0.8, 1.0);
    
    // Define your color palette
    vec3 colorPaletteMix[6] = vec3[6](
        colMix1,     
        colMix2,    
        colMix3,  
        colMix4,        
        colMix5,
        colMix6
    );
    
    // Define each cell with its position and color
    const int CELL_COUNT = 9 + 4 + 8 + 4; // Currently 9 cells, expandable to 25
    Cell cells[CELL_COUNT] = Cell[CELL_COUNT](
        Cell(0, 4, 0), // mTl - top left - colMix2
        Cell(2, 4, 1), // mMt - middle top - colMix1
        Cell(4, 4, 0), // mTr - top right - colMix1
        
        Cell(4, 2, 1), // mMr - middle right - colMix4
        Cell(4, 0, 0), // mBr - bottom right - colMix3

        Cell(2, 0, 1), // mMb - middle bottom - colMix2
        Cell(0, 0, 0), // mBl - bottom left - colMix4

        Cell(0, 2, 1), // mMl - middle left - colMix4
        // end of first square

        Cell(1, 3, 2), // mMtl - middle top left
        Cell(3, 3, 2), // mMtr - middle top right
        Cell(3, 1, 3), // mRbr - middle right bottom right
        Cell(1, 1, 3), // mRtr - middle right top right

        Cell(2, 2, 4),  // mMm - middle middle - colMix4
        
        Cell(1, 4, 4),
        Cell(3, 4, 4),  
        Cell(4, 3, 4),  
        Cell(4, 1, 4),
        Cell(3, 0, 4),
        Cell(1, 0, 4), 
        Cell(0, 1, 4),
        Cell(0, 3, 4),

        //center part
        Cell(2, 3, 6), // 1 
        Cell(3, 2, 6), // 2 
        Cell(2, 1, 6), // 3 
        Cell(1, 2, 6) // 4 
            
    );
    

    vec3 col = vec3(0.0);

    // Process all cells
    for (int i = 0; i < CELL_COUNT; i++) {
        float mask = getCellMask(uv, hBorders, vBorders, cells[i]);
        col += colorPaletteMix[cells[i].colorIndex] * mask;
    }
    
    
    fragColor = vec4(col, 1.0);
}

// green
 // vec3 colorPalette[8] = vec3[8](
    //     vec3(0.216, 0.251, 0.09),    // darkGreen - forest/military green, good for shadows
    //     vec3(0.898, 0.949, 0.714),   // lightGreen - pale mint green, excellent for highlights
    //     vec3(0.682, 0.749, 0.435),   // midGreen - olive/sage green, versatile mid-tone
    //     vec3(0.396, 0.451, 0.196),   // semiDarkGreen - moss green, good for mid-shadows
    //     vec3(0.298, 0.851, 0.212),   // exLightGreen - vibrant lime green, high saturation accent
    //     vec3(0.086, 0.251, 0.063),   // exDarkGreen - deep forest green, for darkest areas
    //     vec3(0.443, 0.851, 0.502),   // lightCyan - mint/aqua, fresh looking accent color
    //     vec3(0.553, 0.651, 0.337)    // darkCyan - muted teal/olive, earthy transition color
    // );

// OLD NOT SCALABLE CODE 

// // mask for quadrants
    // float cellSize = 0.8;
    // float cellM1 = 0.4;
    // float cellM2 = 0.6;

    // float mMt = step(cellM1, uv.x) * step(uv.x, cellM2)
    //             * step(cellSize, uv.y);

    // float mTr = step(cellSize, uv.x) * step(cellSize, uv.y);
    // float mBr = step(cellSize, uv.x) * step(cellSize, 1.0 - uv.y);

    // float mMr = step(0.8, uv.x)
    //             * step(cellM1, uv.y) * step(uv.y, cellM2);

    // float mTl = step(cellSize, 1.0 - uv.x) * step(cellSize, uv.y);

    // float mMb = step(cellM1, uv.x) * step(uv.x, cellM2)
    //             * step(cellSize, 1.0 - uv.y);

    // float mBl = step(cellSize, 1.0 - uv.x) * step(cellSize, 1.0 - uv.y);

    // float mMl = step(cellSize, 1.0 - uv.x) 
    //             * step(cellM1, uv.y) * step(uv.y, cellM2);

    // float mMm = step(cellM1, uv.x) * step(uv.x, cellM2)
    //             * step(cellM1, uv.y) * step(uv.y, cellM2) ;

// col += colMix1 * mMt;
    // col += colMix1 * mTr;
    // col += colMix2 * mTl;
    // col += colMix2 * mMb;
    // col += colMix3 * mBr;
    // col += colMix4 * mBl;
    // col += colMix4 * mMr;
    // col += colMix4 * mMl;
    // col += colMix4 * mMm;