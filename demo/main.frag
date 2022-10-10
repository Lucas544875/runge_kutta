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
const vec3 LightDir = normalize(vec3(2.0,1.0,3.0));
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
  false,  //ソフトシャドウ
  false, //大域照明
  true, //グロー
  true,  //霧
  true   //ガンマ補正
);

struct dfstruct{
  float dist;
  int   id;
};
`
let fs_main1 =`

dfstruct dfmeta(dfstruct df1, dfstruct df2,float k){ //メタボール風の結合
  float distmin, distmax;
  int id;
  if (df1.dist < df2.dist){
    distmin = df1.dist;
    distmax = df2.dist;
    id = df1.id;
  }else{
    distmin = df2.dist;
    distmax = df1.dist;
    id = df2.id;
  }
  float h = 1.0 + exp(-k *(distmax-distmin));
  return dfstruct(distmin -log(h) / k, id);
}

dfstruct dfmax(dfstruct df1, dfstruct df2){ //共通部分
  if (df1.dist < df2.dist){
    return df2;
  }else{
    return df1;
  }
}

dfstruct dfmin(dfstruct df1, dfstruct df2){//和集合
  if (df1.dist < df2.dist){
    return df1;
  }else{
    return df2;
  }
}

vec2 pmod2d(vec2 p, float r,float section) {
  float a = atan(p.x, p.y) + PI/r+section;
  float n = PI2 / r;
  a = floor(a/n)*n ;
  return p*rot(-a);
}

vec3 pmod(vec3 z, vec3 center, vec3 direction, int n, float section){
  vec3 cz = z - center;
  vec3 pole = cross(vec3(0,0,1),direction);
  float theta = angle(vec3(0,0,1),direction);
  vec3 tz = turn(cz,pole,-theta);
  vec3 zz = vec3(pmod2d(tz.xy,float(n),section),tz.z);
  return turn(zz,pole,theta) + center;
}

vec3 bugmod(vec3 z, vec3 center, vec3 direction, int n, float section){
  vec3 cz = z - center;
  vec3 axes = cross(direction,vec3(0,0,1));
  float theta = angle(axes,cz) + section;
  float shift = floor(theta*float(n)/PI2)*PI2/float(n);
  return turn(cz,direction,shift)+center;
}

dfstruct distanceFunction(vec3 z){
  vec3 pz = pmod(z,vec3(0,-1,0),vec3(1,0,0),3,time);
  dfstruct df = dfstruct(mengerSponge(pz),0);
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