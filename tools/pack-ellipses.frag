// Simple GLSL for packed ellipses with glowing boundaries

// Hash function for random values
vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

// Computes approximate distance to an ellipse
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

// Function to create packed ellipses
float packedEllipses(vec2 uv) {
    // Initialize with a large distance
    float minDist = 1000.0;
    
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
                
                // Keep track of minimum distance
                minDist = min(minDist, dist);
            }
        }
    }
    
    return minDist;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalize coordinates
    vec2 uv = fragCoord / iResolution.y;
    
    // Scale to control density
    uv *= 3.0;
    
    // Get distance to nearest ellipse boundary
    float dist = packedEllipses(uv);
    
    // Create glowing edges
    float edgeGlow = exp(-6.0 * abs(dist));
    
    // Add some variation to the glow color based on position
    vec3 glowColor = mix(
        vec3(0.2, 0.4, 0.8),  // Blue
        vec3(0.9, 0.9, 1.0),  // White
        smoothstep(-0.1, 0.1, sin(uv.x * 0.2) * sin(uv.y * 0.3))
    );
    
    // Dark background
    vec3 bgColor = vec3(0.0, 0.0, 0.1);
    
    // Combine colors
    vec3 finalColor = mix(bgColor, glowColor, edgeGlow);
    
    // Output
    fragColor = vec4(finalColor, 1.0);
}