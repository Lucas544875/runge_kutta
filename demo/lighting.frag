
let fs_lighting =`

void raymarch(inout rayobj ray){
  for(int i = 0; i < Iteration; i++){
    dfstruct df = distanceFunction(ray.rPos);
    ray.distance = df.dist;
    if(ray.distance < 0.001){
      ray.normal = normal(ray.rPos);
      ray.objectID = df.id;
      ray.iterate = float(i)/float(Iteration);
      return;
    }
    ray.len += ray.distance;
    if(ray.len > 100.0){
      ray.objectID = 98;
      ray.iterate = float(i)/float(Iteration);
      return;
    }
    ray.rPos += ray.distance * ray.direction;
  }
  ray.objectID = 99;
  ray.iterate = 1.0;
}

//ライティング
void ambientFunc(inout rayobj ray){//アンビエント
  vec3 color = color(ray);
  vec3 ambcolor = vec3(1.0);
  float ambIntensity =  0.2;
  ray.fragColor += ambIntensity * dot(color,ambcolor);
  ray.fragColor = clamp(ray.fragColor,0.0,1.0);
}

void specularFunc(inout rayobj ray){//鏡面反射
  float t = -dot(ray.direction,ray.normal);
  vec3 reflection=ray.direction+2.0*t*ray.normal;
  float x = dot(reflection,LightDir);
  float specular=1.0/(50.0*(1.001-clamp(x,0.0,1.0)));
  ray.fragColor = clamp(ray.fragColor+specular,0.0,1.0);
}

void diffuseFunc(inout rayobj ray){//拡散光
  vec3 color = color(ray);
  vec3 lightColor = vec3(1.0);//(0.741, 0.741, 0.717);
  float diffIntensity = 0.4;
  float diffuse = max(0.0,dot(LightDir, ray.normal));
  ray.fragColor += diffIntensity * diffuse * Hadamard(color,lightColor);
  ray.fragColor = clamp(ray.fragColor,0.0,1.0);
}

void _incandescenceFunc(inout rayobj ray, vec3 incandescenceColor, vec3 incCenter, float incRadius, float incIntensity){ 
  vec3 color = pow(max((1.0 - (length(incCenter - ray.rPos)/incRadius)),0.0),2.0) * incIntensity * incandescenceColor;
  ray.fragColor += color;
  ray.fragColor = clamp(ray.fragColor,0.0,1.0);
}

void incandescenceFunc(inout rayobj ray){ //白熱光
  vec3 incandescenceColor = vec3(1.000, 0.501, 0.200);
  vec3 incCenter0 = vec3( 2.0,0.0,0.0);
  vec3 incCenter1 = vec3(-2.0,0.0,0.0);
  vec3 incCenter2 = vec3(0.0, 2.0,0.0);
  vec3 incCenter3 = vec3(0.0,-2.0,0.0);
  vec3 incCenter4 = vec3(0.0,0.0, 2.0);
  vec3 incCenter5 = vec3(0.0,0.0,-2.0);
  float incRadius = 2.0;
  float incIntensity = 1.5;
  _incandescenceFunc(ray, incandescenceColor, incCenter0, incRadius, incIntensity);
  _incandescenceFunc(ray, incandescenceColor, incCenter1, incRadius, incIntensity);
  _incandescenceFunc(ray, incandescenceColor, incCenter2, incRadius, incIntensity);
  _incandescenceFunc(ray, incandescenceColor, incCenter3, incRadius, incIntensity);
  _incandescenceFunc(ray, incandescenceColor, incCenter4, incRadius, incIntensity);
  _incandescenceFunc(ray, incandescenceColor, incCenter5, incRadius, incIntensity);
}

const float shadowCoef = 0.4;
void shadowFunc(inout rayobj ray){
  float h = 0.0;
  float c = 0.0;
  float r = 1.0;
  for(float t = 0.0; t < 50.0; t++){
    h = distanceFunction(ray.rPos + ray.normal*0.001 + LightDir * c).dist;
    if(h < 0.001){
      ray.fragColor *= shadowCoef;
      return;
    }
    r = min(r, h * 200.0 / c);
    c += h;
  }
  ray.fragColor *= mix(shadowCoef, 1.0, r);
  return;
}

void globallightFunc(inout rayobj ray){//大域照明
  vec3 origin = ray.rPos+ray.normal*0.001;
  rayobj ray2 = rayobj(origin,ray.normal,0.0,0.0,0.0,99,0,vec3(0.0),vec3(0.0));
  raymarch(ray2);
  float near = 0.10;
  ray.fragColor *= clamp(min(near,ray2.len)/near,0.0,1.0);
}

void skysphereFunc(inout rayobj ray){//天球
  if (ray.objectID == 98){
    ray.fragColor += color(ray);
  }
}

const float growIntencity = 1.0;
void growFunc(inout rayobj ray){//グロー
  vec3 grow = vec3(ray.iterate) * growIntencity;
  ray.fragColor += grow;
}

void fogFunc(inout rayobj ray){//霧
  rayobj ray2 = ray;
  ray2.material = SAIHATE;
  vec3 fogColor = color(ray2);
  const float minRadius = 60.0;
  const float maxRadius = 80.0;
  float fogcoef = clamp((ray.len-minRadius)/(maxRadius-minRadius),0.0,1.0);
  ray.fragColor = mix(ray.fragColor, fogColor, fogcoef);
}

void gammaFunc(inout rayobj ray){//ガンマ補正
  ray.fragColor=pow(ray.fragColor,vec3(2.2));
}

void reflectFunc(inout rayobj ray){//反射
  rayobj rays[MAX_REFRECT+1];
  rays[0] = ray;
  int escape = MAX_REFRECT;
  for (int i = 0;i<MAX_REFRECT;i++){
    float dot = -dot(rays[i].direction,rays[i].normal);
    vec3 direction=rays[i].direction+2.0*dot*rays[i].normal;
    rays[i+1] = rayobj(rays[i].rPos+rays[i].normal*0.001,direction,0.0,0.0,0.0,99,0,vec3(0.0),vec3(0.0));
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