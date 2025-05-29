// Hash function for random values
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

// Main dot generation function
vec3 generateDots(vec2 uv, float dt) {   
    vec3 dotColor = vec3(0.0);
    
    // Parameters
    const int NUM_DOTS = 100;
    vec2 cellId = floor(uv * 0.5); // Simple cell ID
    
    // Create dots
    for (int i = 0; i < NUM_DOTS; i++) {   
        // Hash for random values
        vec2 hashInput = vec2(float(i) * 0.1) + cellId * 10.0 + vec2(13.5, 7.2);
        
        // Random position for this dot
        vec2 dotPos = vec2(
            H(hashInput),
            H(hashInput + vec2(42.1, 11.3))
        );
        
        // Scale position to cover area
        vec2 scaledDotPos = dotPos * 1.5 - 0.7; 
        
        // Add animation
        vec2 animOffset = 0.1 * vec2(
            sin(dt * 0.5 + 6.28 * H(hashInput)),
            cos(dt * 0.5 + 6.28 * H(hashInput + vec2(33.3, 27.8)))
        );
        scaledDotPos += animOffset;

        // Random dot size
        float dotSize = 0.05 + 0.1 * H(hashInput + vec2(100.0, 200.0));
        
        // Distance to dot center
        float dist = length((uv - cellId - vec2(0.5)) * 2.0 - scaledDotPos);
        
        // Add noise texture to dot
        float textureSeed = H(hashInput + vec2(33.7, 71.9)) * 100.0;
        float noiseValue = fbm11((uv * 2.0 - scaledDotPos) * 5.0 + textureSeed + dt * 0.1);
        float noisyDist = dist * (0.7 + 0.5 * noiseValue);
        
        // Dot shape with inner and outer parts
        float innerDot = smoothstep(dotSize, dotSize * 0.3, noisyDist);
        float outerGlow = smoothstep(dotSize * 3.0, dotSize * 0.5, noisyDist);
        
        // HSV color for dots
        float hue = 0.6 + 0.1 * H(hashInput + vec2(27.1, 33.7));
        float sat = 0.3 + 0.5 * H(hashInput + vec2(77.7, 33.2));
        float val = 0.8 + 0.2 * innerDot; 
        
        // HSV to RGB conversion
        vec3 k = vec3(1.0, 2.0/3.0, 1.0/3.0);
        vec3 p = abs(fract(vec3(hue) + k) * 6.0 - 3.0);
        vec3 thisColor = val * mix(vec3(1.0), clamp(p - vec3(1.0), 0.0, 1.0), sat);
        
        // Apply dot intensity
        vec3 coloredDot = thisColor * (innerDot + outerGlow * 0.5);
        
        // Max blend with existing dots
        dotColor = max(dotColor, coloredDot);
    }
    
    return dotColor;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalize coordinates
    vec2 uv = fragCoord / iResolution.xy;
    
    // Generate dots
    vec3 dots = generateDots(uv * 1.0, iTime);
    
    // Dark background
    vec3 bgColor = vec3(0.0, 0.0, 0.1);
    
    // Final color
    vec3 finalColor = bgColor + dots;
    
    fragColor = vec4(finalColor, 1.0);
}