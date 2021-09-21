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
const vec3 LightDir = normalize(vec3(1.0,-0.8,0.3));
const int Iteration =128;

struct rayobj{
  vec3  rPos;
  vec3  direction;
  float distance;
  float distmin;
  float len;
  int   material;
  vec3  normal;
  vec3  fragColor;
};

struct effectConfig{
  bool reflect;    //反射
  bool specular;   //ハイライト(鏡面反射)
  bool diffuse;    //拡散光
  bool shadow;     //ソフトシャドウ
  bool globallight;//大域照明
  bool fog;        //霧
  bool gamma;      //ガンマ補正
};
const effectConfig effect = effectConfig(
  false,false,true,true,false,true,true
);

const int SAIHATE = 0;
const int CYAN = 1;
const int WHITE = 2;
const int MANDEL = 3;
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
  vec3 p = vec3(mod(z.x,3.0),mod(z.y,3.0),z.z);
  return sphere(p,vec3(1.5,1.5,0.0),1.0);
}

float plane(vec3 z,vec3 normal,float offset){
  return dot(z,normalize(normal))+offset;
}

float floor1(vec3 z){//plane
  return plane(z,vec3(0.0,0.0,1.0),1.0);
}

void sphereFold(inout vec3 z, inout float dz) {
  float minRadius2=0.60;//定数
  float fixedRadius2=2.65;//定数
	float r2 = dot(z,z);
	if (r2<minRadius2) { 
		// linear inner scaling
		float temp = fixedRadius2/(minRadius2);
		z *= temp;
		dz*= temp;
	} else if (r2<fixedRadius2) { 
		// this is the actual sphere inversion
		float temp =fixedRadius2/r2;
		z *= temp;
		dz*= temp;
	}
}

void boxFold(inout vec3 z, inout float dz) {
  float foldingLimit=1.14;//定数
	z = clamp(z, -foldingLimit, foldingLimit) * 2.0 - z;
}

float DE(vec3 z){
  float Scale = -2.18 ;//+time/20.0;//定数
	vec3 offset = z;
	float dr = 1.0;
	for (int n = 0; n < 25; n++) {
		boxFold(z,dr);       // Reflect
		sphereFold(z,dr);    // Sphere Inversion
    z=Scale*z + offset;  // Scale & Translate
    dr = dr*abs(Scale)+1.0;
	}
	float r = length(z);
	return r/abs(dr);
}

float distanceFunction(vec3 z){
  return DE(z);
}

//マテリアルの設定
int materialOf(vec3 z,float distance){
  if (floor1(z) == distance){
    return CYAN;
  }else if (sphere1(z) == distance){
    return WHITE;
  }else if (DE(z) == distance){
    return MANDEL;
  }else{
    return ERROR;
  }
}

vec3 kadoCol(vec3 rPos){
  vec3 color;
  float colorr;
  float colorb;
  float seed;
  seed=(rPos.x-rPos.z)/4.6;
  colorr=max(0.0,seed+0.2);
  colorb=max(0.0,1.0-seed+0.2);
  colorr*=pow(1.0-seed,2.0)/2.0+0.5;
  colorb*=pow(1.0-seed,2.0)/2.0+0.5;
  float a=4.0;
  colorb=(1.0/(1.0+exp(-a*(colorb-0.5)))-0.5)*(1.0/(1.0/(1.0+exp(-0.5*a))-0.5))/2.0+0.5;
  color=vec3(colorr,1.2-abs(seed),colorb*0.5);
  color=clamp(color,0.0,1.0);
  return color;
}

vec3 color(rayobj ray){
  if (ray.material == CYAN){
    return vec3(0.0,0.5,0.5);
  }else if (ray.material == WHITE){
    return vec3(1.0,1.0,1.0);
  }else if (ray.material == MANDEL){
    return kadoCol(ray.rPos);
  }else{
    return vec3(1.0,0.0,0.0);
  }
}

float refrectance(int material){
  if (material == CYAN){
    return 0.5;
  }else if (material == WHITE){
    return 0.6;
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
  ray.fragColor = clamp(ray.fragColor + min(light_specular,1.0),0.0,1.0);
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
  ray.fragColor = (ray.fragColor)*(1.0-fog)+vec3(0.05)*(fog);
}

void gammaFunc(inout rayobj ray){//ガンマ補正
  ray.fragColor.x=pow(ray.fragColor.x,1.0/2.2);
  ray.fragColor.y=pow(ray.fragColor.y,1.0/2.2);
  ray.fragColor.z=pow(ray.fragColor.z,1.0/2.2);
}

const int MAX_REFRECT = 3;
void reflectFunc(inout rayobj ray){
  rayobj rays[MAX_REFRECT+1];
  rays[0] = ray;
  int escape = MAX_REFRECT;
  for (int i = 0;i<MAX_REFRECT;i++){
    float dot = -dot(rays[i].direction,rays[i].normal);
    vec3 direction=rays[i].direction+2.0*dot*rays[i].normal;
    rays[i+1] = rayobj(rays[i].rPos+rays[i].normal*0.001,direction,0.0,INFINITY,0.0,0,vec3(0.0),vec3(0.0));
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
  rayobj ray = rayobj(cPos,direction,0.0,INFINITY,0.0,0,vec3(0.0),vec3(0.0));
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
  if (effect.gamma){
    gammaFunc(ray);
  }
  gl_FragColor = vec4(ray.fragColor,1.0);
}
`