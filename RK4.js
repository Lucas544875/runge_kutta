//タイムステップ 時刻 座標配列 速度配列
function RK4(dt, t, rs, vs) {
  let N = rs.length;
  
  // 1
  let v1s = RK4.V(t, rs, vs);
  let a1s = RK4.A(t, rs, vs);

  // 2
  let _v1s = [];
  let _a1s = [];
  for (let i = 0; i < N; i++) {
    _v1s[i] = new Vector3( rs[i].x + v1s[i].x*dt/2, rs[i].y + v1s[i].y*dt/2,rs[i].z + v1s[i].z*dt/2);
    _a1s[i] = new Vector3( vs[i].x + a1s[i].x*dt/2, vs[i].y + a1s[i].y*dt/2,vs[i].z + a1s[i].z*dt/2);
  }
  let v2s = RK4.V( t + dt/2, _v1s, _a1s);
  let a2s = RK4.A( t + dt/2, _v1s, _a1s);

  // 3
  let _v2s = [];
  let _a2s = [];
  for (let i = 0; i < N; i++) {
    _v2s[i] = new Vector3( rs[i].x + v2s[i].x*dt/2, rs[i].y + v2s[i].y*dt/2,rs[i].z + v2s[i].z*dt/2);
    _a2s[i] = new Vector3( vs[i].x + a2s[i].x*dt/2, vs[i].y + a2s[i].y*dt/2,vs[i].z + a2s[i].z*dt/2);
  }
  let v3s = RK4.V( t + dt/2, _v2s, _a2s);
  let a3s = RK4.A( t + dt/2, _v2s, _a2s);

  // 4
  let _v3s = [];
  let _a3s = [];
  for (let i = 0; i < N; i++) {
    _v3s[i] = new Vector3( rs[i].x + v3s[i].x*dt/2, rs[i].y + v3s[i].y*dt/2,rs[i].z + v3s[i].z*dt/2);
    _a3s[i] = new Vector3( vs[i].x + a3s[i].x*dt/2, vs[i].y + a3s[i].y*dt/2,vs[i].z + a3s[i].z*dt/2);
  }
  let v4s = RK4.V( t + dt/2, _v3s, _a3s);
  let a4s = RK4.A( t + dt/2, _v3s, _a3s);

  // 出力
  let output_rs = [];
  let output_vs = [];
  for (let i = 0; i < N; i++) {
    output_rs[i] = new Vector3();
    output_vs[i] = new Vector3();
    output_rs[i].x =  dt/ 6 *(v1s[i].x + 2*v2s[i].x + 2*v3s[i].x + v4s[i].x);
    output_rs[i].y =  dt/ 6 *(v1s[i].y + 2*v2s[i].y + 2*v3s[i].y + v4s[i].y);
    output_rs[i].z =  dt/ 6 *(v1s[i].z + 2*v2s[i].z + 2*v3s[i].z + v4s[i].z);
    output_vs[i].x =  dt/ 6 *(a1s[i].x + 2*a2s[i].x + 2*a3s[i].x + a4s[i].x);
    output_vs[i].y =  dt/ 6 *(a1s[i].y + 2*a2s[i].y + 2*a3s[i].y + a4s[i].y);
    output_vs[i].z =  dt/ 6 *(a1s[i].z + 2*a2s[i].z + 2*a3s[i].z + a4s[i].z);
  }
  return {rs : output_rs, vs : output_vs};
}

RK4.A = function (t,rs,vs) {
  let N = rs.length;
  let outputs = [];
  for (let i = 0; i < N; i++) {
    outputs[i] = new Vector3();
  }
  return outputs;
}

RK4.V = function (t,rs,vs) {
  let N = vs.length;
  let outputs = [];
  for (let i = 0; i < N; i++) {
    outputs[i] = vs[i].clone();
  }
  return outputs;
}



let compensationK = 0.02;   //補正ばね弾性係数
let compensationGamma = 1.0;//補正粘性抵抗係数
let compensationFactor = 1/10;   //補正倍率因子

// 解析解
let r_box = new Vector3(0,0,z_box);
let v_box = new Vector3(0,0,0);
let a_box = new Vector3(0,0,0);
// 重力
let vec_g = new Vector3(0,0,-g);

function A(rs,vs,i,j) {
  let ri = (i>0)?rs[i-1]:r_box;
  let rj = (j>0)?rs[j-1]:r_box;
  let rij = new Vector3().subVectors(ri,rj);

  let vi = (i>0)?vs[i-1]:v_box;
  let vj = (j>0)?vs[j-1]:v_box;
  let vij = new Vector3().subVectors(vi,vj);

  let ai = (i>0)?vec_g:a_box;
  let aj = (j>0)?vec_g:a_box;
  let aij = new Vector3().subVectors(ai,aj);
  let L = (i==0)?L01:L12;
  return (-vij.lengthSq()-aij.dot(rij))/L;
}

function f01(rs,vs,cos) {
  let bunbo = m1+m2*(1-cos*cos);
  return -m1*(m1+m2)/bunbo*A(rs,vs,0,1)
          -m1*m2*cos/bunbo*A(rs,vs,1,1);
}

function f12(rs,vs,cos) {
  let bunbo = m1+m2*(1-cos*cos);
  return -m1*m2*cos/bunbo*A(rs,vs,0,1)
          -m1*m2*cos/bunbo*A(rs,vs,1,2);
}

// RK4
let dt = 0.01;
// 加速度
RK4.A = function (t,rs,vs) {
  let N = rs.length;
  let outputs = [];
  // 方向ベクトル
  let n01 = new Vector3().subVectors(r_box,rs[0]).normalize;
  let n12 = new Vector3().subVectors(rs[0],rs[1]).normalize;

  let cos = n01.dot(n12);
  outputs[0] = vec_g.clone();
  outputs[0].add(n01.clone().multiplyScalar(f01(rs,vs,cos)/m1))
            .add(n12.clone().multiplyScalar(-f12(rs,vs,cos)/m1));
  
  outputs[1] = vec_g.clone();
  outputs[1].add(n12.clone().multiplyScalar(f12(rs,vs,cos)/m2));

  // ひも長補正
  let _L01 = new Vector3().subVectors(r_box,rs[0]).length();
  let _L12 = new Vector3().subVectors(rs[0],rs[1]).length();

  let ratio = (outputs[0].length() + outputs[1].length())*compensationFactor
  let fk01 = n01.clone().multiplyScalar( -(_L01 - L01)*compensationK*ratio);
  let fk10 = fk01.clone().multiplyScalar(-1);
  let fk12 = n12.clone().multiplyScalar( -(_L12 - L12)*compensationK*ratio);
  let fk21 = fk12.clone().multiplyScalar(-1);
  let v01 = new Vector3().subVectors(v_box,vs[0]);
  let v12 = new Vector3().subVectors(vs[0],vs[1]);
  //補正粘性抵抗力
  let fgamma01 = n01.clone().multiplyScalar(compensationGamma*v01.dot(n01)*ratio);
  let fgamma10 = fgamma01.clone().multiplyScalar(-1);
  let fgamma12 = n12.clone().multiplyScalar(compensationGamma*v12.dot(n12)*ratio);
  let fgamma21 = fgamma12.clone().multiplyScalar(-1);
  outputs[0].add(fk01).add(fk21).add(fgamma01).add(fgamma21);
  outputs[1].add(fk12).add(fgamma12);
  return outputs;
}