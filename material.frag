let fs_material =`
//マテリアルの設定
const int SAIHATE = 0;
const int CYAN = 1;
const int WHITE = 2;
const int GRID = 3;
const int DEBUG = 98;
const int ERROR = 99;

//マテリアルの設定
int materialOf(vec3 z,float distance){
  if (floor1(z).d == distance){
    return GRID;
  }else if (sphere1(z).d == distance){
    return DEBUG;
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

vec3 color(rayobj ray){
  if (ray.material == GRID){
    return gridCol(ray.rPos);
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
  }else if (material == GRID){
    return 0.3;
  }else{
    return 0.0;
  }
}
`