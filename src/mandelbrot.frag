let fragmentShader =`
precision mediump float;
uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;
uniform mat4  keyary;
const int iteration =500;
const float PI = 3.14159265;

// HSV 色相 彩度 明度
vec3 hsv(float h, float s, float v){
  vec4 t = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(vec3(h) + t.xyz) * 6.0 - vec3(t.w));
  return v * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0, 1.0), s);
}

void main(void){
  float zoom=exp(keyary[0][3] / 3.0 - 0.5);
  // フラグメント座標の正規化
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
  
  // マンデルブロ集合
  int j = 0;
  vec2  point = p/zoom - mouse + vec2(-0.5, 0.0);
  vec2  element = vec2(0.0, 0.0);
  
  // 漸化式
  for(int i = 0; i < iteration; i++){
    j++;
    if(length(element) > 2.0){break;}
    element = vec2(element.x * element.x - element.y * element.y, 2.0 * element.x * element.y) + point;
  }
  
  float s = sqrt(float(j) / float(iteration));

  vec3 rgb = hsv(s,0.5,sin(s*PI));
  
  // 最終的な色の出力
  gl_FragColor = vec4(rgb, 1.0);
  
}
`