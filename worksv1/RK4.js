//タイムステップ 時刻 座標配列 速度配列
function RK4 ( dt, t, rs, vs ){
  let N = rs.length;
  //１段目
  let v1s = RK4.V( t, rs, vs );
  let a1s = RK4.A( t, rs, vs );

  //２段目
  let _v1s = [];
  let _a1s = [];
  for( let i = 0;i < N; i++ ){
    _v1s[i] = new Vector3( rs[i].x + v1s[i].x*dt/2, rs[i].y + v1s[i].y*dt/2, rs[i].z + v1s[i].z*dt/2 );
    _a1s[i] = new Vector3( vs[i].x + a1s[i].x*dt/2, vs[i].y + a1s[i].y*dt/2, vs[i].z + a1s[i].z*dt/2 );
  }
  let v2s = RK4.V( t + dt/2, _v1s, _a1s );
  let a2s = RK4.A( t + dt/2, _v1s, _a1s );

  //３段目
  let _v2s = [];
  let _a2s = [];
  for( let i = 0;i < N; i++ ){
    _v2s[i] = new Vector3( rs[i].x + v2s[i].x*dt/2, rs[i].y + v2s[i].y*dt/2, rs[i].z + v2s[i].z*dt/2 );
    _a2s[i] = new Vector3( vs[i].x + a2s[i].x*dt/2, vs[i].y + a2s[i].y*dt/2, vs[i].z + a2s[i].z*dt/2 );
  }
  let v3s = RK4.V( t + dt/2, _v2s, _a2s );
  let a3s = RK4.A( t + dt/2, _v2s, _a2s );

  //４段目
  let _v3s = [];
  let _a3s = [];
  for( let i = 0;i < N; i++ ){
    _v3s[i] = new Vector3( rs[i].x + v3s[i].x*dt, rs[i].y + v3s[i].y*dt, rs[i].z + v3s[i].z*dt );
    _a3s[i] = new Vector3( vs[i].x + a3s[i].x*dt, vs[i].y + a3s[i].y*dt, vs[i].z + a3s[i].z*dt );
  }
  let v4s = RK4.V( t + dt, _v3s, _a3s );
  let a4s = RK4.A( t + dt, _v3s, _a3s );

  //仕上げ
  let output_rs = [];
  let output_vs = [];

  for( let i = 0;i < N; i++ ){
    output_rs[i] = new Vector3();
    output_vs[i] = new Vector3();
    output_rs[i].x = dt / 6 *(  v1s[i].x + 2*v2s[i].x + 2*v3s[i].x + v4s[i].x );
    output_rs[i].y = dt / 6 *(  v1s[i].y + 2*v2s[i].y + 2*v3s[i].y + v4s[i].y );
    output_rs[i].z = dt / 6 *(  v1s[i].z + 2*v2s[i].z + 2*v3s[i].z + v4s[i].z );
    output_vs[i].x = dt / 6 *(  a1s[i].x + 2*a2s[i].x + 2*a3s[i].x + a4s[i].x );
    output_vs[i].y = dt / 6 *(  a1s[i].y + 2*a2s[i].y + 2*a3s[i].y + a4s[i].y );
    output_vs[i].z = dt / 6 *(  a1s[i].z + 2*a2s[i].z + 2*a3s[i].z + a4s[i].z );
  }

  return { rs : output_rs, vs : output_vs };
}
//加速度ベクトル
/*
RK4.A = function( t, rs, vs ){
  let N = rs.length;

  let outputs = [];
  for( let i = 0;i < N; i++ ){
    outputs[i] = new Vector3();
  }

  return outputs;
}
*/
//速度ベクトル
RK4.V = function( t, rs, vs ){
  let N = vs.length;

  let output_vs = [];
  for( let i = 0;i < N; i++ ){
    output_vs[i] = vs[i].clone();
  }

  return output_vs;
}
