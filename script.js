// global
let c, cw, ch, mx, my, gl, run, eCheck;
let startTime;
let time = 0.0;
let tempTime = 0.0;
const fps = 1000 / 5; //1000ms 5fps
let uniLocation = new Array();
let keyary = new Array();
let diff=1.0

// onload
window.onload = function(){
  // エレメントを取得
  c = document.getElementById('canvas');
  
  // canvas サイズ
  ch=512;cw=512;
  c.height=ch;
  c.width=cw;

  // イベントリスナー登録
  document.addEventListener("keydown",key,true);
  //w=87,a=65,s=83,d=68,z=90,x=88
  //u=85,h=72,j=74,k=75,n=78,m=77,o=79,p=80
  c.addEventListener('mousemove', mouseMove, true);
  //eCheck.addEventListener('change', checkChange, true);
  
  // WebGL コンテキストを取得
  gl = c.getContext('webgl');
  
  // シェーダ周りの初期化
  let prg = create_program(create_shader('vs'), create_shader('fs'));
  run = (prg != null); if(!run){eCheck.checked = false;}
  uniLocation[0] = gl.getUniformLocation(prg, 'time');
  uniLocation[1] = gl.getUniformLocation(prg, 'mouse');
  uniLocation[2] = gl.getUniformLocation(prg, 'resolution');
  uniLocation[3] = gl.getUniformLocation(prg, 'keyary');
  
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
  let vPosition = create_vbo(position);
  let vIndex = create_ibo(index);
  let vAttLocation = gl.getAttribLocation(prg, 'position');
  gl.bindBuffer(gl.ARRAY_BUFFER, vPosition);
  gl.enableVertexAttribArray(vAttLocation);
  gl.vertexAttribPointer(vAttLocation, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);
  
  // その他の初期化
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  mx = 0.5; my = 0.5;
  keyary=[0.0,0.0,0.0,0.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0];

  startTime = new Date().getTime();
  
  // レンダリング関数呼出
  render();
};

function create_shader(id){
  // シェーダを格納する変数
  let shader;
  
  // HTMLからscriptタグへの参照を取得
  let scriptElement = document.getElementById(id);
  
  // scriptタグが存在しない場合は抜ける
  if(!scriptElement){return;}
  
  // scriptタグのclass属性をチェック
  // 生成されたシェーダにソースを割り当てる
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

// レンダリングを行う関数
function render(){
  // フラグチェック
  if(!run){return;}
  
  // 時間管理
  time = (new Date().getTime() - startTime) * 0.001;
  
  // カラーバッファをクリア
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // uniform 関連
  gl.uniform1f(uniLocation[0], time + tempTime);
  gl.uniform2fv(uniLocation[1], [mx, my]);
  gl.uniform2fv(uniLocation[2], [cw, ch]);
  gl.uniformMatrix4fv(uniLocation[3], false, keyary)
  // 描画
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  gl.flush();
  
  // 再帰
  //setTimeout(render, fps);
  //無効化してるだけ

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

/*
// checkbox
function checkChange(e){
  run = e.currentTarget.checked;
  if(run){
    startTime = new Date().getTime();
    render();
  }else{
    tempTime += time;
  }
}
*/
// mouse
function mouseMove(e){
  mx = e.offsetX / cw;
  my = e.offsetY / ch;
}
//key
//w=87,a=65,s=83,d=68,z=90,x=88
//u=85,h=72,j=74,k=75,n=78,m=77,o=79,p=80
function key(e){
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
}