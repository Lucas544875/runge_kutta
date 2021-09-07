let fragmentShader =`
precision mediump float;
uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;
uniform vec3  cDir;
uniform vec3  cPos;

const float PI = 3.14159265;
const float E = 2.71828182;
const float angle = 30.0;
const float fov = angle * 0.5 * PI / 180.0;
const vec3 lightDir = normalize(vec3(1.0,-0.8,0.3));
const int Iteration =128;
const float theta=45.0;

struct colorobj{
  vec3 col1;
  vec3 col2;
  vec3 col3;
  vec3 colelse;
  vec3 fog;
  vec3 reffog;
};
const colorobj material=colorobj(vec3(1.0),vec3(1.0),vec3(1.0),vec3(1.0),vec3(0.1),vec3(1.0));

struct rayobj{
  vec3 rPos;
  float dist;
  float distmin;
  float len;
};

//quaternion
vec4 times(vec4 q1,vec4 q2){
  return normalize(vec4 (
    q1[0]*q2[0] - q1[1]*q2[1] - q1[2]*q2[2] - q1[3]*q2[3],
    q1[0]*q2[1] + q1[1]*q2[0] + q1[2]*q2[3] - q1[3]*q2[2],
    q1[0]*q2[2] - q1[1]*q2[3] + q1[2]*q2[0] + q1[3]*q2[1],
    q1[0]*q2[3] + q1[1]*q2[2] - q1[2]*q2[1] + q1[3]*q2[0]
  ));
}

vec4 inverse(vec4 q){
  return normalize(vec4(q[0],-q[1],-q[2],-q[3]));
}

vec4 rotation(float theta,vec3 v){
  float c = cos(theta/2.0);
  float s = sin(theta/2.0);
  return normalize(vec4(c,v.x*s,v.y*s,v.z*s));
}

vec4 turn(vec4 v,vec4 rot){
  return normalize(times(times(rot,v),inverse(rot)));
}

//distance function
float df1(vec3 z){
  return length(z-vec3(0,0,0))-1.0;
}
float df2(vec3 z){//plane
  return dot(z, vec3(0.0,0.0,1.0))+1.0;
}
float distanceFunc(vec3 z){
  return min(df1(z),df2(z));
}
vec3 getNormal(vec3 p){
  float d = 0.0001;
  return normalize(vec3(
    distanceFunc(p + vec3(  d, 0.0, 0.0)) - distanceFunc(p + vec3( -d, 0.0, 0.0)),
    distanceFunc(p + vec3(0.0,   d, 0.0)) - distanceFunc(p + vec3(0.0,  -d, 0.0)),
    distanceFunc(p + vec3(0.0, 0.0,   d)) - distanceFunc(p + vec3(0.0, 0.0,  -d))
  ));
}
float genShadow(vec3 rd, vec3 ro,vec3 normal){
  if (dot(rd,normal)<0.0){return 1.0;}
  float h = 0.0;
  float c = 0.001;
  float r = 1.0;
  float shadowCoef = 0.5;
  for(float t = 0.0; t < 50.0; t++){
    h = distanceFunc(ro + rd * c);
    if(h < 0.001){
      return shadowCoef;
    }
    //r = min(r, h * 16.0 / c);
    c += h;
  }
  return 1.0 - shadowCoef + r * shadowCoef;
}
rayobj raymarch(vec3 ray,vec3 origin){
  float distance = 0.0;
  float rLen = 0.0;
  float distmin = 100.0;
  vec3  rPos = origin;
  float shadowCoef=0.5;
  float r=1.0;
  for(int i = 0; i < Iteration; i++){
    distance = distanceFunc(rPos);
    if(distance < 0.001){break;}
    rLen += distance;
    if(rLen > 100.0){break;}
    distmin=min(distance,distmin);
    r = min(r, distance * 16.0 / rLen);
    rPos = cPos + ray * rLen;
  }
  rayobj ans=rayobj(rPos,distance,distmin,rLen);
  return ans;
}
vec3 materialCol(vec3 rPos){
  vec3 color;
  float dist=distanceFunc(rPos);
  if (dist==df1(rPos)){
    color=material.col1;
  }else if (dist==df2(rPos)){
    color=material.col2;
  }else{
    color=material.colelse;
  }
  return color+vec3(0.1);
}
float specfanc(float x){
  float m=100.0;
  float norm_factor = ( m + 2.0 ) / ( 2.0 * PI );
  //float light_specular =  norm_factor*pow(clamp(max(0.0,x),0.0,1.0),m);
  float light_specular=1.0/(-30.0*(clamp(x,0.0,1.0)-1.0));
  light_specular=clamp(light_specular,0.0,1.0);
  return min(light_specular,1.0);
}
float difffanc(float dot){
  //float m=0.8;
  return max(0.0,dot);
  //float a=0.1;
  //diff=(1.0/(1.0+exp(-a*(diff-0.5)))-0.5)*(1.0/(1.0/(1.0+exp(-0.5*a))-0.5))/2.0+0.5;
  //diff=min(diff*1.2,1.0);
  //float ans=diff*m+(1.0-m);
  //return ans;
}
vec4 reflectfanc(vec3 ray,vec3 origin,vec3 normal){
  float ver=dot(-ray,normal);
  vec3 refRay=ray+2.0*ver*normal;
  rayobj temp=raymarch(refRay,origin);
  vec3 refNormal = getNormal(temp.rPos);
  vec3 halfLE = normalize(lightDir - refRay);
  vec3 color=materialCol(temp.rPos);
  float diff = difffanc(dot(lightDir, refNormal));
  float spec = specfanc(dot(halfLE, refNormal));
  float shadow = genShadow(lightDir,temp.rPos + refNormal * 0.001,refNormal);//raymarch
  float fog=clamp(temp.len/50.0,0.0,1.0);

  vec3 looks=color;
  looks*=diff;
  looks+=vec3(spec);
  looks*=shadow;
  looks=(looks)*(1.0-fog)+material.fog*(fog);
  
  return vec4(looks,1.0);
}
float globallightfanc(vec3 normal,vec3 origin){
  rayobj temp=raymarch(normal,origin);
  float a=0.20;
  float ans=min(a,temp.len)/a;
  return ans;
}

void main(void){
  // fragment position
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

  vec3 xaxes = normalize(cross(cDir,vec3(0.0,0.0,1.0)));
  vec3 yaxes = -normalize(cross(cDir,xaxes));
  vec4 rot = times(rotation(-p.x*fov,yaxes),rotation(p.y*fov,xaxes));
  vec3 ray = turn(vec4(0,cDir),rot).yzw;

  rayobj temp=raymarch(ray,cPos);
  vec3 rPos=temp.rPos;
  float distance=temp.dist;
  float rLen=temp.len;

  // hit check 
  float diff=0.0;
  float spec=0.0;
  vec4 reflect=vec4(0.0);
  float shadow=1.0;
  vec3 color=vec3(0.0);
  float fog=1.0;
  float globallight=0.0;
  if(abs(distance) < 0.001){
    vec3 normal = getNormal(rPos);
    // light
    vec3 halfLE = normalize(lightDir - ray);
    diff = difffanc(dot(lightDir, normal));
    spec = specfanc(dot(halfLE, normal));
    reflect =reflectfanc(ray,rPos+normal*0.001,normal);//raymarch*2
    globallight=globallightfanc(normal,rPos+normal*0.001);//raymarch
    //shadow
    shadow = genShadow(lightDir,rPos + normal * 0.001,normal);//raymarch
    fog=clamp((rLen-0.0)/30.0,0.0,1.0);
    //else
    color = materialCol(rPos);
  }
  vec3 looks=color;
  if (reflect[3]==1.0){
    looks=looks*0.8+reflect.xyz*0.2;
  }
  looks+=vec3(spec);
  looks*=diff;
  looks.x=pow(looks.x,1.0/2.2);
  looks.y=pow(looks.y,1.0/2.2);
  looks.z=pow(looks.z,1.0/2.2);
  looks*=shadow;
  looks*=globallight;
  looks=(looks)*(1.0-fog)+material.fog*(fog);
  gl_FragColor = vec4(looks, 1.0);
}
`