float map(vec3 p){ return length(p) - 1.0; }

void mainImage(out vec4 O, in vec2 I)
{
    vec2 uv = (2.0 * I - iResolution.xy) / iResolution.y;
    
    // init
    vec3 rayOrigin = vec3(0.0, 0.0, -3.0);
    vec3 rayDirect = normalize(vec3(uv, 1.0));

    float distT = 0.0;  // total distance travel
    
    vec3 color = vec3(0.0);
    // Raymarching 
    for(int i=0; i<80; i++)
    {
        vec3 p = rayOrigin + rayDirect * distT; // position along the ray 

        float d = map(p);                       // current distance to the scene

        distT += d;                             // march the ray
        
        //color = vec3(i) / 80.0;

        if(d < 0.001 || distT > 100.0) break;
    }

    color = vec3(distT * 0.2);

    O = vec4(color, 1.0);
}