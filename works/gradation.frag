let fragmentShader =`
precision mediump float;
uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;

void main(void){
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
  vec2 color = (vec2(1.0) + p.xy) * 0.5;
  gl_FragColor = vec4(color, 0.0, 1.0);
}
`