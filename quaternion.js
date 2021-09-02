class Quatarnion {
  constructor(w,i,j,k){
    this.w = w;
    this.i = i;
    this.j = j;
    this.k = k;
  }

  inverce(){
    return new Quatarnion(this.w,-this.i,-this.j,-this.k);
  }
  /* 
  欲しい関数
  q1.times(q2)
  q2=q1.inverse()
  vec to qua
  lookat
  cross

  v=Quartation.vec(1,2,3)
  q=v.lookat(0,0,0)

  */
}