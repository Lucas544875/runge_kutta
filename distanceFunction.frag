let fs_distanceFunction =`
//シーン設定
//distance function
//primitives
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

float mandelBox(vec3 z){
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
`