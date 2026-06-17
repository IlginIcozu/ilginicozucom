// basic pass-through vertex shader
attribute vec3 aPosition;
varying vec2 vUV;

void main() {
  // convert from clip-space [-1,1] to UV [0,1]
  vUV = aPosition.xy * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 1.0);
}
