let fs_material =`
//マテリアルの設定
const int SAIHATE = 0;
const int CYAN = 1;
const int WHITE = 2;
const int GRID = 3;
const int MANDEL = 4;
const int DEBUG = 98;
const int ERROR = 99;

//マテリアルの設定
int materialOf(vec3 z,float distance){
  if (floor1(z).d == distance){
    return GRID;
  }else if (sphere1(z).d == distance){
    return DEBUG;
  }else if (mandelBox(z).d == distance){
    return MANDEL;
  }else{
    return ERROR;
  }
}

vec3 gridCol(vec3 rPos){
  return mix(vec3(0.3),vec3(step(fract(2.0*rPos.x),0.05),step(fract(2.0*rPos.y),0.05),step(fract(2.0*rPos.z),0.05)),0.5);
}


vec3 debugCol(vec3 rPos){
  return fract(rPos);
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
  if (ray.material == GRID){
    return gridCol(ray.rPos);
  }else if (ray.material == WHITE){
    return vec3(1.0,1.0,1.0);
  }else if (ray.material == DEBUG){
    return debugCol(ray.rPos);
  }else if (ray.material == MANDEL){
    return kadoCol(ray.rPos);
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
  }else if (material == GRID){
    return 0.3;
  }else if (material == MANDEL){
    return 0.3;
  }else{
    return 0.0;
  }
}
`