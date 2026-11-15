/* =====================================================================
   SFX · Web Audio synthesizer for "Tales of the Forgotten" (NASA Space Apps)
   - 100% synthesized with the Web Audio API: no audio files, no libraries.
   - Load it AFTER the main game <script> (it wraps the game's functions).
   - Audio starts on the player's first tap / click / key press, so browsers
     never block it (the "Start mission" screen is that first interaction).
   - Floating "Audio: ON / OFF" button (top-right) + key M + Settings row.
   ===================================================================== */
const SFX=(()=>{
 "use strict";
 const AC=window.AudioContext||window.webkitAudioContext;
 let ctx=null,master=null,noiseBuf=null,vol=.85,muted=false;
 try{muted=localStorage.getItem("sfxMuted")==="1"}catch(e){}
 const gates={};
 const gate=(k,ms)=>{const t=performance.now();if(t-(gates[k]||-1e9)<ms)return false;gates[k]=t;return true};

 /* ---------- context + first-gesture unlock ---------- */
 function unlock(){
  if(!AC||(ctx&&ctx.state==="running"))return;
  if(!ctx){
   try{ctx=new AC({latencyHint:"interactive"})}catch(e){try{ctx=new AC()}catch(e2){return}}
   master=ctx.createGain();master.gain.value=muted?0:vol;
   const comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=12;comp.ratio.value=5;
   master.connect(comp);comp.connect(ctx.destination);
   noiseBuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
   const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
   /* iOS Safari: play one silent sample inside the gesture */
   try{const s=ctx.createBufferSource();s.buffer=ctx.createBuffer(1,1,22050);s.connect(ctx.destination);s.start(0)}catch(e){}
  }
  if(ctx.state!=="running"&&ctx.resume)ctx.resume().catch(()=>{});
 }
 ["pointerdown","pointerup","touchend","click","keydown"].forEach(ev=>addEventListener(ev,unlock,{capture:true,passive:true}));
 document.addEventListener("visibilitychange",()=>{
  if(!ctx)return;
  if(document.hidden)ctx.suspend&&ctx.suspend().catch(()=>{});else ctx.resume&&ctx.resume().catch(()=>{})});

 /* ---------- building blocks ---------- */
 /* tone: {f,to,d,type,v,at,a,lp}  (pitch glide f→to, volume v, attack a, delay at) */
 function tone(o){
  const c=ctx,t=c.currentTime+(o.at||0),d=o.d||.1,v=o.v==null?.1:o.v,a=Math.min(o.a==null?.005:o.a,d*.5);
  const os=c.createOscillator(),g=c.createGain();
  os.type=o.type||"sine";os.frequency.setValueAtTime(o.f,t);
  if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  let n=os;
  if(o.lp){const f=c.createBiquadFilter();f.type="lowpass";f.frequency.value=o.lp;os.connect(f);n=f}
  n.connect(g);g.connect(master);os.start(t);os.stop(t+d+.03);
 }
 /* noise: {d,v,type,f,to,q,at,a}  (filtered white noise with a sweeping cutoff) */
 function noise(o){
  const c=ctx,t=c.currentTime+(o.at||0),d=o.d||.2,v=o.v==null?.1:o.v,a=Math.min(o.a==null?.005:o.a,d*.5);
  const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  s.buffer=noiseBuf;s.loop=true;
  f.type=o.type||"lowpass";f.Q.value=o.q||1;f.frequency.setValueAtTime(o.f||1000,t);
  if(o.to)f.frequency.exponentialRampToValueAtTime(o.to,t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  s.connect(f);f.connect(g);g.connect(master);s.start(t,Math.random()*1.5);s.stop(t+d+.03);
 }

 /* ---------- the sound effects ---------- */
 const N=[523.25,659.25,783.99,1046.5];   /* C5 E5 G5 C6 */
 const S={
  /* UI */
  hover(){if(!gate("hv",55))return;tone({f:1500,to:1900,d:.035,type:"sine",v:.025})},
  click(){tone({f:700,to:1250,d:.05,type:"square",v:.04,lp:3500});tone({f:1900,d:.06,type:"sine",v:.035,at:.012})},
  whoosh(){if(!gate("ws",300))return;noise({d:.55,v:.05,type:"bandpass",q:.8,f:250,to:2200,a:.25})},

  /* world selection: sonar ping + radar sweep + telemetry chirps */
  radar(){
   noise({d:.5,v:.05,type:"bandpass",q:6,f:300,to:3200});
   [0,.2,.4].forEach((x,i)=>tone({f:1320,d:.9,type:"sine",v:.09/(1+i*2.2),at:.08+x}));
   [[2200,.62],[1760,.69],[2640,.76]].forEach(([f,x])=>tone({f,d:.04,type:"square",v:.025,at:x,lp:5000}))},

  /* chapter opening: "incoming transmission" data burst + soft beacon */
  transmission(){
   noise({d:.35,v:.04,type:"bandpass",q:4,f:2800,to:700});
   for(let i=0;i<9;i++)tone({f:1000+((i*7919)%13)*170,d:.03,type:"square",v:.025,at:.05+i*.045,lp:4500});
   tone({f:880,d:.5,type:"sine",v:.07,at:.5});tone({f:1320,d:.7,type:"sine",v:.05,at:.62})},

  /* mini-games */
  success(){if(!gate("ok",120))return;N.forEach((f,i)=>tone({f,d:.16,type:"triangle",v:.1,at:i*.065}));tone({f:2093,d:.25,type:"sine",v:.03,at:.2})},
  error(){if(!gate("er",250))return;[0,.16].forEach(x=>{tone({f:165,to:120,d:.13,type:"sawtooth",v:.07,at:x,lp:700});tone({f:110,d:.13,type:"square",v:.03,at:x,lp:500})})},
  puff(){noise({d:.28,v:.12,type:"bandpass",q:1.2,f:400,to:1800});tone({f:200,to:420,d:.2,type:"sine",v:.06})},
  bounce(){if(!gate("bn",200))return;tone({f:150,to:60,d:.2,type:"sine",v:.2});noise({d:.12,v:.08,type:"lowpass",f:900,to:200})},

  /* victory / arrival alarm */
  win(){
   N.forEach((f,i)=>{tone({f,d:.22,type:"square",v:.05,at:i*.11,lp:3000});tone({f,d:.3,type:"triangle",v:.09,at:i*.11})});
   N.forEach(f=>tone({f,d:1.1,type:"triangle",v:.06,at:.5,a:.02}));
   tone({f:2093,d:.9,type:"sine",v:.03,at:.52});
   [0,.14].forEach(x=>tone({f:1568,d:.08,type:"sine",v:.05,at:1.35+x}))},

  /* bad landing: impact + debris + descending warning */
  crash(){
   noise({d:.7,v:.28,type:"lowpass",f:2400,to:120,a:.002});
   tone({f:110,to:38,d:.45,type:"sine",v:.3,a:.002});
   tone({f:300,to:90,d:.25,type:"sawtooth",v:.08,lp:900,at:.02});
   [0,.1].forEach(x=>tone({f:2200,to:1500,d:.1,type:"square",v:.025,at:.12+x,lp:3000}));
   tone({f:196,to:98,d:.5,type:"sawtooth",v:.05,lp:600,at:.45})}
 };

 /* ---------- continuous engine (rocket roar / rotor whir / ion hum) ----------
    Call SFX.thrust(level 0..1, kind) every frame while the engine is on.
    A watchdog fades it out if the calls stop (screen change, pause, landing). */
 const K={
  rocket:{c:L=>300+700*L,g:L=>.26*L,f:L=>48+28*L,t:"sawtooth",o:.7},
  rotor:{c:L=>400+1400*L,g:L=>.2*L,f:L=>60+260*L,t:"sawtooth",o:.25},
  ion:{c:()=>1800,g:L=>.12*L,f:L=>200+90*L,t:"sine",o:.9}
 };
 let eng=null,engLevel=0,engTick=0,engTimer=0,killT=0;
 function engStart(kind){
  const c=ctx,g=c.createGain(),f=c.createBiquadFilter(),src=c.createBufferSource(),o=c.createOscillator(),og=c.createGain();
  g.gain.value=0;f.type="lowpass";f.Q.value=.8;og.gain.value=K[kind].o;o.type=K[kind].t;
  src.buffer=noiseBuf;src.loop=true;src.connect(f);o.connect(og);og.connect(f);f.connect(g);g.connect(master);
  src.start();o.start();eng={g,f,src,o,og,kind};
 }
 function engKill(){
  clearInterval(engTimer);engTimer=0;clearTimeout(killT);
  if(!eng)return;const e=eng;eng=null;engLevel=0;
  try{e.src.stop();e.o.stop()}catch(x){}
  try{e.g.disconnect()}catch(x){}
 }
 function engSet(L){
  engLevel=L;if(!eng)return;
  const t=ctx.currentTime,k=K[eng.kind];
  eng.g.gain.setTargetAtTime(k.g(L),t,L>0?.05:.09);
  eng.f.frequency.setTargetAtTime(k.c(L),t,.08);
  eng.o.frequency.setTargetAtTime(k.f(L),t,.08);
  if(L===0){clearTimeout(killT);killT=setTimeout(()=>{if(engLevel===0)engKill()},600)}
 }
 function thrust(L,kind){
  if(!ctx||muted)return;
  kind=K[kind]?kind:"rocket";engTick=performance.now();
  if(!(L>.01)){if(eng&&engLevel>0)engSet(0);return}
  if(ctx.state!=="running"&&ctx.resume)ctx.resume().catch(()=>{});
  clearTimeout(killT);
  if(!eng||eng.kind!==kind){engKill();engStart(kind)}
  engSet(Math.min(1,L));
  if(!engTimer)engTimer=setInterval(()=>{if(performance.now()-engTick>140&&engLevel>0)engSet(0)},60);
 }

 /* ---------- black-hole wind: a howling void (looped, slow fade in/out) ---------- */
 let wind=null,windWanted=false;
 function windStart(){
  if(wind||!ctx||muted)return;
  const c=ctx,out=c.createGain(),nodes=[];
  out.gain.value=0;out.connect(master);
  /* cavernous "space" reverb: a long decaying noise impulse */
  const ir=c.createBuffer(2,Math.floor(c.sampleRate*2.6),c.sampleRate);
  for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2.4)}
  const verb=c.createConvolver();verb.buffer=ir;
  const wet=c.createGain();wet.gain.value=.8;verb.connect(wet);wet.connect(out);
  const send=(node,amt)=>{const g=c.createGain();g.gain.value=amt;node.connect(g);g.connect(verb)};
  const loopNoise=rate=>{const s=c.createBufferSource();s.buffer=noiseBuf;s.loop=true;s.playbackRate.value=rate;nodes.push(s);return s};
  const lfo=(hz,depth,param)=>{const o=c.createOscillator(),g=c.createGain();o.frequency.value=hz;g.gain.value=depth;o.connect(g);g.connect(param);nodes.push(o)};
  /* howling wind: band-passed noise whose pitch and strength drift slowly */
  const w=loopNoise(1),bp=c.createBiquadFilter(),wg=c.createGain();
  bp.type="bandpass";bp.frequency.value=480;bp.Q.value=1.4;wg.gain.value=.55;
  w.connect(bp);bp.connect(wg);wg.connect(out);send(wg,.7);lfo(.11,260,bp.frequency);lfo(.29,.3,wg.gain);
  /* thin whistle riding on top */
  const w2=loopNoise(.8),bp2=c.createBiquadFilter(),wg2=c.createGain();
  bp2.type="bandpass";bp2.frequency.value=1100;bp2.Q.value=6;wg2.gain.value=.12;
  w2.connect(bp2);bp2.connect(wg2);wg2.connect(out);send(wg2,1);lfo(.07,520,bp2.frequency);lfo(.17,.08,wg2.gain);
  /* deep rumble of the event horizon */
  const r=loopNoise(.5),lp=c.createBiquadFilter(),rg=c.createGain();
  lp.type="lowpass";lp.frequency.value=150;rg.gain.value=.9;
  r.connect(lp);lp.connect(rg);rg.connect(out);lfo(.06,.35,rg.gain);
  /* sub drone */
  [46,69.3].forEach(f=>{const o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.value=f;g.gain.value=.12;o.connect(g);g.connect(out);nodes.push(o)});
  /* ghostly cosmic pad that swells in the reverb */
  [[98,.05],[147,.04],[196.6,.03]].forEach(([f,a],i)=>{
   const o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.value=f;g.gain.value=a;
   o.connect(g);g.connect(out);send(g,1);lfo(.04+i*.03,a*.6,g.gain);nodes.push(o)});
  nodes.forEach(n=>n.start());
  out.gain.setTargetAtTime(.42,c.currentTime,1.1);
  wind={out,nodes};
 }
 function windStop(){
  if(!wind)return;const w=wind;wind=null;
  try{w.out.gain.setTargetAtTime(0,ctx.currentTime,.3)}catch(e){}
  setTimeout(()=>{w.nodes.forEach(n=>{try{n.stop()}catch(e){}});try{w.out.disconnect()}catch(e){}},1600);
 }

 /* ---------- mute / unmute ---------- */
 function setMuted(m){
  muted=!!m;try{localStorage.setItem("sfxMuted",muted?"1":"0")}catch(e){}
  if(master)master.gain.setTargetAtTime(muted?0:vol,ctx.currentTime,.02);
  if(muted){engKill();windStop()}else if(windWanted&&ctx)windStart();
  ui();
 }
 function ui(){
  const b=document.getElementById("sfx-mute");
  if(b){
   b.setAttribute("aria-pressed",String(muted));
   b.setAttribute("aria-label",muted?"Sound effects are off. Press to turn on":"Sound effects are on. Press to turn off");
   b.title=(muted?"Turn sound effects on":"Turn sound effects off")+" (M)";
   b.firstChild.textContent=muted?"🔇":"🔊";b.lastChild.textContent=muted?"Audio: OFF":"Audio: ON"}
  const s=document.getElementById("set-sfx");if(s)s.textContent=muted?"Off 🔇":"On 🔊";
 }

 /* ---------- public API ---------- */
 const api={
  ctx:()=>ctx,out:()=>master,unlock,thrust,setMuted,
  wind(on){windWanted=!!on;if(!ctx)return;if(on)windStart();else windStop()},toggle:()=>setMuted(!muted),
  get muted(){return muted},
  volume(v){vol=Math.max(0,Math.min(1,v));if(master&&!muted)master.gain.value=vol}
 };
 Object.keys(S).forEach(k=>{api[k]=(...a)=>{
  if(!ctx||muted)return;
  if(ctx.state!=="running"&&ctx.resume)ctx.resume().catch(()=>{});
  try{S[k](...a)}catch(e){}}});

 /* ---------- floating Audio ON/OFF button + Settings row ---------- */
 const CSS=`
#sfx-mute{position:fixed;top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));z-index:70;display:inline-flex;align-items:center;gap:6px;min-height:38px;padding:6px 12px;border-radius:99px;background:#12183acc;border:1px solid #00f3ff66;color:#cfe0ff;font:800 .75rem Lexend,sans-serif;letter-spacing:.04em;cursor:pointer;opacity:.82;transition:opacity .2s,border-color .2s;-webkit-tap-highlight-color:transparent}
#sfx-mute:hover,#sfx-mute:focus-visible{opacity:1;border-color:#00f3ff}
#sfx-mute[aria-pressed=true]{border-color:#ff4d6d99;color:#ffb3c0}
#sfx-mute .i{font-size:1rem;line-height:1}
#cin-skip{right:auto;left:16px}
@media(max-width:1240px){.screen{padding-top:58px}#solar{padding-top:96px}#pct{top:54px}}
@media(max-width:600px){#sfx-mute .t{display:none}#sfx-mute{padding:6px 10px}}`;
 function mount(){
  if(document.getElementById("sfx-mute"))return;
  const st=document.createElement("style");st.id="sfx-css";st.textContent=CSS;document.head.appendChild(st);
  const b=document.createElement("button");
  b.id="sfx-mute";b.type="button";b.setAttribute("data-nosfx","");b.setAttribute("translate","no");
  b.innerHTML='<span class="i" aria-hidden="true"></span><span class="t"></span>';
  b.addEventListener("click",e=>{unlock();setMuted(!muted);if(!muted)api.click();if(e.detail)b.blur()});
  document.body.appendChild(b);
  const ref=document.getElementById("set-snd"),row0=ref&&ref.closest(".srow");
  if(row0){
   const row=document.createElement("div");row.className="srow";
   row.innerHTML='<span>Sound effects <small>(key M)</small></span><button class="btn ghost tg" id="set-sfx" type="button" data-nosfx></button>';
   row0.after(row);
   row.querySelector("button").onclick=()=>{unlock();setMuted(!muted);if(!muted)api.click()};
  }
  ui();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();

 /* keyboard shortcut: M = mute / unmute */
 addEventListener("keydown",e=>{
  if(e.code!=="KeyM"||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
  if(/^(INPUT|TEXTAREA|SELECT)$/.test((e.target&&e.target.tagName)||""))return;
  unlock();setMuted(!muted);if(!muted)api.click();
 });

 /* ---------- UI sounds by event delegation (hover + click) ---------- */
 const SEL="button,.btn,.mis-btn,.slot,.part,[role=button],input[type=range],.tvo";
 const off=t=>!t||t.disabled||t.hasAttribute("data-nosfx");
 document.addEventListener("pointerover",e=>{
  if(e.pointerType!=="mouse")return;
  const t=e.target.closest&&e.target.closest(SEL);
  if(off(t)||(e.relatedTarget&&t.contains(e.relatedTarget)))return;
  api.hover();
 },{passive:true});
 document.addEventListener("click",e=>{
  const t=e.target.closest&&e.target.closest(SEL);
  /* skipped on purpose: planets (radar), chapters (transmission), game pads, answers/slots (success/error) */
  if(off(t)||t.matches(".hit:not(.lock),[data-m],[data-k],.tvo,.slot"))return;
  api.click();
 },true);

 return api;
})();

/* ---------- wiring into the game's own functions ---------- */
(function sfxWire(){
 const wrap=(n,pre,post)=>{
  const o=window[n];if(typeof o!=="function")return;
  window[n]=function(){
   try{pre&&pre.apply(this,arguments)}catch(e){}
   const r=o.apply(this,arguments);
   try{post&&post.call(this,r,arguments)}catch(e){}
   return r};
 };
 /* choose a world → radar ping (pick(i,1) is just a resize re-layout) */
 wrap("pick",(i,inst)=>{if(!inst)SFX.radar();SFX.wind(!!PL[i]&&PL[i].id==="bh")});
 /* the black hole's wind stops when you leave it */
 wrap("back",()=>SFX.wind(false));
 wrap("swap",()=>SFX.wind(false));
 wrap("solar",()=>SFX.wind(false));
 /* open a chapter → incoming transmission */
 wrap("story",()=>SFX.transmission());
 /* black screen wipe between scenes */
 wrap("sweep",()=>{if(typeof busy!=="undefined"&&!busy)SFX.whoosh()});
 /* mission complete / golden aura → victory alarm */
 wrap("win",()=>SFX.win());
 wrap("goldNow",()=>SFX.win());
 /* failure pop-up: 💥 = crash, anything else = console error buzz */
 wrap("popup",(ic,t,r,btn,cb,bad)=>{if(bad)SFX[ic==="💥"?"crash":"error"]()});
 /* HUD messages: "ok" = success chime, "warn" = soft warning, skid = bounce */
 wrap("msg",(t,c)=>{
  if(c==="ok")SFX.success();
  else if(c==="warn"){
   t=String(t||"");
   if(/^Mission failed/.test(t))return;
   if(/^Whoa, too much sideways/.test(t))SFX.bounce();else SFX.error();
  }
 });
 /* trivia answers */
 const ans=window.answerTv;
 if(typeof ans==="function"){
  window.answerTv=function(){
   const s=tvS,n=s?s.res.length:0,r=ans.apply(this,arguments);
   try{if(s&&s.res.length>n)SFX[s.res[s.res.length-1]?"success":"error"]()}catch(e){}
   return r};
 }
})();
