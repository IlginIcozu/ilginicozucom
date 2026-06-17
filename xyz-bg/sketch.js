let sh; // our flash shader
let frameMod;
let aksak, aksakNoise, aksak2, envMult;
let notes, randomNote;
let sChooser, s;
let ellipseChooser;
let dirChooser;

let flashRegion = 0;
let flashTimer = 0;
let flashDuration = 5; // half-second at frameRate(30)

let moveRegion = 0;
let moveTimer = 0;
let moveDuration = 30; // frames (1 second at 30fps)

// Perc-scene state
let percTimer = 0;
let percDuration = 30; // frames
let percDir = 0; // 0 = L→R, 1 = R→L

let gridCols = 10;
let gridRows = 10;


let grad
// Audio objects (unchanged) …
let kickOsc, kickEnv, kickFilter;
let snareOsc, snareFilter;
let percOsc, percEnv, percFilter;
let percOsc2, percEnv2, percFilter2;
let noiseOsc, noiseOscFilter;
let synthOsc, synthFilter;
let pitchShifter;
let masterGain, highpf, lowpf, currentFilter = null;

let moveThickness = 0.2;
const minThickness = 0.25;
const maxThickness = 1.0;


let sliceActive = 0;
let sliceFreq = 10;
let sliceFreqMin = 5;
let sliceFreqMax = 20;
// Add:
// circle-on-synth state
let circleActive = false;
let circleTimeout = null;
let r1, r2 = 0.25

let sliceOrientation = 0; // 0 = perpendicular stripes, 1 = horizontal stripes

let showPercGrid = true;

// fraction of one cell that the wipe band occupies (0.0–1.0)
let gridThickness = 5.0;
let gradientdir = 0.0

let postSh, inversion = 0;

let coll = 0.0

let buffer; // offscreen buffer for first‐pass shader

// Post-process effect control variables (0 = off / neutral)

let pixelateScale = 10.0;
let pixelateAmt = 0;

let levels = 50.0;
let posterizeAmt = 0;

let brightPassThreshold = 0.8;
let brightPassAmt = 0;

let lineFreq = 600;
let lineIntensity = 5;
let scanlineAmt = 0;



let swirlStrength = 0.5;
let swirlAmt = 0;

let distortStrength = 1;
let distortAmt = 0;

let fishStrength = -0.5;
let fishAmt = 0;

let waveFreq = 50.0;
let waveAmp = 0.1;
let waveAmt = 0;

///sepia

//inversion

let embossAmt = 0;

let edgeAmt = 0;

let kaleidoSlices = 8;
let kaleidoAmt = 0;

let aberrationOffset = 4;
let aberrationAmt = 0;

let glitchAmp = 0.02;
let glitchAmt = 0;

//grain
let fr = 35

let cnv;
let dpr = 1;

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// iOS Safari can report weird heights because of the address bar.
// visualViewport is the most reliable when available.
function getViewportSize() {
  const vv = window.visualViewport;
  const w = Math.floor(vv ? vv.width : window.innerWidth);
  const h = Math.floor(vv ? vv.height : window.innerHeight);
  return { w, h };
}

function startAudioAndHideOverlay() {
  // start audio (must be user-gesture driven on mobile)
  if (typeof Tone !== "undefined" && Tone.context && Tone.context.state !== "running") {
    Tone.start().catch(() => {});
  }

  const overlay = document.getElementById("overlay");
  if (overlay) overlay.style.display = "none";
}



function preload() {
  sh = loadShader('shader.vert', 'shader.frag');
  postSh = loadShader('post.vert', 'post.frag');
}

function setup() {
  const vp = getViewportSize();

  // Critical on mobile: cap pixel density so WEBGL textures don't explode.
  // (Doesn't change your shader visuals/logic; it prevents GPU failure.)
  dpr = isMobileDevice() ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  pixelDensity(dpr);

  cnv = createCanvas(vp.w, vp.h, WEBGL);
  frameRate(fr);
  noStroke();

  // Prevent browser gestures/scroll from interrupting touches.
  cnv.elt.style.touchAction = "none";
  cnv.elt.style.webkitUserSelect = "none";
  cnv.elt.style.userSelect = "none";

  buffer = createGraphics(vp.w, vp.h, WEBGL);
  buffer.pixelDensity(dpr);
  buffer.noStroke();

  // Ensure the first tap anywhere (overlay or canvas) starts audio & hides overlay.
  document.addEventListener("pointerdown", startAudioAndHideOverlay, { once: true });

  // Keep canvas matching the *real* viewport when mobile browser UI changes.
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", windowResized);
    window.visualViewport.addEventListener("scroll", windowResized);
  }

  // --- your existing init below unchanged ---
  let r = random([0, 1, 2, 3]);

  frameMod = 64;
  aksak = 16;
  aksakNoise = 4;
  aksak2 = 32;
  envMult = 1;

  notes = ["D5", "F5", "A5", "D6"];
  randomNote = random(notes);

  audioSetup();
}

function draw() {
  // clear to black
  background(0);
  // frameRate(fr)

  if (flashTimer > 0) {
    flashTimer--;
  }

  if (moveTimer > 0) {
    moveTimer--;
  }


  if (percTimer > 0) {
    percTimer--;
  }



  if (frameCount % frameMod === 0) {

    // fr = random([30, 30, 35, 30, 30]);

    random() < 0.5 ? distortAmt = random() < 0.1 ? 1 : 0 : fishAmt = random() < 0.1 ? 1 : 0

    pixelateScale = random([width / 100, width / 50, width / 25]);

    pixelateAmt = random() < 0.1 ? 1 : 0

    levels = random([50, 25, 10, 5])
    posterizeAmt = random() < 0.1 ? 1 : 0

    aberrationOffset = random(1, 4, 10, 50, 20, 8);
    aberrationAmt = random() < 0.2 ? 1 : 0;


    lineFreq = height / random([1, 2, 5, 7, 10]);
    lineIntensity = random([1, 3, 5, 7, 10]);
    scanlineAmt = random() < 0.15 ? 1 : 0;

    glitchAmt = random() < 0.1 ? 1 : 0;

    edgeAmt = random([0, 0, 0, 0, 0, 0, 1])

    waveFreq = 50.0;
    waveAmp = 0.1;
    waveAmt = random() < 0.1 ? 1 : 0;

    coll = random([0.0, 0.0, 1.0, 0.0])

    embossAmt = random() < 0.1 ? 0 : 0;

    // coll = 1

    let minDim = min(width, height);
    sChooser = random([1.0, 2.0, 3.0]);
    ellipseChooser = random([0.0, 0.0, 1.0, 1.0]);
    // ellipseChooser = 1.0
    aksak = (frameMod === 25 ? random([1, 2]) : random([1, 2, 3, 4, 1, 2]));
    dirChooser = random([1.0, 2.0, 3.0]);

    if (sChooser === 1.0) s = random([minDim / 10, minDim / 5, minDim / 20, minDim / 10, minDim / 50]);
    else if (sChooser === 2.0) s = random([minDim / 50, minDim / 20, minDim / 50, minDim / 20]);
    else s = random([minDim / 10, minDim / 5, minDim / 10, minDim / 5]);

    randomNote = random(notes);
    aksak = random([16, 16, 16, 24, 24, 24, 24, 12, 8, 16, 16, 16]);
    // aksakNoise = random([4, 4, 4, 4, 4, 4, 4]);
    aksak2 = random([32, 16, 32, 16, 24, 24, 12, 12, 16, 32, 32, 32]);

    // envelope tweaks
    if (s === minDim / 50) {
      kickEnv.decay = 0.01;
      snareOsc.envelope.attack = 0.001;
      snareOsc.envelope.decay = 0.001;
      envMult = 5;
      percEnv.attack = 0.00005;
      percEnv.decay = 0.00002;
      percOsc.volume.value = 5;
      noiseOsc.volume.value = -18;
      snareOsc.volume.value = 5;
      randomNote = "A5";
    } else if (s === minDim / 20) {
      kickEnv.decay = 0.1;
      snareOsc.envelope.attack = 0.005;
      snareOsc.envelope.decay = 0.01;
      envMult = 2;
      percEnv.attack = 0.00005;
      percEnv.decay = 0.00002;
      percOsc.volume.value = 5;
      noiseOsc.volume.value = -20;
      snareOsc.volume.value = -3;
      randomNote = "D5";
    } else if (s === minDim / 10) {
      kickEnv.decay = 0.2;
      snareOsc.envelope.attack = 0.01;
      snareOsc.envelope.decay = 0.1;
      envMult = 1;
      percEnv.attack = 0.0005;
      percEnv.decay = 0.0002;
      percOsc.volume.value = -3;
      noiseOsc.volume.value = -22;
      snareOsc.volume.value = -9;
      randomNote = "A4";
    } else {
      kickEnv.decay = 0.2;
      snareOsc.envelope.attack = 0.01;
      snareOsc.envelope.decay = 0.1;
      envMult = 1;
      percEnv.attack = 0.0005;
      percEnv.decay = 0.0002;
      percOsc.volume.value = -3;
      noiseOsc.volume.value = -22;
      snareOsc.volume.value = -9;
      randomNote = "D4";
    }

    if (dirChooser === 1.0) {
      aksak = random([12, 8, 16, 16]);
      synthFilter.frequency = "16n";
    } else if (dirChooser === 2.0) {
      aksak = random([16, 16, 16, 12, 16, 16, 12]);
      synthFilter.frequency = "12n";
    } else {
      aksak = random([16, 16, 16, 24, 24, 24, 24]);
      synthFilter.frequency = "8n";
    }
  }

  if (Tone.context.state === "running") {


    if (frameCount % aksak === 0) {
      if (random() > 0.3) {
        kickEnv.triggerAttackRelease("8n");
        flashRegion = floor(random(4));
        flashTimer = flashDuration;
      } else {
        // start moving block instead of flash
        moveRegion = floor(random(4));
        moveDuration = random([30, 10, 20, 30, 20])
        moveTimer = moveDuration;
        moveThickness = random(minThickness, maxThickness);

        sliceActive = random() < 0.5 ? 1 : 0;
        sliceFreq = random(sliceFreqMin, sliceFreqMax);
        sliceOrientation = random() < 0.5 ? 0 : 1;
      }
    }



    if (frameCount % aksak2 === 0 && random() < 0.9) {
      snareOsc.triggerAttackRelease("8n");
      snareFilter.frequency.value = random(500, 800) * 4;

      inversion = random([0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0]);

    }

    if (frameCount % 4 === 0 && random() < 0.6) {
      percEnv.triggerAttackRelease("32n");
      percFilter.frequency.value = random(1000, 5000);
      // kick off the grid-columns scene

    }

    if (frameCount % 4 === 0 && random() < 0.1) {
      percDuration = random([30, 20, 10, 40, 50]);
      percTimer = percDuration;
      percDir = floor(random(4)); // 0=L→R, 1=R→L, 2=B→T, 3=T→B

      showPercGrid = random([true, false, false, false]);

      gradientdir = random([0.0, 1.0])

      gridCols = random([3, 5, 10, 15, 20])
      gridRows = random([3, 5, 10, 15, 20])
      // showPercGrid = true
    } else {
      showPercGrid = random([true, false, false, false]);
      // percDuration = 10
      // percTimer = percDuration;
      // percDir = floor(random(4));  // 0=L→R, 1=R→L, 2=B→T, 3=T→B
    }



    if (frameCount % aksakNoise === 0 && random() < 0.6) {
      noiseOsc.triggerAttackRelease("32n");
      let en = random([0.1, 0.1, 0.1, 0.9, 0.45, 0.1])
      noiseOsc.envelope.decay = en / envMult;

      if (en == 0.9) {
        // random() < 0.5 ? distortAmt = 1 : fishAmt = 1
        kaleidoSlices = random([8, 12,24])
        kaleidoAmt = 0//random() < 0.2 ? 1 : 0;
      } else {
        kaleidoAmt = 0
        // distortAmt = 0
        // fishAmt = 0
      }
    }
    let ec = random()
    if (ellipseChooser === 1.0 && frameCount % 4 === 0 && ec < 0.9) {
      synthOsc.triggerAttackRelease(randomNote, "32n");
      r1 = random([0.25, 0.5, 0.35])
      r2 = random([0.25, 0.5, 0.35])
    }

    if (ellipseChooser === 1.0 && ec < 0.9) {
      circleActive = true;
    } else {
      circleActive = false;
    }
  }

  inversion == 1.0 ? grad = 0.05 : grad = 0.8



  // update resolution uniform each frame so resizing works immediately
  buffer.shader(sh);
  sh.setUniform('u_time', millis() * 0.001);
  sh.setUniform('u_resolution', [width, height]);
  sh.setUniform('u_flashActive', flashTimer > 0 ? 1.0 : 0.0);
  sh.setUniform('u_region', flashRegion);

  sh.setUniform('u_moveActive', moveTimer > 0 ? 1.0 : 0.0);
  sh.setUniform('u_moveRegion', moveRegion);
  sh.setUniform('u_moveProgress', 1.0 - float(moveTimer) / float(moveDuration));
  sh.setUniform('u_moveThickness', moveThickness);

  sh.setUniform('u_sliceActive', sliceActive);
  sh.setUniform('u_sliceFreq', sliceFreq);
  sh.setUniform('u_sliceOrientation', sliceOrientation);

  sh.setUniform('u_circleActive', circleActive ? 1.0 : 0.0);

  sh.setUniform('u_radius1', r1);
  sh.setUniform('u_radius2', r2);

  sh.setUniform('u_percActive', percTimer > 0 ? 1.0 : 0.0);
  sh.setUniform('u_percProgress', 1.0 - percTimer / percDuration);
  sh.setUniform('u_percDir', percDir);
  sh.setUniform('u_gridCols', gridCols);
  sh.setUniform('u_gridRows', gridRows);
  sh.setUniform('u_percFade', 0.3); // try 0.2–0.4 for a subtler grid

  sh.setUniform('u_showPercGrid', showPercGrid ? 1.0 : 0.0);

  sh.setUniform('u_gridThickness', gridThickness);
  sh.setUniform('u_gradientdir', gradientdir);
  sh.setUniform('gradientWidth', grad);




  // draw full-screen quad
  buffer.quad(
    -width / 2, -height / 2,
    width / 2, -height / 2,
    width / 2, height / 2,
    -width / 2, height / 2
  );
  buffer.resetShader();

  // post-processing pass
  shader(postSh);
  postSh.setUniform('u_tex', buffer);
  postSh.setUniform('u_time', frameCount);
  postSh.setUniform('u_resolution', [width, height]);



  postSh.setUniform('u_inversionAmt', inversion);
  postSh.setUniform('u_sepiaAmt', coll);
  postSh.setUniform('u_levels', levels);
  postSh.setUniform('u_posterizeAmt', posterizeAmt);
  postSh.setUniform('u_aberrationOffset', aberrationOffset);
  postSh.setUniform('u_aberrationAmt', aberrationAmt);
  postSh.setUniform('u_lineFreq', lineFreq);
  postSh.setUniform('u_lineIntensity', lineIntensity);
  postSh.setUniform('u_scanlineAmt', scanlineAmt);
  postSh.setUniform('u_brightPassThreshold', brightPassThreshold);
  postSh.setUniform('u_brightPassAmt', brightPassAmt);
  postSh.setUniform('u_edgeAmt', edgeAmt);
  postSh.setUniform('u_embossAmt', embossAmt);
  postSh.setUniform('u_pixelateScale', pixelateScale);
  postSh.setUniform('u_pixelateAmt', pixelateAmt);
  postSh.setUniform('u_kaleidoSlices', kaleidoSlices);
  postSh.setUniform('u_kaleidoAmt', kaleidoAmt);
  postSh.setUniform('u_swirlStrength', swirlStrength);
  postSh.setUniform('u_swirlAmt', swirlAmt);
  postSh.setUniform('u_waveFreq', waveFreq);
  postSh.setUniform('u_waveAmp', waveAmp);
  postSh.setUniform('u_waveAmt', waveAmt);
  postSh.setUniform('u_distortStrength', distortStrength);
  postSh.setUniform('u_distortAmt', distortAmt);
  postSh.setUniform('u_fishStrength', fishStrength);
  postSh.setUniform('u_fishAmt', fishAmt);
  postSh.setUniform('u_glitchAmp', glitchAmp);
  postSh.setUniform('u_glitchAmt', glitchAmt);
  postSh.setUniform('u_grainAmt', 0.2);

  quad(
    -width / 2, -height / 2,
    width / 2, -height / 2,
    width / 2, height / 2,
    -width / 2, height / 2
  );
  resetShader();

}

function windowResized() {
  const vp = getViewportSize();

  // Keep logical size consistent
  resizeCanvas(vp.w, vp.h);

  // IMPORTANT: also resize the offscreen WEBGL buffer
  if (buffer) buffer.resizeCanvas(vp.w, vp.h);
}


function mousePressed() {
  startAudioAndHideOverlay();
}

function touchStarted() {
  startAudioAndHideOverlay();
  return false; // stop the browser from treating this as scroll/zoom
}

function touchMoved() {
  return false; // prevents page scrolling while interacting
}


// audioSetup() unchanged from your last version...
function audioSetup() {
  kickOsc = new Tone.Oscillator("B1", "sine").start();
  kickEnv = new Tone.AmplitudeEnvelope({
    attack: 0.001,
    decay: 0.2,
    sustain: 0,
    release: 0.1
  });
  kickFilter = new Tone.Filter({
    frequency: 100,
    type: "lowpass",
    rolloff: -24
  });
  kickOsc.connect(kickFilter);
  kickFilter.connect(kickEnv);

  snareOsc = new Tone.NoiseSynth({
    noise: {
      type: "white"
    },
    envelope: {
      attack: 0.005,
      decay: 0.01,
      sustain: 0,
      release: 1
    }
  });
  snareFilter = new Tone.Filter({
    frequency: 1500,
    type: "bandpass",
    rolloff: -12,
    Q: 1
  });
  snareOsc.volume.value = -9;
  snareOsc.connect(snareFilter);

  percOsc = new Tone.Oscillator("G3", "triangle").start();
  percEnv = new Tone.AmplitudeEnvelope({
    attack: 0.0005,
    decay: 0.0002,
    sustain: 0,
    release: 0.1
  });
  percFilter = new Tone.Filter({
    frequency: 1200,
    type: "lowpass",
    rolloff: -24
  });
  percOsc.volume.value = 3;
  percOsc.connect(percFilter);
  percFilter.connect(percEnv);

  percOsc2 = new Tone.Oscillator("G5", "sawtooth").start();
  percEnv2 = new Tone.AmplitudeEnvelope({
    attack: 0.005,
    decay: 0.002,
    sustain: 0,
    release: 0.01
  });
  percFilter2 = new Tone.Filter({
    frequency: 6200,
    type: "highpass",
    rolloff: -24
  });
  percOsc2.volume.value = -4;
  percOsc2.connect(percFilter2);
  percFilter2.connect(percEnv2);

  noiseOsc = new Tone.NoiseSynth({
    noise: {
      type: "white"
    },
    envelope: {
      attack: 0.0005,
      decay: 0.1,
      sustain: 0,
      release: 1
    }
  });
  noiseOscFilter = new Tone.Filter({
    frequency: 15000,
    type: "lowpass",
    rolloff: -12,
    Q: 1
  });
  noiseOsc.volume.value = -22;
  noiseOsc.connect(noiseOscFilter);

  synthOsc = new Tone.DuoSynth({
    voice0: {
      oscillator: {
        type: "sine"
      },
      envelope: {
        attack: 0.005,
        decay: 0.0005,
        sustain: 0,
        release: 1.5
      }
    },
    voice1: {
      oscillator: {
        type: "triangle"
      },
      envelope: {
        attack: 0.001,
        decay: 0.001,
        sustain: 0,
        release: 1.0
      }
    }
  });
  synthFilter = new Tone.AutoFilter({
    frequency: "8n",
    depth: 1,
    baseFrequency: 100,
    octaves: 4,
    filter: {
      type: "lowpass",
      rolloff: -24,
      Q: 1
    }
  }).start();
  synthOsc.volume.value = -18;
  synthFilter.type = "sine";
  synthOsc.connect(synthFilter);

  pitchShifter = new Tone.PitchShift({
    pitch: 24,
    windowSize: 0.5,
    delayTime: 0.01,
    feedback: 0.01
  });

  const reverb = new Tone.Reverb({
    decay: 2,
    preDelay: 0.01,
    wet: 0.5
  });
  synthFilter.connect(reverb);
  reverb.toDestination();

  highpf = new Tone.Filter({
    frequency: 1000,
    type: "highpass",
    rolloff: -24
  }).toDestination();
  lowpf = new Tone.Filter({
    frequency: 500,
    type: "lowpass",
    rolloff: -24
  }).toDestination();
  masterGain = new Tone.Gain().toDestination();

  kickEnv.connect(masterGain);
  snareFilter.connect(masterGain);
  percEnv.connect(masterGain);
  percEnv2.connect(masterGain);
  noiseOscFilter.connect(masterGain);
  synthFilter.connect(masterGain);
}

