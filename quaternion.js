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
  
}