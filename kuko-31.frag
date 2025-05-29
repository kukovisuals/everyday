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

void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

float sdfCircle(vec2 p, float r) 
{
    return length(p) - r;
}

float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

float sdQuadraticCircle( in vec2 p )
{
    p = abs(p); if( p.y>p.x ) p=p.yx;

    float a = p.x-p.y;
    float b = p.x+p.y;
    float c = (2.0*b-1.0)/3.0;
    float h = a*a + c*c*c;
    float t;
    if( h>=0.0 )
    {   
        h = sqrt(h);
        t = sign(h-a)*pow(abs(h-a),1.0/3.0) - pow(h+a,1.0/3.0);
    }
    else
    {   
        float z = sqrt(-c);
        float v = acos(a/(c*z))/3.0;
        t = -z*(cos(v)+sin(v)*1.732050808);
    }
    t *= 0.5;
    vec2 w = vec2(-t,t) + 0.75 - t*t - p;
    return length(w) * sign( a*a*0.5+b-1.5 );
}

float sdHyberbola( in vec2 p, in float k, in float he ) // k in (0,inf)
{
    p = abs(p);
    p = vec2(p.x-p.y,p.x+p.y)/sqrt(2.0);

    float x2 = p.x*p.x/16.0;
    float y2 = p.y*p.y/16.0;
    float r = k*(4.0*k - p.x*p.y)/12.0;
    float q = (x2 - y2)*k*k;
    float h = q*q + r*r*r;
    float u;
    if( h<0.0 )
    {
        float m = sqrt(-r);
        u = m*cos( acos(q/(r*m))/3.0 );
    }
    else
    {
        float m = pow(sqrt(h)-q,1.0/3.0);
        u = (m - r/m)/2.0;
    }
    float w = sqrt( u + x2 );
    float b = k*p.y - x2*p.x*2.0;
    float t = p.x/4.0 - w + sqrt( 2.0*x2 - u + b/w/4.0 );
    t = max(t,sqrt(he*he*0.5+k)-he/sqrt(2.0));
    float d = length( p-vec2(t,k/t) );
    return p.x*p.y < k ? d : -d;
}

mat2 rotate2D(float r) {
    return mat2(cos(r), sin(r), -sin(r), cos(r));
}

float sdLine( in vec2 p, in vec2 a, in vec2 b )
{   
    float h = min(1.0 , 
        max(0.0, dot(p - a, b - a) / dot(b - a, b - a)));
    
    return length(p - a - (b - a) * h);
}

float sdMoon(vec2 p, float d, float ra, float rb )
{
    p *= 1.5;
    p -= 0.5;
    p *= rotate2D(PI/4);

    p.y = abs(p.y);
    float a = (ra*ra - rb*rb + d*d)/(2.0*d);
    float b = sqrt(max(ra*ra-a*a,0.0));
    if( d*(p.x*b-p.y*a) > d*d*max(b-p.y,0.0) )
          return length(p-vec2(a,b));
    return max( (length(p          )-ra),
               -(length(p-vec2(d,0))-rb));
}

float opRound( in vec2 p, in vec2 a, in vec2 b,  in float r )
{
    return sdLine(p, a, b) - r;
}


float opUnion( float d1, float d2 )
{
    return min(d1,d2);
}

float opSmoothUnion( float d1, float d2, float k )
{
    float h = max(k-abs(d1-d2),0.0);
    return min(d1, d2) - h*h*0.25/k;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 iResolution = u_resolution;
    float t = u_time;
    vec2 mouse = u_mouse.xy / iResolution.xy;
    vec2 uv = (2.0 * fragCoord - iResolution.xy)/iResolution.y;
    uv *= 2.5;
    uv *= rotate2D( PI/4 );

    // uv *= atan(uv * 1.0);
    vec2 sinRotation = vec2(-1.0); //-abs(sin(vec2(-0.1) * t * 1.0)) * (rotate2D( t * 0.5) * uv);
    vec2 cosRotation = vec2(0.0); //0.3 - cos(vec2(-0.2) * t * 5.0) * (rotate2D( t * 0.1) * uv);
    // uv *= atan(uv * 1.0);

    float line = opRound(uv, sinRotation, cosRotation, 0.3);

    float di = 1.0; //* cos(1.0);
    float ra = 1.0;
    float rb = 1.0;

    float moon = sdMoon(uv, di, ra, rb) - 0.2;

    float d =  opUnion(line, moon);
    d = opSmoothUnion(line, moon, 0.5);
    
    vec3 color = d > 0.0 ? vec3(0.0,0.6,0.6) : vec3(0.0, 0.9, 0.6);
    color *= 1.3 - exp(-5.0*abs(d));
    color *= 0.8 + 0.2*cos(100.0*d);

    fragColor = vec4(color, 1.0);
}