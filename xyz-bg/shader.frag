#ifdef GL_ES
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

// simple per‐pixel film grain: centered on zero, ±0.1 max
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

  // Horizontal scans (L→R or R→L)
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
  // Vertical scans (B→T or T→B)
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
    float radius = u_radius1;                     // quarter‐width circle
    vec2 center = vec2(0.5, 0.5);
 // aspect-corrected circle test
    vec2 diff = vUV - center;
    diff.x *= u_resolution.x / u_resolution.y;
    if(length(diff) < radius) {
      inCircle = true;
    }

  }

// --- PERC-GRID SCENE: negative-blend 4-direction scan ---
// if (u_percActive > 0.5) {
//   int dir   = int(u_percDir + 0.5);
//   int cols  = int(u_gridCols + 0.5);
//   int rows  = int(u_gridRows  + 0.5);
//   float prog = u_percProgress * float((dir < 2) ? cols : rows);
//   int idx    = int(floor(prog));
//   float frac = fract(prog);

//   bool isLit = false;
//   float fadeVal = 0.0;

//   // Horizontal scans
//   if (dir == 0 || dir == 1) {
//     float cellW = 1.0 / float(cols);
//     int   col   = int(floor(vUV.x * float(cols)));
//     if ( (dir == 0 && col == idx)
//       || (dir == 1 && col == cols - idx - 1) ) {
//       isLit = true;
//       // vertical gradient
//       fadeVal = 1.0 - smoothstep(1.0 - gradientWidth, 1.0, vUV.y);
//     }
//   }
//   // Vertical scans
//   else {
//     float cellH = 1.0 / float(rows);
//     int   row   = int(floor(vUV.y * float(rows)));
//     if ( (dir == 2 && row == idx)
//       || (dir == 3 && row == rows - idx - 1) ) {
//       isLit = true;
//       // horizontal gradient
//       fadeVal = 1.0 - smoothstep(1.0 - gradientWidth, 1.0, vUV.x);
//     }
//   }

//   if (isLit) {
//     // negative-blend over move/flash/circle
//     if (inMove || inFlash || inCircle) {
//       gl_FragColor = vec4(0.0);
//       return;
//     }
//     float g = grain(vUV);
//     gl_FragColor = vec4(vec3(fadeVal + g), 1.0);
//     return;
//   }
// }
// fall through to move/flash/circle when u_percActive == 0.5


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
    // normalized distance from the leading edge (0→1 across the block)
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
