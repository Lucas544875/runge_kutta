let fs_setup =`
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
const vec3 LightDir = normalize(vec3(0.0,1.0,0.0));
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
  bool ambient;    //アンビエント
  bool specular;   //ハイライト(鏡面反射)
  bool diffuse;    //拡散光
  bool shadow;     //ソフトシャドウ
  bool globallight;//大域照明
  bool grow;       //グロー
  bool fog;        //霧
  bool gamma;      //ガンマ補正
};

struct dualVec{ //三次元の二重数
  float d;
  vec3  e;
};

const effectConfig effect = effectConfig(
  false, //反射
  true,  //アンビエント
  false, //ハイライト(鏡面反射)
  true, //拡散光
  false,  //ソフトシャドウ
  false, //大域照明
  false, //グロー
  true,  //霧
  true   //ガンマ補正
);
`

let fs_main1 =`
dualVec distanceFunction(vec3 z){
  return mandelBox(z);
}
`

let fs_main2 =`
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
  ray.fragColor = vec3(0.0,0.0,0.0);
  if(abs(ray.distance) < 0.001){//物体表面にいる場合

    if (effect.reflect){
      reflectFunc(ray);
    }
    if(effect.ambient){
      ambientFunc(ray);
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