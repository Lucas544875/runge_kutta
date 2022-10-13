let fs_distanceFunction =`

//primitives
float sphere(vec3 z,vec3 center,float radius){
  return length(z-center)-radius;
}


float plane(vec3 z,vec3 normal,float offset){
	return dot(z,normalize(normal)) - offset;
}

float plane1(vec3 z){//plane
  return plane(z,normalize(vec3(0.0,0.0,1.0)),0.5);
}

void sphereFold(inout vec3 z, inout float dz, float minRadius2, float fixedRadius2) {
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

void boxFold(inout vec3 z, inout float dz, float foldingLimit) {
	z = clamp(z, -foldingLimit, foldingLimit) * 2.0 - z;
}

float mandelBox(vec3 z, float Scale, float foldingLimit, float minRadius2, float fixedRadius2){
	vec3 offset = z;
	float dr = 1.0;
	for (int n = 0; n < 16; n++) {
		boxFold(z,dr,foldingLimit);       // Reflect
		sphereFold(z,dr,minRadius2,fixedRadius2);    // Sphere Inversion
    z=Scale*z + offset;  // Scale & Translate
    dr = dr*abs(Scale)+1.0;
	}
	float r = length(z);
	return r/abs(dr);
}
float tofu(vec3 z){
  float Scale = 1.9 ;//定数
  float foldingLimit=0.6;//定数
	float minRadius2=0.60;//定数
  float fixedRadius2=2.65;//定数
	return mandelBox(z, Scale, foldingLimit, minRadius2, fixedRadius2);
}
float kado(vec3 z){
  float Scale = -2.18 ;//定数
  float foldingLimit=1.14;//定数
	float minRadius2=0.60;//定数
  float fixedRadius2=2.65;//定数
	return mandelBox(z, Scale, foldingLimit, minRadius2, fixedRadius2);
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
	for (int i = 0; i < 8; i++) {
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
	float size = 1.2;
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

float gasket(vec3 z){
	const float isq3 = inversesqrt(3.0);
	vec3 a1 = vec3(0,0,3.0/2.0);
	vec3 a2 = vec3(0,1,0);
	vec3 a3 = vec3(2.0/3.0*isq3,-1.0/3.0*isq3,0);
	vec3 a4 = vec3(-2.0/3.0*isq3,-1.0/3.0*isq3,0);
	vec3 c;
	float dist, d;
  float Scale=2.0;
  const int ite=50;
	for (int i=0;i < ite;i++) {
    c = a1; dist = length(z-a1);
    d = length(z-a2); if (d < dist) { c = a2; dist=d; }
    d = length(z-a3); if (d < dist) { c = a3; dist=d; }
    d = length(z-a4); if (d < dist) { c = a4; dist=d; }
    z = Scale*z-c*(Scale-1.0);
	}
	return length(z) * pow(Scale, float(-ite));
}

float lenPtoL(vec3 p,vec3 l, vec3 dir){
	vec3 z = l-p;
	vec3 ndir = normalize(dir);
	vec3 proj = z - dot(ndir,z)*ndir;
	return length(proj);
}
float triangle(vec3 z, vec3 p1, vec3 p2, vec3 p3){
	vec3 p1z = z-p1;
	vec3 p1p2 = p2 - p1;
	vec3 p1p3 = p3 - p1;
	vec3 p2p3 = p3 - p2;
	vec3 normal = normalize(cross(p1p2,p1p3));
	mat3 cmat = mat3(p1p2,p1p3,normal);
	vec3 c = inverse(cmat)*p1z;
	if(c.x > 0.0 && c.y > 0.0 && c.x+c.y < 1.0){
		return abs(dot(normal,p1z));
	}else if(c.x*c.y>0.0||c.x*(c.x-c.y)){
		float d1 = lenPtoL(z,p1,p1p2);
		float d2 = lenPtoL(z,p1,p1p3);
		float d3 = lenPtoL(z,p2,p2p3);
		return min(min(d1,d2),d3);
	}else{
		float d1 = lenPtoL(z,p1,p1p2);
		float d2 = lenPtoL(z,p1,p1p3);
		float d3 = lenPtoL(z,p2,p2p3);
		return min(min(d1,d2),d3);
	}
}
`