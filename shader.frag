let fragmentShader =`
precision mediump float;
uniform float time;//使ってない
uniform vec2  mouse;
uniform vec2  resolution;
uniform vec3  cDir;
uniform vec3  cPos;

const float PI = 3.14159265;
const float E = 2.71828182;
const float INFINITY = 1.e20;
const float FOV = 30.0 * 0.5 * PI / 180.0;//field of view
const vec3 LightDir = normalize(vec3(1.0,-0.8,0.3));
const int Iteration =128;

struct rayobj{
  vec3  rPos;
  vec3  direction;
  float distance;
  float distmin;
  float len;
  int   objectId;
  vec3  normal;
  vec3  fragColor;
};
/*
objectId
0:saihate
1:floor1
2:sphere1
99:else
*/

struct effectConfig{
  bool reflect;    //反射
  bool specular;   //ハイライト(鏡面反射)
  bool diffuse;    //拡散光
  bool shadow;     //ソフトシャドウ
  bool globallight;//大域照明
  bool fog;        //霧
  bool gamma;      //ガンマ補正
};
const effectConfig effect = effectConfig(false,true,true,true,false,true,true);

struct material{
  vec3 color;
  float refrectance;
};

const material cyan = material(vec3(0.0,1.0,1.0),0.6);
const material white = material(vec3(1.0,1.0,1.0),0.6);
const material errorObject = material(vec3(1.0,0.0,0.0),0.6);

//quaternion
vec4 times(vec4 q1,vec4 q2){
  return vec4 (
    q1[0]*q2[0] - q1[1]*q2[1] - q1[2]*q2[2] - q1[3]*q2[3],
    q1[0]*q2[1] + q1[1]*q2[0] + q1[2]*q2[3] - q1[3]*q2[2],
    q1[0]*q2[2] - q1[1]*q2[3] + q1[2]*q2[0] + q1[3]*q2[1],
    q1[0]*q2[3] + q1[1]*q2[2] - q1[2]*q2[1] + q1[3]*q2[0]
  );
}

vec4 inverse(vec4 q){
  return vec4(q[0],-q[1],-q[2],-q[3]);
}

vec4 rotation(float theta,vec3 v){
  float c = cos(theta/2.0);
  float s = sin(theta/2.0);
  return normalize(vec4(c,v.x*s,v.y*s,v.z*s));
}

vec4 turn(vec4 v,vec4 rot){
  return times(times(rot,v),inverse(rot));
}

//distance function
float sphere(vec3 z,vec3 center,float radius){
  return length(z-center)-radius;
}

float sphere1(vec3 z){
  return sphere(z,vec3(0.0),1.0);
}

float plane(vec3 z,vec3 normal,float offset){
  return dot(z,normalize(normal))+offset;
}

float floor1(vec3 z){//plane
  return plane(z,vec3(0.0,0.0,1.0),1.0);
}

float distanceFunction(vec3 z){
  return min(sphere1(z),floor1(z));
}

//視線と物体の交点で実行
int objectId(vec3 z,float distance){
  if (floor1(z) == distance){
    return 1;
  }else if (sphere1(z) == distance){
    return 2;
  }else{
    return 99;
  }
}

vec3 materialCol(int objectId){
  if (objectId == 1){
    return white.color;
  }else if (objectId == 2){
    return cyan.color;
  }else{
    return errorObject.color;
  }
}

mat3 jacobi(vec3 z,int objectId){
  if (objectId == 1){
    return mat3(0.0);
  }else if (objectId == 2){
    return mat3(0.0);
  }else{
    return mat3(0.0);
  }
}

//jacobi行列に置き換え
vec3 normal(vec3 p,int objectId){
  float d = 0.0001;
  return normalize(vec3(
    distanceFunction(p + vec3(  d, 0.0, 0.0)) - distanceFunction(p + vec3( -d, 0.0, 0.0)),
    distanceFunction(p + vec3(0.0,   d, 0.0)) - distanceFunction(p + vec3(0.0,  -d, 0.0)),
    distanceFunction(p + vec3(0.0, 0.0,   d)) - distanceFunction(p + vec3(0.0, 0.0,  -d))
  ));
}

void raymarch(inout rayobj ray){
  for(int i = 0; i < Iteration; i++){
    ray.distance = distanceFunction(ray.rPos);
    if(ray.distance < 0.001){
      ray.objectId = objectId(ray.rPos,ray.distance);
      ray.normal = normal(ray.rPos,ray.objectId);
      break;
    }
    ray.len += ray.distance;
    if(ray.len > 100.0){
      ray.objectId = 0;
      break;
    }
    ray.distmin=min(ray.distance,ray.distmin);
    ray.rPos = cPos + ray.direction * ray.len;
  }
}

//ライティング
void specularFunc(inout rayobj ray){//鏡面反射
  vec3 halfLE = normalize(LightDir - ray.direction);
  float x = dot(halfLE, ray.normal);
  float light_specular=1.0/(-30.0*(clamp(x,0.0,1.0)-1.0));
  light_specular=clamp(light_specular,0.0,1.0);
  ray.fragColor += min(light_specular,1.0);
}

void diffuseFunc(inout rayobj ray){//拡散光
  ray.fragColor *= max(0.0,dot(LightDir, ray.normal));
}

void shadowFunc(inout rayobj ray){//ソフトシャドウ
  vec3 ro=ray.rPos + ray.normal * 0.001;
  if (dot(LightDir,ray.normal)<0.0){return;}
  float h = 0.0;
  float c = 0.001;
  float r = 1.0;
  float shadowCoef = 0.5;
  for(float t = 0.0; t < 50.0; t++){
    h = distanceFunction(ro + LightDir * c);
    if(h < 0.001){
      ray.fragColor *= shadowCoef;
      return;
    }
    //r = min(r, h * 16.0 / c);
    c += h;
  }
  ray.fragColor *= 1.0 - shadowCoef + r * shadowCoef;
}

void globallightFunc(inout rayobj ray){//大域照明
  vec3 origin = ray.rPos+ray.normal*0.001;
  rayobj ray2 = rayobj(origin,ray.normal,0.0,INFINITY,0.0,0,vec3(0.0),vec3(0.0));
  raymarch(ray2);
  float near = 0.20;
  ray.fragColor *= min(near,ray.len)/near;
}

void fogFunc(inout rayobj ray){//霧
  float fog = clamp((ray.len-0.0)/30.0,0.0,1.0);
  ray.fragColor = (ray.fragColor)*(1.0-fog)+vec3(0.1)*(fog);
}

void gammaFunc(inout rayobj ray){//ガンマ補正
  ray.fragColor.x=pow(ray.fragColor.x,1.0/2.2);
  ray.fragColor.y=pow(ray.fragColor.y,1.0/2.2);
  ray.fragColor.z=pow(ray.fragColor.z,1.0/2.2);
}

//todo:反射の実装
/*
vec4 reflectfunc(vec3 ray,vec3 origin,vec3 normal){
  float ver=dot(-ray,normal);
  vec3 refRay=ray+2.0*ver*normal;
  rayobj temp=raymarch(refRay,origin);
  vec3 refNormal = getNormal(temp.rPos);
  vec3 halfLE = normalize(LightDir - refRay);
  vec3 color=materialCol(temp.objectId);
  float diff = difffunc(dot(LightDir, refNormal));
  float spec = specfunc(dot(halfLE, refNormal));
  float shadow = genShadow(LightDir,temp.rPos + refNormal * 0.001,refNormal);//raymarch
  float fog=clamp(temp.len/50.0,0.0,1.0);

  vec3 fragColor=color;
  fragColor*=diff;
  fragColor+=vec3(spec);
  fragColor*=shadow;
  fragColor=(fragColor)*(1.0-fog)+vec3(0.1)*(fog);

  return vec4(fragColor,1.0);
}*/

void main(void){
  // fragment position
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
  //fix:真上真下が見えない
  vec3 xAxes = normalize(cross(cDir,vec3(0.0,0.0,1.0)));
  vec3 yAxes = normalize(-cross(cDir,xAxes));
  vec4 rot = normalize(times(rotation(-p.x*FOV,yAxes),rotation(p.y*FOV,xAxes)));
  vec3 direction = normalize(turn(vec4(0,cDir),rot).yzw);

  //レイの定義と移動
  rayobj ray = rayobj(cPos,direction,0.0,INFINITY,0.0,0,vec3(0.0),vec3(0.0));
  raymarch(ray);

  //エフェクト
  vec3 fragColor=vec3(0.0);

  if(abs(ray.distance) < 0.001){//物体表面にいる場合
    ray.fragColor = materialCol(ray.objectId);

    if (effect.reflect){
      //reflectFunc(ray);
    }
    if (effect.specular){
      specularFunc(ray);
    }
    if (effect.diffuse){
      diffuseFunc(ray);
    }
    if (effect.shadow){
      shadowFunc(ray);
    }
    if (effect.globallight){
      globallightFunc(ray);
    }
  }
  
  if (effect.fog){
    fogFunc(ray);
  }
  if (effect.gamma){
    gammaFunc(ray);
  }
  gl_FragColor = vec4(ray.fragColor,1.0);
}
`