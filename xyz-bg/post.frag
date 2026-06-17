#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUV;
uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_time;

// per-effect mix amounts (0.0 = off, 1.0 = full)
uniform float u_pixelateScale;
uniform float u_pixelateAmt;
uniform float u_levels;
uniform float u_posterizeAmt;
uniform float u_brightPassThreshold;
uniform float u_brightPassAmt;
uniform float u_lineFreq;
uniform float u_lineIntensity;
uniform float u_scanlineAmt;
uniform float u_swirlStrength;
uniform float u_swirlAmt;
uniform float u_distortStrength;
uniform float u_distortAmt;
uniform float u_fishStrength;
uniform float u_fishAmt;
uniform float u_waveFreq;
uniform float u_waveAmp;
uniform float u_waveAmt;
uniform float u_embossAmt;
uniform float u_edgeAmt;
uniform float u_sepiaAmt;
uniform float u_inversionAmt;
uniform float u_kaleidoSlices;
uniform float u_kaleidoAmt;
uniform float u_aberrationOffset;
uniform float u_aberrationAmt;
uniform float u_glitchAmp;
uniform float u_glitchAmt;
uniform float u_grainAmt;

float random2(vec2 uv) {
  vec2 i = floor(uv * u_resolution);
  return fract(sin(i.x * 127.1 + i.y * 311.7) * 43758.5453123);
}

void main() {
  vec2 uv = vUV;
  vec3 c = texture2D(u_tex, uv).rgb;

  // 1) pixelate
  vec2 uvP = floor(uv * u_pixelateScale) / u_pixelateScale;
  vec3 pixC = texture2D(u_tex, uvP).rgb;
  c = mix(c, pixC, u_pixelateAmt);

  // 2) posterize
  vec3 p = floor(c * u_levels) / u_levels;
  c = mix(c, p, u_posterizeAmt);

  // 3) bright-pass
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  vec3 bp = c;
  if(lum > u_brightPassThreshold)
    bp += c;
  c = mix(c, bp, u_brightPassAmt);

  // 4) scanlines
  float line = sin(uv.y * u_lineFreq);
  float sl = mix(1.0, u_lineIntensity, step(0.0, line));
  c = mix(c, c * sl, u_scanlineAmt);

  // 5) swirl
  vec2 d = uv - 0.5;
  float r = length(d);
  float a = atan(d.y, d.x) + u_swirlStrength * (1.0 - r);
  vec2 uvS = 0.5 + vec2(cos(a), sin(a)) * r;
  vec3 sC = texture2D(u_tex, uvS).rgb;
  c = mix(c, sC, u_swirlAmt);

  // 6) lens distortion
  vec2 dd = (uv - 0.5) * 2.0;
  float r2 = dot(dd, dd);
  vec2 uvD = dd * (1.0 + u_distortStrength * r2) * 0.5 + 0.5;
  vec3 dC = texture2D(u_tex, uvD).rgb;
  c = mix(c, dC, u_distortAmt);

  // 7) fish-eye
  vec2 df = uv - 0.5;
  float rf = length(df);
  float kf = pow(rf, u_fishStrength);
  vec2 uvF = 0.5 + df * kf;
  vec3 fC = texture2D(u_tex, uvF).rgb;
  c = mix(c, fC, u_fishAmt);

  // 8) wave/ripple
  vec2 uvW = uv;
  uvW.x += sin((uv.y + u_time) * u_waveFreq) * u_waveAmp;
  uvW.y += cos((uv.x + u_time) * u_waveFreq) * u_waveAmp;
  vec3 wC = texture2D(u_tex, uvW).rgb;
  c = mix(c, wC, u_waveAmt);

    // 11) sepia
  vec3 sep;
  sep.r = dot(c, vec3(0.993,0.969,0.989));
  sep.g = dot(c,vec3(0.0,0.0,0.0));
  sep.b = dot(c, vec3(0.0,0.0,0.0));
  c = mix(c, sep, u_sepiaAmt);

    // 12) inversion
  vec3 invC = 1.0 - c;
  c = mix(c, invC, u_inversionAmt);

  // 9) emboss
  vec2 eoff = 1.0 / u_resolution;
  float c1v = texture2D(u_tex, uv + eoff * vec2(-2, -2)).r;
  float c2v = texture2D(u_tex, uv + eoff * vec2(2, 2)).r;
  float emb = c2v - c1v + 0.1;
  c = mix(c, vec3(emb), u_embossAmt);

  // 10) edge detection (Sobel)
  float gx = -2.0 * texture2D(u_tex, uv + eoff 
  * vec2(-1, -1)).r - 2.0 * texture2D(u_tex, uv + eoff 
  * vec2(-1, 0)).r - 1.0 * texture2D(u_tex, uv + eoff 
  * vec2(-1, 1)).r + 1.0 * texture2D(u_tex, uv + eoff 
  * vec2(1, -1)).r + 2.0 * texture2D(u_tex, uv + eoff 
  * vec2(1, 0)).r + 1.0 * texture2D(u_tex, uv + eoff 
  * vec2(1, 1)).r;
  float gy = -2.0 * texture2D(u_tex, uv + eoff 
  * vec2(-1, -1)).r - 2.0 * texture2D(u_tex, uv + eoff 
  * vec2(0, -1)).r - 1.0 * texture2D(u_tex, uv + eoff 
  * vec2(1, -1)).r + 1.0 * texture2D(u_tex, uv + eoff 
  * vec2(-1, 1)).r + 2.0 * texture2D(u_tex, uv + eoff 
  * vec2(0, 1)).r + 1.0 * texture2D(u_tex, uv + eoff 
  * vec2(1, 1)).r;
  float eVal = length(vec2(gx, gy));
  c = mix(c, vec3(eVal), u_edgeAmt);



  // 13) kaleidoscope
  float angK = atan(uv.y - 0.5, uv.x - 0.5);
  float radK = length(uv - 0.5);
  float slice = 6.283185 / u_kaleidoSlices;
  angK = mod(angK, slice);
  vec2 uvK = 0.5 + vec2(cos(angK), sin(angK)) * radK;
  vec3 kC = texture2D(u_tex, uvK).rgb;
  c = mix(c, kC, u_kaleidoAmt);

  // 14) chromatic aberration
  vec2 offCA = u_aberrationOffset / u_resolution;
  vec3 abC;
  abC.r = texture2D(u_tex, uv + offCA).r;
  abC.g = texture2D(u_tex, uv).g;
  abC.b = texture2D(u_tex, uv - offCA).b;
  c = mix(c, abC, u_aberrationAmt);

  // 15) glitch
  float ty = step(0.95, fract(u_time * 5.0)) * u_glitchAmp;
  vec2 uvG = uv + vec2(random2(uv.yx) * ty, 0.0);
  vec3 gC = texture2D(u_tex, uvG).rgb;
  c = mix(c, gC, u_glitchAmt);

  // 16) grain
  float n = random2(uv);
  float g = (n - 0.5) * 0.1;
  c += g;

  gl_FragColor = vec4(c, 1.0);
}
