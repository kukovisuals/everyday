#version 120
#ifdef GL_ES
precision highp float;
#endif
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform sampler2D u_text0;
#define PI 3.14159265
void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    
    ▓              KuKo Day - 63                   ▓
    ▓                                              ▓
    ▓                   SDFS                       ▓
    ▓                    Map                       ▓
    ▓               Grid Circles                   ▓
    
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
mat2 rotate2D(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a));}

float smin( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}
float sdSphere(vec3 p, float r)
{
    return length(p) - r;
}
float map(vec3 p)
{
    vec3 newp_p = p;
    newp_p.xy = rotate2D(u_time * 0.3) * newp_p.xy;

    float speed = 0.5;
    // sphere vectors
    float v_z = 1.0; float v_xy = 2.3; float v_r = 1.5;
    // fx
    float d1_fx = pow(sin(u_time * speed ) * 1.0 + 0.8, 3.0);
    float d1_fx_two = pow(sin(u_time * speed + 0.0) * 0.8 + 0.8, 3.0);
    float d1_fx_three = pow(sin(u_time * speed + 0.0) * 0.8 + 0.8, 3.0);
    // sdf sphere
    float d1 = sdSphere(newp_p + vec3(0.0,0.0, v_z + d1_fx), v_r);
    float d3 = sdSphere(newp_p + vec3(-v_xy + d1_fx_two,-v_xy, v_z ), v_r);
    float d4 = sdSphere(newp_p + vec3( v_xy,-v_xy, v_z + d1_fx_three), v_r);
    float d5 = sdSphere(newp_p + vec3(-v_xy, v_xy, v_z + d1_fx_three), v_r);
    float d6 = sdSphere(newp_p + vec3( v_xy - d1_fx_two, v_xy, v_z), v_r);
    // sdf plane
    float d2 = newp_p.z + 1.0;
    // Combine all spheres first
    float spheres = smin(d1, d3, 1.5);
    spheres = smin(spheres, d4, 1.0);
    spheres = smin(spheres, d5, 1.0);
    spheres = smin(spheres, d6, 1.5);
    return smin(spheres, d2, 1.0);
}
float gridLines(vec3 p)
{
    // vec3 newp_p = p;
    // newp_p.xy = rotate2D(u_time * 0.3) * newp_p.xy;
    vec2 cell_p = mod(p.xy, 0.2) - 0.1;
    float center = length(cell_p);
    float circles = 1.0 - smoothstep(0.08, 0.08, center);
    float dist = length(p.xy);
    return circles;
}
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓               Ray Direction                  ▓
    ▓                  Normal                      ▓
    ▓                   Light                      ▓

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
float rayDirection(vec3 ro, vec3 rd)
{
    float dt = 0.0;
    for(int i=0; i<80; i++)
    {
        vec3 p = ro + rd * dt;
        float d = map(p);
        dt += d;
        if(d < 0.001 || dt > 20.) break;
    }
    return dt;
}

vec3 calcNormal(vec3 p)
{
    vec2 e = vec2(0.0001, 0.0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yxx) - map(p - e.yxx)
    ));
}
vec3 phongLight(vec3 p, vec3 norm, vec3 lightDir, vec3 viewDir, vec3 baseColor)
{
    
    float diff = max(dot(norm, lightDir), 0.40);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 2.0);

    return baseColor * (diff + spec * 0.6);
}
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓                   Color                      ▓

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}
void colorPalette(int effectIndex, vec2 uv, out vec3 bg, out vec3 rgbColor){
    float hue = mod(uv.y / 0.6 + uv.x, 1.0);
    
    if(effectIndex == 0){
        bg = vec3(0.416,0.153,0.208);
        rgbColor = pal(uv.y,vec3(0.067,0.051,0.047),vec3(0.082,0.067,0.071),vec3(0.114,0.098,0.102),vec3(0.157,0.161,0.157) );
    }   else if(effectIndex == 1) {
        bg = vec3(0.416,0.153,0.208);
        rgbColor = pal(uv.y,vec3(0.067,0.051,0.047),vec3(0.373,0.,0.039),vec3(0.114,0.098,0.102),vec3(0.647,0.055,0.102) );
    }   else if(effectIndex == 2){
        bg = vec3(0.933,0.298,0.231);
        rgbColor = pal(uv.y,vec3(0.0017,0.0241,0.165),vec3(0.01133,0.0907,0.0619),vec3(0.57, 0.239, 0.232),vec3(0.1, 0.15, 0.3) );
    }   else if(effectIndex == 3){
        bg = vec3(0.922,0.275,0.188);
        rgbColor = pal(uv.y, vec3(0.275,0.173,0.208),vec3(0.13,0.033,0.003), vec3(0.384,0.212,0.188),vec3(0.31,0.173,0.184) );
    }   else if(effectIndex == 4){
        bg = vec3(0.333,0.373,0.49);
        rgbColor = pal(uv.y,vec3(0.063,0.035,0.176),vec3(0.094,0.09,0.325),vec3(0.094,0.067,0.298),vec3(0.333,0.373,0.49) );
    }   else {
        bg = vec3(0.631,0.847,0.969);
        rgbColor = pal(uv.y,vec3(0.129,0.404,0.49),vec3(0.153,0.024,0.002),vec3(0.169,0.514,0.549),vec3(0.153,0.424,0.502) );
    }
    bg = vec3(0.416,0.153,0.208);
}
vec3 colorGird(vec3 norm, float grid, int effectIndex, vec3 p)
{
    /*–‑‑ colors –‑‑*/
    vec3 bg, rgbColorTwo;
    // vec3 newp_p = norm;
    // newp_p.xy = rotate2D(u_time * 0.3) * newp_p.xy;
    colorPalette(effectIndex, norm.xy, bg, rgbColorTwo);
    return mix(bg, rgbColorTwo, grid);
    // return rgbColor;
}
/*
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ▓                   Main                       ▓

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*/
void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - u_resolution.xy) / u_resolution.y;
    uv.xy = rotate2D(u_time * 0.2) * uv.xy;
    vec3 color = vec3(-uv.y);

    vec3 ro = vec3(0.0,0.0,3.0);
    vec3 rd = normalize(vec3(uv, -1.0));
    float dt = rayDirection(ro,rd);

    if(dt < 20.)
    {
        vec3 p = ro + rd * dt;
        vec3 norm = calcNormal(p);
        vec3 lightDir = normalize(vec3(0.0,0.0,3.0));
        vec3 viewDir = normalize(-rd);

        float grid = gridLines(p);

        vec3 baseColor = vec3(0.0);

        if((p.x > 0.0 && p.y > 0.0))
        {
            baseColor = colorGird(norm, grid, 2, p);
        } else if (p.x < 0.0 && p.y < 0.0){
            baseColor = colorGird(norm, grid, 2, p);
        } else {
            baseColor = colorGird(norm, grid, 4, p);
        }

        vec3 light = phongLight(p, norm, lightDir, viewDir, baseColor);

        color = light;
    }
    color = pow(color * 1.2, vec3(1.0/2.0));

    O = vec4(color, 1.0);
}