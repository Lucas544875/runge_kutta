class Quatarnion {
  constructor(w,i,j,k){
    this.w = w;
    this.i = i;
    this.j = j;
    this.k = k;
  };

  normalize(){
    let r = this.w**2+this.i**2+this.j**2+this.k**2;
    return new Quatarnion(this.w/r,this.i/r,this.j/r,this.k/r)
  };

  times(q2){
    return new Quatarnion(
    this.w*q2.w - this.i*q2.i - this.j*q2.j - this.k*q2.k,
    this.w*q2.i + this.i*q2.w + this.j*q2.k - this.k*q2.j,
    this.w*q2.j - this.i*q2.k + this.j*q2.w + this.k*q2.i,
    this.w*q2.k + this.i*q2.j - this.j*q2.i + this.k*q2.w
    );
  }

  inverse(){
    return new Quatarnion(this.w,-this.i,-this.j,-this.k);
  };

  static vec(x,y,z){
    return new Quatarnion(0,x,y,z);
  }
  
  static rotation(theta,x,y,z){
    let c = Math.cos(theta/2);
    let s = Math.sin(theta/2);
    return new Quatarnion(c,x*s,y*s,z*s).normalize();
  }

  turn(q){
    return q.times(this).times(q.inverse());
  }
  
  tovec(){
    return [this.i,this.j,this.k];
  }

  cross(q2){
    //todo:入力がベクトルかチェック
    return new Quatarnion(
      0,
      this.j*q2.k-this.k*q2.j,
      this.k*q2.i-this.i*q2.k,
      this.i*q2.j-this.j*q2.i
    )
  }
  /* 
  欲しい関数
  q1.times(q2)
  q2=q1.inverse()
  vec to qua
  lookat
  cross
  normalize
  v=Quartation.vec(1,2,3)
  q=v.lookat(0,0,0)
  */
}