let fs_distanceFunction =`

//primitives
dualVec sphere(vec3 z,vec3 center,float radius){
	float d = length(z-center)-radius;
	vec3 normal = normalize(z-center);
  return dualVec(d,normal);
}

dualVec sphere1(vec3 z){
  vec3 p = vec3(mod(z.x,3.0),mod(z.y,3.0),z.z);
  return sphere(p, vec3(1.5,1.5,0.0), 0.8);
}

dualVec plane(vec3 z,vec3 normal,float offset){
	float d = dot(z,normalize(normal)) + offset;
	vec3 e = normalize(normal);
  return dualVec(d,e);
}

dualVec floor1(vec3 z){//plane
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

float _mandelBox(vec3 z){
  float Scale = -2.18 ;//+time/20.0;//定数
	vec3 offset = z;
	float dr = 1.0;
	for (int n = 0; n < 16; n++) {
		boxFold(z,dr);       // Reflect
		sphereFold(z,dr);    // Sphere Inversion
    z=Scale*z + offset;  // Scale & Translate
    dr = dr*abs(Scale)+1.0;
	}
	float r = length(z);
	return r/abs(dr);
}

vec3 normal(vec3 p){
  float d = 0.0001;
  return normalize(vec3(
    _mandelBox(p + vec3(  d, 0.0, 0.0)) - _mandelBox(p + vec3( -d, 0.0, 0.0)),
    _mandelBox(p + vec3(0.0,   d, 0.0)) - _mandelBox(p + vec3(0.0,  -d, 0.0)),
    _mandelBox(p + vec3(0.0, 0.0,   d)) - _mandelBox(p + vec3(0.0, 0.0,  -d))
  ));
}

dualVec mandelBox(vec3 z){
	float d = _mandelBox(z);
	vec3 e = normal(z);
	return dualVec(d,e);
}
`