(function (root) {
  "use strict";
  const C = root.PsicoCore;

  const PALETTE = {
    sangre:"#C73A4A", mostaza:"#B78627", musgo:"#708152",
    cobre:"#3E7C88", amatista:"#785B9D", oled:"#000000", hueso:"#FCF8F0"
  };
  const GROUP_COLORS=[PALETTE.cobre,PALETTE.musgo,PALETTE.mostaza,PALETTE.sangre,PALETTE.amatista];
  const PRESENCE_GLYPHS=["•","▬","▲","■","●"];

  class FlowGrid {
    constructor(seed,cols,rows){this.seed=seed;this.cols=cols||54;this.rows=rows||31;this.vx=new Float32Array(this.cols*this.rows);this.vy=new Float32Array(this.cols*this.rows);this.lastStamp=-1;}
    update(time){
      const stamp=Math.floor(time*4); if(stamp===this.lastStamp)return; this.lastStamp=stamp;
      const z=stamp*0.017,eps=0.032;
      for(let gy=0;gy<this.rows;gy++){
        const y=gy/(this.rows-1);
        for(let gx=0;gx<this.cols;gx++){
          const x=gx/(this.cols-1),sx=x*3.0,sy=y*2.15;
          const dx=(C.fbm3(sx+eps,sy,z,this.seed,3)-C.fbm3(sx-eps,sy,z,this.seed,3))/(2*eps);
          const dy=(C.fbm3(sx,sy+eps,z,this.seed,3)-C.fbm3(sx,sy-eps,z,this.seed,3))/(2*eps);
          const i=gy*this.cols+gx; this.vx[i]=dy; this.vy[i]=-dx;
        }
      }
    }
    sample(x,y){
      x=C.clamp(x,0,0.999999);y=C.clamp(y,0,0.999999);
      const fx=x*(this.cols-1),fy=y*(this.rows-1),x0=Math.floor(fx),y0=Math.floor(fy),x1=Math.min(this.cols-1,x0+1),y1=Math.min(this.rows-1,y0+1),tx=fx-x0,ty=fy-y0;
      const i00=y0*this.cols+x0,i10=y0*this.cols+x1,i01=y1*this.cols+x0,i11=y1*this.cols+x1;
      return {x:C.lerp(C.lerp(this.vx[i00],this.vx[i10],tx),C.lerp(this.vx[i01],this.vx[i11],tx),ty),y:C.lerp(C.lerp(this.vy[i00],this.vy[i10],tx),C.lerp(this.vy[i01],this.vy[i11],tx),ty)};
    }
  }

  function physics(kind){
    switch(kind){
      case "currents": return {spring:0.0048,flow:0.00010,damping:0.964,max:0.0062};
      case "magnetism":return {spring:0.0064,flow:0.00018,damping:0.966,max:0.0068};
      case "terrain":  return {spring:0.0105,flow:0.00008,damping:0.958,max:0.0073};
      case "growth":   return {spring:0.0092,flow:0.00012,damping:0.963,max:0.0068};
      case "paradigm": return {spring:0.0115,flow:0.00006,damping:0.952,max:0.0076};
      case "time":     return {spring:0.0088,flow:0.00010,damping:0.961,max:0.0069};
      case "unknown":  return {spring:0.0072,flow:0.00020,damping:0.966,max:0.0070};
      case "presences":return {spring:0.0096,flow:0.00010,damping:0.960,max:0.0070};
      default:return {spring:0.006,flow:0.0002,damping:0.965,max:0.0065};
    }
  }

  class FieldEngine {
    constructor(canvas,config,audioProbe){
      this.canvas=canvas;this.ctx=canvas.getContext("2d",{alpha:false,desynchronized:true});this.config=config;this.audioProbe=audioProbe;
      this.seedString=config.seed||"psicoandino";this.seed=C.hashString(this.seedString);this.fixedDt=1/60;this.tick=0;this.simTime=0;this.accumulator=0;this.lastFrameMs=null;this.fps=0;this.fpsSmooth=60;
      this.profile=(config.profile||"refined").toLowerCase();this.quality=config.quality||"high";this.count=({low:900,medium:1500,high:2200})[this.quality]||2200;
      this.particles=C.makeParticles(this.seed,this.count);this.flow=new FlowGrid(C.mix32(this.seed^0x51f15e),56,32);
      this.width=1920;this.height=1080;this.dpr=1;this.sceneInfo=C.sceneAt(0,config.cycleSeconds);this.sceneOverride=null;this.audio={bass:0,mid:0,treble:0,rms:0};
      this._resetSnapshot=this.particles.map(p=>({x:p.x,y:p.y,vx:p.vx,vy:p.vy}));
      for(const p of this.particles){p.role="stream";p.palette=-1;p.targetStrength=1;}
      this.resize();
    }
    resize(){
      const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(root.devicePixelRatio||1,2);this.dpr=dpr;this.width=Math.max(1,Math.round(rect.width));this.height=Math.max(1,Math.round(rect.height));
      const w=Math.max(1,Math.round(this.width*dpr)),h=Math.max(1,Math.round(this.height*dpr));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
      this.ctx.setTransform(dpr,0,0,dpr,0,0);this.ctx.textBaseline="middle";this.ctx.textAlign="center";
    }
    reset(){
      for(let i=0;i<this.particles.length;i++){const p=this.particles[i],s=this._resetSnapshot[i];p.x=s.x;p.y=s.y;p.vx=s.vx;p.vy=s.vy;p.role="stream";p.palette=-1;p.targetStrength=1;}
      this.tick=0;this.simTime=0;this.accumulator=0;this.flow.lastStamp=-1;
    }
    setSceneOverride(kind){
      if(!kind){this.sceneOverride=null;return;}
      const found=C.SCENES.find(s=>s.kind===kind||s.name===kind);if(found)this.sceneOverride=found;
    }
    setProfile(profile,resetWorld){
      const next=(profile||"refined").toLowerCase()==="legacy"?"legacy":"refined";
      if(next===this.profile)return;
      this.profile=next;
      if(resetWorld!==false)this.reset();
    }
    effectiveScene(){
      if(!this.sceneOverride)return this.sceneInfo;
      return {scene:this.sceneOverride,index:C.SCENES.indexOf(this.sceneOverride),local:0.58,canonicalTime:this.simTime};
    }
    step(){
      const cycle=this.config.cycleSeconds||240;this.simTime=this.tick*this.fixedDt;if(this.simTime>=cycle){this.reset();return;}
      this.sceneInfo=C.sceneAt(this.simTime,cycle);this.flow.update(this.simTime);
      const info=this.effectiveScene(),scene=info.scene,local=info.local,env=this.sceneOverride?1:C.envelope(local,0.12),ph=physics(scene.kind),refined=this.profile!=="legacy";
      for(let i=0;i<this.particles.length;i++){
        const p=this.particles[i],f=this.flow.sample(p.x,p.y);let ax=f.x*ph.flow*p.weight,ay=f.y*ph.flow*p.weight;
        const tar=refined
          ? (this.sceneOverride?C.targetForRefined(p,scene.kind,this.simTime,local,this.seed):C.transitionedTargetFor(p,info.index,this.simTime,local,this.seed))
          : C.targetFor(p,scene.kind,this.simTime,local,this.seed);
        const s=refined?tar.strength:tar.strength*(scene.kind==="currents"?1:env);
        p.role=tar.role||"free";p.palette=tar.palette==null?-1:tar.palette;p.targetStrength=s;
        if(s>0){ax+=(tar.x-p.x)*ph.spring*s;ay+=(tar.y-p.y)*ph.spring*s;}
        const sf=refined?C.sceneForceRefined(p,scene.kind,this.simTime,local):C.sceneForce(p,scene.kind,this.simTime,local);ax+=sf.ax;ay+=sf.ay;
        p.vx=(p.vx+ax)*ph.damping;p.vy=(p.vy+ay)*ph.damping;
        const sp=Math.hypot(p.vx,p.vy);if(sp>ph.max){p.vx=p.vx/sp*ph.max;p.vy=p.vy/sp*ph.max;}
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<-.03)p.x+=1.06;else if(p.x>1.03)p.x-=1.06;if(p.y<-.04)p.y+=1.08;else if(p.y>1.04)p.y-=1.08;
      }
      this.tick++;
    }
    glyphFor(p,scene,audio){
      const pulse=((Math.floor(this.simTime*(1.8+audio.treble*2.1))+p.id)%23)===0;
      if(p.role==="presence")return (p.id%5===0)?p.altGlyph:PRESENCE_GLYPHS[p.group%5];
      if(p.role==="ground")return ["_","-","=","x","/","\\"][p.id%6];
      if(p.role==="ridge")return ["/","\\","^","-","_"][p.id%5];
      if(p.role==="cloud")return [".","-","/","\\",":"][p.id%5];
      if(p.role==="branch")return ["|","/","\\","Y","+"][p.id%5];
      if(p.role==="leaf")return ["•",".","+","*","o"][p.id%5];
      if(p.role==="grid")return ["-","=","+","|","x"][p.id%5];
      if(p.role==="anomaly")return ["■","x","+","#","="][p.id%5];
      if(p.role==="word"||p.role==="unknown-word")return pulse?p.altGlyph:p.glyph;
      if(p.role==="flow")return [".","-","=","/","<",">"][p.id%6];
      if(p.role==="equilibrium")return ["=","-","_","."][p.id%4];
      if(p.role==="magnet")return (p.id%11===0)?PRESENCE_GLYPHS[p.group%5]:(pulse?p.altGlyph:p.glyph);
      if(p.role==="filament")return ["-","=","~","/","\\","·"][p.id%6];
      if(p.role==="vein")return ["=","+","x","•","-"][p.id%5];
      if(p.role==="fault")return ["/","\\","x","+","#"][p.id%5];
      return pulse?p.altGlyph:p.glyph;
    }
    draw(){
      const ctx=this.ctx,w=this.width,h=this.height,dark=this.config.background==="oled";ctx.fillStyle=dark?PALETTE.oled:PALETTE.hueso;ctx.fillRect(0,0,w,h); // acousticOS: the field follows the site's mode (the director, 2026-10-22); without config it is hueso as before
      const info=this.effectiveScene(),scene=info.scene,local=info.local,audio=this.audio,baseSize=Math.max(7.4,Math.min(11.8,w/166));
      const vr=scene.kind==="unknown"?C.unknownVoid(local):null;
      const cover=this.config.fit==="cover",tall=cover&&h>w,L=tall?Math.max(h,w*16/9):(cover?Math.max(w,h*16/9):w),S=cover?L*9/16:h,ox=tall?(w-S)/2:(w-L)/2,oy=tall?(h-L)/2:(h-S)/2; // acousticOS: fill the space without stretching; on a tall screen the world turns a quarter so it is laid out for it (the director, 2026-10-22); without config the world maps to the canvas as before
      const at=tall?(px,py)=>[ox+py*S,oy+px*L]:(px,py)=>[ox+px*L,oy+py*S];
      if(vr&&vr.amount>0){ctx.fillStyle=dark?PALETTE.hueso:PALETTE.oled;const a=at(vr.cx-vr.w/2,vr.cy-vr.h/2);ctx.fillRect(a[0],a[1],tall?vr.h*S:vr.w*L,tall?vr.w*L:vr.h*S);}
      for(let i=0;i<this.particles.length;i++){
        const p=this.particles[i];let [x,y]=at(p.x,p.y);
        const audioAmp=(this.config.audio&&this.config.audio.gain!=null)?this.config.audio.gain:0.18,shimmer=audioAmp*(0.44*audio.mid+0.56*audio.treble);
        x+=Math.sin(this.simTime*2.7+p.phase)*shimmer*3.6*p.weight;y+=Math.cos(this.simTime*2.1+p.phase2)*shimmer*2.5*p.weight;
        if(vr&&vr.amount>0&&p.role!=="unknown-word"&&C.insideRect(p.x,p.y,vr,-0.002))continue;
        let color=PALETTE.oled,alpha=0.20+p.weight*0.55;
        if(p.palette>=0&&p.palette<=4){color=GROUP_COLORS[p.palette];alpha=0.54+0.36*Math.min(1,p.targetStrength+0.15);}
        if(p.palette===6){color=PALETTE.hueso;alpha=0.92;}
        if(scene.kind==="currents"&&p.eligible>=0.955)alpha*=0.26;
        if(scene.kind==="terrain"&&p.role==="ground")alpha=0.62+p.weight*0.30;
        if(p.role==="vein")alpha=0.72+p.weight*0.24;
        if(p.role==="filament")alpha=0.44+p.weight*0.35;
        if(p.role==="fault")alpha=0.60+p.weight*0.28;
        if(scene.kind==="paradigm"&&p.role==="grid")alpha=0.46+p.weight*0.32;
        if(scene.kind==="unknown"&&p.role==="orbit")alpha*=0.72;
        if(scene.kind==="presences"&&p.role==="presence")alpha=0.88;
        if(scene.kind==="presences"&&p.role==="return")alpha*=0.62;
        if(dark){if(color===PALETTE.oled)color=PALETTE.hueso;else if(color===PALETTE.hueso)color=PALETTE.oled;}
        const glyph=this.glyphFor(p,scene,audio),size=baseSize*p.size*(1+audio.bass*0.040)*(p.role==="presence"?1.10:1);
        ctx.font=`${size.toFixed(1)}px ${this.config.glyphFont||'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace'}`; // glyphFont: acousticOS draws in Newsreader (the director, 2026-10-22); the default keeps v0.3 as it was
        ctx.globalAlpha=C.clamp(alpha,0,1);ctx.fillStyle=color;ctx.fillText(glyph,x,y);
      }
      ctx.globalAlpha=1;
    }
    advanceFrame(nowMs){
      if(this.lastFrameMs==null)this.lastFrameMs=nowMs;const elapsed=Math.min(0.10,Math.max(0,(nowMs-this.lastFrameMs)/1000));this.lastFrameMs=nowMs;this.accumulator+=elapsed;let steps=0;
      while(this.accumulator>=this.fixedDt&&steps<6){this.step();this.accumulator-=this.fixedDt;steps++;}
      this.audio=this.audioProbe?this.audioProbe.update(this.simTime):{bass:0,mid:0,treble:0,rms:0};this.draw();const instant=elapsed>0?1/elapsed:60;this.fpsSmooth=this.fpsSmooth*0.92+instant*0.08;this.fps=Math.round(this.fpsSmooth);
    }
    advanceTicks(n){for(let i=0;i<n;i++)this.step();this.audio=this.audioProbe?this.audioProbe.update(this.simTime):{bass:0,mid:0,treble:0,rms:0};this.draw();}
    getDebugState(){const info=this.effectiveScene();return {scene:info.scene.name+(this.sceneOverride?"*":""),profile:this.profile,tick:this.tick,fps:this.fps,particles:this.particles.length,seed:this.seedString,hash:C.stateHash(this.particles,this.tick),audio:this.audio};}
  }

  root.PsicoEngine={FieldEngine,PALETTE};
})(globalThis);
