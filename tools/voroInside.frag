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
// fabrice -> https://www.shadertoy.com/view/4dKSDV

vec3 voronoiDistSq(vec2 p, float dt)
{
    vec2 cellId, diff;
    float d;
    vec3 dists = vec3(9.0);       

    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        diff   = H(cellId) + cellId - p;


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
vec4 getClosestCellInfo(vec2 p) {
    vec2 bestCellId = vec2(0.0);
    vec2 bestCellPoint = vec2(0.0);
    float minDist = 100.0;
    
    // Check the 9 neighboring cells
    for (int k = 0; k < 9; ++k) {
        vec2 cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        vec2 cellPoint = H(cellId) + cellId;
        
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

// Step 3: Generate a secondary Voronoi in the local coordinate system
vec3 secondaryVoronoi(vec2 localP) {
    // Re-use the same voronoiDistSq function but with local coordinates
    return voronoiDistSq(localP, 0.0); // Using fixed time for now
}

float heightAt(vec2 p, float dt)
{
    // vec3  d        = voronoiDistSq(p, dt);
    vec3  d        = voronoiDistSq(p, dt);
    float F1       = sqrt(d.x);
    float F2       = sqrt(d.y);
    float F3       = sqrt(d.z);
    float edgeDiff = F2 - F1;               // ≥ 0, biggest at cell centre
    float curvature = (F3 - F2) / F2;

    // use a *positive* scale so height rises inward
    return clamp( 5.5 * edgeDiff * curvature, 0.05, 1.0 );   // 0.8‒1.0 works well
}

float createHeightField(float primaryEdgeDist, float secondaryEdgeDist, float primaryDist) {
    // Parameters for height field
    float primaryEdgeHeight = 0.9;  // Height of primary edges
    float secondaryEdgeHeight = 0.6;  // Height of secondary edges
    float baseHeight = 0.1;  // Base height of the surface
    float primaryEdgeWidth = 0.2;  // Width of primary edge elevation
    float secondaryEdgeWidth = 0.1;  // Width of secondary edge elevation
    
    // Create height for primary edges - higher near edges
    float primaryEdgeInfluence = 1.0 - smoothstep(0.0, primaryEdgeWidth, primaryEdgeDist);
    float primaryHeight = mix(baseHeight, primaryEdgeHeight, primaryEdgeInfluence);
    
    // Create height for secondary edges - medium height near edges
    float secondaryEdgeInfluence = 1.0 - smoothstep(0.0, secondaryEdgeWidth, secondaryEdgeDist);
    float secondaryHeight = mix(baseHeight, secondaryEdgeHeight, secondaryEdgeInfluence);
    
    // Combine heights - primary edges take precedence
    float combinedHeight = max(primaryHeight, secondaryHeight);
    
    // Optional: Add some variation based on distance to primary cell center
    // This creates a subtle dome in the center of each cell
    float centerBump = 0.1 * (1.0 - smoothstep(0.0, 0.5, primaryDist));
    
    return combinedHeight + centerBump;
}

// Step 2: Calculate surface normals from the height field
vec3 calculateNormals(vec2 uv, float scale) {
    // Use small offsets for numerical differentiation
    float eps = 0.01;
    vec2 e = vec2(eps, 0.0);
    
    // Sample heights at nearby points
    float heightCenter = createHeightField(
        sqrt(voronoiDistSq(uv * scale, 0.0).y) - sqrt(voronoiDistSq(uv * scale, 0.0).x),
        sqrt(voronoiDistSq(getLocalCoordinates(uv, getClosestCellInfo(uv * scale).zw / scale) + 
             vec2(getClosestCellInfo(uv * scale).xy * 0.1), 0.0).y) - 
        sqrt(voronoiDistSq(getLocalCoordinates(uv, getClosestCellInfo(uv * scale).zw / scale) + 
             vec2(getClosestCellInfo(uv * scale).xy * 0.1), 0.0).x),
        sqrt(voronoiDistSq(uv * scale, 0.0).x)
    );
    
    float heightX = createHeightField(
        sqrt(voronoiDistSq((uv + e.xy) * scale, 0.0).y) - sqrt(voronoiDistSq((uv + e.xy) * scale, 0.0).x),
        sqrt(voronoiDistSq(getLocalCoordinates(uv + e.xy, getClosestCellInfo((uv + e.xy) * scale).zw / scale) + 
             vec2(getClosestCellInfo((uv + e.xy) * scale).xy * 0.1), 0.0).y) - 
        sqrt(voronoiDistSq(getLocalCoordinates(uv + e.xy, getClosestCellInfo((uv + e.xy) * scale).zw / scale) + 
             vec2(getClosestCellInfo((uv + e.xy) * scale).xy * 0.1), 0.0).x),
        sqrt(voronoiDistSq((uv + e.xy) * scale, 0.0).x)
    );
    
    float heightY = createHeightField(
        sqrt(voronoiDistSq((uv + e.yx) * scale, 0.0).y) - sqrt(voronoiDistSq((uv + e.yx) * scale, 0.0).x),
        sqrt(voronoiDistSq(getLocalCoordinates(uv + e.yx, getClosestCellInfo((uv + e.yx) * scale).zw / scale) + 
             vec2(getClosestCellInfo((uv + e.yx) * scale).xy * 0.1), 0.0).y) - 
        sqrt(voronoiDistSq(getLocalCoordinates(uv + e.yx, getClosestCellInfo((uv + e.yx) * scale).zw / scale) + 
             vec2(getClosestCellInfo((uv + e.yx) * scale).xy * 0.1), 0.0).x),
        sqrt(voronoiDistSq((uv + e.yx) * scale, 0.0).x)
    );
    
    // Calculate the normal using the gradient
    vec3 normal;
    normal.x = (heightX - heightCenter) / eps;
    normal.y = (heightY - heightCenter) / eps;
    normal.z = 1.0;  // Fixed z component
    
    return normalize(normal);
}

// Step 3: Implement basic lighting
vec3 calculateLighting(vec3 normal, float height) {
    // Define a light direction (can be animated if desired)
    vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
    
    // Basic material properties
    vec3 baseColor = vec3(0.9);  // Off-white base color
    vec3 edgeColor = vec3(0.3);  // Darker color for edges
    
    // Basic lighting calculation
    float diffuse = max(0.0, dot(normal, lightDir));
    
    // Mix between base color and edge color based on height
    // Higher areas (edges) get the edge color
    vec3 surfaceColor = mix(baseColor, edgeColor, smoothstep(0.1, 0.6, height));
    
    // Apply ambient and diffuse lighting
    float ambient = 0.3;
    vec3 finalColor = surfaceColor * (ambient + diffuse);
    
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
    vec4 cellInfo = getClosestCellInfo(uv * scale);
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
    float primaryCellInfluence = smoothstep(0.0, 0.9, primaryEdgeDist);
    
    // Calculate height field
    float height = createHeightField(primaryEdgeDist, secondaryEdgeDist * primaryCellInfluence, primaryDist);
    
    // Calculate surface normals
    vec3 normal = calculateNormals(uv, scale);
    
    // Calculate lighting
    vec3 finalColor = calculateLighting(normal, height);

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
float rand(vec2 p) {                  // cheap 2‑D hash → [0,1)
    return fract(sin(dot(p, vec2(27.13, 91.17))) * 43758.5453);
}

vec3 voronoiVarRadius(vec2 p, float dt) {
    vec2  base   = floor(p);         
    vec3  dists  = vec3(9.0); 
    float differ;       

    for(int j = -3; j <= 3; ++j)
    for(int i = -3; i <= 3; ++i) {
        vec2 cell  = base + vec2(i, j);         
        vec2 site  = cell + H(cell) + 0.08 * sin(dt + 6.28 * H(cell));            
        float r    = mix(0.5, 3.0, rand(cell) ); 

        differ = length(p - site) - r;         
        differ *= differ;                                 

        differ < dists.x ? (dists.yz = dists.xy, dists.x = differ) :
        differ < dists.y ? (dists.z  = dists.y , dists.y = differ) :
        differ < dists.z ?                dists.z = differ  :
                       differ;
    }
    return dists;   // x = F1², y = F2², z = F3²
}

vec3 voronoiDistSq(vec2 p, float dt)
{
    vec2 cellId, diff;
    float d;
    vec3 dists = vec3(9.0);       

    for (int k = 0; k < 9; ++k)
    {
        cellId = ceil(p) + vec2(k - (k/3)*3, k/3) - 2.0;
        // diff   = H(cellId) + cellId - p;
        diff = H(cellId) + cellId + 0.08 * cos(dt + 6.28 * H(cellId)) - p;

        d = dot(diff, diff);      

        d < dists.x ? (dists.yz = dists.xy, dists.x = d) :
        d < dists.y ? (dists.z  = dists.y , dists.y = d) :
        d < dists.z ?               dists.z = d        :
                       d;
    }
    return dists;
}


vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}

void colorPalette(int effectIndex, vec2 uv, out vec3 bg, out vec3 rgbColor){
    float hue = mod(uv.y / 0.6 + uv.x, 1.0);
    
    bg = vec3(0.3631,0.5847,0.6969);
    rgbColor = pal(uv.y,vec3(0.129,0.404,0.49),vec3(0.153,0.024,0.002),vec3(0.169,0.514,0.549),vec3(0.153,0.424,0.502) );
}

float heightAt(vec2 p, float dt)
{
    // vec3  d        = voronoiDistSq(p, dt);
    vec3  d        = voronoiDistSq(p, dt);
    float F1       = sqrt(d.x);
    float F2       = sqrt(d.y);
    float F3       = sqrt(d.z);
    float edgeDiff = F2 - F1;               // ≥ 0, biggest at cell centre
    float curvature = (F3 - F2) / F2;

    // use a *positive* scale so height rises inward
    return clamp( 5.5 * edgeDiff * curvature, 0.05, 1.0 );   // 0.8‒1.0 works well
}

int effectIndex = 0;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 iResolution = u_resolution;
    float dt = u_time;
    vec2 mouse = u_mouse.xy / iResolution.xy;
    vec2 uv = 2.0 * (fragCoord + fragCoord - iResolution.xy) / iResolution.y;
    uv.x += dt * 0.1;   

    float scale2 = floor(rand(iResolution.xy) * 1.0) + 2.5;
    vec3 d1 = voronoiDistSq(uv * 1.0, dt);  
    vec3 d2 = voronoiVarRadius(uv * scale2, dt);  


    float w   = 3.0;
    float edgeDist = sqrt(d1.y) - sqrt(d1.x);
    float mask = smoothstep( w, 0.0, edgeDist ) *
                 smoothstep(-w, 3.0, -edgeDist);   

    float F1 = sqrt(d2.x);
    float F2 = sqrt(d2.y);
    float F3 = sqrt(d2.z);

    float edgeWidth = F2 - F1;
    float curvature = (F3 - F2) / F2;

    // approximate the gradient to fake the  normal
    float eps = 10.0 / iResolution.x * -5.3;
    float ho = heightAt(d2.xy, dt);
    
    float dhx = heightAt(uv + vec2(eps, 0.0), dt) - ho;
    float dhy = heightAt(uv + vec2(0.0, eps), dt) - ho;
    vec3 normal = normalize( vec3(dhx, dhy, 0.02 ) );

    // per pixel lightning 
    vec3 lightDir = normalize(vec3(0.1, 0.4, 0.5));
    vec3 viewDir = vec3(0.4, 0.1, 1.0); 
    
    float diffuse = max( dot(normal, lightDir), 0.0);

    vec3 reflextDir = reflect( -lightDir, normal);
    float specular = pow( max( dot(reflextDir, viewDir), 0.0), 64.0);

    float rim = pow(1.0 - normal.z, 4.0);

    vec3 col1 = 2.4 * sqrt(d1);
    col1 -= vec3(col1.x);
    col1 += 8.0 * ( col1.y / (col1.y / col1.z + 1.0) - 0.5 ) - col1;

    vec3 col2 = 20.0 * sqrt(d2);
    col2 -= vec3(col2.x);
    col2 += 5.0 * ( col2.y / (col2.y / col2.z + 1.0) - 0.5 ) - col2;

    vec3 finalColor = mix( col1, col2, mask );
    /*–‑‑ colors –‑‑*/
//     vec3 bg, rgbColor;
//     effectIndex = int(mod(dt / 10.0, 6.0));
//     colorPalette(effectIndex, uv, bg, rgbColor);

//     vec3 colorGrad =  rgbColor * diffuse * finalColor
//            + vec3(1.0) * specular 
//            +   rgbColor * rim * 0.3; 
//     float alpha = smoothstep(-0.003, 0.003, F1);
//     vec3 color = mix(bg,colorGrad,  alpha);

//     fragColor = vec4( color, 1.0 );
//     // fragColor = vec4(normal * 0.5 + 0.5, 1.0); // check if normals look valid

// }


