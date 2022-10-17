let fs_setup =`
precision mediump float;
uniform float time;
uniform vec2  resolution;
uniform vec3  cDir;
uniform vec3  cPos;

const float PI = 3.14159265;
const float PI2 = PI*2.0;
const float E = 2.71828182;
const float INFINITY = 1.e20;
const float FOV = 30.0 * 0.5 * PI / 180.0;//field of view
const vec3 LightDir = normalize(vec3(2.0,1.0,1.0));
const int Iteration =128;
const int MAX_REFRECT = 2;

struct rayobj{
  vec3  rPos;     //レイの場所
  vec3  direction;//方向
  float distance; //距離関数の返り値
  float len;      //出発点からの距離
  float iterate;  //レイマーチの反復回数
  int   objectID;  //オブジェクトID
  int   material; //マテリアルID
  vec3  normal;   //法線ベクトル
  vec3  fragColor;//色
};

struct effectConfig{
  bool reflect;    //反射
  bool ambient;    //アンビエント
  bool specular;   //ハイライト(鏡面反射)
  bool diffuse;    //拡散光
  bool incandescence;//白熱光
  bool shadow;     //ソフトシャドウ
  bool globallight;//大域照明
  bool grow;       //グロー
  bool fog;        //霧
  bool gamma;      //ガンマ補正
};

const effectConfig effect = effectConfig(
  false, //反射
  true,  //アンビエント
  false, //ハイライト(鏡面反射)
  true, //拡散光
  false,  //白熱光
  true,  //ソフトシャドウ
  false, //大域照明
  false, //グロー
  true,  //霧
  true   //ガンマ補正
);

struct dfstruct{
  float dist;
  int   id;
};
`
let fs_main1 =`
float floor1(vec3 z){
  return plane(z,vec3(0,0,1),-1.95);
}

const float space = 1.3;
float gear1(vec3 z){
  z = z- vec3(0,space,0);
  z = turn(z,vec3(0,1,0),PI/2.0);
  z = turn(z,vec3(0,0,1),PI/20.0+time);
  return gear(z, 1.0, 1.4, 0.1, 20, 0.06);
}
float gear2(vec3 z){
  z = z- vec3(0,-space,0);
  z = turn(z,vec3(0,1,0),PI/2.0);
  z = turn(z,vec3(0,0,1),-time);
  return gear(z, 1.0, 1.4, 0.1, 20, 0.06);
}

dfstruct distanceFunction(vec3 z){
  z = z +vec3(-2,0,0);
  dfstruct plane = dfstruct(floor1(z),1);
  dfstruct gear1 = dfstruct(gear1(z),0);
  dfstruct gear2 = dfstruct(gear2(z),0);

  dfstruct df;
  df = dfmin(plane,gear1);
  df = dfmin(df,gear2);
  return df;
}
dfstruct depthFunction(vec3 z){
  z=z +vec3(-2,0,0);
  dfstruct plane = dfstruct(floor1(z),1);
  //dfstruct gear = dfstruct(gear(z),2);

  dfstruct df;
  //df = dfmin(plane,gear);
  return df;
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
  rayobj ray = rayobj(cPos,direction,0.0,0.0,0.0,99,0,vec3(0.0),vec3(0.0));
  raymarch(ray);
  //trick(ray,2.1);//錯視
  ray.material = materialOf(ray.objectID);

  //エフェクト
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
    if (effect.incandescence){
      incandescenceFunc(ray);
    }
    if (effect.shadow){
      shadowFunc(ray);
    }
    if (effect.globallight){
      globallightFunc(ray);
    }
  }else{//描写範囲外 or ステップ数不足
    skysphereFunc(ray);
    lessStepFunc(ray);
  }
  //全体
  if (effect.grow){
    growFunc(ray);
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