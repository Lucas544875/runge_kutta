
let fs_lighting =`
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
`