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

//void sphereFold(inout vec3 z, inout float dz) {
//  float minRadius2 = 0.60;//定数
//  float fixedRadius2 = 2.65;//定数
//	float r2 = dot(z,z);
//	if (r2 < minRadius2) { 
//		// linear inner scaling
//		float temp = fixedRadius2/(minRadius2);
//		z  *= temp;
//		dz *= temp;
//	} else if (r2 < fixedRadius2) { 
//		// this is the actual sphere inversion
//		float temp = fixedRadius2/r2;
//		z  *= temp;
//		dz *= temp;
//	}
//}
//
//void boxFold(inout vec3 z, inout float dz) {
//  float foldingLimit=1.14;//定数
//	z = clamp(z, -foldingLimit, foldingLimit) * 2.0 - z;
//}
//
//dualVec mandelBox(vec3 z){
//  float Scale = -2.18 ;//+time/20.0;//定数
//	vec3 offset = z;
//	float dr = 1.0;
//	for (int n = 0; n < 25; n++) {
//		boxFold(z,dr);       // Reflect
//		sphereFold(z,dr);    // Sphere Inversion
//    z=Scale*z + offset;  // Scale & Translate
//    dr = dr*abs(Scale)+1.0;
//	}
//	float r = length(z)/abs(dr);
//	vec3 normal = vec3(1., 0., 0.);
//	return dualVec(r,normal);
//}
mat3 diag(vec3 v){
	return mat3(
		v.x, 0.0, 0.0,
		0.0, v.y, 0.0,
		0.0, 0.0, v.z
	);
}

float trace(mat3 m){
	return m[0][0] + m[1][1] + m[2][2];
}
mat3 transpose(mat3 m){
	return mat3 (
		m[0][0], m[0][1], m[0][2],
		m[1][0], m[1][1], m[1][2],
		m[2][0], m[2][1], m[2][2]
	);
}

float Fnorm(mat3 m){
	return sqrt(trace(m * transpose(m)));
}
float L1norm(vec3 v){
	return abs(v.x)+abs(v.y)+abs(v.z);
}
float L1norm(mat3 m){
	return max(max(L1norm(m[0]),L1norm(m[1])),L1norm(m[2]));
}
float Linfnorm(mat3 m){
	return L1norm(transpose(m));
}

void sphereFold(inout vec3 z, inout mat3 dz) {
  float minRadius2 = 0.60;//定数
  float fixedRadius2 = 2.65;//定数
	float r2 = dot(z,z);
	if (r2 < minRadius2) {
		// linear inner scaling
		float temp = fixedRadius2/(minRadius2);
		z  *= temp;
		dz *= temp;
	} else if (r2 < fixedRadius2) { 
		// this is the actual sphere inversion
		float temp = fixedRadius2/r2;
		mat3 jacobi = mat3 (//column-major order
			r2-2.0*z.x*z.x, -2.0*z.y*z.x, -2.0*z.z*z.x,
			-2.0*z.x*z.y, r2-2.0*z.y*z.y, -2.0*z.z*z.y,
			-2.0*z.x*z.z, -2.0*z.y*z.z, r2-2.0*z.z*z.z
			);
		jacobi *= temp/r2;
		dz = jacobi*dz;
		z *= temp;
	}
}

void boxFold(inout vec3 z, inout mat3 dz) {
  float foldingLimit=1.14;//定数
	z = clamp(z, -foldingLimit, foldingLimit) * 2.0 - z;
	mat3 jacobi = diag(sign(abs(z)-foldingLimit));
	dz = jacobi*dz;
}

dualVec mandelBox(vec3 z){
  float Scale = -2.18;//+time/20.0;//定数
	vec3 offset = z;
	mat3 dr = mat3(1.0);
	for (int n = 0; n < 10; n++) {
		boxFold(z,dr);       // Reflect
		sphereFold(z,dr);    // Sphere Inversion
    z  = Scale*z + offset;  // Scale & Translate
    dr = Scale*dr + mat3(1.0);
	}
	float r = length(z)/L1norm(dr);
	r = min(r,0.3);//なぜか上手くいく
	vec3 normal = dr * normalize(z);
	return dualVec(r,normalize(normal));
}
`