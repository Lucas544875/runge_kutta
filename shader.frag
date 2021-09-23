let fragmentShader =`
precision mediump float;
uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;
uniform vec3  cDir;
uniform vec3  cPos;

const float PI = 3.14159265;
const float E = 2.71828182;
const float INFINITY = 1.e20;
const float FOV = 30.0 * 0.5 * PI / 180.0;//field of view
const vec3 LightDir = normalize(vec3(1.0,0.6,0.6));
const int Iteration =128;
const int MAX_REFRECT = 2;

struct rayobj{
  vec3  rPos;     //レイの場所
  vec3  direction;//方向
  float distance; //距離関数の返り値
  float mindist;  //かすめた最短距離
  float shadowSmoothing;//ソフトシャドウのぼかし係数
  float len;      //出発点からの距離
  int   material; //マテリアルID
  vec3  normal;   //法線ベクトル
  vec3  fragColor;//色
};

struct effectConfig{
  bool reflect;    //反射
  bool specular;   //ハイライト(鏡面反射)
  bool diffuse;    //拡散光
  bool shadow;     //ソフトシャドウ
  bool globallight;//大域照明
  bool grow;       //グロー
  bool fog;        //霧
  bool gamma;      //ガンマ補正
};
const effectConfig effect = effectConfig(
  false,false,false,false,false,false,true,true
);

const int SAIHATE = 0;
const int CYAN = 1;
const int WHITE = 2;
const int DEBUG = 98;
const int ERROR = 99;


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

//シーン設定
//distance function
float sphere(vec3 z,vec3 center,float radius){
  return length(z-center)-radius;
}

float sphere1(vec3 z){
  vec3 p = vec3(mod(z.x,2.0),mod(z.y,2.0),z.z);
  return sphere(p,vec3(1.0,1.0,0.0),0.5);
}

float plane(vec3 z,vec3 normal,float offset){
  return dot(z,normalize(normal))-offset;
}

float floor1(vec3 z){//plane
  return plane(z,vec3(0.0,0.0,1.0),-0.5);
}

float distanceFunction(vec3 z){
  return min(sphere1(z),floor1(z));
}

//マテリアルの設定
int materialOf(vec3 z,float distance){
  if (floor1(z) == distance){
    return CYAN;
  }else if (sphere1(z) == distance){
    return DEBUG;
  }else{
    return ERROR;
  }
}

vec3 debugCol(vec3 rPos){
  return fract(rPos);
}

vec3 color(rayobj ray){
  if (ray.material == CYAN){
    return vec3(0.0,1.0,1.0);
  }else if (ray.material == WHITE){
    return vec3(1.0,1.0,1.0);
  }else if (ray.material == DEBUG){
    return debugCol(ray.rPos);
  }else{
    return vec3(1.0,0.0,0.0);
  }
}

float refrectance(int material){
  if (material == CYAN){
    return 0.1;
  }else if (material == WHITE){
    return 0.6;
  }else if (material == DEBUG){
    return 0.3;
  }else{
    return 0.0;
  }
}

vec3 normal(vec3 p){
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
    ray.mindist = min(ray.mindist,ray.distance);
    ray.shadowSmoothing=min(ray.shadowSmoothing,ray.distance * 20.0 / ray.len);
    if(ray.distance < 0.001){
      ray.material = materialOf(ray.rPos,ray.distance);
      ray.normal = normal(ray.rPos);
      break;
    }
    ray.len += ray.distance;
    if(ray.len > 100.0){
      ray.material = SAIHATE;
      break;
    }
    ray.rPos += ray.distance * ray.direction;
  }
}

//ライティング
void specularFunc(inout rayobj ray){//鏡面反射
  float t = -dot(ray.direction,ray.normal);
  vec3 reflection=ray.direction+2.0*t*ray.normal;
  float x = dot(reflection,LightDir);
  float specular=1.0/(50.0*(1.001-clamp(x,0.0,1.0)));
  ray.fragColor = clamp(ray.fragColor+specular,0.0,1.0);
}

void diffuseFunc(inout rayobj ray){//拡散光
  ray.fragColor *= mix(0.9,1.0,dot(LightDir, ray.normal));
}

const float shadowCoef = 0.4;
void shadowFunc(inout rayobj ray){//ソフトシャドウ
  if (dot(LightDir,ray.normal)<0.0){return;}
  vec3 origin=ray.rPos + ray.normal * 0.001;
  rayobj ray2 = rayobj(origin,LightDir,0.0,INFINITY,1.0,0.0,0,vec3(0.0),vec3(0.0));
  raymarch(ray2);
  if (ray2.distance<0.001){
    ray.fragColor *= shadowCoef;
  }else{
    //ray.fragColor *= 1.0 - (1.0 - ray.shadowSmoothing) * shadowCoef;
    ray.fragColor *= mix(shadowCoef,1.0,ray2.shadowSmoothing);
  }
}

void globallightFunc(inout rayobj ray){//大域照明
  vec3 origin = ray.rPos+ray.normal*0.001;
  rayobj ray2 = rayobj(origin,ray.normal,0.0,INFINITY,1.0,0.0,0,vec3(0.0),vec3(0.0));
  raymarch(ray2);
  float near = 0.10;
  ray.fragColor *= clamp(min(near,ray2.len)/near,0.0,1.0);
}

const float growSise = 0.2;
void growFunc(inout rayobj ray){//グロー
  if (ray.distance<0.001){return;}
  float grow =1.0 - min(ray.mindist/growSise,1.0);
  ray.fragColor = clamp(ray.fragColor+0.1*grow,0.0,1.0);
}

const vec3 fogColor = vec3(243.0, 240.0, 215.0)/256.0;
void fogFunc(inout rayobj ray){//霧
  float fog = clamp((ray.len-10.0)/20.0,0.0,1.0);
  ray.fragColor = (ray.fragColor)*(1.0-fog)+fogColor*(fog);
}

void gammaFunc(inout rayobj ray){//ガンマ補正
  ray.fragColor.x=pow(ray.fragColor.x,2.2);
  ray.fragColor.y=pow(ray.fragColor.y,2.2);
  ray.fragColor.z=pow(ray.fragColor.z,2.2);
}

void reflectFunc(inout rayobj ray){//反射
  rayobj rays[MAX_REFRECT+1];
  rays[0] = ray;
  int escape = MAX_REFRECT;
  for (int i = 0;i<MAX_REFRECT;i++){
    float dot = -dot(rays[i].direction,rays[i].normal);
    vec3 direction=rays[i].direction+2.0*dot*rays[i].normal;
    rays[i+1] = rayobj(rays[i].rPos+rays[i].normal*0.001,direction,0.0,INFINITY,1.0,0.0,0,vec3(0.0),vec3(0.0));
    raymarch(rays[i+1]);

    if(abs(rays[i].distance) < 0.001){
      rays[i+1].fragColor = color(rays[i+1]);
    }else{
      escape = i;
      break;
    }
  }

  for (int i = MAX_REFRECT;i >= 0;i--){
    if (i>escape){continue;}

    if (effect.specular){
      specularFunc(rays[i]);
    }
    if (effect.diffuse){
      diffuseFunc(rays[i]);
    }
    if (effect.shadow){
      shadowFunc(rays[i]);
    }
    if (effect.globallight){
      globallightFunc(rays[i]);
    }
    if (effect.fog){
      fogFunc(rays[i]);
    }

    if (i == 0){
      ray.fragColor = rays[i].fragColor;
    }else{
      float refrectance = refrectance(rays[i-1].material);
      rays[i-1].fragColor = mix(rays[i-1].fragColor,rays[i].fragColor,refrectance);
    }
  }
}

void main(void){
  // fragment position
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
  //fix:真上真下が見えない
  vec3 xAxes = normalize(cross(cDir,vec3(0.0,0.0,1.0)));
  vec3 yAxes = normalize(-cross(cDir,xAxes));
  vec4 rot = normalize(times(rotation(-p.x*FOV,yAxes),rotation(p.y*FOV,xAxes)));
  vec3 direction = normalize(turn(vec4(0,cDir),rot).yzw);

  //レイの定義と移動
  rayobj ray = rayobj(cPos,direction,0.0,INFINITY,1.0,0.0,0,vec3(0.0),vec3(0.0));
  raymarch(ray);

  //エフェクト
  if(abs(ray.distance) < 0.001){//物体表面にいる場合
    ray.fragColor = color(ray);

    if (effect.reflect){
      reflectFunc(ray);
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
  if (effect.grow){
    growFunc(ray);
  }
  if (effect.gamma){
    gammaFunc(ray);
  }
  gl_FragColor = vec4(ray.fragColor,1.0);
}
`