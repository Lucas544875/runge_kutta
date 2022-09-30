let fs_distanceFunction =`

//primitives
float sphere(vec3 z,vec3 center,float radius){
  return length(z-center)-radius;
}

float sphere1(vec3 z){
  vec3 p = vec3(mod(z.x,3.0),mod(z.y,3.0),z.z);
  return sphere(p, vec3(1.5,1.5,0.0), 0.8);
}

float plane(vec3 z,vec3 normal,float offset){
	return dot(z,normalize(normal)) - offset;
}

float floor1(vec3 z){//plane
  return plane(z,vec3(0.0,0.0,1.0), -0.8);
}

float plane1(vec3 z){//plane
  return plane(z,normalize(vec3(-1.0,0.0,0.0)),0.5);
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
  float foldingLimit=0.6;//定数
	z = clamp(z, -foldingLimit, foldingLimit) * 2.0 - z;
}

float mandelBox(vec3 z){
  float Scale = 1.9 ;//定数
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

float sdCross(vec3 p, float c) {
	p = abs(p);
	float dxy = max(p.x, p.y);
	float dyz = max(p.y, p.z);
	float dxz = max(p.x, p.z);
	return min(dxy, min(dyz, dxz)) - c;
}

float sdBox(vec3 p, vec3 b) {
	p = abs(p) - b;
	return length(max(p, 0.0)) + min(max(p.x, max(p.y, p.z)), 0.0);
}

float _mengerSponge(vec3 p, float scale, float width) {
	float d = sdBox(p, vec3(1.0));
	float s = 1.0;
	for (int i = 0; i < 7; i++) {
		vec3 a = mod(p * s, 2.0) - 1.0;
		s *= scale;
		vec3 r = 1.0 - scale * abs(a);
		float c = sdCross(r, width) / s;
		d = max(d, c);
	}
	return d;
}

float mengerSponge(vec3 p) {
	float scale = 3.0;
	float width = 1.0;
	return _mengerSponge(p,scale,width);
}

float pseudoKleinian(vec3 p) {
	vec3 csize = vec3(0.90756, 0.92436, 0.90756);
	float size = 1.0 ;
	vec3 c = vec3(0.0);
	float defactor = 1.0;
	vec3 ap = p + 1.0;
	for (int i = 0; i < 10; i++) {
		ap = p;
		p = 2.0 * clamp(p, -csize, csize) - p;
		float r2 = dot(p, p);
		float k = max(size / r2, 1.0);
		p *= k;
		defactor *= k;
		p += c;
	}
	float r = abs(0.5 * p.z / defactor);
	return r;
}
float shiftKeinian(vec3 p){
	vec3 o = vec3(11.0,-1.0,-1.0);
	return pseudoKleinian(p - o);
}
`