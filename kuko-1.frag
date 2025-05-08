#ifdef GL_ES
precision mediump float;
#endif

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

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 iResolution = u_resolution;
    float dt = u_time;
    vec2 mouse = u_mouse.xy / iResolution.xy;

    vec2 uv = fragCoord/iResolution.xy;
    
    float sinX = 0.5 + 0.5 * abs(sin(dt * 2.5));
    float sinX2 = 0.5 + 0.5 * abs(sin(dt * 2.0));
    float sinX3 = 0.5 + 0.5 * abs(sin(dt * 5.5));

    float sinSmooth = smoothstep(0.6, 0.9, sinX2);
    
    float stepX = step(0.5, uv.x);
    float stepYPow = pow(uv.y, 2.0);
    float stepYfact = 0.5 * fract(uv.x);

    float stepY = step(0.5, uv.y);
    float fade = smoothstep(0.0, 0.5, dt);
    //stepY = 0.5 * abs(sin(dt * 3.5));
    

    // Auto-cycle through effects every 3 seconds
    int effectIndex = int(mod(dt / 10.0, 8.0));
    vec3 col; 

    if(effectIndex == 0) col = vec3(sinSmooth, stepY, stepY);
    else if(effectIndex == 2) col = vec3(sinX3, stepX, stepX);
    else if(effectIndex == 3) col = vec3(sinSmooth, stepY, stepY);
    else if(effectIndex == 5) col = vec3(stepX, stepY, sinSmooth);
    else if(effectIndex == 6) col = vec3(stepY, sinSmooth, sinSmooth);
    else if(effectIndex == 7) col = vec3(sinSmooth, stepY, sinSmooth);
    else if(effectIndex == 8) col = vec3(sinX3, sinSmooth, stepYPow);
    else col = vec3(stepX, sinSmooth, stepY);
    
    fragColor = vec4(col, 1.0);
}