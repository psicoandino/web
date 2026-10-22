(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.PsicoCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const TAU = Math.PI * 2;
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function fract(v) { return v - Math.floor(v); }
  function smoothstep(a, b, x) {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function smootherstep(a, b, x) {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mix32(x) {
    x = (x + 0x9e3779b9) >>> 0;
    x ^= x >>> 16;
    x = Math.imul(x, 0x21f0aaad);
    x ^= x >>> 15;
    x = Math.imul(x, 0x735a2d97);
    x ^= x >>> 15;
    return x >>> 0;
  }

  function hashFloat(seed, a, b, c) {
    let h = seed >>> 0;
    h = mix32(h ^ Math.imul((a | 0) + 1, 0x85ebca6b));
    h = mix32(h ^ Math.imul((b | 0) + 1, 0xc2b2ae35));
    h = mix32(h ^ Math.imul((c | 0) + 1, 0x27d4eb2f));
    return h / 4294967296;
  }

  function XorShift32(seed) { this.state = (seed || 1) >>> 0; }
  XorShift32.prototype.nextUint = function () {
    let x = this.state;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  };
  XorShift32.prototype.next = function () { return this.nextUint() / 4294967296; };
  XorShift32.prototype.range = function (a, b) { return lerp(a, b, this.next()); };

  function fade(t) { return t * t * (3 - 2 * t); }
  function valueNoise3(x, y, z, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const tx = fade(x - xi), ty = fade(y - yi), tz = fade(z - zi);
    function v(dx, dy, dz) { return hashFloat(seed, xi + dx, yi + dy, zi + dz) * 2 - 1; }
    const x00 = lerp(v(0,0,0), v(1,0,0), tx);
    const x10 = lerp(v(0,1,0), v(1,1,0), tx);
    const x01 = lerp(v(0,0,1), v(1,0,1), tx);
    const x11 = lerp(v(0,1,1), v(1,1,1), tx);
    return lerp(lerp(x00, x10, ty), lerp(x01, x11, ty), tz);
  }

  function fbm3(x, y, z, seed, octaves) {
    let amp = 0.58, freq = 1, sum = 0, norm = 0;
    const n = octaves || 3;
    for (let i = 0; i < n; i++) {
      sum += valueNoise3(x * freq, y * freq, z * freq, mix32(seed + i * 977)) * amp;
      norm += amp;
      freq *= 1.97;
      amp *= 0.49;
    }
    return sum / norm;
  }

  // Eight 30-second movements. The final movement spends its last third returning
  // particles to the opening field so the 240-second cycle can close quietly.
  const SCENES = [
    { name: "currents",   start:   0, end:  30, kind: "currents" },
    { name: "magnetism",  start:  30, end:  60, kind: "magnetism" },
    { name: "terrain",    start:  60, end:  90, kind: "terrain" },
    { name: "growth",     start:  90, end: 120, kind: "growth" },
    { name: "paradigm",   start: 120, end: 150, kind: "paradigm" },
    { name: "time",       start: 150, end: 180, kind: "time" },
    { name: "unknown",    start: 180, end: 210, kind: "unknown" },
    { name: "presences",  start: 210, end: 240, kind: "presences" }
  ];

  function sceneAt(seconds, cycleSeconds) {
    const cycle = cycleSeconds || 240;
    const t = ((seconds % cycle) + cycle) % cycle;
    const u = t * 240 / cycle;
    let scene = SCENES[0], index = 0;
    for (let i = 0; i < SCENES.length; i++) {
      if (u >= SCENES[i].start && u < SCENES[i].end) { scene = SCENES[i]; index = i; break; }
    }
    const local = (u - scene.start) / (scene.end - scene.start);
    return { scene, index, local: clamp(local, 0, 1), canonicalTime: u };
  }

  function envelope(local, edge) {
    const e = edge == null ? 0.14 : edge;
    return smoothstep(0, e, local) * (1 - smoothstep(1 - e, 1, local));
  }

  // Stable stream ecology: particles move along a family of persistent currents.
  function streamTarget(p, time) {
    const lane = Math.min(8, Math.floor(p.anchorA * 9));
    const direction = (lane === 1 || lane === 4 || lane === 7) ? -1 : 1;
    const speed = 0.0048 + 0.0040 * p.weight;
    let u = fract(p.anchorB + direction * time * speed + lane * 0.041);
    if (direction < 0) u = 1 - u;

    const defs = [
      [0.09,  0.09, 0.040, 1.20], [0.18, -0.10, 0.050, 1.55],
      [0.30,  0.15, 0.055, 0.86], [0.42, -0.13, 0.050, 1.26],
      [0.54,  0.17, 0.055, 0.96], [0.65, -0.12, 0.048, 1.48],
      [0.76,  0.09, 0.052, 1.05], [0.86, -0.08, 0.042, 1.73],
      [0.94,  0.04, 0.026, 1.31]
    ];
    const d = defs[lane];
    const phase = p.phase * 0.19;
    let x = 0.018 + u * 0.964;
    let y = d[0] + d[1] * (u - 0.5);
    y += d[2] * Math.sin(TAU * (u * d[3]) + phase + time * (0.040 + lane * 0.004));
    y += 0.012 * Math.sin(TAU * (u * 2.35 - lane * 0.071) - time * 0.061);
    y += Math.sin(time * 0.09 + lane * 0.73) * 0.010;
    const width = 0.012 + 0.026 * (0.5 + 0.5 * Math.sin(TAU * u + lane * 0.7));
    y += (p.anchorC - 0.5) * width;
    x += Math.sin(time * 0.14 + p.phase2) * 0.0030 * (0.3 + p.weight);
    return { x, y: clamp(y, 0.015, 0.985), strength: p.eligible < 0.955 ? 1 : 0, palette: -1, role: "stream" };
  }

  const POLE_BASES = [
    [0.20,0.31], [0.37,0.68], [0.54,0.37], [0.70,0.66], [0.82,0.33]
  ];
  function poleCenter(group, time) {
    const b = POLE_BASES[group % 5];
    return {
      x: b[0] + Math.sin(time * (0.043 + group*0.003) + group) * 0.018,
      y: b[1] + Math.cos(time * (0.037 + group*0.004) + group*1.7) * 0.015
    };
  }

  function magnetismTarget(p, time) {
    if (p.eligible >= 0.90) return { x:p.x, y:p.y, strength:0, palette:-1, role:"free" };
    const g = p.group % 5, c = poleCenter(g, time);
    const theta = TAU * p.anchorB + time * (0.052 + g*0.004) * (g%2 ? -1 : 1) + p.phase*0.22;
    const shell = 0.025 + Math.pow(p.anchorC, 1.35) * (0.085 + g*0.006);
    const breathing = 1 + 0.12 * Math.sin(time*0.31 + p.phase2);
    let x = c.x + Math.cos(theta) * shell * breathing;
    let y = c.y + Math.sin(theta) * shell * (0.54 + 0.07*g) * breathing;
    // Field-line pinch: gives loops a magnetic rather than circular silhouette.
    const pinch = Math.cos(theta*2) * 0.018 * (0.3 + p.anchorC);
    x += Math.cos(theta) * pinch;
    y -= Math.sin(theta) * pinch * 0.55;
    return { x, y, strength:1, palette:g, role:"magnet" };
  }

  function gaussian(x, mu, sigma) {
    const d = (x-mu)/sigma;
    return Math.exp(-0.5*d*d);
  }

  function terrainHeight(x, time, seed) {
    const drift = time * 0.0022;
    const n = fbm3(x*3.8 + drift, 0.33, 0.12, mix32(seed ^ 0x7410), 4);
    const fine = fbm3(x*10.5 - drift*0.7, 1.1, 0.44, mix32(seed ^ 0x317), 3);
    const peaks = 0.17*gaussian(x,0.26,0.085) + 0.115*gaussian(x,0.50,0.115) + 0.145*gaussian(x,0.74,0.075);
    return clamp(0.64 - peaks - n*0.052 - fine*0.018, 0.30, 0.72);
  }

  function terrainTarget(p, time, seed) {
    const x = 0.018 + 0.964 * p.anchorB;
    const h = terrainHeight(x, time, seed);
    if (p.eligible < 0.64) {
      const bands = 23;
      const band = Math.floor(p.anchorC * bands) / (bands-1);
      let y = h + band * (0.985 - h);
      y += Math.sin(x*34 + p.phase + time*0.035) * 0.0025 * (0.2 + band);
      return { x, y, strength:1, palette: p.group===1 && band<0.16 ? 1 : -1, role:"ground" };
    }
    if (p.eligible < 0.82) {
      const y = h + (p.anchorC-0.5)*0.025 + Math.sin(time*0.13+p.phase)*0.003;
      return { x, y, strength:1, palette: p.group===0 ? 0 : -1, role:"ridge" };
    }
    if (p.eligible < 0.91) {
      // Sparse cloud/island clusters echo the reference without copying it.
      const cluster = Math.floor(p.anchorA*4);
      const cx = [0.16,0.39,0.66,0.86][cluster];
      const cy = [0.22,0.34,0.18,0.31][cluster];
      const a = TAU*p.anchorB + p.phase*0.08;
      const r = 0.018 + 0.060*Math.sqrt(p.anchorC);
      return { x:cx+Math.cos(a)*r, y:cy+Math.sin(a)*r*0.42, strength:1, palette:-1, role:"cloud" };
    }
    return { x:p.x, y:p.y, strength:0, palette:-1, role:"free" };
  }

  function makeGrowthSegments() {
    const segs = [];
    function branch(x, y, angle, len, depth, path) {
      if (depth < 0 || len < 0.018) return;
      const x2 = x + Math.cos(angle)*len;
      const y2 = y + Math.sin(angle)*len;
      segs.push({x1:x,y1:y,x2,y2,depth,birth:1-depth/6,path});
      if (depth === 0) return;
      const asym = ((path*17 + depth*13) % 11 - 5) * 0.006;
      branch(x2,y2,angle-0.43+asym,len*0.74,depth-1,path*2+1);
      branch(x2,y2,angle+0.51-asym,len*0.71,depth-1,path*2+2);
      if (depth===4 || depth===2) branch(x2,y2,angle+0.05,len*0.58,depth-1,path*3+7);
    }
    branch(0.50,0.97,-Math.PI/2,0.19,6,1);
    return segs;
  }
  const GROWTH_SEGMENTS = makeGrowthSegments();

  function growthTarget(p, time, local) {
    if (p.eligible >= 0.91) return {x:p.x,y:p.y,strength:0,palette:-1,role:"free"};
    const idx = Math.floor(p.anchorA * GROWTH_SEGMENTS.length) % GROWTH_SEGMENTS.length;
    const s = GROWTH_SEGMENTS[idx];
    const grow = smootherstep(0.04,0.62,local);
    if (s.birth > grow + 0.08) {
      // Not-yet-grown particles wait in the root field rather than teleporting.
      return {x:0.50+(p.anchorB-0.5)*0.10, y:0.94+(p.anchorC-0.5)*0.025, strength:0.65, palette:-1, role:"root"};
    }
    const u = p.anchorB;
    let x = lerp(s.x1,s.x2,u), y = lerp(s.y1,s.y2,u);
    const dx=s.x2-s.x1, dy=s.y2-s.y1, mag=Math.max(0.001,Math.hypot(dx,dy));
    const nx=-dy/mag, ny=dx/mag;
    const width=(0.010 + 0.010*(s.depth/6))*(p.anchorC-0.5);
    x += nx*width; y += ny*width;
    const sway = Math.sin(time*0.33 + s.path*0.71 + u*2.4) * (0.0015 + (6-s.depth)*0.0008);
    x += sway; y += Math.cos(time*0.27+s.path)*sway*0.35;
    const palette = s.depth <= 1 && p.anchorC > 0.58 ? 1 : (s.depth===2 && p.group===2 ? 2 : -1);
    return {x,y,strength:1,palette,role:s.depth<=1?"leaf":"branch"};
  }

  const FONT5 = {
    A:["01110","10001","10001","11111","10001","10001","10001"],
    C:["01111","10000","10000","10000","10000","10000","01111"],
    D:["11110","10001","10001","10001","10001","10001","11110"],
    E:["11111","10000","10000","11110","10000","10000","11111"],
    I:["11111","00100","00100","00100","00100","00100","11111"],
    K:["10001","10010","10100","11000","10100","10010","10001"],
    M:["10001","11011","10101","10101","10001","10001","10001"],
    N:["10001","11001","10101","10011","10001","10001","10001"],
    O:["01110","10001","10001","10001","10001","10001","01110"],
    P:["11110","10001","10001","11110","10000","10000","10000"],
    R:["11110","10001","10001","11110","10100","10010","10001"],
    S:["01111","10000","10000","01110","00001","00001","11110"],
    T:["11111","00100","00100","00100","00100","00100","00100"],
    U:["10001","10001","10001","10001","10001","10001","01110"],
    W:["10001","10001","10001","10101","10101","10101","01010"]
  };
  const WORD_CACHE = {};
  function wordCells(word) {
    if (WORD_CACHE[word]) return WORD_CACHE[word];
    const cells=[]; let xoff=0;
    for (const ch of word) {
      const rows=FONT5[ch] || FONT5.E;
      for(let y=0;y<7;y++) for(let x=0;x<5;x++) if(rows[y][x]==="1") cells.push([xoff+x,y]);
      xoff += 6;
    }
    const width=Math.max(1,xoff-1);
    const out={cells,width,height:7}; WORD_CACHE[word]=out; return out;
  }
  function wordTarget(p, word, cx, cy, scale, time) {
    const data=wordCells(word), cell=data.cells[p.id % data.cells.length];
    const jitterX=(p.anchorC-0.5)*scale*0.42, jitterY=(p.anchorD-0.5)*scale*0.42;
    const w=data.width*scale, h=data.height*scale;
    const x=cx-w/2+(cell[0]+0.5)*scale+jitterX+Math.sin(time*0.9+p.phase)*scale*0.08;
    const y=cy-h/2+(cell[1]+0.5)*scale+jitterY+Math.cos(time*0.73+p.phase2)*scale*0.07;
    return {x,y};
  }

  function paradigmTarget(p, time, local) {
    const wordPhase = envelope(clamp((local-0.08)/0.52,0,1),0.22);
    if (p.eligible < 0.20 && local < 0.69) {
      const w=wordTarget(p,"SCIENCE",0.50,0.25,0.0124,time);
      return {x:w.x,y:w.y,strength:0.65+0.35*wordPhase,palette:-1,role:"word"};
    }
    if (p.eligible >= 0.94) return {x:p.x,y:p.y,strength:0,palette:-1,role:"free"};
    const cols=68, rows=27;
    const col=Math.floor(p.anchorB*cols), row=Math.floor(p.anchorC*rows);
    let x=0.055+(col/(cols-1))*0.89;
    let y=0.34+(row/(rows-1))*0.56;
    x += (p.anchorD-0.5)*0.004; y += (p.anchorA-0.5)*0.0035;
    const anomaly=smootherstep(0.43,0.78,local);
    const cx=0.59+Math.sin(time*0.11)*0.035, cy=0.60+Math.cos(time*0.09)*0.022;
    const dx=x-cx,dy=y-cy,d=Math.max(0.002,Math.hypot(dx,dy));
    const radius=0.05+0.19*anomaly;
    if(d<radius*1.55){
      const wave=Math.sin((d/radius)*Math.PI*3-time*1.4)*0.010*anomaly;
      x += (dx/d)*(radius-d)*0.36*anomaly - (dy/d)*wave;
      y += (dy/d)*(radius-d)*0.28*anomaly + (dx/d)*wave;
    }
    const palette=(d<radius*0.95 && p.group===3)?3:((d<radius*1.28 && p.group===4)?4:-1);
    return {x,y,strength:1,palette,role:palette>=0?"anomaly":"grid"};
  }

  function timeTarget(p, time, local) {
    if (p.eligible >= 0.92) return {x:p.x,y:p.y,strength:0,palette:-1,role:"free"};
    if (p.eligible < 0.16 && local > 0.56 && local < 0.90) {
      const w=wordTarget(p,"TIME",0.50,0.51,0.021,time);
      return {x:w.x,y:w.y,strength:smoothstep(0.56,0.68,local)*(1-smoothstep(0.84,0.90,local)),palette:2,role:"word"};
    }
    const r=0.035+0.43*Math.sqrt(p.anchorB);
    const base=p.id*GOLDEN_ANGLE + p.phase*0.055;
    const motion=1-smootherstep(0.48,0.74,local);
    const theta=base + time*0.12*motion + Math.sin(time*0.08+p.phase2)*0.10;
    let x=0.50+Math.cos(theta)*r;
    let y=0.52+Math.sin(theta)*r*0.54;
    y += Math.sin(r*52-time*0.26)*0.004*(0.2+motion);
    return {x,y,strength:1,palette:(p.group===0&&p.anchorC>0.74)?0:-1,role:motion>0.35?"flow":"equilibrium"};
  }

  function unknownVoid(local) {
    const rise=smootherstep(0.08,0.30,local), fall=1-smootherstep(0.82,0.98,local), a=clamp(rise*fall,0,1);
    return { amount:a, cx:0.50, cy:0.515, w:lerp(0.012,0.42,a), h:lerp(0.08,0.27,a) };
  }

  function unknownTarget(p, time, local) {
    const vr=unknownVoid(local);
    if (p.eligible < 0.16 && vr.amount > 0.25) {
      const w=wordTarget(p,"UNKNOWN",vr.cx,vr.cy,0.0172,time);
      return {x:w.x,y:w.y,strength:vr.amount,palette:6,role:"unknown-word"}; // palette 6 = hueso special
    }
    // Everyone else tends to a breathing orbit around the absence.
    const theta=TAU*p.anchorB + time*(0.028 + p.weight*0.012)*(p.group%2?-1:1);
    const ring=0.24 + 0.16*p.anchorC;
    const x=vr.cx+Math.cos(theta)*ring;
    const y=vr.cy+Math.sin(theta)*ring*0.43;
    return {x,y,strength:0.82*vr.amount,palette:(p.group===4&&p.anchorC>0.86)?4:-1,role:"orbit"};
  }

  function shapePoint(group, p) {
    const u=p.anchorB, v=p.anchorC;
    if(group===0){ // • filled dot
      const r=0.045*Math.sqrt(u), a=TAU*v; return [Math.cos(a)*r,Math.sin(a)*r];
    }
    if(group===1){ // ▬ bar
      return [(u-0.5)*0.14,(v-0.5)*0.045];
    }
    if(group===2){ // ▲ filled triangle via folded barycentric coordinates
      let a=u,b=v;if(a+b>1){a=1-a;b=1-b;}
      const x=(-0.07)*(1-a-b)+(0.07)*a+0*b;
      const y=(0.052)*(1-a-b)+(0.052)*a+(-0.070)*b;
      return [x,y];
    }
    if(group===3){ // ■ square
      return [(u-0.5)*0.105,(v-0.5)*0.105];
    }
    // ● ring
    const a=TAU*u, r=0.060+(v-0.5)*0.014; return [Math.cos(a)*r,Math.sin(a)*r];
  }

  function presencesTarget(p, time, local) {
    // Last third returns to opening currents for a continuous cycle.
    const back=smootherstep(0.68,0.98,local);
    if(back>0){
      const s=streamTarget(p,0);
      return {x:lerp(p.x,s.x,back),y:lerp(p.y,s.y,back),strength:0.65+0.35*back,palette:-1,role:"return"};
    }
    if (p.eligible >= 0.72) return streamTarget(p,time*0.32);
    const centers=[[0.18,0.44],[0.34,0.65],[0.52,0.35],[0.68,0.62],[0.82,0.41]];
    const g=p.group%5,c=centers[g],q=shapePoint(g,p);
    const breathe=1+0.06*Math.sin(time*0.46+p.phase);
    const x=c[0]+q[0]*breathe+Math.sin(time*0.82+p.phase2)*0.0025;
    const y=c[1]+q[1]*breathe+Math.cos(time*0.68+p.phase)*0.0020;
    return {x,y,strength:1,palette:g,role:"presence"};
  }


  // --- v0.3 additive refinement layer --------------------------------------
  // The v0.2 targetFor()/sceneForce() functions below remain untouched.
  // Refined mode composes extra laws on top and can always be bypassed.

  function ridgedFbm3(x,y,z,seed,octaves) {
    let amp=0.58,freq=1,sum=0,norm=0;
    const n=octaves||4;
    for(let i=0;i<n;i++){
      let r=1-Math.abs(valueNoise3(x*freq,y*freq,z*freq,mix32(seed+i*1223)));
      r*=r;
      sum+=r*amp; norm+=amp; freq*=2.03; amp*=0.48;
    }
    return sum/Math.max(norm,1e-9);
  }

  function domainWarp2(x,y,time,seed) {
    const t=time*0.006;
    const qx=fbm3(x*0.86+1.7,y*0.86-2.1,t,mix32(seed^0x91e10da5),3);
    const qy=fbm3(x*0.86-3.4,y*0.86+0.8,t,mix32(seed^0x43f62b17),3);
    const rx=fbm3(x*1.31+qx*1.55,y*1.31+qy*1.55,t*0.73,mix32(seed^0x7a2d41f3),3);
    const ry=fbm3(x*1.31-qy*1.37,y*1.31+qx*1.37,t*0.73,mix32(seed^0x13b59a2d),3);
    return {x:x+qx*0.19+rx*0.085,y:y+qy*0.19+ry*0.085,qx,qy};
  }

  function refinedCurrentTarget(p,time,seed) {
    const b=streamTarget(p,time);
    if(!b.strength) return b;
    const lane=Math.min(8,Math.floor(p.anchorA*9));
    const w=fbm3(b.x*3.7,b.y*4.1,time*0.012,mix32((seed||1)^0x5eeda11),3);
    const braid=Math.sin(time*0.105+p.phase+lane*1.37)*0.0035*(0.35+p.weight);
    return {
      x:b.x + w*0.008 + braid,
      y:clamp(b.y + Math.cos(time*0.083+p.phase2)*0.0032 + w*0.004,0.012,0.988),
      strength:b.strength,palette:-1,role:"stream"
    };
  }

  function bezier2(a,b,c,u) {
    const v=1-u;
    return v*v*a+2*v*u*b+u*u*c;
  }

  function refinedMagnetismTarget(p,time) {
    if(p.eligible>=0.93) return {x:p.x,y:p.y,strength:0,palette:-1,role:"free"};
    const g=p.group%5;
    // A minority becomes connective field-lines between poles: visible relation,
    // not a separate object. The rest retains the v0.2 orbital ecology.
    if(p.eligible<0.26){
      const a=poleCenter(g,time), h=(g+1+(p.id%2))%5, b=poleCenter(h,time);
      const u=p.anchorB;
      const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(0.001,Math.hypot(dx,dy));
      const nx=-dy/d,ny=dx/d;
      const bow=(0.035+0.085*p.anchorC)*(p.id%2?-1:1);
      const mx=(a.x+b.x)*0.5+nx*bow+Math.sin(time*0.07+p.phase)*0.008;
      const my=(a.y+b.y)*0.5+ny*bow+Math.cos(time*0.061+p.phase2)*0.006;
      return {
        x:bezier2(a.x,mx,b.x,u),y:bezier2(a.y,my,b.y,u),strength:1,
        palette:p.anchorD>0.56?g:-1,role:"filament"
      };
    }
    const b=magnetismTarget(p,time);
    const theta=TAU*p.anchorB+time*0.031*(g%2?-1:1);
    b.x+=Math.sin(theta*2+p.phase)*0.0055;
    b.y+=Math.cos(theta*3+p.phase2)*0.0038;
    return b;
  }

  function refinedTerrainHeight(x,time,seed) {
    const w=domainWarp2(x*3.15,0.47,time,mix32(seed^0x17aa42));
    const ridge=ridgedFbm3(w.x,w.y,time*0.0028,mix32(seed^0x74ee91),5);
    const macro=fbm3(x*2.35+time*0.0011,0.71,time*0.0018,mix32(seed^0x553a71),4);
    const fine=fbm3(w.x*2.55,w.y*2.20,time*0.004,mix32(seed^0xa17311),3);
    const namedPeaks=0.105*gaussian(x,0.18,0.078)+0.165*gaussian(x,0.43,0.105)+0.125*gaussian(x,0.71,0.085)+0.070*gaussian(x,0.87,0.055);
    return clamp(0.705-namedPeaks-ridge*0.165-macro*0.042-fine*0.018,0.255,0.735);
  }

  function refinedTerrainTarget(p,time,seed) {
    const x=0.012+0.976*p.anchorB;
    const h=refinedTerrainHeight(x,time,seed||1);
    if(p.eligible<0.66){
      const bands=30, band=Math.floor(p.anchorC*bands)/(bands-1);
      let y=h+band*(0.992-h);
      const warp=fbm3(x*12.5,band*5.2,time*0.006,mix32((seed||1)^0x20017),2);
      y+=warp*0.006*(0.28+band);
      const vein=Math.abs(fbm3(x*18.0,band*8.0,time*0.002,mix32((seed||1)^0x8d719),2));
      const mineral=band>0.12&&band<0.78&&vein>0.56&&p.anchorD>0.48;
      return {x,y,strength:1,palette:mineral?(p.group%5):-1,role:mineral?"vein":"ground"};
    }
    if(p.eligible<0.84){
      const contour=(p.anchorC-0.5)*0.031;
      return {x,y:h+contour+Math.sin(time*0.09+p.phase)*0.0026,strength:1,palette:-1,role:"ridge"};
    }
    if(p.eligible<0.94){
      // Suspended formations are deterministic islands/clouds, not random dust.
      const cluster=Math.floor(p.anchorA*5);
      const cx=[0.10,0.28,0.50,0.72,0.90][cluster];
      const cy=[0.24,0.16,0.31,0.20,0.34][cluster];
      const a=TAU*p.anchorB+p.phase*0.035+time*0.009*(cluster%2?-1:1);
      const r=(0.015+0.073*Math.sqrt(p.anchorC))*(1+0.10*Math.sin(time*0.11+cluster));
      return {x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r*0.34,strength:1,palette:-1,role:"cloud"};
    }
    return {x:p.x,y:p.y,strength:0,palette:-1,role:"free"};
  }

  function refinedGrowthTarget(p,time,local) {
    const b=growthTarget(p,time,local);
    if(b.role==="branch"||b.role==="leaf"){
      // Weak phototropism/tropism: the recursive form remains, but it leans and breathes.
      const tropism=(1-p.anchorC)*0.007*smootherstep(0.18,0.78,local);
      b.x+=Math.sin(time*0.16+p.phase2)*tropism;
      b.y-=tropism*0.55;
    }
    return b;
  }

  function refinedParadigmTarget(p,time,local) {
    const b=paradigmTarget(p,time,local);
    if(b.role==="grid"&&local>0.45){
      const fault=fbm3(b.x*7.0,b.y*6.0,time*0.009,mix32(0x51c13e^p.group),2);
      if(Math.abs(fault)<0.055&&p.anchorD>0.28){
        b.x+=Math.sin(time*0.31+p.phase)*0.006;
        b.y+=Math.cos(time*0.27+p.phase2)*0.004;
        b.role="fault";
        if(p.group===3||p.group===4)b.palette=p.group;
      }
    }
    return b;
  }

  function refinedTimeTarget(p,time,local) {
    const b=timeTarget(p,time,local);
    if(b.role==="flow"){
      // Lag rings make the sequential nature visible without adding a new object.
      const lag=Math.floor(p.anchorC*7)/7;
      const a=time*(0.035+lag*0.045)+p.phase;
      b.x+=Math.cos(a)*0.0045*(1-lag);
      b.y+=Math.sin(a)*0.0030*(1-lag);
    }
    return b;
  }

  function refinedUnknownTarget(p,time,local) {
    const b=unknownTarget(p,time,local), vr=unknownVoid(local);
    if(b.role==="orbit"&&vr.amount>0.18){
      const dx=b.x-vr.cx,dy=b.y-vr.cy,d=Math.max(0.02,Math.hypot(dx,dy));
      const lens=Math.sin(time*0.17+p.phase)*0.0045*vr.amount;
      b.x+=(-dy/d)*lens; b.y+=(dx/d)*lens*0.72;
    }
    return b;
  }

  function refinedPresencesTarget(p,time,local) {
    const back=smootherstep(0.70,0.98,local);
    if(back>0){
      const s=refinedCurrentTarget(p,0,0x71f0);
      return {x:lerp(p.x,s.x,back),y:lerp(p.y,s.y,back),strength:0.66+0.34*back,palette:-1,role:"return"};
    }
    if(p.eligible>=0.72)return refinedCurrentTarget(p,time*0.32,0x71f0);
    const centers=[[0.18,0.44],[0.34,0.65],[0.52,0.35],[0.68,0.62],[0.82,0.41]];
    const g=p.group%5,c=centers[g],q=shapePoint(g,p);
    let qx=q[0],qy=q[1];
    if(g===0){const a=time*0.13;const cs=Math.cos(a),sn=Math.sin(a),x=qx*cs-qy*sn,y=qx*sn+qy*cs;qx=x;qy=y;}
    if(g===1) qy+=Math.sin((p.anchorB-0.5)*Math.PI*4+time*0.33)*0.006;
    if(g===2){const a=Math.sin(time*0.12)*0.075,cs=Math.cos(a),sn=Math.sin(a),x=qx*cs-qy*sn,y=qx*sn+qy*cs;qx=x;qy=y;}
    if(g===3) qx+=qy*Math.sin(time*0.18)*0.075;
    if(g===4){const rr=1+0.08*Math.sin(time*0.39+p.phase);qx*=rr;qy*=rr;}
    const breathe=1+0.045*Math.sin(time*0.46+p.phase);
    return {x:c[0]+qx*breathe+Math.sin(time*0.82+p.phase2)*0.0022,y:c[1]+qy*breathe+Math.cos(time*0.68+p.phase)*0.0019,strength:1,palette:g,role:"presence"};
  }

  function targetForRefined(p,kind,time,local,seed) {
    switch(kind){
      case "currents": return refinedCurrentTarget(p,time,seed||1);
      case "magnetism": return refinedMagnetismTarget(p,time);
      case "terrain": return refinedTerrainTarget(p,time,seed||1);
      case "growth": return refinedGrowthTarget(p,time,local||0);
      case "paradigm": return refinedParadigmTarget(p,time,local||0);
      case "time": return refinedTimeTarget(p,time,local||0);
      case "unknown": return refinedUnknownTarget(p,time,local||0);
      case "presences": return refinedPresencesTarget(p,time,local||0);
      default:return {x:p.x,y:p.y,strength:0,palette:-1,role:"free"};
    }
  }

  function blendTargets(a,b,t) {
    const u=smootherstep(0,1,t);
    return {
      x:lerp(a.x,b.x,u),y:lerp(a.y,b.y,u),strength:lerp(a.strength,b.strength,u),
      palette:u<0.52?a.palette:b.palette,role:u<0.52?a.role:b.role
    };
  }

  function transitionedTargetFor(p,sceneIndex,time,local,seed) {
    const scene=SCENES[sceneIndex];
    const a=targetForRefined(p,scene.kind,time,local,seed);
    const start=0.78;
    if(local<=start)return a;
    const next=SCENES[(sceneIndex+1)%SCENES.length];
    const b=targetForRefined(p,next.kind,time,0,seed);
    return blendTargets(a,b,(local-start)/(1-start));
  }

  function sceneForceRefined(p,kind,time,local) {
    const f=sceneForce(p,kind,time,local);
    let ax=f.ax,ay=f.ay;
    if(kind==="magnetism"){
      // Additional weak dipole-like torque; bounded so v0.2's field remains legible.
      const g=p.group%5,c=poleCenter(g,time),dx=p.x-c.x,dy=p.y-c.y,d2=dx*dx+dy*dy+0.0025,d=Math.sqrt(d2);
      const torque=0.0000027/d2*(g%2?-1:1);
      ax+=(-dy/d)*torque; ay+=(dx/d)*torque;
    }
    if(kind==="growth"&&p.role==="root") ay-=0.000018*smootherstep(0.05,0.55,local);
    return {ax,ay};
  }

  function targetFor(p, kind, time, local, seed) {
    switch(kind){
      case "currents": return streamTarget(p,time);
      case "magnetism": return magnetismTarget(p,time);
      case "terrain": return terrainTarget(p,time,seed||1);
      case "growth": return growthTarget(p,time,local||0);
      case "paradigm": return paradigmTarget(p,time,local||0);
      case "time": return timeTarget(p,time,local||0);
      case "unknown": return unknownTarget(p,time,local||0);
      case "presences": return presencesTarget(p,time,local||0);
      default: return {x:p.x,y:p.y,strength:0,palette:-1,role:"free"};
    }
  }

  function sceneForce(p, kind, time, local) {
    let ax=0,ay=0;
    if(kind==="magnetism"){
      // A field metaphor: attraction plus tangential motion around five moving poles.
      for(let g=0;g<5;g++){
        const c=poleCenter(g,time),dx=c.x-p.x,dy=c.y-p.y,d2=dx*dx+dy*dy+0.0035,d=Math.sqrt(d2);
        const sign=(g%2===0?1:-0.58),q=0.0000045*sign/d2;
        ax += dx/d*q - dy/d*q*0.48;
        ay += dy/d*q + dx/d*q*0.48;
      }
    }
    if(kind==="unknown"){
      const vr=unknownVoid(local);
      if(vr.amount>0 && p.eligible>=0.16){
        const dx=p.x-vr.cx,dy=p.y-vr.cy,nx=Math.abs(dx)/Math.max(vr.w*.5,0.001),ny=Math.abs(dy)/Math.max(vr.h*.5,0.001),near=Math.max(nx,ny);
        if(near<1.48){
          const d=Math.max(0.03,Math.hypot(dx,dy)),rep=(1.48-near)*0.00125*vr.amount;
          ax += dx/d*rep-dy/d*rep*0.40;
          ay += dy/d*rep+dx/d*rep*0.40;
        }
      }
    }
    return {ax,ay};
  }

  function makeParticle(seed, i) {
    const r=new XorShift32(mix32(seed ^ Math.imul(i+1,0x9e3779b1)));
    const glyphs=[".","-","_","=","/","\\","|","x","+",":","<",">","0","1","2","3","4","5","6","7","8","9"];
    const p={
      id:i, x:r.next(), y:r.next(), vx:r.range(-0.0006,0.0006), vy:r.range(-0.0005,0.0005),
      glyph:glyphs[Math.floor(r.next()*glyphs.length)], altGlyph:glyphs[Math.floor(r.next()*glyphs.length)],
      phase:r.next()*TAU, phase2:r.next()*TAU, weight:r.range(0.32,1), size:r.range(0.72,1.20),
      eligible:r.next(), group:Math.floor(r.next()*5), anchorA:r.next(), anchorB:r.next(), anchorC:r.next(), anchorD:r.next()
    };
    if(p.eligible<0.955){ const t=streamTarget(p,0); p.x=t.x; p.y=t.y; }
    return p;
  }
  function makeParticles(seed,count){const out=new Array(count);for(let i=0;i<count;i++)out[i]=makeParticle(seed,i);return out;}

  function insideRect(x,y,r,pad){const px=r.w*.5+(pad||0),py=r.h*.5+(pad||0);return Math.abs(x-r.cx)<px&&Math.abs(y-r.cy)<py;}

  function stateHash(particles,tick){
    let h=mix32(tick>>>0),stride=Math.max(1,Math.floor(particles.length/64));
    for(let i=0;i<particles.length;i+=stride){const p=particles[i],xi=Math.round(p.x*1e6),yi=Math.round(p.y*1e6);h=mix32(h^xi^Math.imul(yi,0x9e3779b1)^p.id);}
    return h.toString(16).padStart(8,"0");
  }

  return {
    TAU,GOLDEN_ANGLE,clamp,lerp,fract,smoothstep,smootherstep,hashString,mix32,hashFloat,XorShift32,valueNoise3,fbm3,
    SCENES,sceneAt,envelope,streamTarget,poleCenter,terrainHeight,refinedTerrainHeight,ridgedFbm3,domainWarp2,GROWTH_SEGMENTS,wordCells,wordTarget,targetFor,targetForRefined,transitionedTargetFor,blendTargets,sceneForce,sceneForceRefined,
    unknownVoid,insideRect,makeParticle,makeParticles,stateHash
  };
});
