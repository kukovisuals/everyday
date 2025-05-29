#version 130
#ifdef GL_ES
precision highp float;
#endif
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform sampler2D u_text0;
#define PI 3.14159265358979323846

void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

vec3 checkboard(vec2 uv)
{
    vec2 id = floor(uv) * 1.0;
    vec2 check = fract(uv) * 1.0;

    vec2 d1 = abs(check) - 0.9;
    float sqX = length(max(d1, 0.0));
    vec3 color = vec3(0.0);

    if(sqX > 0.0){
        color = vec3(0.0, sqX, sqX);
    } else {
        if(int(mod(id.y,2.0)) == 0 && int(mod(id.x,2.0)) == 0){
            color = vec3(1.0);
        } else {
            color = vec3(0.0);
        }
    }

    return color;
}

vec2 rotate2D(vec2 uv, float a)
{
    uv -= 0.5;
    uv = mat2(cos(a), -sin(a), sin(a), cos(a)) * uv;
    uv += 0.5;
    return uv;
}

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2. * I - u_resolution.xy) / u_resolution.y;
    uv *= 2.0 - 1.0;
    float t = u_time;
    int effectIndex = int(mod(t / 1.0, 9.0));

    

    vec3 color = vec3(0.0, uv.x, uv.x);
    // // 2. Linear gradient (Y-axis)
    if(effectIndex == 0){
        uv.x += sin(uv.x * 10.1);
        color = vec3(0.5, 0.5, uv.y);
        // 3. Radial gradient from center
        float center = length(uv) - 0.5;

        color = vec3(0.0, center, center);
    }
    // 4. Checkerboard pattern
    if(effectIndex == 1){
        uv.x += cosh(uv.x * 10.1);
        uv.x += t * 1.0;
        uv = fract(uv) * 10.0;
        color = checkboard(uv);
    }
    // 5. Horizontal stripes
    if(effectIndex == 2){
        uv.y += t * 1.0;
        uv *= 5.0;
        uv = fract(uv) * 3.0;
        float lines = length(uv.y * uv.y - 1.0) + 0.0;
        color = vec3(0.0, lines, lines);
    }
    // 6. Vertical stripes
    if(effectIndex == 3){
        uv.x += t * 1.0;
        uv *= 6.0;
        uv = fract(uv) * 3.0;
        float vertical = length(uv.x * uv.x - 1.0) + 0.0;
        color = vec3(0.0, vertical, vertical);
    }
    // 7. Diagonal stripes
    if(effectIndex == 4){
        uv.y += t * 1.0;
        uv = rotate2D(uv, PI/5);
        uv *= 6.0;
        uv = fract(uv) * 10.0;
        float diagonal = length(uv.x * uv.x) + 0.2;
        color = vec3(0.0, diagonal, diagonal);
    }
    float speed = 3.0;
    // 8. Circle in center
    if(effectIndex == 5){
        uv.x += sin(uv.x * 5.1);
        // uv = fract(uv) * 10.0;
        float pulse = .5 - 2.5 * sin(t * 2.0) - 4.5;
        float circle = length(uv * pulse) - 0.5;
        color = vec3(0.0, circle, circle);
    }
    // 9. Animated pulse
    // 10. Color rotation
    if(effectIndex == 6){
        uv.x += sin(uv.x * 5.1);
        float pulse = .5 - 2.5 * sin(t * 2.0) - 4.5;
        float circle = length(uv * pulse) - 0.5;
        float colorX = -1.5 * 1.0 * sin(t * 5.1);
        color = vec3(0.0, circle * colorX, circle * colorX);
    }

    if(effectIndex == 7)
    {
        uv = fract(uv) * 10.0;
        if(uv.x > 0.4){
            color = vec3(0.6, 0.6, sin(t * speed));
        } else if(uv.x > -0.0){
            color = vec3(0.7, sin(t * speed), 0.7);
        } else {
            color = vec3( sin(t * speed), 0.7, 0.7);
        }
    }
    

    O = vec4(color, 1.0);
}




