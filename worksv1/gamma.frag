let fragmentShader =`
precision mediump float;
uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;

void main(void){
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
  //vec3 color = vec3(0.5*(1.0 + p.x),fract(1.0 + p.y),1.0);
  vec3 color = 0.5*vec3(1.0 + p.x);
  if (p.y<0.0){
    color.x=pow(color.x,2.2);
    color.y=pow(color.y,2.2);
    color.z=pow(color.z,2.2);
  }
  gl_FragColor = vec4(color, 1.0);
}
`