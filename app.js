(function(){
"use strict";
const app=document.getElementById("app");
let lang="es",unlocked=0,view=null,timer=null,raf=null;
try{unlocked=+localStorage.getItem("ma1_unlocked")||0}catch(e){}
const save=()=>{try{localStorage.setItem("ma1_unlocked",unlocked)}catch(e){}};

const UI={
es:{sub:"Acto 1 · La Luna",pick:"Elige tu idioma",cont:"Continuar ▶",tap:"(toca el texto para acelerar)",map:"Mapa de misiones",lock:"🔒 Bloqueada",done:"✅ Completada",go:"Jugar ▶",retry:"Reintentar",next:"Siguiente misión ▶",back:"◀ Mapa",fact:"¿Sabías que…?",win:"¡Misión cumplida!",end:"¡Completaste el Acto 1! Próximamente: Acto 2, Marte 🔴",lang:"🌐 English",check:"Comprobar",boost:"MANTÉN PARA IMPULSAR 🔥",speed:"Velocidad",fuel:"Combustible",goal:"Misión:"},
en:{sub:"Act 1 · The Moon",pick:"Choose your language",cont:"Continue ▶",tap:"(tap the text to speed up)",map:"Mission map",lock:"🔒 Locked",done:"✅ Completed",go:"Play ▶",retry:"Try again",next:"Next mission ▶",back:"◀ Map",fact:"Did you know…?",win:"Mission complete!",end:"You finished Act 1! Coming soon: Act 2, Mars 🔴",lang:"🌐 Español",check:"Check",boost:"HOLD TO FIRE THRUSTERS 🔥",speed:"Speed",fuel:"Fuel",goal:"Mission:"}
};
const CH=[
{ic:"🧑‍🚀",
es:{t:"Apollo 11",tag:"MISIÓN 1 · JULIO 1969",intro:"> TRANSMISIÓN RECIBIDA...\n> LUGAR: Mar de la Tranquilidad\n> Dos astronautas, Neil y Buzz, caminaron por primera vez en otro mundo.\n> Al irse, dejaron cosas atrás... y sigue ahí hoy.\n> Tu trabajo: identificar qué equipo QUEDÓ en la Luna.",goal:"Toca las 3 cosas que se quedaron en la Luna.",fact:"El reflector láser que dejó Apollo 11 todavía se usa: científicos le disparan rayos láser desde la Tierra para medir la distancia a la Luna.",items:["Bandera|🚩|1","Reflector láser|🔦|1","Sismómetro|📡|1","Rocas lunares|🪨|0","Cámara con película|📷|0","Muestras de polvo|🧪|0"],bad:"Esa se la llevaron a la Tierra. ¡Intenta otra!"},
en:{t:"Apollo 11",tag:"MISSION 1 · JULY 1969",intro:"> TRANSMISSION RECEIVED...\n> LOCATION: Sea of Tranquility\n> Two astronauts, Neil and Buzz, walked on another world for the first time.\n> When they left, they left things behind... and it is still there today.\n> Your job: find out which gear STAYED on the Moon.",goal:"Tap the 3 things that stayed on the Moon.",fact:"The laser reflector left by Apollo 11 is still used: scientists shoot lasers at it from Earth to measure the distance to the Moon.",items:["Flag|🚩|1","Laser reflector|🔦|1","Seismometer|📡|1","Moon rocks|🪨|0","Film camera|📷|0","Dust samples|🧪|0"],bad:"That one came back to Earth. Try another!"}},
{ic:"🎯",
es:{t:"Apollo 12 y Surveyor 3",tag:"MISIÓN 2 · NOVIEMBRE 1969",intro:"> TRANSMISIÓN RECIBIDA...\n> LUGAR: Océano de las Tormentas\n> Apollo 12 debe aterrizar con MUCHA precisión.\n> Cerca hay una sonda fantasma: Surveyor 3, llegó sola en 1967.\n> Controla los cohetes y aterriza suave sobre la plataforma verde.",goal:"Mantén el botón para frenar. ¡Toca el suelo despacito!",fact:"Apollo 12 aterrizó a unos 160 metros de Surveyor 3. Los astronautas la visitaron y se llevaron piezas a la Tierra para estudiarlas.",crash:"💥 ¡Muy rápido! Intenta frenar antes.",nofuel:"⛽ Se acabó el combustible.",ok:"🎉 ¡Aterrizaje perfecto!"},
en:{t:"Apollo 12 & Surveyor 3",tag:"MISSION 2 · NOVEMBER 1969",intro:"> TRANSMISSION RECEIVED...\n> LOCATION: Ocean of Storms\n> Apollo 12 must land with GREAT precision.\n> Nearby sits a ghost probe: Surveyor 3, it arrived alone in 1967.\n> Control the rockets and land softly on the green pad.",goal:"Hold the button to slow down. Touch down gently!",fact:"Apollo 12 landed about 160 meters from Surveyor 3. The astronauts visited it and brought parts back to Earth to study them.",crash:"💥 Too fast! Brake earlier.",nofuel:"⛽ Out of fuel.",ok:"🎉 Perfect landing!"}},
{ic:"🚙",
es:{t:"Apollo 15",tag:"MISIÓN 3 · JULIO 1971",intro:"> TRANSMISIÓN RECIBIDA...\n> LUGAR: Hadley, junto a montañas lunares\n> ¡Llega el primer vehículo lunar, el Rover!\n> Venía doblado como un paraguas y hay que armarlo.\n> Ordena las piezas del 1 al 8.",goal:"Desliza las piezas para ordenarlas del 1 al 8.",fact:"El Rover de Apollo 15 permitió a los astronautas viajar kilómetros lejos de su nave. ¡Y hoy sigue estacionado en la Luna!"},
en:{t:"Apollo 15",tag:"MISSION 3 · JULY 1971",intro:"> TRANSMISSION RECEIVED...\n> LOCATION: Hadley, beside lunar mountains\n> The first lunar vehicle, the Rover, has arrived!\n> It came folded like an umbrella and must be assembled.\n> Put the parts in order from 1 to 8.",goal:"Slide the parts to put them in order 1 to 8.",fact:"The Apollo 15 Rover let astronauts travel kilometers away from their ship. And it is still parked on the Moon today!"}},
{ic:"🤖",
es:{t:"Surveyor 3",tag:"MISIÓN 4 · ABRIL 1967",intro:"> SOY SURVEYOR 3. SOY UN ROBOT.\n> Llevo años quieta en este cráter, sola, mirando.\n> Con mi cámara vi la Tierra en el cielo negro.\n> Un día llegaron visitantes en una nave y me tocaron.\n> Ayúdame a encontrar lo que ven mis ojos.",goal:"Toca la Tierra, la nave lunar y las huellas.",fact:"Surveyor 3 cavó el suelo con un brazo-pala y mandó fotos a la Tierra, ¡antes de que llegara cualquier persona!",targets:["🌍|Tierra|8|10","🚀|Nave lunar|60|60","👣|Huellas|30|72"],decoy:"Solo es una roca lunar. Sigue buscando."},
en:{t:"Surveyor 3",tag:"MISSION 4 · APRIL 1967",intro:"> I AM SURVEYOR 3. I AM A ROBOT.\n> I have sat still in this crater for years, alone, watching.\n> With my camera I saw Earth in the black sky.\n> One day visitors came in a ship and touched me.\n> Help me find what my eyes see.",goal:"Tap the Earth, the lunar module and the footprints.",fact:"Surveyor 3 dug the soil with a scoop arm and sent photos to Earth, before any person had arrived!",targets:["🌍|Earth|8|10","🚀|Lunar module|60|60","👣|Footprints|30|72"],decoy:"Just a moon rock. Keep looking."}}
];
const T=()=>UI[lang];
const clear=()=>{clearInterval(timer);cancelAnimationFrame(raf)};
const show=(html)=>{clear();app.innerHTML=html;window.scrollTo(0,0)};

function screenLang(){view=screenLang;
 show(`<div class="big">🚀🌕</div><h1>Misión Espacial</h1><p class="sub">Acto 1 · La Luna / The Moon<br>${UI.es.pick} · ${UI.en.pick}</p>
 <div class="row"><button class="btn" data-l="es">Español 🇲🇽</button><button class="btn alt" data-l="en">English 🇺🇸</button></div>`);
 app.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{lang=b.dataset.l;document.documentElement.lang=lang;screenMap()});
}
function screenMap(){view=screenMap;const t=T();
 show(`<h1>${t.sub}</h1><p class="sub">${t.map}</p><div class="map">${CH.map((c,i)=>{const o=i>unlocked,d=i<unlocked;
 return `<button class="btn ch" data-i="${i}" ${o?"disabled":""}><span class="ic">${o?"🔒":c.ic}</span><span>${c[lang].t}<small>${o?t.lock:d?t.done:t.go}</small></span></button>`}).join("")}</div>
 <button class="btn ghost" id="lg">${t.lang}</button>`);
 app.querySelectorAll(".ch").forEach(b=>b.onclick=()=>screenIntro(+b.dataset.i));
 document.getElementById("lg").onclick=()=>{lang=lang==="es"?"en":"es";document.documentElement.lang=lang;screenMap()};
}
function screenIntro(i){view=()=>screenIntro(i);const t=T(),c=CH[i][lang];
 show(`<p class="tag">${c.tag}</p><h2>${c.t}</h2><div class="term cur" id="tm"></div><p class="sub" style="font-size:.9rem">${t.tap}</p><button class="btn" id="go">${t.cont}</button>`);
 const tm=document.getElementById("tm");let n=0;const txt=c.intro;
 timer=setInterval(()=>{tm.textContent=txt.slice(0,++n);if(n>=txt.length)clearInterval(timer)},22);
 tm.onclick=()=>{clearInterval(timer);tm.textContent=txt};
 document.getElementById("go").onclick=()=>screenGame(i);
}
function screenGame(i){view=()=>screenGame(i);const t=T(),c=CH[i][lang];
 show(`<p class="tag">${c.tag}</p><h2>${c.t}</h2><p class="card"><b>${t.goal}</b> ${c.goal}</p><div id="g"></div><div class="msg" id="m"></div>`);
 [g1,g2,g3,g4][i](document.getElementById("g"),document.getElementById("m"),c,()=>win(i));
}
function win(i){const t=T(),c=CH[i][lang];if(unlocked<i+1){unlocked=Math.min(i+1,CH.length);save()}
 const last=i===CH.length-1;
 show(`<div class="big">🏆</div><h1>${t.win}</h1><div class="card"><p class="tag">${t.fact}</p><p>${c.fact}</p></div>${last?`<p class="sub">${t.end}</p>`:""}
 <div class="row">${last?"":`<button class="btn" id="nx">${t.next}</button>`}<button class="btn alt" id="mp">${t.back}</button></div>`);
 const nx=document.getElementById("nx");if(nx)nx.onclick=()=>screenIntro(i+1);
 document.getElementById("mp").onclick=screenMap;
}

/* Mini 1: elegir equipo que se quedó */
function g1(el,m,c,done){const t=T(),found=new Set();
 el.innerHTML=`<div class="grid g2 g3">${c.items.map((s,k)=>{const[a,e]=s.split("|");return `<button class="item" data-k="${k}"><span>${e}</span>${a}</button>`}).join("")}</div>`;
 el.firstChild.style.gridTemplateColumns="repeat(auto-fit,minmax(130px,1fr))";
 el.querySelectorAll(".item").forEach(b=>b.onclick=()=>{const k=+b.dataset.k,ok=c.items[k].endsWith("|1");
  if(ok){b.classList.add("sel");found.add(k);m.textContent="✅ "+found.size+"/3";m.style.color="var(--ok)";if(found.size===3)setTimeout(done,700)}
  else{b.classList.remove("no");void b.offsetWidth;b.classList.add("no");m.textContent=c.bad;m.style.color="var(--bad)"}});
}
/* Mini 2: control de descenso con un botón */
function g2(el,m,c,done){const t=T();let y=0,v=0,fuel=100,held=false,over=false,last=0;
 el.innerHTML=`<div class="hud"><span id="sp">${t.speed}: 0</span><span>${t.fuel}</span></div><div class="bar"><i id="fu"></i></div><div class="sky" id="sk"><div class="pad"></div><div class="moon"></div><div class="lm" id="lm">🛬</div></div><button class="btn" id="bt" style="width:100%;margin-top:12px">${t.boost}</button>`;
 const lm=el.querySelector("#lm"),sp=el.querySelector("#sp"),fu=el.querySelector("#fu"),bt=el.querySelector("#bt"),H=340-46-40;
 const on=e=>{e.preventDefault();held=true},off=()=>{held=false};
 bt.onpointerdown=on;bt.onpointerup=off;bt.onpointerleave=off;bt.onpointercancel=off;
 const kd=e=>{if(e.code==="Space"){e.preventDefault();held=true}},ku=e=>{if(e.code==="Space")held=false};
 document.addEventListener("keydown",kd);document.addEventListener("keyup",ku);
 function end(ok,msg){over=true;m.textContent=msg;m.style.color=ok?"var(--ok)":"var(--bad)";document.removeEventListener("keydown",kd);document.removeEventListener("keyup",ku);
  if(ok)setTimeout(done,900);else{bt.textContent=t.retry;bt.onpointerdown=null;bt.onclick=()=>screenGame(1)}}
 function loop(ts){if(!el.isConnected){document.removeEventListener("keydown",kd);document.removeEventListener("keyup",ku);return}
  const dt=Math.min((ts-(last||ts))/1000,.05);last=ts;
  if(!over){const th=held&&fuel>0;v+=(th?-8:6)*dt;if(th)fuel=Math.max(0,fuel-14*dt);y+=v*dt*1.0*(H/100);
   if(y<0){y=0;v=Math.max(v,0)}
   lm.style.top=y+"px";sp.textContent=t.speed+": "+Math.max(0,Math.round(v));sp.style.color=v>8?"var(--bad)":"var(--ok)";fu.style.width=fuel+"%";
   if(y>=H){y=H;lm.style.top=y+"px";v<=8?end(true,c.ok):end(false,c.crash)}
   else if(fuel<=0&&v>8&&y>H*.9)end(false,c.nofuel)}
  raf=requestAnimationFrame(loop)}
 raf=requestAnimationFrame(loop);
}
/* Mini 3: puzzle deslizante 3x3 */
function g3(el,m,c,done){let b=[1,2,3,4,5,6,7,8,0],z=8;
 const nb=i=>[[1,3],[0,2,4],[1,5],[0,4,6],[1,3,5,7],[2,4,8],[3,7],[4,6,8],[5,7]][i];
 for(let k=0;k<60;k++){const o=nb(z),n=o[Math.floor(Math.random()*o.length)];b[z]=b[n];b[n]=0;z=n}
 const solved=()=>b.every((v,i)=>v===(i+1)%9);
 if(solved()){b=[1,2,3,4,5,6,0,7,8];z=6}
 function draw(){el.innerHTML=`<div class="grid g3" style="max-width:360px;margin:auto">${b.map((v,i)=>v?`<button class="tile" data-i="${i}">${v}</button>`:`<div class="tile e"></div>`).join("")}</div>`;
  el.querySelectorAll("[data-i]").forEach(t=>t.onclick=()=>{const i=+t.dataset.i;if(nb(i).includes(z)){b[z]=b[i];b[i]=0;z=i;draw();if(solved()){m.textContent="🚙 ✅";m.style.color="var(--ok)";setTimeout(done,700)}}})}
 draw();
}
/* Mini 4: encontrar objetos en la escena */
function g4(el,m,c,done){const t=T(),got=new Set();
 const tg=c.targets.map(s=>{const[e,n,x,y]=s.split("|");return{e,n,x:+x,y:+y}});
 const deco=[["🪨",20,62],["🪨",78,80],["🌑",45,44],["⭐",70,12],["🪨",88,58]];
 el.innerHTML=`<div class="list">${tg.map((o,i)=>`<span class="pill" id="p${i}">${o.n}</span>`).join("")}</div><div class="scene" style="margin-top:10px">${tg.map((o,i)=>`<button class="hot" data-t="${i}" style="left:${o.x}%;top:${o.y}%">${o.e}</button>`).join("")}${deco.map(d=>`<button class="hot" data-d="1" style="left:${d[1]}%;top:${d[2]}%;opacity:.8">${d[0]}</button>`).join("")}</div>`;
 el.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{const i=+b.dataset.t;b.classList.add("found");got.add(i);document.getElementById("p"+i).classList.add("ok");m.textContent="✅ "+got.size+"/3";m.style.color="var(--ok)";if(got.size===3)setTimeout(done,800)});
 el.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{m.textContent=c.decoy;m.style.color="var(--mut)"});
}
screenLang();
})();
