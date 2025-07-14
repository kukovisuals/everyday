#version 120
#ifdef GL_ES
precision highp float;
#endif
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform sampler2D u_text0;

void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

// HSV to RGB conversion function - MEMORIZE THIS!
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - u_resolution) / u_resolution.y;
    uv = I / u_resolution.xy;
    
    // Create 2x8 grid
    vec2 grid = floor(uv * vec2(4.0, 3.0));
    vec2 cell_uv = fract(uv * vec2(4.0, 3.0));
    
    // Calculate cell index (0-15)
    int cell_id = int(grid.y * 4.0 + grid.x);
    
    vec3 color = vec3(0.0);
    vec3 white = vec3(1.0);
    vec3 black = vec3(0.0);
    vec3 red = vec3(1.0, 0.0, 0.0);
    vec3 green = vec3(0.0, 1.0, 0.0);
    vec3 blue = vec3(0.0, 0.0, 1.0);
    
    // Row 1 (Top row - cells 0-7)
    if (cell_id == 0) {
        float circle_fx = length(cell_uv - 0.5) - 0.5;
        circle_fx = sin(circle_fx * 40.0 - u_time);
        float hue = circle_fx * 0.3 + 0.7;
        color = hsv2rgb(vec3(hue, 1.0, 1.0));
    }
    else if (cell_id == 1) {
        // 2. Animated RGB Pulse
        float circle_fx = length(cell_uv - 0.5) - 0.5;
        circle_fx = sin(circle_fx * 30 - u_time);
        float hue = circle_fx * 0.2 + 1.6;
        // color = mix(black, white,circle_fx);
        color = hsv2rgb(vec3(hue, 1.0, 1.));
    }
    else if (cell_id == 2) {
        // 3. HSV Rainbow Wheel
        float patter1 = sin(cell_uv.x * 10.0 + u_time) * cos(cell_uv.y * 10.0);
        float hue = patter1 * 0.2 + 0.6;
        // color = vec3(0.6 + 1.4 * sin(patter1));
        color = hsv2rgb(vec3(hue, 1.0, 1.0));
    }
    else if (cell_id == 3) {
        // 4. HSV Saturation Control
        float hue = u_time * 0.2;
        // color = hsv2rgb(vec3(hue, cell_uv.y, 1.0));
        vec2 center = cell_uv - 0.5;
        float angle = atan(center.y, center.x) / (2.0 * 3.14159) + 0.5;
        float pattern2 = sin(cell_uv.x * 4.0 + u_time);
        float rotating_hue = (angle + hue * 0.2 + 0.2) + (pattern2 * 0.2);
        float controlled_hue = mod(rotating_hue, 0.5) * 0.6 + 0.43;
        color = hsv2rgb(vec3(controlled_hue, cell_uv.y + 0.3, 1.0));
    }
    else if (cell_id == 4) {
        // 5. HSV Brightness Control
        float hue = -u_time * 0.2;
        vec2 center = cell_uv - 0.5;
        float angle = atan(center.y, center.x) / (2.0 * 3.14159) + 0.5;
        float pattern2 = sin(cell_uv.x * 4.0 + u_time) * cos(cell_uv.y * 5.0 + u_time);
        float rotate_hue = (angle + hue * 0.2 + 0.2) + (pattern2 * 0.3);
        float controlled_hue = mod(rotate_hue, 0.5) * 0.6 + 0.4;
        color = hsv2rgb(vec3(controlled_hue, cell_uv.x, 1.0));
    }
    else if (cell_id == 5) {
        // 6. Linear Color Mixing
        float hue = u_time * 0.2;
        vec2 center = cell_uv - 0.5;
        float angle = atan(center.y, center.x) / (2.0 * 3.141592) + 0.5;
        float circle = length(uv - 0.5) - 0.5;
        circle = sin(circle * 30. - u_time * 0.4);
        float rotate_hue = (angle + hue * 0.2 + 0.2) + (circle * 0.3);
        float controlled_hue = mod(rotate_hue, 0.5) * 0.6 + 0.4;
        color = hsv2rgb(vec3(controlled_hue, 1.0, 1.0));
    }
    else if (cell_id == 6) {
        // 7. Radial Color Blend
        float hue = (u_time * 0.5) * 0.2 + 0.2;
        vec2 center = cell_uv - 0.5;
        float angle = atan(center.y, center.x) / (2.0 * 3.141592) + 0.5;
        float circle = length(uv - 0.5) - 0.5;
        circle = sin(circle * 40. + u_time);
        float rotate_hue = (angle + hue) + (circle * 0.3);
        float conHue = mod(rotate_hue, 0.5) * 0.6 + 0.5;
        color = hsv2rgb(vec3(conHue, 1.0, 1.0));
    }
    else if (cell_id == 7) {
        float hue = (u_time * 0.2) * 0.2 + 0.2;
        vec2 center = cell_uv - 0.5;
        float angle = atan(center.y, center.x) / (2.0 * 3.141592) + 0.5;
        float pattern3 = sin(cell_uv.x * 4.0 - u_time * 0.3) * cos(cell_uv.y * 5.0 - u_time * 0.3);
        float pattern1 = sin(cell_uv.x * 3. - u_time * 0.3);
        float rotate_hue = (angle + hue) + (pattern1 + pattern3 * 0.5);
        float conHue = mod(rotate_hue, 0.5) * 0.8 + 0.2;
        color = hsv2rgb(vec3(conHue, 1.0, 1.0));
    }
    // Row 2 (Bottom row - cells 8-15)
    else if (cell_id == 8) {
        // 9. Color Wave Animation
        float circle_fx = length(cell_uv - 0.5) - 0.5;
        circle_fx = sin(circle_fx * 40.0 - u_time);
        float hue = circle_fx * 0.3 + 0.7;
        color = hsv2rgb(vec3(hue, 1.0, 1.0));
    }
    else if (cell_id == 9) {
        // 10. Pulsing Colors
        float pulse = 0.5 + 0.5 * sin(u_time * 3.0);
        color = vec3(pulse, 1.0 - pulse, cell_uv.y);
    }
    else if (cell_id == 10) {
        // 11. Rotating Hue
        float hue_offset = u_time * 0.2;
        color = hsv2rgb(vec3(cell_uv.x + hue_offset, 1.0, 1.0));
    }
    else if (cell_id == 11) {
        // 12. Color Temperature
        float temp = cell_uv.x;
        vec3 cold = vec3(0.5, 0.8, 1.0);
        vec3 warm = vec3(1.0, 0.7, 0.3);
        color = mix(cold, warm, temp);
    }
    else if (cell_id == 12) {
        // 13. Complementary Colors
        float hue1 = cell_uv.x;
        float hue2 = mod(hue1 + 0.5, 1.0); // Opposite on color wheel
        vec3 color1 = hsv2rgb(vec3(hue1, 1.0, 1.0));
        vec3 color2 = hsv2rgb(vec3(hue2, 1.0, 1.0));
        color = mix(color1, color2, step(0.5, cell_uv.y));
    }
    else if (cell_id == 13) {
        // 14. Triadic Color Harmony
        float hue_offset = u_time * 0.1;
        vec3 colorz = hsv2rgb(vec3(hue_offset, 1.0, 1.0));
        vec3 colory = hsv2rgb(vec3(mod(hue_offset + 0.33, 1.0), 1.0, 1.0));
        vec3 colorx = hsv2rgb(vec3(mod(hue_offset + 0.66, 1.0), 1.0, 1.0));
        color = colorz * cell_uv.x + colory * cell_uv.y + colorx * (1.0 - cell_uv.x - cell_uv.y);
    }
    else if (cell_id == 14) {
        // 15. Color Dodge & Burn
        vec3 base_color = vec3(0.5, 0.3, 0.8);
        float dodge = cell_uv.x * 0.7; // Limit dodge to prevent overflow
        float burn = max(0.1, cell_uv.y); // Prevent division by zero
        
        vec3 dodged = base_color / (1.0 - dodge);
        vec3 burned = 1.0 - (1.0 - base_color) / burn;
        color = mix(burned, dodged, step(0.5, cell_uv.x));
    }
    else if (cell_id == 15) {
        // 16. Color Grading
        vec3 original = vec3(cell_uv.y, cell_uv.x, 0.7);
        vec3 lift = vec3(0.1, 0.0, -0.1);
        float gamma = 1.2;
        vec3 gain = vec3(1.1, 1.0, 0.9);
        color = pow((original + lift) * gain, vec3(1.0/gamma));
    }
    
    // Add subtle grid lines to separate cells
    vec2 grid_lines = abs(fract(uv * vec2(8.0, 2.0)) - 0.5);
    float line_width = 0.005;
    float grid_mask = 1.0 - step(line_width, min(grid_lines.x, grid_lines.y));
    color = mix(color, vec3(0.2), grid_mask * 0.3);

    O = vec4(color, 1.0);
}