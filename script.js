// global
let c, cw, ch, mx, my, gl, eCheck, mouseflag;
let centorx=0.0;
let centory=0.0;
let startTimeary = [];
let tempTimeary = [0.0,0.0];
let timenow = 0.0;
let uniLocation = [];
let vAttLocation = [];
let attStride = [];
let keyary = [];
let diff=1.0;
let run = true;
// onload
window.onload = function(){
  // エレメントを取得
  c = document.getElementById('canvas');
  eCheck = document.getElementById('check');

  // canvas サイズ
  ch=512;cw=512;
  c.height=ch;
  c.width=cw;

  // イベントリスナー登録
  document.addEventListener("keydown",key,true);
  //w=87,a=65,s=83,d=68,z=90,x=88
  //u=85,h=72,j=74,k=75,n=78,m=77,o=79,p=80
  document.addEventListener("mousedown",mouseDown,true);
  document.addEventListener("mouseup",mouseUp,true);
  c.addEventListener('mousemove', mouseMove, true);
  eCheck.addEventListener('change', checkChange, true);
  
  // WebGL コンテキストを取得
  gl = c.getContext('webgl');
  
  // シェーダ周りの初期化
  let prg = create_program(create_shader('vs'), create_shader('fs'));
  uniLocation[0] = gl.getUniformLocation(prg, 'time');
  uniLocation[1] = gl.getUniformLocation(prg, 'mouse');
  uniLocation[2] = gl.getUniformLocation(prg, 'resolution');
  uniLocation[3] = gl.getUniformLocation(prg, 'keyary');

  vAttLocation[0] = gl.getAttribLocation(prg, 'position');
  attStride[0] = 3;

  // 頂点データ回りの初期化
  let position = [
    -1.0,  1.0,  0.0,
     1.0,  1.0,  0.0,
    -1.0, -1.0,  0.0,
     1.0, -1.0,  0.0
  ];
  let index = [
      0, 2, 1,
      1, 2, 3
  ];

  //vbo
  let vPosition = create_vbo(position);
  
  //vboのバインド attribute属性の設定 増えてきたら関数化する
  gl.bindBuffer(gl.ARRAY_BUFFER, vPosition);
  gl.enableVertexAttribArray(vAttLocation[0]);
  gl.vertexAttribPointer(vAttLocation[0], attStride[0], gl.FLOAT, false, 0, 0);
  
  //iboの生成
  let vIndex = create_ibo(index);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);
  
  // その他の初期化
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  mx = 0.0; my = 0.0;
  keyary=[1.0,0.0,1.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0];

  startTimeary[0] = new Date().getTime();
  
  // レンダリング関数呼出
  render();
};

function render(){
  if (run==false) {
    return;
  }
  window.requestAnimationFrame(render, c);
  // 時間管理
  timenow = new Date().getTime();
  
  // カラーバッファをクリア
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // uniform 関連
  gl.uniform1f(uniLocation[0], (timenow - startTimeary[0] + tempTimeary[0]) * 0.001);
  gl.uniform2fv(uniLocation[1], [mx, my]);
  gl.uniform2fv(uniLocation[2], [cw, ch]);
  if (mouseflag) {
    keyary[3]=(timenow - startTimeary[1] + tempTimeary[1]) * 0.001;
  };
  gl.uniformMatrix4fv(uniLocation[3], false, keyary)
  // 描画
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  gl.flush();
}

function create_shader(id){
  // シェーダを格納する変数
  let shader;
  
  // HTMLからscriptタグへの参照を取得
  let scriptElement = document.getElementById(id);
  
  // scriptタグが存在しない場合は抜ける
  if(!scriptElement){return;}
  
  // scriptタグのclass属性をチェック
  switch(scriptElement.className){
      
    // 頂点シェーダの場合
    case 'x-shader/x-vertex':
      shader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(shader, vertexShader);
      break;
    // フラグメントシェーダの場合
    case 'x-shader/x-fragment':
      shader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(shader, fragmentShader);
      break;
    default :
      return;
  }
    
  // シェーダをコンパイルする
  gl.compileShader(shader);
  
  // シェーダが正しくコンパイルされたかチェック
  if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      
    // 成功していたらシェーダを返して終了
    return shader;
  }else{
      
    // 失敗していたらエラーログをアラートする
    alert(gl.getShaderInfoLog(shader));
  }
}

function create_program(vs, fs){
  // プログラムオブジェクトの生成
  let program = gl.createProgram();
  
  // プログラムオブジェクトにシェーダを割り当てる
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  
  // シェーダをリンク
  gl.linkProgram(program);
  
  // シェーダのリンクが正しく行なわれたかチェック
  if(gl.getProgramParameter(program, gl.LINK_STATUS)){
  
    // 成功していたらプログラムオブジェクトを有効にする
    gl.useProgram(program);
    
    // プログラムオブジェクトを返して終了
    return program;
  }else{
  
    // 失敗していたらエラーログをアラートする
    alert(gl.getProgramInfoLog(program));
  }
}

function create_vbo(data){
  // バッファオブジェクトの生成
  let vbo = gl.createBuffer();
  
  // バッファをバインドする
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  
  // バッファにデータをセット
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  
  // バッファのバインドを無効化
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
  // 生成した VBO を返して終了
  return vbo;
}

// IBOを生成する関数
function create_ibo(data){
  // バッファオブジェクトの生成
  let ibo = gl.createBuffer();
  
  // バッファをバインドする
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  
  // バッファにデータをセット
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
  
  // バッファのバインドを無効化
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  
  // 生成したIBOを返して終了
  return ibo;
}

// mouse center
function mouseMove(e){
  if (!mouseflag){
    let zoom=Math.exp(keyary[3] / 3.0- 0.5);
    mx =(2 * e.offsetX / cw - 1)/zoom*2+centorx;
    my =(-2 * e.offsetY / ch + 1)/zoom*2+centory;
  };
}

//check box
function checkChange(e) {
  run = e.currentTarget.checked;
  if(run){
    startTimeary[0] = new Date().getTime();
    render();
  }else{
    tempTimeary[0] += timenow - startTimeary[0]
  }
};

function mouseDown(e) {
  mouseflag=true;
  startTimeary[1] = new Date().getTime();
  centorx=mx;
  centory=my;
};

function mouseUp(e) {
  mouseflag=false;
  tempTimeary[1] += timenow - startTimeary[1];
  let zoom=Math.exp(keyary[3] / 3.0- 0.5);

  centorx-=(2 * e.offsetX / cw - 1)/zoom*2;
  centory-=(-2 * e.offsetY / cw + 1)/zoom*2;
  console.log(zoom);
};

//key
//w=87,a=65,s=83,d=68,z=90,x=88
//u=85,h=72,j=74,k=75,n=78,m=77,o=79,p=80
function key(e){
  return;
  /*
  if (e.keyCode==87){// w
    keyary[2]+=0.1*diff;
  }else if(e.keyCode==83){// s
    keyary[2]-=0.1*diff;
  }else if(e.keyCode==65){// a
    keyary[0]-=0.1*diff;
  }else if(e.keyCode==68){// d
    keyary[0]+=0.1*diff;
  }else if(e.keyCode==90){// z
    keyary[1]+=0.1*diff;
  }else if(e.keyCode==88){// x
    keyary[1]-=0.1*diff;
  }else if(e.keyCode==85){// u
    keyary[3]-=0.1;
  }else if(e.keyCode==74){// j
    keyary[3]+=0.1;
  }else if(e.keyCode==72){// h
    keyary[5]-=0.1;
  }else if(e.keyCode==75){// k
    keyary[5]+=0.1;
  }else if(e.keyCode==78){// n
    keyary[4]-=0.2;
  }else if(e.keyCode==77){// m
    keyary[4]+=0.2;
  }else if(e.keyCode==79){// o
    keyary[7]*=1.05;
  }else if(e.keyCode==80){// p
    keyary[7]/=1.05;
  }else if(e.keyCode==188){// <
    diff/=2.0;
  }else if(e.keyCode==190){// >
    diff*=2.0;
  }else if(e.keyCode==191){// /
    keyary[6]-=0.01*diff;
  }else if(e.keyCode==226){// \
    keyary[6]+=0.01*diff;
  }
  */
}