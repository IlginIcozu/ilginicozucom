/* shaders-shim.js
   Inlines shader.vert / shader.frag / post.vert / post.frag as data: URLs and
   monkey-patches p5.prototype.loadShader so sketch.js can keep calling
   loadShader('shader.vert', 'shader.frag') unchanged. This makes the embedded
   copy of the ilginicozu site work even when the parent page is opened via
   the file:// protocol (where fetch() of relative resources is blocked).

   This file is intentionally local to portfolio-sitev2/xyz-bg/ — it does not
   affect the original ilginicozuxyzfinal-main project.
*/

(function () {
  if (typeof p5 === 'undefined' || !p5.prototype || !p5.prototype.loadShader) {
    return;
  }

  const SHADER_VERT = `// basic pass-through vertex shader
attribute vec3 aPosition;
varying vec2 vUV;

void main() {
  // convert from clip-space [-1,1] to UV [0,1]
  vUV = aPosition.xy * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 1.0);
}
`;

  const SHADER_FRAG = `#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUV;

uniform float u_flashActive;
uniform float u_region;

uniform float u_moveActive;
uniform float u_moveRegion;
uniform float u_moveProgress;
uniform float u_moveThickness;

uniform float u_time;
uniform vec2 u_resolution;

uniform float u_sliceActive;
uniform float u_sliceFreq;

uniform float u_sliceOrientation;
uniform float u_circleActive;
uniform float u_radius1, u_radius2;

uniform float u_percActive;
uniform float u_percProgress;
uniform float u_percDir;
uniform float u_gridCols;

uniform float u_showPercGrid;
uniform float u_gridThickness;
uniform float u_gradientdir;

uniform float u_gridRows;
uniform float gradientWidth;


// const float gradientWidth = 0.8;

// simple per-pixel film grain: centered on zero, +/-0.1 max
float grain(vec2 uv) {
  float n = fract(sin(dot(uv * u_resolution, vec2(12.9898, 78.233))) * 43758.5453);
  return (n - 0.5) * 0.1;
}

void main() {

// // --- PERC-GRID SCENE: standalone 4-direction scan ---
  if(u_percActive > 0.5 && u_showPercGrid == 1.0) {
    int dir = int(u_percDir + 0.5);
    int cols = int(u_gridCols + 0.5);
    int rows = int(u_gridRows + 0.5);
    float prog = u_percProgress * float((dir < 2) ? cols : rows);
    int idx = int(floor(prog));
    float frac = fract(prog);

  // Horizontal scans (L->R or R->L)
    if(dir == 0 || dir == 1) {
      float cellW = 1.0 / float(cols);
      int col = int(floor(vUV.x * float(cols)));
      bool lit = (dir == 0 && col == idx) || (dir == 1 && col == cols - idx - 1);
      if(lit) {
      // vertical gradient at top edge of screen
        float fadeVal = 1.0 - smoothstep(1.0 - gradientWidth, 0.8, vUV.y);
        if(u_gradientdir == 1.0) {
          fadeVal = smoothstep(0.0, gradientWidth, vUV.y);
        }
        float g = grain(vUV);
        gl_FragColor = vec4(vec3(fadeVal ), 1.0);
        return;
      }
    }
  // Vertical scans (B->T or T->B)
    else {
      float cellH = 1.0 / float(rows);
      int row = int(floor(vUV.y * float(rows)));
      bool lit = (dir == 2 && row == idx) || (dir == 3 && row == rows - idx - 1);
      if(lit) {
      // horizontal gradient at right edge of screen
        float fadeVal = 1.0 - smoothstep(1.0 - gradientWidth, 0.8, vUV.x);
          if(u_gradientdir == 1.0) {
          fadeVal = smoothstep(0.0, gradientWidth, vUV.x);
        }
        float g = grain(vUV);
        gl_FragColor = vec4(vec3(fadeVal ), 1.0);
        return;
      }
    }

  // all other pixels black
    gl_FragColor = vec4(0.0);
    return;
  }

  // --- CALCULATE MOVING BLOCK ---
  bool inMove = false;
  float moveD = 0.0;
  if(u_moveActive > 0.1) {
    int region = int(u_moveRegion + 0.5);
    float p = u_moveProgress;
    float halfT = u_moveThickness * 0.5;

    if(region == 0) {
      float minX = 0.5 - halfT;
      float maxX = 0.5 + halfT;
      if(vUV.x > minX && vUV.x < maxX && vUV.y < p) {
        inMove = true;
        moveD = p - vUV.y;
      }
    } else if(region == 1) {
      float minX = 0.5 - halfT;
      float maxX = 0.5 + halfT;
      if(vUV.x > minX && vUV.x < maxX && vUV.y > 1.0 - p) {
        inMove = true;
        moveD = vUV.y - (1.0 - p);
      }
    } else if(region == 2) {
      float minY = 0.5 - halfT;
      float maxY = 0.5 + halfT;
      if(vUV.y > minY && vUV.y < maxY && vUV.x < p) {
        inMove = true;
        moveD = p - vUV.x;
      }
    } else {
      float minY = 0.5 - halfT;
      float maxY = 0.5 + halfT;
      if(vUV.y > minY && vUV.y < maxY && vUV.x > 1.0 - p) {
        inMove = true;
        moveD = vUV.x - (1.0 - p);
      }
    }
  }

  // --- CALCULATE FLASH BLOCK ---
  bool inFlash = false;
  float flashD = 0.0;
  if(u_flashActive > 0.5) {
    int region = int(u_region + 0.5);
    if(region == 0 && vUV.y < 0.5) {
      inFlash = true;
      flashD = 0.5 - vUV.y;
    } else if(region == 1 && vUV.y > 0.5) {
      inFlash = true;
      flashD = vUV.y - 0.5;
    } else if(region == 2 && vUV.x < 0.5) {
      inFlash = true;
      flashD = 0.5 - vUV.x;
    } else if(region == 3 && vUV.x > 0.5) {
      inFlash = true;
      flashD = vUV.x - 0.5;
    }
  }

  // --- CIRCLE IN CENTER ---
  bool inCircle = false;
  if(u_circleActive > 0.1) {
    float radius = u_radius1;                     // quarter-width circle
    vec2 center = vec2(0.5, 0.5);
 // aspect-corrected circle test
    vec2 diff = vUV - center;
    diff.x *= u_resolution.x / u_resolution.y;
    if(length(diff) < radius) {
      inCircle = true;
    }

  }

  // --- COMBINE WITH NEGATIVE BLEND ON OVERLAP ---
  if(inCircle && (inMove || inFlash)) {
    gl_FragColor = vec4(0.0);
    return;
  } else if(inMove) {
  // base gradient intensity at the leading edge
    float intensity = smoothstep(0.0, gradientWidth, moveD);

  // only when slicing is active
    if(u_sliceActive > 0.5) {
    // compute how many stripes fit exactly into the block
      float thickness = u_moveThickness;
      float stripes = floor(1.0 / thickness + 0.5);
    // normalized distance from the leading edge (0->1 across the block)
      float dn = moveD / thickness;
    // build the stripe pattern
      float pattern = sin(dn * stripes * 3.14159);
      float mask = step(0.0, pattern);
      intensity *= mask;
    }

  // add grain and output
    float g = grain(vUV);
    gl_FragColor = vec4(vec3(intensity ), 1.0);
    return;
  } else if(inFlash) {
    float intensity = smoothstep(0.0, gradientWidth, flashD);
    float g = grain(vUV);
    gl_FragColor = vec4(vec3(intensity ), 1.0);
    return;
  } else if(inCircle) {
  // compute distance from circle edge
    vec2 center = vec2(0.5, 0.5);
    float radius = u_radius2;
// aspect-corrected distance for gradient
    vec2 diff = vUV - center;
    diff.x *= u_resolution.x / u_resolution.y;
    float distToCenter = length(diff);
    float edgeDist = radius - distToCenter;

  // gradient falloff over gradientWidth
    float intensity = smoothstep(0.0, gradientWidth, edgeDist);

  // add film grain
    float g = grain(vUV);
    gl_FragColor = vec4(vec3(intensity ), 1.0);
    return;
  }

  // --- DEFAULT BLACK ---
  float g = grain(vUV);
  gl_FragColor = vec4(vec3(0.0,0.0,0.01), 1.0);
}
`;

  const POST_VERT = `attribute vec3 aPosition;
varying vec2 vUV;
void main() {
  vUV = aPosition.xy * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 1.0);
}
`;

  const POST_FRAG = `#ifdef GL_ES
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
`;

  const SOURCES = {
    'shader.vert': SHADER_VERT,
    'shader.frag': SHADER_FRAG,
    'post.vert': POST_VERT,
    'post.frag': POST_FRAG
  };

  function toDataUrl(src) {
    return 'data:text/plain;charset=utf-8,' + encodeURIComponent(src);
  }

  const origLoadShader = p5.prototype.loadShader;
  p5.prototype.loadShader = function (vert, frag, success, error) {
    const v = SOURCES[vert] ? toDataUrl(SOURCES[vert]) : vert;
    const f = SOURCES[frag] ? toDataUrl(SOURCES[frag]) : frag;
    return origLoadShader.call(this, v, f, success, error);
  };
})();
