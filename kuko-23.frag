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

// ✅ Identify the primary Voronoi cell centers and edges (already done)
// Create a local coordinate system within each primary cell
// Generate a secondary Voronoi pattern using these local coordinates
// Combine the primary and secondary patterns
// Refine the appearance (thickness, contrast, etc.)

// Steps to Add Height, Normals, and Lighting:

// Create a height field based on the Voronoi distances
// Calculate normals from the height field
// Implement basic lighting using the normals
// Refine material properties and lighting parameters
// Add additional effects (specular, ambient occlusion, etc.)

// Steps to Animate the Voronoi Pattern with Correct Normals and Lighting:

// Modify the voronoiDistSq function to include animation
// Update the getClosestCellInfo function to use the same animation parameters
// Ensure the normal calculation uses animated values consistently
// Adjust animation parameters for the inner Voronoi pattern
// Fine-tune the animation speed and amplitude


// fabrice -> https://www.shadertoy.com/view/4dKSDV

vec3 voronoiDistSq(vec2 p, float dt)
{
    vec2 cellId, diff;
    float d;
    vec3 dists = vec3(9.0);       

    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        // Animation vector - create a consistent circular motion
        vec2 animationOffset = 0.2 * vec2(
            cos(dt + 6.28 * H(cellId).x),
            sin(dt + 6.28 * H(cellId).y)
        );
        
        // Apply animation to cell point calculation
        diff = H(cellId) + cellId + animationOffset - p;


        d = dot(diff, diff);      

        d < dists.x ? (dists.yz = dists.xy, dists.x = d) :
        d < dists.y ? (dists.z  = dists.y , dists.y = d) :
        d < dists.z ?               dists.z = d        :
                       d;
    }
    return dists;
}

// Step 2: Create a local coordinate system within each primary cell
vec2 getLocalCoordinates(vec2 p, vec2 cellCenter) {
    // Convert to local space (centered at cell center)
    vec2 localP = p - cellCenter;
    
    // Scale to make the secondary pattern more visible
    // Adjust this scale factor based on desired density
    float scale = 4.0;
    localP *= scale;
    
    return localP;
}

// First step: Identify cell center and cell ID for inner Voronoi
vec4 getClosestCellInfo(vec2 p, float dt) {
    vec2 bestCellId = vec2(0.0);
    vec2 bestCellPoint = vec2(0.0);
    float minDist = 100.0;
    
    // Check the 9 neighboring cells
    for (int k = 0; k < 9; ++k) {
        vec2 cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        // vec2 cellPoint = H(cellId) + cellId;
        // Use the same animation offset as in voronoiDistSq
        vec2 animationOffset = 0.08 * vec2(
            cos(dt + 6.28 * H(cellId).x),
            sin(dt + 6.28 * H(cellId).y)
        );
        
        // Apply animation to cell point calculation
        vec2 cellPoint = H(cellId) + cellId + animationOffset;
        
        
        float dist = length(cellPoint - p);
        
        if (dist < minDist) {
            minDist = dist;
            bestCellId = cellId;
            bestCellPoint = cellPoint;
        }
    }
    
    // Return cell ID and cell center point
    return vec4(bestCellId, bestCellPoint);
}

float createHeightField(float primaryEdgeDist, float secondaryEdgeDist, float primaryDist) {

    float primaryEdgeHeight = 0.9;  
    float secondaryEdgeHeight = 0.6;  
    float baseHeight = 0.1;  
    float primaryEdgeWidth = 0.2;  
    float secondaryEdgeWidth = 0.12;  
    
    // Create height for primary edges - higher near edges
    float primaryEdgeInfluence = 1.0 - smoothstep(0.1, primaryEdgeWidth, primaryEdgeDist);
    float primaryHeight = mix(baseHeight, primaryEdgeHeight, primaryEdgeInfluence);
    
    // Create height for secondary edges - medium height near edges
    float secondaryEdgeInfluence = 1.0 - smoothstep(0.0, secondaryEdgeWidth, secondaryEdgeDist);
    float secondaryHeight = mix(baseHeight, secondaryEdgeHeight, secondaryEdgeInfluence);
    
    // Combine heights - primary edges take precedence
    float combinedHeight = max(primaryHeight, secondaryHeight);
    
    // Optional: Add some variation based on distance to primary cell center
    // This creates a subtle dome in the center of each cell
    float centerBump = 0.1 * (1.0 - smoothstep(0.0, 0.8, primaryDist));
    
    return combinedHeight + centerBump;
}

// Step 3: Update calculateNormals to use animation parameters
vec3 calculateNormals(vec2 uv, float scale, float dt) {
    float eps = 0.01;
    vec2 e = vec2(eps, 0.03);
    
    // Calculate animated heights with consistent time parameter
    float heightCenter = createHeightField(
        sqrt(voronoiDistSq(uv * scale, dt).y) - sqrt(voronoiDistSq(uv * scale, dt).x),
        sqrt(voronoiDistSq(getLocalCoordinates(uv, getClosestCellInfo(uv * scale, dt).zw / scale) + 
             vec2(getClosestCellInfo(uv * scale, dt).xy * 0.1), dt * 0.5).y) - 
        sqrt(voronoiDistSq(getLocalCoordinates(uv, getClosestCellInfo(uv * scale, dt).zw / scale) + 
             vec2(getClosestCellInfo(uv * scale, dt).xy * 0.1), dt * 0.5).x),
        sqrt(voronoiDistSq(uv * scale, dt).x)
    );
    
    float heightX = createHeightField(
        sqrt(voronoiDistSq((uv + e.xy) * scale, dt).y) - sqrt(voronoiDistSq((uv + e.xy) * scale, dt).x),
        sqrt(voronoiDistSq(getLocalCoordinates(uv + e.xy, getClosestCellInfo((uv + e.xy) * scale, dt).zw / scale) + 
             vec2(getClosestCellInfo((uv + e.xy) * scale, dt).xy * 0.1), dt * 0.5).y) - 
        sqrt(voronoiDistSq(getLocalCoordinates(uv + e.xy, getClosestCellInfo((uv + e.xy) * scale, dt).zw / scale) + 
             vec2(getClosestCellInfo((uv + e.xy) * scale, dt).xy * 0.1), dt * 0.5).x),
        sqrt(voronoiDistSq((uv + e.xy) * scale, dt).x)
    );
    
    float heightY = createHeightField(
        sqrt(voronoiDistSq((uv + e.yx) * scale, dt).y) - sqrt(voronoiDistSq((uv + e.yx) * scale, dt).x),
        sqrt(voronoiDistSq(getLocalCoordinates(uv + e.yx, getClosestCellInfo((uv + e.yx) * scale, dt).zw / scale) + 
             vec2(getClosestCellInfo((uv + e.yx) * scale, dt).xy * 0.1), dt * 0.5).y) - 
        sqrt(voronoiDistSq(getLocalCoordinates(uv + e.yx, getClosestCellInfo((uv + e.yx) * scale, dt).zw / scale) + 
             vec2(getClosestCellInfo((uv + e.yx) * scale, dt).xy * 0.1), dt * 0.5).x),
        sqrt(voronoiDistSq((uv + e.yx) * scale, dt).x)
    );
    
    // Calculate the normal using the gradient
    vec3 normal;
    normal.x = (heightX - heightCenter) / eps;
    normal.y = (heightY - heightCenter) / eps;
    normal.z = 1.0;  // Fixed z component
    
    return normalize(normal);
}

// Step 3: Implement basic lighting
// Enhanced lighting calculation
vec3 calculateLighting(vec3 normal, float height) {
    // Define multiple light directions for more interesting lighting
    vec3 lightDir1 = normalize(vec3(0.4, 0.5, 0.8));  // Main light
    vec3 lightDir2 = normalize(vec3(-0.3, -0.2, 0.6));  // Secondary light
    
    // Enhanced material properties
    vec3 baseColor = vec3(0.9, 0.95, 0.98);  // Slightly blue-tinted white for base
    vec3 edgeColor = vec3(0.15, 0.15, 0.3);   // Dark blue-tinted color for edges
    vec3 highlightColor = vec3(0.9, 0.9, 0.9);  // Pure white for highlights
    
    // Diffuse lighting from two light sources
    float diffuse1 = max(0.0, dot(normal, lightDir1));
    float diffuse2 = max(0.0, dot(normal, lightDir2)) * 0.5;  // Secondary light is weaker
    
    // Specular lighting (Blinn-Phong model)
    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));  // Camera is looking down the z-axis
    vec3 halfVector1 = normalize(lightDir1 + viewDir);
    float specular1 = pow(max(0.0, dot(normal, halfVector1)), 32.0) * 0.6;
    
    // Ambient occlusion effect based on height
    // Lower areas (valleys) receive less ambient light
    float ao = mix(0.5, 1.0, smoothstep(0.1, 0.6, height));
    
    // Mix between base color and edge color based on height
    // Higher areas (edges) get the edge color
    vec3 surfaceColor = mix(baseColor, edgeColor, smoothstep(0.2, 0.7, height));
    
    // Apply ambient, diffuse, and specular lighting
    float ambient = 0.25;
    vec3 finalColor = surfaceColor * (ambient * ao + diffuse1 + diffuse2);
    
    // Add specular highlights (stronger on edges)
    finalColor += highlightColor * specular1 * smoothstep(0.4, 0.8, height);
    
    return finalColor;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 iResolution = u_resolution;
    float dt = u_time;
    vec2 mouse = u_mouse.xy / iResolution.xy;
    vec2 uv = 6.0 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;// + dt * 0.01;   

    float scale = 0.6;
    vec3 d1 = voronoiDistSq(uv * scale, dt);
    
    // Get the cell ID and cell center for the current point
    vec4 cellInfo = getClosestCellInfo(uv * scale, dt);
    vec2 cellId = cellInfo.xy;
    vec2 cellCenter = cellInfo.zw / scale;
    
    // Get local coordinates within the cell
    vec2 localCoords = getLocalCoordinates(uv, cellCenter);
    
    // Get secondary (nested) Voronoi pattern using local coordinates
    vec3 d2 = voronoiDistSq(localCoords + vec2(cellId.x * 0.1, cellId.y * 0.1), dt * 0.5);
    
    // Cell distance metrics
    float primaryDist = sqrt(d1.x);
    float primaryEdgeDist = sqrt(d1.y) - sqrt(d1.x);
    float secondaryDist = sqrt(d2.x);
    float secondaryEdgeDist = sqrt(d2.y) - sqrt(d2.x);
    float primaryCellInfluence = smoothstep(0.0, 1.0, primaryEdgeDist);
    
    // Calculate height field
    float height = createHeightField(primaryEdgeDist, secondaryEdgeDist * primaryCellInfluence, primaryDist);
    
    // Calculate surface normals
    vec3 normal = calculateNormals(uv, scale, dt);
    
    // Calculate lighting
    vec3 finalColor = calculateLighting(normal, height);

    // float vignette = 1.0 - smoothstep(0.5, 1.5, length((fragCoord / iResolution.xy - 0.5) * 1.0));
    // finalColor *= mix(0.8, 1.0, vignette);

    fragColor = vec4( finalColor, 1.0 );
}


// normals
// void mainImage( out vec4 fragColor, in vec2 fragCoord )
// {
//     vec2 iResolution = u_resolution;
//     float dt = u_time;
//     vec2 mouse = u_mouse.xy / iResolution.xy;
//     vec2 uv = 6.0 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;// + dt * 0.01;   

//     float scale = 0.6;
//     vec3 d1 = voronoiDistSq(uv * scale, dt);
    
//     // Get the cell ID and cell center for the current point
//     vec4 cellInfo = getClosestCellInfo(uv * scale);
//     vec2 cellId = cellInfo.xy;
//     vec2 cellCenter = cellInfo.zw / scale;
    
//     // Get local coordinates within the cell
//     vec2 localCoords = getLocalCoordinates(uv, cellCenter);
    
//     // Get secondary (nested) Voronoi pattern using local coordinates
//     vec3 d2 = voronoiDistSq(localCoords + vec2(cellId.x * 0.1, cellId.y * 0.1), dt * 0.5);
    
//     // Cell distance metrics
//     float primaryDist = sqrt(d1.x);
//     float primaryEdgeDist = sqrt(d1.y) - sqrt(d1.x);
//     float secondaryDist = sqrt(d2.x);
//     float secondaryEdgeDist = sqrt(d2.y) - sqrt(d2.x);
//     float primaryCellInfluence = smoothstep(0.0, 0.6, primaryEdgeDist);
    
//     // Calculate height field
//     float height = createHeightField(primaryEdgeDist, secondaryEdgeDist * primaryCellInfluence, primaryDist);
    
//     // Calculate surface normals
//     vec3 normal = calculateNormals(uv, scale);
    
//     // Debug: Visualize normals as RGB
//     vec3 finalColor = normal * 0.5 + 0.5;  // Map from [-1,1] to [0,1] range

//     fragColor = vec4( finalColor, 1.0 );
// }

// void mainImage( out vec4 fragColor, in vec2 fragCoord )
// {
//     vec2 iResolution = u_resolution;
//     float dt = u_time;
//     vec2 mouse = u_mouse.xy / iResolution.xy;
//     vec2 uv = 6.0 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;// + dt * 0.01;   

//     float scale = 0.6;
//     vec3 d1 = voronoiDistSq(uv * scale, dt);
    
//     // Get the cell ID and cell center for the current point
//     vec4 cellInfo = getClosestCellInfo(uv * scale);
//     vec2 cellId = cellInfo.xy;
//     vec2 cellCenter = cellInfo.zw;
    
//     // Get local coordinates within the cell
//     vec2 localCoords = getLocalCoordinates(uv, cellCenter);
    
//     // Get secondary (nested) Voronoi pattern using local coordinates
//     // Offset the hash seed slightly to create variation
//     vec3 d2 = voronoiDistSq(localCoords + vec2(cellId.x * 0.1, cellId.y * 0.1), dt * 0.5);
    
//     // Cell distance metrics
//     float primaryDist = sqrt(d1.x);  // Distance to closest cell center
//     float primaryEdgeDist = sqrt(d1.y) - sqrt(d1.x);  // Distance to edge
    
//     float secondaryDist = sqrt(d2.x);  // Distance to closest secondary cell center
//     float secondaryEdgeDist = sqrt(d2.y) - sqrt(d2.x);  // Distance to secondary edge
    
//     // Create edge masks with controllable thickness
//     float primaryEdgeThickness = 0.3;
//     float secondaryEdgeThickness = 0.1;
    
//     float primaryEdge = 1.0 - smoothstep(0.2, primaryEdgeThickness, primaryEdgeDist);
//     float secondaryEdge = 1.0 - smoothstep(0.1, secondaryEdgeThickness, secondaryEdgeDist);
    
//     // Calculate primary cell influence - how much we're "inside" the primary cell
//     // Fade out the secondary pattern near primary edges
//     float primaryCellInfluence = smoothstep(0.0, 0.6, primaryEdgeDist);
    
//     // Center dot
//     float centerDotSize = 0.0;
//     float centerDot = 1.0 - smoothstep(0.0, centerDotSize, length(uv - cellCenter));
    
//     // Calculate final color
//     vec3 baseColor = vec3(1.0);  // White background
    
//     // Apply the secondary Voronoi edges - controlled by primary cell influence
//     vec3 colorWithSecondaryEdges = mix(baseColor, vec3(0.5), secondaryEdge * primaryCellInfluence);
    
//     // Step 1: Create height field
//     float height = createHeightField(primaryEdgeDist, secondaryEdgeDist * primaryCellInfluence, primaryDist);
    
//     // Visualize height field directly for debugging
//     vec3 finalColor = vec3(height);

//     fragColor = vec4( finalColor, 1.0 );
// }

// void mainImage( out vec4 fragColor, in vec2 fragCoord )
// {
//     vec2 iResolution = u_resolution;
//     float dt = u_time;
//     vec2 mouse = u_mouse.xy / iResolution.xy;
//     vec2 uv = 6.0 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;// + dt * 0.01;   

//     float scale = 0.6;
//     vec3 d1 = voronoiDistSq(uv * scale, dt);
    
//     // Get the cell ID and cell center for the current point
//     vec4 cellInfo = getClosestCellInfo(uv * scale);
//     vec2 cellId = cellInfo.xy;
//     vec2 cellCenter = cellInfo.zw;
    
//     // Get local coordinates within the cell
//     vec2 localCoords = getLocalCoordinates(uv, cellCenter);
    
//     // Get secondary (nested) Voronoi pattern using local coordinates
//     // Offset the hash seed slightly to create variation
//     vec3 d2 = voronoiDistSq(localCoords + vec2(cellId.x * 0.1, cellId.y * 0.1), dt * 0.5);
    
//     // Cell distance metrics
//     float primaryDist = sqrt(d1.x);  // Distance to closest cell center
//     float primaryEdgeDist = sqrt(d1.y) - sqrt(d1.x);  // Distance to edge
    
//     float secondaryDist = sqrt(d2.x);  // Distance to closest secondary cell center
//     float secondaryEdgeDist = sqrt(d2.y) - sqrt(d2.x);  // Distance to secondary edge
    
//     // Create edge masks with controllable thickness
//     float primaryEdgeThickness = 0.3;
//     float secondaryEdgeThickness = 0.1;
    
//     float primaryEdge = 1.0 - smoothstep(0.2, primaryEdgeThickness, primaryEdgeDist);
//     float secondaryEdge = 1.0 - smoothstep(0.1, secondaryEdgeThickness, secondaryEdgeDist);
    
//     // Calculate primary cell influence - how much we're "inside" the primary cell
//     // Fade out the secondary pattern near primary edges
//     float primaryCellInfluence = smoothstep(0.0, 0.6, primaryEdgeDist);
    
//     // Center dot
//     float centerDotSize = 0.0;
//     float centerDot = 1.0 - smoothstep(0.0, centerDotSize, length(uv - cellCenter));
    
//     // Calculate final color
//     vec3 baseColor = vec3(1.0);  // White background
    
//     // Apply the secondary Voronoi edges - controlled by primary cell influence
//     vec3 colorWithSecondaryEdges = mix(baseColor, vec3(0.5), secondaryEdge * primaryCellInfluence);
    
//     // Apply primary edges on top
//     vec3 finalColor = mix(colorWithSecondaryEdges, vec3(0.0), primaryEdge);
    
//     // Add center dot
//     finalColor = mix(finalColor, vec3(0.0), centerDot);

//     fragColor = vec4( finalColor, 1.0 );
// }

// void mainImage( out vec4 fragColor, in vec2 fragCoord )
// {
//     vec2 iResolution = u_resolution;
//     float dt = u_time;
//     vec2 mouse = u_mouse.xy / iResolution.xy;
//     vec2 uv = 3.0 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;// + dt * 0.01;   

//     vec3 d1 = voronoiDistSq(uv, dt);
    
//     // Get the cell ID and cell center for the current point
//     vec4 cellInfo = getClosestCellInfo(uv);
//     vec2 cellId = cellInfo.xy;
//     vec2 cellCenter = cellInfo.zw;
    
//     // Get local coordinates within the cell
//     vec2 localCoords = getLocalCoordinates(uv, cellCenter);
    
//     // Get secondary (nested) Voronoi pattern using local coordinates
//     vec3 d2 = secondaryVoronoi(localCoords);
    
//     // Primary Voronoi edge
//     float primaryEdge = 1.0 - smoothstep(0.0, 0.05, sqrt(d1.y) - sqrt(d1.x));
    
//     // Secondary Voronoi edge
//     float secondaryEdge = 1.0 - smoothstep(0.0, 0.05, sqrt(d2.y) - sqrt(d2.x));
    
//     // Original cell coloring
//     vec3 col1 = vec3(8.0) * sqrt(d1); 
//     col1 -= vec3(col1.x);
//     col1 += 4.0 * (col1.y / (col1.y / col1.z + 1.0) - 0.5) - col1;
    
//     // Simple coloring for visualization: white cells with black edges
//     vec3 baseColor = vec3(1.0);
    
//     // Apply secondary edges only inside primary cells
//     vec3 withSecondaryEdges = mix(baseColor, vec3(0.7), secondaryEdge * 0.7);
    
//     // Apply primary edges on top of everything
//     vec3 finalColor = mix(withSecondaryEdges, vec3(0.0), primaryEdge);
    
//     // Center dot
//     float centerDot = 1.0 - smoothstep(0.0, 0.1, length(uv - cellCenter));
//     finalColor = mix(finalColor, vec3(0.0), centerDot);

//     fragColor = vec4( finalColor, 1.0 );
// }


// local coordinate system
// void mainImage( out vec4 fragColor, in vec2 fragCoord )
// {
//     vec2 iResolution = u_resolution;
//     float dt = u_time;
//     vec2 mouse = u_mouse.xy / iResolution.xy;
//     vec2 uv = 3.0 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;// + dt * 0.01;   

//     vec3 d1 = voronoiDistSq(uv, dt);
    
//     // Get the cell ID and cell center for the current point
//     vec4 cellInfo = getClosestCellInfo(uv);
//     vec2 cellId = cellInfo.xy;
//     vec2 cellCenter = cellInfo.zw;
    
//     // Get local coordinates within the cell
//     vec2 localCoords = getLocalCoordinates(uv, cellCenter);
    
//     // Primary Voronoi edge
//     float primaryEdge = 1.0 - smoothstep(0.0, 0.05, sqrt(d1.y) - sqrt(d1.x));
    
//     // Debug: Visualize local coordinate system
//     // Create a checkerboard pattern based on local coordinates
//     vec2 checker = step(vec2(0.0), sin(localCoords * 2.0));
//     float checkerPattern = abs(checker.x - checker.y);
    
//     // Original cell coloring
//     vec3 col1 = vec3(8.0) * sqrt(d1); 
//     col1 -= vec3(col1.x);
//     col1 += 4.0 * (col1.y / (col1.y / col1.z + 1.0) - 0.5) - col1;
    
//     // Blend checkerboard pattern inside each cell
//     vec3 checkerColor = mix(vec3(0.8), vec3(1.0), checkerPattern);
    
//     // Combine: inside cells use checker pattern, edges use primary edge color
//     vec3 finalColor = mix(checkerColor, vec3(0.0), primaryEdge);
    
//     // Center dot
//     float centerDot = 1.0 - smoothstep(0.0, 0.1, length(uv - cellCenter));
//     finalColor = mix(finalColor, vec3(0.0), centerDot);

//     fragColor = vec4( finalColor, 1.0 );
// }

// void mainImage( out vec4 fragColor, in vec2 fragCoord )
// {
//     vec2 iResolution = u_resolution;
//     float dt = u_time;
//     vec2 mouse = u_mouse.xy / iResolution.xy;
//     vec2 uv = 3.0 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;// + dt * 0.01;   

//     vec3 d1 = voronoiDistSq(uv, dt);
    
//     // Get the cell ID and cell center for the current point
//     vec4 cellInfo = getClosestCellInfo(uv);
//     vec2 cellId = cellInfo.xy;
//     vec2 cellCenter = cellInfo.zw;
    
//     // Visualize: make edges darker where points are near cell boundaries
//     float edge = 1.0 - smoothstep(0.0, 0.05, sqrt(d1.y) - sqrt(d1.x));
    
//     // Basic coloring similar to original code
//     vec3 col1 = vec3(8.0) * sqrt(d1); 
//     col1 -= vec3(col1.x);
//     col1 += 4.0 * (col1.y / (col1.y / col1.z + 1.0) - 0.5) - col1;
    
//     // For now, just highlight edges
//     vec3 finalColor = mix(col1, vec3(1.0), edge);
    
//     // Debug visualization: show the cell centers as white dots
//     float cellCenterDot = 1.0 - smoothstep(0.0, 0.5, length(uv - cellCenter));
//     finalColor = mix(finalColor, vec3(0.0), cellCenterDot);

//     fragColor = vec4( finalColor, 1.0 );
// }


/*
    glslViewer kuko-16.frag -w 1080 -h 1920 --headless \
    -E "record,reel.mp4,0,60,300"

glslViewer kuko-16.frag -w 1080 -h 1920 --headless \
  -E record,reel.mp4,0,5,60


    ffmpeg -framerate 60 -pattern_type glob -i '*.png' \
  -c:v libvpx-vp9 \
  -b:v 0 -crf 30 \
  -row-mt 1 \
  -tile-columns 2 -tile-rows 2 \
  -threads 8 \
  -speed 1 \
  -frame-parallel 0 \
  -auto-alt-ref 1 \
  -lag-in-frames 25 \
  -g 240 \
  -pix_fmt yuv420p \
  -an \
  kuko-4.webm


    ffmpeg -framerate 60 -pattern_type glob -i '*.png' \
  -c:v libx264 -preset medium \
  -crf 18 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  -an \
  -threads 8 \
  kuko.mp4


  ffmpeg -framerate 60 -pattern_type glob -i '*.png' -vf "fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=full:reserve_transparent=0[p];[s1][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle" kuko-4.gif

  ffmpeg -framerate 60 -pattern_type glob -i '*.png' \
  -vf "fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=full:reserve_transparent=0[p];[s1][p]paletteuse=dither=floyd_steinberg:diff_mode=rectangle" \
  -threads 8 \
  -loop 0 \
  kuko-7.gif

  ffmpeg -framerate 30 -pattern_type glob -i '*.png' \
  -vf "fps=30,scale=1080:1350:force_original_aspect_ratio=decrease,pad=1080:1350:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p" \
  -c:v h264_videotoolbox -b:v 10M -maxrate 12M -bufsize 20M \
  -profile:v high -level 4.0 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  kuko-9.mp4

*/
