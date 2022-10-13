let fs_util = `
vec3 hsv(float h, float s, float v) {
  // h: 0.0 - 2PI, s: 0.0 - 1.0, v: 0.0 - 1.0, 円柱モデル
  return ((clamp(abs(fract(mod(h,2.0*PI)+vec3(0,2,1)/3.)*6.-3.)-1.,0.,1.)-1.)*s+1.)*v;
}

float manhattan (vec3 p,vec3 q){
  return abs(p.x-q.x)+abs(p.y-q.y)+abs(p.z-q.z);
}

float chebyshev (vec3 p,vec3 q){
  return max(max(abs(p.x-q.x),abs(p.y-q.y)),abs(p.z-q.z));
}

vec3 Hadamard(vec3 v,vec3 w){ //アダマール積
  return vec3(
    v.x * w.x,
    v.y * w.y,
    v.z * w.z
  );
}

vec3 gammainv(vec3 p){
  return pow(p,vec3(1.0/2.2));
}

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c,s,-s,c);
}

mat3 transpose(mat3 m) {
  return mat3(m[0][0], m[1][0], m[2][0],
              m[0][1], m[1][1], m[2][1],
              m[0][2], m[1][2], m[2][2]);
}

float det(mat2 matrix) {
  return matrix[0].x * matrix[1].y - matrix[0].y * matrix[1].x;
}

mat3 inverse(mat3 matrix) {
  vec3 row0 = matrix[0];
  vec3 row1 = matrix[1];
  vec3 row2 = matrix[2];

  vec3 minors0 = vec3(
    det(mat2(row1.y, row1.z, row2.y, row2.z)),
    det(mat2(row1.z, row1.x, row2.z, row2.x)),
    det(mat2(row1.x, row1.y, row2.x, row2.y))
  );
  vec3 minors1 = vec3(
    det(mat2(row2.y, row2.z, row0.y, row0.z)),
    det(mat2(row2.z, row2.x, row0.z, row0.x)),
    det(mat2(row2.x, row2.y, row0.x, row0.y))
  );
  vec3 minors2 = vec3(
    det(mat2(row0.y, row0.z, row1.y, row1.z)),
    det(mat2(row0.z, row0.x, row1.z, row1.x)),
    det(mat2(row0.x, row0.y, row1.x, row1.y))
  );

  mat3 adj = transpose(mat3(minors0, minors1, minors2));

  return (1.0 / dot(row0, minors0)) * adj;
}
`