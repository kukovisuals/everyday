// --- Hash and noise functions ---
vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

float H(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// Fractal Brownian Motion for noise texture
float fbm11(vec2 p) {
    float f = 0.0;
    float weight = 0.5;
    float scale = 1.0;
    
    for (int i = 0; i < 4; i++) {
        f += weight * (0.5 + 0.5 * sin(p.x * scale) * sin(p.y * scale));
        weight *= 0.5;
        scale *= 2.7;
    }
    
    return f;
}

// --- Ellipse functions ---
float ellipseDistance(vec2 p, vec2 center, vec2 ab, float angle) {
    // Move to ellipse coordinate system
    p = p - center;
    
    // Rotate point to align with ellipse axes
    float c = cos(angle);
    float s = sin(angle);
    p = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);
    
    // Scale to make unit circle
    p = p / ab;
    
    // Distance approximation to ellipse
    float r = length(p);
    return (r - 1.0) * min(ab.x, ab.y);
}

// Function to check if a point is inside an ellipse
bool insideEllipse(vec2 p, vec2 center, vec2 ab, float angle) {
    // Move to ellipse coordinate system
    p = p - center;
    
    // Rotate point to align with ellipse axes
    float c = cos(angle);
    float s = sin(angle);
    p = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);
    
    // Scale to make unit circle
    p = p / ab;
    
    // Inside check
    return length(p) < 1.0;
}

// --- Struct to store ellipse info ---
struct Ellipse {
    vec2 center;
    vec2 axes;
    float angle;
    float distFromPoint;
    bool isInside;
};

// --- Dot generation function ---
vec3 generateDots(vec2 uv, vec2 ellipseCenter, vec2 ellipseAxes, float ellipseAngle, float dt) {   
    vec3 dotColor = vec3(0.0);
    
    // Transform point to ellipse space
    vec2 localPos = uv - ellipseCenter;
    
    // Rotate to align with ellipse
    float c = cos(-ellipseAngle);
    float s = sin(-ellipseAngle);
    localPos = vec2(c * localPos.x + s * localPos.y, -s * localPos.x + c * localPos.y);
    
    // Scale to make ellipse a unit circle
    vec2 normalizedPos = localPos / ellipseAxes;
    
    // Check if we're inside the ellipse
    if (length(normalizedPos) >= 1.0) {
        return vec3(0.0); // Outside the ellipse
    }
    
    // Use ellipse center as a seed for this ellipse's dots
    vec2 cellId = floor(ellipseCenter * 10.0);
    
    // Parameters - more dots for larger ellipses
    int NUM_DOTS = int(100.0 * (ellipseAxes.x + ellipseAxes.y));
    NUM_DOTS = max(NUM_DOTS, 50); // At least 50 dots
    NUM_DOTS = min(NUM_DOTS, 200); // Cap at 200 dots for performance
    
    // Create dots
    for (int i = 0; i < 200; i++) {
        if (i >= NUM_DOTS) break;
        
        // Hash for random values
        vec2 hashInput = vec2(float(i) * 0.1) + cellId + vec2(13.5, 7.2);
        
        // Random position for this dot - distribute within ellipse
        // Use rejection sampling approach for better distribution
        vec2 dotPos = vec2(
            H(hashInput) * 2.0 - 1.0,
            H(hashInput + vec2(42.1, 11.3)) * 2.0 - 1.0
        );
        
        // Shrink a bit to ensure dots stay within ellipse
        dotPos *= 0.85;
        
        // Add animation - smaller movement near edges
        float distFromEdge = 1.0 - length(normalizedPos);
        vec2 animOffset = 0.2 * distFromEdge * vec2(
            sin(dt * 0.5 + 6.28 * H(hashInput)),
            cos(dt * 0.5 + 6.28 * H(hashInput + vec2(33.3, 27.8)))
        );
        dotPos += animOffset;
        
        // Random dot size - smaller near edges
        float edgeFactor = smoothstep(0.0, 0.3, 1.0 - length(dotPos));
        float dotSize = (0.03 + 0.07 * H(hashInput + vec2(100.0, 200.0))) * edgeFactor;
        
        // Distance to dot center
        float dist = length(normalizedPos - dotPos);
        
        // Add noise texture to dot
        float textureSeed = H(hashInput + vec2(33.7, 71.9)) * 100.0;
        float noiseValue = fbm11((normalizedPos - dotPos) * 5.0 + textureSeed + dt * 0.1);
        float noisyDist = dist * (0.7 + 0.5 * noiseValue);
        
        // Dot shape with inner and outer parts
        float innerDot = smoothstep(dotSize, dotSize * 0.3, noisyDist);
        float outerGlow = smoothstep(dotSize * 3.0, dotSize * 0.5, noisyDist);
        
        // HSV color for dots - whiter in the center of the ellipse
        float centerBoost = smoothstep(0.7, 0.0, length(normalizedPos));
        float hue = 0.6 + 0.1 * H(hashInput + vec2(27.1, 33.7));
        float sat = 0.3 + 0.5 * H(hashInput + vec2(77.7, 33.2)) - 0.3 * centerBoost;
        float val = 0.8 + 0.2 * innerDot + 0.1 * centerBoost; 
        
        // HSV to RGB conversion
        vec3 k = vec3(1.0, 2.0/3.0, 1.0/3.0);
        vec3 p = abs(fract(vec3(hue) + k) * 6.0 - 3.0);
        vec3 thisColor = val * mix(vec3(1.0), clamp(p - vec3(1.0), 0.0, 1.0), sat);
        
        // Apply dot intensity
        vec3 coloredDot = thisColor * (innerDot + outerGlow * 0.5);
        
        // Max blend with existing dots
        dotColor = max(dotColor, coloredDot);
    }
    
    // Fade dots near the edge of the ellipse
    float edgeFade = smoothstep(0.9, 0.8, length(normalizedPos));
    return dotColor * edgeFade;
}

// Function to create packed ellipses
Ellipse findNearestEllipse(vec2 uv) {
    Ellipse nearest;
    nearest.distFromPoint = 1000.0;
    nearest.isInside = false;
    
    // Check nearby grid cells for ellipses
    for (int y = -2; y <= 2; y++) {
        for (int x = -2; x <= 2; x++) {
            // Current cell coordinates
            vec2 cellPos = floor(uv) + vec2(x, y);
            
            // Get 1-4 ellipses per cell based on hash
            int numEllipses = 1 + int(3.0 * hash2(cellPos).x);
            
            for (int i = 0; i < 4; i++) {
                if (i >= numEllipses) break;
                
                // Generate random parameters for this ellipse
                vec2 h = hash2(cellPos + 0.1 * vec2(i));
                vec2 ellipseCenter = cellPos + h;
                
                // Ellipse axes (a,b) - vary size based on position
                float size = 0.3 + 0.5 * hash2(cellPos + vec2(i, 0)).x;
                float aspect = 0.5 + hash2(cellPos + vec2(0, i)).y;
                vec2 ab = size * vec2(1.0, aspect);
                
                // Ellipse rotation angle
                float angle = 6.28 * hash2(cellPos + vec2(i)).y;
                
                // Calculate distance to this ellipse
                float dist = ellipseDistance(uv, ellipseCenter, ab, angle);
                
                // Check if this is the nearest so far
                if (dist < nearest.distFromPoint) {
                    nearest.distFromPoint = dist;
                    nearest.center = ellipseCenter;
                    nearest.axes = ab;
                    nearest.angle = angle;
                    nearest.isInside = insideEllipse(uv, ellipseCenter, ab, angle);
                }
            }
        }
    }
    
    return nearest;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalize coordinates
    vec2 uv = fragCoord / iResolution.y;
    
    // Scale to control density
    uv *= 3.0;
    
    // Find nearest ellipse
    Ellipse nearest = findNearestEllipse(uv);
    
    // Create glowing edges
    float edgeGlow = exp(-6.0 * abs(nearest.distFromPoint));
    
    // Add some variation to the glow color based on position
    vec3 glowColor = mix(
        vec3(0.2, 0.4, 0.8),  // Blue
        vec3(0.9, 0.9, 1.0),  // White
        smoothstep(-0.1, 0.1, sin(uv.x * 0.2) * sin(uv.y * 0.3))
    );
    
    // Dark background
    vec3 bgColor = vec3(0.0, 0.0, 0.1);
    
    // Generate dots inside the ellipse
    vec3 dots = vec3(0.0);
    if (nearest.isInside) {
        dots = generateDots(uv, nearest.center, nearest.axes, nearest.angle, iTime);
    }
    
    // Combine everything:
    // 1. Start with background
    vec3 finalColor = bgColor;
    
    // 2. Add dots inside ellipses
    finalColor += dots;
    
    // 3. Add glowing edges on top
    finalColor = mix(finalColor, glowColor, edgeGlow);
    
    // Output
    fragColor = vec4(finalColor, 1.0);
}