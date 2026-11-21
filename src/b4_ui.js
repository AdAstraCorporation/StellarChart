
/* ═════════ Bucle principal ═════════ */
let drag=null,prevCv=null;const prevSt={yaw:.8,pitch:.45,drag:null,last:0};
function frame(now){
  const dt=Math.min(.05,(now-(lastT||now))/1000);lastT=now;
  if(travel)stepTravel(now);
  else if(planRun)stepPlan();
  if(!travel){
    if(keys.size&&mode==='map'&&CP){const s=cam.R*dt*(pilot?.5:.9);let mx=0,my=0,mz=0;
      if(keys.has('w')||keys.has('arrowup'))my++;if(keys.has('s')||keys.has('arrowdown'))my--;if(keys.has('a')||keys.has('arrowleft'))mx--;if(keys.has('d')||keys.has('arrowright'))mx++;if(keys.has('e'))mz++;if(keys.has('q'))mz--;
      if(mx||my||mz){const v=[(CP.cy*mx+CP.sy*my)*s,(-CP.sy*mx+CP.cy*my)*s,mz*s];lastInput=now;idleDone=false;
        if(pilot){const k2=keys.has('shift')?4:1;v[0]*=k2;v[1]*=k2;v[2]*=k2;const d=Math.hypot(...v);
          if(pilotConsume(d)){pilot.pos[0]+=v[0];pilot.pos[1]+=v[1];pilot.pos[2]+=v[2];pilot.dir=v.map(q=>q/d);pilot.moved+=d}else if(!pilot.warned){pilot.warned=1;toast('Sin energía negativa o materia para seguir avanzando. Extrae materia en un sistema, consigue energía negativa o activa el modo creativo.')}}
        else{tg.fx+=v[0];tg.fy+=v[1];tg.fz+=v[2]}}}
    if(pilot){tg.fx=cam.fx=pilot.pos[0];tg.fy=cam.fy=pilot.pos[1];tg.fz=cam.fz=pilot.pos[2]}
    if(opt.spin&&!pilot&&mode==='map'&&!drag&&now-lastInput>4000)tg.yaw+=dt*.04;
  }
  const k=1-Math.exp(-dt*(drag?30:6));
  cam.yaw+=(tg.yaw-cam.yaw)*k;cam.pitch+=(tg.pitch-cam.pitch)*k;cam.R=Math.exp(lerp(Math.log(cam.R),Math.log(tg.R),k));
  if(!travel){cam.fx+=(tg.fx-cam.fx)*k;cam.fy+=(tg.fy-cam.fy)*k;cam.fz+=(tg.fz-cam.fz)*k}
  if(mode==='map'&&needVis())buildVis();
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#060708';ctx.fillRect(0,0,W,H);
  if(mode==='system')drawSystem(now);else if(mode==='surface')drawSurface(now);else drawMap(now);
  drawWarp(now);
  if(prevCv&&tab==='ship')drawPreview(now);
  if(now-lastUi>250){lastUi=now;updateHud()}
  if(!idleDone&&now-lastInput>2200){idleDone=true;saveView()}
  requestAnimationFrame(frame);
}
function saveView(){if(pilot){D.sp=pointAt(...pilot.pos).seed;_sp='';}D.cm=[cam.fx,cam.fy,cam.fz,cam.R,cam.yaw,cam.pitch].map(v=>+v.toFixed(4));D.op=[opt.color?1:0,opt.spin?1:0,opt.nav?1:0,opt.pet?1:0,opt.fac?1:0];D.c=seedStr(focusLoc(14));saveD();
  if(mode==='map'&&!travel)record('m',focusLoc())}

/* ═════════ Entrada: ratón, táctil y teclado ═════════ */
const tip=$('#tip'),ptrs=new Map();
const pos=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
function showTip(html,mx,my){tip.innerHTML=html;tip.style.display='block';const r=$('#stage').getBoundingClientRect();tip.style.left=Math.max(4,Math.min(r.width-tip.offsetWidth-6,mx+14))+'px';tip.style.top=Math.max(4,my-34)+'px'}
function pickStar(mx,my){let b=null,bd=12;for(const s of vis){if(s._f!==frameNo)continue;const d=Math.hypot(s._x-mx,s._y-my);if(d<bd){bd=d;b=s}}for(const s of ANCHSTARS){if(s._f!==frameNo)continue;const d=Math.hypot(s._x-mx,s._y-my)-3;if(d<bd){bd=d;b=s}}return b}
function pickPlanet(mx,my){for(const k of sysHits)if(Math.hypot(k.x-mx,k.y-my)<k.r)return k.planet;return null}
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{
  cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);lastInput=performance.now();idleDone=false;
  drag={x:e.clientX,y:e.clientY,moved:0,yaw:tg.yaw,pitch:tg.pitch,v3y:V3.yaw,v3p:V3.pitch,pan:e.shiftKey||e.button===2,f:[tg.fx,tg.fy,tg.fz]};
  if(ptrs.size===2){const a=[...ptrs.values()];drag.pinch={d0:Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]),R0:tg.R,m:[(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2],f:[tg.fx,tg.fy,tg.fz]};drag.moved=99}
});
function panFrom(f,dx,dy){if(!CP)return;const s=CP.dist/CP.F;tg.fx=f[0]-CP.cy*dx*s+CP.sp*CP.sy*dy*s;tg.fy=f[1]+CP.sy*dx*s+CP.sp*CP.cy*dy*s;tg.fz=f[2]+CP.cp*dy*s}
cv.addEventListener('pointermove',e=>{
  const [mx,my]=pos(e);
  if(drag&&ptrs.has(e.pointerId)){ptrs.set(e.pointerId,[e.clientX,e.clientY]);lastInput=performance.now();
    if(drag.pinch&&ptrs.size===2){const a=[...ptrs.values()],d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]),m=[(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2];if(mode!=='map'){if(drag.pinch.L0==null)drag.pinch.L0=MW.LT;MW.LT=clamp(drag.pinch.L0+Math.log2(Math.max(20,d)/drag.pinch.d0)*1.3,0,MWLMAX);return}tg.R=clamp(drag.pinch.R0*drag.pinch.d0/Math.max(20,d),1,3000);if(mode==='map')panFrom(drag.pinch.f,m[0]-drag.pinch.m[0],m[1]-drag.pinch.m[1]);return}
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved=Math.max(drag.moved,Math.hypot(dx,dy));
    if(drag.moved>4&&mode==='map'){tip.style.display='none';if(drag.pan)panFrom(drag.f,dx,dy);else{tg.yaw=drag.yaw-dx*.006;tg.pitch=clamp(drag.pitch+dy*.006,-1.45,1.45)}}
    else if(drag.moved>4){tip.style.display='none';mwArrastre(dx,dy,drag)}
    return}
  if(mode==='system'){const p=pickPlanet(mx,my);cv.style.cursor=p?'pointer':'default';if(p)showTip(`${esc(p.name)} · ${KIND[p.kind][0]}`,mx,my);else tip.style.display='none';return}
  if(mode!=='map'){tip.style.display='none';return}
  hoverStar=pickStar(mx,my);
  if(hoverStar){cv.style.cursor='pointer';const d=gd(shipStar(),hoverStar),sp=SPEC[D.ship.d],ok=d<=alcance()||D.cr;
    showTip(`<b>${esc(starName(hoverStar))}</b> · ${hoverStar.P.k}<br><span class="dim">${fmtLen(d)} de tu nave · ${ok?'<span class="ok">al alcance</span>':d<=legMax(D.ship.d)?'falta energía o materia':'requiere ruta'}${opt.pet&&infected(hoverStar)?' · <span style="color:#ff3b5c">astrófago</span>':''}</span>`,mx,my)}
  else if(shipHit&&Math.hypot(shipHit.x-mx,shipHit.y-my)<shipHit.r){cv.style.cursor='pointer';showTip('Tu nave · clic para centrar',mx,my)}
  else{cv.style.cursor=drag?'grabbing':'grab';tip.style.display='none'}
});
cv.addEventListener('pointerup',e=>{
  ptrs.delete(e.pointerId);if(ptrs.size)return;const d=drag;drag=null;if(!d||d.moved>=5)return;const [mx,my]=pos(e);
  if(mwClic(mx,my))return;
  if(mode==='system'){const p=MW.L<.6?pickPlanet(mx,my):null;if(p){selPlanet=p;setTab('carta');renderPanel()}return}
  if(mode!=='map')return;
  if(shipHit&&Math.hypot(shipHit.x-mx,shipHit.y-my)<shipHit.r){centerOnShip();return}
  const s=pickStar(mx,my);if(s)selectStar(s);
});
cv.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);drag=null});
cv.addEventListener('dblclick',e=>{if(mode!=='map')return;const s=pickStar(...pos(e));if(s)selectStar(s,true)});
cv.addEventListener('wheel',e=>{e.preventDefault();lastInput=performance.now();idleDone=false;if(mode!=='map'){mwZoom(-clamp(e.deltaY,-200,200)*.0016);return}tg.R=clamp(tg.R*Math.exp(clamp(e.deltaY,-200,200)*.0013),1,3000)},{passive:false});
const KEYS=new Set(['w','a','s','d','q','e','shift','arrowup','arrowdown','arrowleft','arrowright']);
document.addEventListener('keydown',e=>{
  if(e.target.matches('input,textarea,select'))return;if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();
  if(modalOpen){if(k==='escape'&&!dq.length&&$('#no'))$('#no').click();return}
  if(KEYS.has(k)){keys.add(k);if(k!=='shift')e.preventDefault();return}
  if(k==='f'){togglePilot();return}
  if(k==='escape'){if(mode==='surface'){mode='system';surf=null;refresh()}else if(mode==='system')exitToMap();else{selStar=null;route=null;renderPanel()}}
  else if(k==='home'||k==='.')centerOnShip();
  else if(mode!=='map'&&(k==='+'||k==='='||k==='-'))mwZoom(k==='-'?-.35:.35);else if(k==='+'||k==='=')tg.R=clamp(tg.R/1.4,1,3000);else if(k==='-')tg.R=clamp(tg.R*1.4,1,3000);
  else if(k==='enter'&&route&&!travel)startTravel();
  else if(k==='m')toggleDrawer();
  else if(k==='/'){e.preventDefault();$('#seedIn').focus()}
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());

/* ═════════ Pilotaje libre: la nave va a cualquier punto del espacio ═════════ */
function pilotConsume(d){
  if(!d)return true;if(D.cr){D.st.ly+=d;return true}const sp=SPEC[D.ship.d],s=D.st,k=d*sp.burn*consumoMul(),need=k*EN_POR;if(s.fuel<need||(s.mat||0)<k)return false;
  s.fuel-=need;s.mat-=k;const days=d*365.25*.32;s.days+=days;s.yrs+=d*1.05;s.ly+=d;if(sp.prov)s.prov=Math.max(0,s.prov-eaters()*days*(D.hib&&sp.hib?.15:1)*(1-(sp.farm||0)));return true;
}
function togglePilot(){if(!pilot&&rondaBloquea({k:'travel'})){toast(esc(MSG_RONDA));return}
  if(travel)return;if(NET.role==='client'){toast('En la sesión compartida sólo el anfitrión pilota a mano. Propón un destino.');return}if(pilot){stopPilot();return}if(mode!=='map')exitToMap();
  if(crewCount()<SPEC[D.ship.d].crew[0]){toast('Tripulación insuficiente para pilotar.');return}
  const p=shipPos();pilot={pos:[p[0],p[1],p[2]],dir:null,moved:0};selStar=null;route=null;flyTo(p[0],p[1],p[2],Math.min(Math.max(tg.R,4),40));
  toast('Pilotaje libre: <b>WASD</b> mover · <b>Q/E</b> bajar/subir · <b>Shift</b> turbo · rueda = velocidad/zoom · <b>F</b> para detenerte');refresh();
}
function stopPilot(){
  const p=pilot.pos;let best=null,bd=.5;starsNear(p[0],p[1],p[2],.5,(s,d)=>{if(d<bd){bd=d;best=s}});
  const moved=pilot.moved;pilot=null;
  if(best){D.sp=seedOf(best);_sp='';toast(`Te detienes junto a <b>${esc(starName(best))}</b>`,'Entrar al sistema',()=>enterSystem(best))}
  else{D.sp=pointAt(p[0],p[1],p[2]).seed;_sp='';toast(`Nave detenida en el espacio profundo · recorriste ${fmtLen(moved)}`)}
  if(moved>0){D.st.jumps++;record('j',D.sp,true);if(best)questEvent({type:'arrive',star:best})}
  ping=performance.now();saveD();refresh();
}
function centerOnShip(){if(travel)return;if(mode!=='map')exitToMap();const p=shipPos();flyTo(p[0],p[1],p[2],Math.max(legMax(D.ship.d)*1.3,8));ping=performance.now()}
$('#ctr').onclick=centerOnShip;
$('#zoom').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='spinBtn'){opt.spin=!opt.spin;syncToggles();saveView();return}if(mode!=='map'){mwZoom(+b.dataset.z>0?-.4:.4);return}tg.R=clamp(tg.R*(+b.dataset.z>0?1.5:1/1.5),1,3000);lastInput=performance.now()});
$('#toggles').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;opt[b.dataset.o]=!opt[b.dataset.o];syncToggles();saveView()});
function syncToggles(){document.querySelectorAll('#toggles button').forEach(b=>b.classList.toggle('on',!!opt[b.dataset.o]));$('#spinBtn').classList.toggle('on',opt.spin)}
$('#views').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||travel)return;if(b.dataset.v==='pilot'){togglePilot();return}if(pilot)stopPilot();if(mode!=='map')exitToMap();const T=A_BY('tceti'),S0=shipStar();
  if(b.dataset.v==='here'){selectStar(pointAt(cam.fx,cam.fy,cam.fz));return}
  if(b.dataset.v==='sol'){selStar=null;route=null;flyTo(SOL.gx,SOL.gy,SOL.gz,18,.5);renderPanel()}
  else if(b.dataset.v==='tau')selectStar(T,true);
  else if(b.dataset.v==='traj'){selectStar(T);flyTo((S0.gx+T.gx)/2,(S0.gy+T.gy)/2,(S0.gz+T.gz)/2,Math.max(gd(S0,T)*.85,8),.75)}
  else if(b.dataset.v==='gal'){flyTo(cam.fx,cam.fy,cam.fz,2500,.3)}
});
$('#backBtn').onclick=()=>{if(mode==='surface'){MW.LT=.7}else if(MW.LT>.02||MW.L>.02){MW.LT=0}else exitToMap()};
function toggleDrawer(force){const d=$('#drawer'),o=force!=null?force:!d.classList.contains('open');d.classList.toggle('open',o);$('#drawerBtn').classList.toggle('on',o)}
$('#drawerBtn').onclick=()=>toggleDrawer();

/* ═════════ Indicadores ═════════ */
const meter=(v,max,col)=>`<span class="mt"><i style="width:${clamp(v/max*100,0,100)}%;background:${col}"></i></span>`;
function updateHud(){
  const sp=SPEC[D.ship.d],s=D.st,c=crewCount(),aliveC=alive(),mor=aliveC.length?aliveC.reduce((a,m)=>a+m.mor,0)/aliveC.length:100,auton=sp.prov&&c?s.prov/(c*(D.hib&&sp.hib?.15:1)*(1-(sp.farm||0))):Infinity;
  let near=0;for(const v of vis)if(v._f===frameNo&&Math.hypot(v.gx-cam.fx,v.gy-cam.fy,v.gz-cam.fz)<=cam.R)near++;
  $('#info').innerHTML=`<div><span>RANGO</span><b>${fmtLen(cam.R)}</b></div><div><span>CAMPO CERCANO</span><b>${mode==='map'?fmtI(near):'—'}</b></div><div><span>SECTOR</span><b>${esc(focusLoc(0).head)}</b></div><div><span>DESTINO</span><b>${selStar?esc(starName(selStar)):'—'}</b></div>`;
  $('#hud').innerHTML=`<div><span>ENERGÍA NEG.</span><b>${s.fuel.toFixed(1)} / ${ENC()} ${EN_U}</b>${meter(s.fuel,ENC(),'#b48cff')}<em>materia ${fmtI(s.mat||0)} / ${fmtI(MATC())} t</em>${meter(s.mat||0,MATC(),'#e0aa46')}<em>alcance ${fmtLen(alcance())}</em></div>
   <div><span>PROVISIONES</span><b>${sp.prov?fmtI(s.prov)+' d-p':'—'}</b>${sp.prov?meter(s.prov,sp.prov,'#7ee787'):''}<em>${sp.prov?(isFinite(auton)?fmtI(auton)+' días':'∞'):'nave no tripulada'}${D.hib&&sp.hib?' · hibernación':''}</em></div>
   <div><span>TRIPULACIÓN</span><b>${c} / ${sp.crew[1]}</b>${meter(mor,100,mor<35?'#ff6b6b':'#78dcff')}<em>moral ${Math.round(mor)}%</em></div>
   <div><span>CASCO</span><b>${Math.round(s.hull)}%</b>${meter(s.hull,100,s.hull<35?'#ff6b6b':'#cfd6e2')}<em>minerales ${Math.round(s.min)} t</em></div>
   <div><span>MISIÓN</span><b>τ ${fmtT(s.days/365.25)}</b><em>Tierra ${(2026+s.yrs).toFixed(1)}</em></div>`;
  if(pilot&&tab==='carta'&&mode==='map')renderCarta();
  if(document.activeElement!==$('#seedIn'))$('#seedIn').value=seedStr(focusLoc());
  $('#banner').style.display=D.anon?'block':'none';$('#crTag').style.display=D.cr?'block':'none';
}
function refresh(){renderPanel();updateHud();syncToggles();$('#backBtn').style.display=mode==='map'?'none':'block';$('#pilotBtn').classList.toggle('on',!!pilot);$('#views').style.visibility=mode==='map'?'visible':'hidden'}

/* ═════════ Panel de mando ═════════ */
function setTab(t){tab=t;_shareT=0;document.querySelectorAll('.tabs button[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===t));document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id==='p-'+t));if(t!=='ship')prevCv=null;renderPanel()}
document.querySelectorAll('.tabs button[data-t]').forEach(b=>b.onclick=()=>setTab(b.dataset.t));
$('#drawerX').onclick=()=>toggleDrawer(false);
/* Se vuelve a pintar con cada cambio de la partida (también los que llegan del anfitrión), salvo mientras se escribe
   en un campo del panel; la pestaña Partida, que genera el QR, como mucho cada 3 s */
let _shareT=0;
function renderPanel(){if(tab==='sess'&&$('#sessDyn')){renderSessDyn();return}
  const ae=document.activeElement,pane=$('#p-'+tab);if(ae&&pane&&pane.contains(ae)&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))return;
  if(tab==='share'){if(Date.now()-_shareT<3000&&$('#shareBody'))return;_shareT=Date.now()}({carta:renderCarta,plan:renderPlan,ship:renderShip,crew:renderCrew,yo:renderYo,fac:renderFac,base:renderBases,sess:renderSess,hist:renderHist,nav:renderNav,share:renderShare})[tab]()}
let ACTS=[];const A=(label,fn,dis,cls)=>{ACTS.push(fn);return`<button class="sm ${cls||''}" data-a="${ACTS.length-1}" ${dis?'disabled':''}>${label}</button>`};
const bindActs=el=>el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>ACTS[+b.dataset.a]());
function starKV(st){const P=st.P,ship=shipStar();return`<div class="kv"><span>Clase</span><span>${P.k} · ${esc(P.lab)}</span><span>Temperatura</span><span>${fmtI(P.T)} K</span><span>Luminosidad</span><span>${P.lum<.01?P.lum.toExponential(1):P.lum.toFixed(2)} L☉</span>
  <span>Masa · radio</span><span>${P.mass.toFixed(2)} M☉ · ${P.rad.toFixed(2)} R☉</span><span>Desde tu nave</span><span>${fmtLen(gd(ship,st))}</span><span>Desde el Sol</span><span>${fmtLen(Math.hypot(st.gx,st.gy,st.gz))}</span><span>Semilla</span><span class="seed">${esc(sSeed(st))}</span><span>Territorio</span><span>${esc(terLab(facOf(st)))}</span></div>`}
function renderCarta(){
  const el=$('#p-carta');ACTS=[];
  if(mode==='system')return systemPanel(el);if(mode==='surface')return surfacePanel(el);
  const ship=shipStar(),sp=SPEC[D.ship.d],ml=legMax(D.ship.d);let h='';
  {const p=PLG();if(p.on)h+=`<div class="card"><div class="kick" style="color:#ff3b5c">PLAGA · ${esc(PLN().toUpperCase())}</div><div class="res"><span>Población</span><span>${Math.round(p.P*100)} %</span></div>${meter(p.P,1,'#ff3b5c')}<div class="res"><span>Depredador</span><span>${Math.round(p.Q*100)} %</span></div>${meter(p.Q,1,'#7ee787')}<p class="note">Se propaga en tiempo real; donde vive su depredador no prospera y algunos sistemas son inmunes. Actívalo con «Petrova» para verla en la carta.</p></div>`}
  if(travel){h+=`<div class="kick">EN TRÁNSITO</div><h2>Rumbo a ${esc(starName(travel.legs[travel.legs.length-1].to))}</h2><p class="note">Salto ${travel.i+1} de ${travel.legs.length}.${D.hib&&sp.hib?' La tripulación duerme en las cápsulas.':''}</p>${travel.legs.length>travel.i+1?A('Detenerse tras este salto',()=>{travel.legs.length=travel.i+1;renderPanel()}):''}`;el.innerHTML=h;bindActs(el);return}
  if(pilot){
    let nb=null,nd=1e9;starsNear(pilot.pos[0],pilot.pos[1],pilot.pos[2],12,(s,d)=>{if(d<nd){nd=d;nb=s}});
    h+=`<div class="kick">PILOTAJE LIBRE</div><h2>${esc(D.ship.n||SHIPS[D.ship.d].n)}</h2><p class="note">Mueve la nave a cualquier lugar: WASD/flechas, Q/E para bajar o subir, Shift para turbo. La velocidad depende del zoom.${D.cr?' Modo creativo: sin consumo.':' Consume '+sp.burn+' t de astrófago por año luz.'}</p>
    <div class="kv"><span>Posición</span><span>${pilot.pos.map(v=>v.toFixed(2)).join(', ')} al</span><span>Recorrido</span><span>${fmtLen(pilot.moved)}</span><span>Estrella más cercana</span><span>${nb?esc(starName(nb))+' · '+fmtLen(nd):'ninguna a menos de 12 al'}</span></div>
    <div class="row">${A('■ Detener la nave aquí',stopPilot,0,'pri')}${nb?A('Ir hasta '+esc(starName(nb)),()=>{pilot.pos=[nb.gx,nb.gy,nb.gz-.01];stopPilot()},!D.cr&&alcance()<nd):''}</div>`;
    el.innerHTML=h;bindActs(el);return;
  }
  if(selStar&&selStar.point){
    const s=selStar;h+=`<div class="kick">DESTINO LIBRE</div><h2>Punto en el espacio profundo</h2><div class="kv"><span>Posición</span><span>${[s.gx,s.gy,s.gz].map(v=>v.toFixed(2)).join(', ')} al</span><span>Desde tu nave</span><span>${fmtLen(gd(ship,s))}</span><span>Desde el Sol</span><span>${fmtLen(Math.hypot(s.gx,s.gy,s.gz))}</span><span>Semilla</span><span class="seed">${esc(s.seed)}</span></div>`;
  }
  if(selStar){
    const s=selStar,here=sameStar(s,ship),inf=infected(s);
    if(!s.point)h+=`<div class="kick">SISTEMA ESTELAR</div><h2 style="color:${opt.pet&&inf?'#ff3b5c':'#fff'}">${esc(starName(s))}</h2><div class="row">${s.anchor?'<span class="tag fx">mapa de la película</span>':''}${plagaTag(s)}${destino(s)?`<span class="tag">${FATE[destino(s)].ic} ${FATE[destino(s)].n}</span>`:''}${estacion(s)?'<span class="tag hz">🛰 estación</span>':''}${D.disc[sSeed(s)]?'<span class="tag hz">registrado</span>':''}</div>
    ${s.anchor?`<p class="note">${esc(s.anchor.blurb)}</p>`:''}${starKV(s)}`;
    if(here)h+=`<p class="ok">Tu nave está en este sistema.</p><div class="row">${A('Entrar al sistema',()=>enterSystem(s),0,'pri')}</div>`;
    else if(!route||route.none)h+=`<p class="bad">No hay ruta con saltos de hasta ${fmtLen(ml)} dentro de un corredor razonable${gd(ship,s)>400?' (máx. 400 al por plan)':''}. Usa el <b>pilotaje libre</b> (tecla F), el modo creativo o un destino intermedio.</p><div class="row">${A('✈ Pilotar libremente',togglePilot,0,'pri')}${A('+ Añadir al plan',()=>addToPlan(s))}${s.point?'':A('Ver sistema (sondeo remoto)',()=>enterSystem(s))}</div>`;
    else{
      const t=route.tot,L0=route.legs[0],err=route.legs.find(l=>l.err),vmax=Math.max(...route.legs.map(l=>l.v));
      h+=`<h3>Cálculo de navegación</h3><div class="calc"><span>Distancia</span><span>${fmtLen(t.d)} · ${route.legs.length} salto${route.legs.length>1?'s':''}</span>
      <span>Perfil</span><span>${sp.acc} g, volteo a mitad de camino</span><span>Velocidad máx.</span><span>${vmax.toFixed(vmax>.99?4:3)} c (γ ${Math.max(...route.legs.map(l=>l.g)).toFixed(1)})</span>
      <span>Tiempo a bordo</span><span>${fmtT(t.tau)}</span><span>Tiempo en la Tierra</span><span>${fmtT(t.tE)} · llegada ${(2026+D.st.yrs+t.tE).toFixed(1)}</span>
      <span>Energía negativa</span><span class="${D.cr||t.fuel<=D.st.fuel?'ok':'bad'}">${t.fuel.toFixed(1)} de ${D.st.fuel.toFixed(1)} ${EN_U}</span><span>Materia</span><span class="${D.cr||t.mat<=D.st.mat?'ok':'bad'}">${fmtI(t.mat)} de ${fmtI(D.st.mat||0)} t</span>${route.legs.some(l=>l.free)?'<span>Agujero negro</span><span class="ok">⚫ saltos sin gasto</span>':''}
      <span>Provisiones</span><span class="${!sp.prov||D.cr||t.prov<=D.st.prov?'ok':'bad'}">${sp.prov?fmtI(t.prov)+' de '+fmtI(D.st.prov)+' días-persona':'no aplica'}</span></div>
      ${sp.hib?`<label class="chk"><input type="checkbox" id="hibT" ${D.hib?'checked':''}> Hibernación en cápsulas de coma (provisiones ×0,15, riesgo al despertar)</label>`:''}
      ${err?`<p class="bad">✗ ${esc(cap(err.err))}${route.legs.indexOf(err)>0?` (salto ${route.legs.indexOf(err)+1})`:''}</p>`:'<p class="ok">✓ Todo listo para el salto.</p>'}
      <div class="row">${A(NET.role==='client'||(NET.role==='host'&&NET.demo&&NET.conns.size)?'🗳 Proponer viaje':'▶ Iniciar viaje',startTravel,!!L0.err&&NET.role!=='client','pri')}${A('+ Añadir al plan',()=>addToPlan(s))}${s.point?'':A('Ver sistema',()=>enterSystem(s))}${A('Centrar',()=>flyTo(s.gx,s.gy,s.gz,Math.min(tg.R,16)))}</div>
      ${route.legs.length>1?`<h3>Escalas</h3><div class="lst">${route.legs.map((l,i)=>`<div class="item ${l.err?'err':l.pend?'pend':''}"><span class="dim">${i+1}</span><div class="m"><b>${esc(starName(l.to))}</b><i>${fmtLen(l.d)} · τ ${fmtT(l.tau)} · ${l.fuel.toFixed(1)} t${l.err?' · '+esc(l.err):''}</i></div></div>`).join('')}</div>`:''}`;
    }
    h+=`<div class="row">${A('Quitar selección',()=>{selStar=null;route=null;renderPanel()})}</div>`;
  }else{
    const fl=focusLoc(),list=[];starsNear(ship.gx,ship.gy,ship.gz,ml,(s,d)=>{if(!sameStar(s,ship))list.push([d,s])});list.sort((a,b)=>a[0]-b[0]);
    h+=`<div class="kick">REGIÓN</div><h2>${esc(regionName(fl))}</h2><div class="seed">${esc(seedStr(fl))}</div>
    <div class="kv"><span>Sector</span><span>${esc(fl.head)} · (${fl.sx}, ${fl.sy}, ${fl.sz})</span><span>Foco (x, y, z)</span><span>${[cam.fx,cam.fy,cam.fz].map(v=>v.toFixed(2)).join(', ')} al</span><span>Desde el Sol</span><span>${fmtLen(Math.hypot(cam.fx,cam.fy,cam.fz))}</span><span>Densidad</span><span>${Math.round(density(cam.fx,cam.fy,cam.fz)*100)}%</span></div>
    <div class="row">${A('⌖ Fijar destino en el foco',()=>selectStar(pointAt(cam.fx,cam.fy,cam.fz)),0,'pri')}${A('✈ Pilotar',togglePilot)}${A('Copiar semilla',()=>copy(seedStr(fl),'Semilla copiada'))}${A('Copiar enlace',()=>copy(baseUrl()+'#s='+encodeURIComponent(seedStr(fl)),'Enlace copiado'))}</div>
    <h3>Sistemas a un salto de ${esc(starName(ship))} (máx. ${fmtLen(ml)})</h3><div class="lst">${list.slice(0,14).map(([d,s],i)=>{ACTS.push(()=>selectStar(s,true));const ok=D.cr||d<=alcance();
      return`<div class="item" data-a="${ACTS.length-1}"><span style="color:${opt.pet&&infected(s)?'#ff3b5c':s.P.col}">●</span><div class="m"><b>${esc(starName(s))}</b><i>${s.P.k} · ${fmtLen(d)}${D.disc[sSeed(s)]?' · registrado':''}</i></div><span class="${ok?'ok':'bad'}">${ok?'✓':'✗'}</span></div>`}).join('')||'<p class="note">Ninguna estrella al alcance. Recolecta astrófago o cambia de nave.</p>'}</div>
    <p class="note">Clic en una estrella para calcular el salto · «Fijar destino» viaja a cualquier punto (la retícula del centro) · «Pilotar» (F) mueve la nave libremente.</p>`;
  }
  el.innerHTML=h;bindActs(el);
  const hb=$('#hibT');if(hb)hb.onchange=()=>{D.hib=hb.checked?1:0;saveD();if(route&&route.stars)route=buildLegs(route.stars);renderPanel();updateHud()};
}
function systemPanel(el){
  const S=SYS,here=sameStar(S.star,shipStar()),sp=SPEC[D.ship.d],sk=sSeed(S.star),s=D.st;
  let h=`<div class="kick">SISTEMA · ${here?'EN ÓRBITA':'VISTA REMOTA'}</div><h2>${esc(S.name)}</h2><div class="note">${esc(S.P.lab)} · ${S.planets.length} planeta${S.planets.length===1?'':'s'}${S.belts.length?' · '+S.belts.length+' cinturón':''}</div>
  <div class="row">${A('⤒ Volver a la carta',exitToMap)}${!here?A('Trazar ruta hasta aquí',()=>{const st=S.star;exitToMap();selectStar(st,true)},0,'pri'):''}</div>`;
  h+=`<p class="note story">${sysLore(S).map(esc).join(' ')}</p>`;
  if(here){
    const used=D.ex[sk+':-1']||0;h+=`<h3>Acciones en órbita</h3><div class="row">`;
    const u=k=>D.ex[sk+':'+k]||0;
    h+=A(`⛏ Extraer materia · 15 d (${3-u('mat')}/3)`,()=>orbitAct('mat',0,'Extraer materia en '+S.name),(s.mat||0)>=MATC()||u('mat')>=3,'pri');
    if(destino(S.star))h+=A(`${FATE[destino(S.star)].ic} Recolectar energía negativa · 20 d (${3-u('en')}/3)`,()=>orbitAct('en',0,'Recolectar energía negativa en '+S.name),s.fuel>=ENC()||u('en')>=3,'pri');
    h+=A(`🌱 Cultivar con luz estelar · 15 d (${3-u('luz')}/3)`,()=>orbitAct('luz',0,'Cultivar con la luz de '+S.name),s.prov>=sp.prov||u('luz')>=3||S.P.lum<.02);
    h+=A('Descansar · 10 d',()=>orbitAct('rest',0,'Descansar 10 días en '+S.name));
    h+=A('Reparar casco · 5 d (10 t)',()=>orbitAct('rep',0,'Reparar el casco'),s.min<10||s.hull>=100);
    h+=A('Escanear todo',()=>orbitAct('scanall',0,'Escanear todos los planetas de '+S.name));
    if(S.star.anchor&&S.star.anchor.id==='sol')h+=A('Reabastecer en la Tierra · 60 d',()=>orbitAct('earth',0,'Reabastecer en la Tierra (60 días)'),0,'pri');
    h+=`</div>`;
    const due=FX().mis.filter(m=>misHere(m,S.star));if(due.length)h+=`<h3>Contratos aquí</h3><div class="row">${due.map(m=>A(`${MTY[m.ty].ic} Cumplir: ${esc(MTY[m.ty].n)} (${esc(FAC[m.g].s)})`,()=>cmd({k:'fac',a:'do',id:m.id},'Cumplir el contrato '+m.id),NET.role==='client','pri')).join('')}</div>`;
    h+=estacionHtml(S);h+=boardHtml(S);
  }else h+=`<p class="note">Datos de sondeo remoto. Viaja hasta aquí para escanear, aterrizar y recolectar.</p>`;
  h+=`<div class="row">${A('+ Añadir este sistema al plan',()=>addToPlan(S.star))}</div>`;
  h+=`<h3>Planetas</h3><div class="lst">`;
  S.planets.forEach((p,i)=>{
    const info=planetInfo(S,i),sc=D.scan[info.key]||!here&&false,open=p===selPlanet;ACTS.push(()=>{selPlanet=open?null:p;renderPanel()});
    h+=`<div class="item col ${open?'sel':''}"><div class="rowi" data-a="${ACTS.length-1}"><span style="color:${KIND[p.kind][1]}">●</span><div class="m"><b>${esc(p.name)}</b><i>${KIND[p.kind][0]} · ${p.a.toFixed(2)} UA${p.hz?' · habitable':''}${info.colony&&sc?' · colonia':''}</i></div></div>`;
    if(open){
      h+=`<div class="kv"><span>Temperatura</span><span>${p.T} K (${Math.round(p.T-273)} °C)</span><span>Gravedad</span><span>${p.g.toFixed(2)} g</span><span>Radio</span><span>${p.r.toFixed(2)} R⊕</span><span>Atmósfera</span><span>${esc(info.atm)}${info.breath?' · respirable':''}</span><span>Año</span><span>${p.period<700?p.period.toFixed(0)+' días':(p.period/365.25).toFixed(1)+' años'}</span><span>Lunas</span><span>${p.moons}${p.ring?' · anillos':''}</span>${orbitaHtml(S,i)}</div>`;
      if(sc&&!info.gas)h+=bioHtml(S,i);
      h+=`<div class="row">${A(info.gas?'🔭 Acercarse':here?'⬇ Descender (rueda o pellizco)':'🔭 Acercarse (sondeo)',()=>{MW.LT=info.gas?1.2:here?1.2:1.6})}</div>`;
      if(p.note)h+=`<p class="note">${esc(p.note)}</p>`;
      if(sc){h+=info.hz.length?`<div class="hzl">${info.hz.map(z=>`<span class="tag ${z[4]?'pet':''}" title="${esc(z[3])}">${esc(z[0])}</span>`).join('')}</div>`:'<p class="ok">Sin condiciones adversas.</p>';
        if(!info.gas)h+=`<p class="note">Puntos de interés: ${info.pois.map(n=>esc(n)+(D.ex[info.key+':'+n]?' ✓':'')).join(' · ')}</p>`}
      if(here){h+=`<div class="row">`;
        if(!sc)h+=A('Escanear · 2 d',()=>orbitAct('scan',i,'Escanear '+p.name));
        if(info.gas)h+=A('Sonda atmosférica · 4 d',()=>orbitAct('gas',i,'Sonda atmosférica a '+p.name));
        else h+=A(sp.land?'⬇ Aterrizar':'⬇ Enviar lanzadera',()=>land(i),0,'pri');
        h+=`</div>`}
      const civ=civInfo(S,i);
      if(civ&&(sc||civ.home||!here)){const rp=repOf(civ);h+=`<div class="card"><div class="kick">CIVILIZACIÓN</div><b>${esc(civ.name)}</b> <span class="tag">${TECH[civ.tech]}</span>${civ.tech?`<span class="tag">${esc(DISP[civ.disp]?DISP[civ.disp][0]:'')}</span><span class="tag ${rp>=20?'hz':rp<-10?'pet':''}">${repLab(rp)} (${rp})</span>`:''}
        <p class="note">${civ.tech?`${esc(civ.sp)} · ~${fmtNum(civ.pop)} habitantes. `:''}${civ.hist.map(esc).join(' ')}</p>
        ${here&&civ.tech&&!civ.home?`<div class="row">${A('Contactar · 5 d',()=>cmd({k:'civ',i,a:'contact'},'Contactar a los '+civ.name),!!D.ex[civ.key+':contact'])}${A('Comerciar (15 t)',()=>cmd({k:'civ',i,a:'trade'},'Comerciar con los '+civ.name),rp<20)}${A('Aprender',()=>cmd({k:'civ',i,a:'learn'},'Aprender de los '+civ.name),rp<20||!!D.ex[civ.key+':learn'])}${A('Reclutar',()=>cmd({k:'civ',i,a:'recruit'},'Reclutar a un voluntario '+civ.name),rp<40||!!D.ex[civ.key+':rec'])}</div>`:''}</div>`}
      else if(here&&!sc)h+=`<p class="note">Escanea el planeta para saber si está habitado.</p>`;
      if(!info.gas&&(sc||!here))h+=baseCardHtml(S,i,here);
      if(!info.gas)h+=`<div class="row">${A('+ Al plan: explorar '+esc(p.name),()=>addToPlan(S.star,'explore:'+i))}${civ&&civ.tech&&!civ.home?A('+ Al plan: contactar',()=>addToPlan(S.star,'civ:'+i)):''}</div>`;
    }
    h+=`</div>`;
  });
  h+=`</div>`;el.innerHTML=h;bindActs(el);
}
function surfacePanel(el){
  const {info}=surf,p=info.p,sp=SPEC[D.ship.d];
  let h=`<div class="kick">SUPERFICIE · ${sp.land?'NAVE POSADA':'LANZADERA'}</div><h2>${esc(p.name)}</h2>
  <div class="kv"><span>Tipo</span><span>${KIND[p.kind][0]}</span><span>Temperatura</span><span>${Math.round(p.T-273)} °C</span><span>Gravedad</span><span>${p.g.toFixed(2)} g</span><span>Atmósfera</span><span>${esc(info.atm)}${info.breath?' · respirable':''}</span></div>
  ${bioHtml(SYS,surf.i)}<p class="note">Rueda o pellizco para subir y bajar; arrastra para recorrer la superficie. Toca un punto de interés para explorarlo.</p>
  <h3>Condiciones</h3>${info.hz.length?`<div class="lst">${info.hz.map(z=>`<div class="item"><span class="${z[4]?'bad':'dim'}">${z[4]?'✦':'▲'}</span><div class="m"><b>${esc(z[0])}</b><i>${esc(z[3])} Dificultad +${z[2]} · mitiga ${STATN[z[1]]}</i></div></div>`).join('')}</div>`:'<p class="ok">Condiciones benignas.</p>'}
  <h3>Puntos de interés</h3><div class="lst">`;
  for(const n of info.pois){const P=POI[n],done=D.ex[info.key+':'+n];h+=`<div class="item"><span class="${done?'ok':''}">${done?'✓':'◆'}</span><div class="m"><b>${esc(n)}</b><i>${esc(P.tx)} ${STATN[P.k]} ${P.dc} · ${P.days} d</i></div>${done?'':A('Expedición',()=>openExpedition(info,n),0,'pri')}</div>`}
  h+=`</div>`;const civ=civInfo(SYS,surf.i);
  if(civ)h+=`<h3>Habitantes</h3><p class="note"><b>${esc(civ.name)}</b> · ${TECH[civ.tech]}. ${civ.hist.map(esc).join(' ')}</p>`;
  h+=`<div class="row">${A('⤒ Despegar',()=>{MW.LT=.7})}</div>`;
  el.innerHTML=h;bindActs(el);
}
function renderShip(){
  const el=$('#p-ship'),s=D.ship,S=SHIPS[s.d],sp=SPEC[s.d],st=D.st,atSol=sameStar(shipStar(),SOL);ACTS=[];
  const refs=REFS.filter(r=>r[1]<sp.len).slice(-2).concat(REFS.filter(r=>r[1]>=sp.len).slice(0,1)),mx=Math.max(sp.len,...refs.map(r=>r[1]));
  el.innerHTML=`<canvas id="shipPrev"></canvas><div class="note" style="text-align:center">Arrastra para girarla</div>
  <div class="kick">${esc(S.n.toUpperCase())}</div><h2>${esc(s.n||S.n)}</h2><p class="note">${esc(S.d)}</p>
  <h3>Escala real</h3>${[[`${s.n||S.n}`,sp.len,1],...refs.map(r=>[r[0],r[1],0])].sort((a,b)=>a[1]-b[1]).map(([n,v,me])=>`<div class="scale-row ${me?'me':''}"><span>${esc(n)}</span><i style="width:${Math.max(1,v/mx*100)}%"></i><span>${fmtI(v)} m</span></div>`).join('')}
  ${sp.extra?`<p class="note">Más ${esc(sp.extra)}.</p>`:''}<p class="note">En la carta la nave es un símbolo: a escala real mediría una diez billonésima de píxel.</p>
  <h3>Especificaciones</h3><div class="kv"><span>Eslora</span><span>${fmtI(sp.len)} m</span><span>Masa seca</span><span>${fmtI(sp.mass)} t</span><span>Motor</span><span>Curvatura · ${sp.acc} g</span><span>Energía negativa</span><span>${fmtI(ENC())} ${EN_U} (${+(sp.burn*EN_POR*consumoMul()).toFixed(2)}/al)</span><span>Materia</span><span>${fmtI(MATC())} t (${+(sp.burn*consumoMul()).toFixed(2)} t/al)</span><span>Salto máximo</span><span>${fmtLen(legMax(s.d))}</span><span>Bodega</span><span>${fmtI(sp.cargo)} t</span><span>Tripulación</span><span>${sp.crew[0]}–${sp.crew[1]}</span><span>Extras</span><span>${[sp.hib&&'cápsulas de coma',sp.land&&'aterriza',!sp.land&&'lanzadera',sp.solar&&'recarga solar',sp.farm&&'granjas'].filter(Boolean).join(', ')}</span></div>
  <h3>Estado</h3>
  <div class="res"><span>Energía negativa</span><span>${st.fuel.toFixed(1)} / ${ENC()} ${EN_U}</span></div>${meter(st.fuel,ENC(),'#b48cff')}
  <div class="res"><span>Materia</span><span>${fmtI(st.mat||0)} / ${fmtI(MATC())} t</span></div>${meter(st.mat||0,MATC(),'#e0aa46')}
  <div class="res"><span>Provisiones</span><span>${sp.prov?fmtI(st.prov)+' / '+fmtI(sp.prov):'—'}</span></div>${sp.prov?meter(st.prov,sp.prov,'#7ee787'):''}
  <div class="res"><span>Casco</span><span>${Math.round(st.hull)}%</span></div>${meter(st.hull,100,'#cfd6e2')}
  <div class="res"><span>Minerales</span><span>${Math.round(st.min)} / ${fmtI(sp.cargo)} t</span></div>${meter(st.min,sp.cargo,'#9b9186')}
  ${sp.hib?`<label class="chk"><input type="checkbox" id="hib" ${D.hib?'checked':''}> Hibernar a la tripulación durante los saltos</label>`:''}
  <label class="chk"><input type="checkbox" id="cre" ${D.cr?'checked':''}> Modo creativo (sin consumo de recursos)</label>
  <div class="row">${A('Reparar casco (10 t → +12%)',()=>orbitAct('rep',0,'Reparar el casco'),st.min<10||st.hull>=100||shipStar().point)}${A('📡 Pedir rescate',()=>{if(confirm('Una nave de Ad Astra remolcará la tuya hasta la Tierra. Pierdes la carga y pasan 10 años. ¿Continuar?'))cmd({k:'rescue'},'Pedir rescate a la Tierra')},!!travel)}</div>
  ${emergenciaHtml()}
  <h3>Aditamentos (${(D.ship.mods||[]).length}/${modSlots()} huecos)</h3>${(D.ship.mods||[]).length?`<div class="lst">${D.ship.mods.map(k=>`<div class="item"><span>${MODS[k].ic}</span><div class="m"><b>${esc(MODS[k].n)}</b><i>${esc(MODS[k].d)}</i></div>${estacion(shipStar())?A('Desmontar',()=>cmd({k:'tienda',q:'desm:'+k},'Desmontar '+MODS[k].n),NET.role==='client'):''}</div>`).join('')}</div>`:'<p class="note">Ninguno. Se compran e instalan en las estaciones de comercio.</p>'}
  <h3>Bonos de rol</h3>${bonosRol().length?`<ul class="note">${bonosRol().map(([,t])=>`<li>${esc(t)}</li>`).join('')}</ul>`:'<p class="note">Nadie a bordo con un rol activo.</p>'}<p class="note">Además, cada tripulante tiene +1 en la estadística de su rol.</p>
  <h3>Comodidad de la tripulación</h3><p class="note">${(INCOMODA[D.ship.d]||[]).length&&!hasMod('habitat')?`Esta nave no está pensada para: ${esc(INCOMODA[D.ship.d].join(', '))}. Viajan incómodos (−1 a todo y pierden moral).`:'Todas las especies viajan cómodas en esta nave.'}${alive().filter(incomodo).length?` A bordo: ${esc(alive().filter(incomodo).map(m=>m.nm).join(', '))}.`:''}</p>
  ${holdHtml()}
  <h3>Astillero ${atSol||D.cr?'':'<span class="dim">(sólo en el Sistema Solar o en modo creativo)</span>'}</h3>
  <div class="ships">${Object.entries(SHIPS).map(([k,v])=>`<button data-k="${k}" class="${k===s.d?'on':''}" ${atSol||D.cr||k===s.d?'':'disabled'}>${shipImg(k,s.c1,s.c2,52)}<span>${v.n}</span><span class="dim">${fmtI(SPEC[k].len)} m</span></button>`).join('')}</div>
  <h3>Personalizar</h3><div class="field"><label>Nombre</label><input id="sn" maxlength="24" placeholder="${esc(S.n)}" value="${esc(s.n)}"></div>
  <div class="field"><label>Color 1</label><input id="sc1" type="color" value="${esc(s.c1)}"></div><div class="field"><label>Color 2</label><input id="sc2" type="color" value="${esc(s.c2)}"></div>`;
  bindActs(el);bindMv(el);prevCv=$('#shipPrev');const pc=prevCv,r=pc.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);pc.width=Math.max(10,r.width*d);pc.height=Math.max(10,r.height*d);
  pc.onpointerdown=e=>{pc.setPointerCapture(e.pointerId);prevSt.drag={x:e.clientX,y:e.clientY,yaw:prevSt.yaw,pitch:prevSt.pitch}};
  pc.onpointermove=e=>{if(!prevSt.drag)return;prevSt.yaw=prevSt.drag.yaw-(e.clientX-prevSt.drag.x)*.012;prevSt.pitch=clamp(prevSt.drag.pitch+(e.clientY-prevSt.drag.y)*.01,-1.2,1.3);prevSt.last=performance.now()};
  pc.onpointerup=()=>{prevSt.drag=null;prevSt.last=performance.now()};
  if(NET.role==='client')el.querySelectorAll('#hib,#cre,#sn,#sc1,#sc2').forEach(x=>x.disabled=true);
  el.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(k===s.d)return;if(!confirm(`¿Cambiar a ${SHIPS[k].n}? La nueva nave sale del astillero con tanques y despensa llenos.`))return;
    cmd({k:'ship',d:k},'Cambiar la nave por '+SHIPS[k].n)});

  if($('#hib'))$('#hib').onchange=e=>{D.hib=e.target.checked?1:0;saveD();updateHud()};
  $('#cre').onchange=e=>{D.cr=e.target.checked?1:0;saveD();refresh()};
  $('#sn').oninput=e=>{D.ship.n=e.target.value.slice(0,24);saveD()};
  $('#sc1').oninput=e=>{D.ship.c1=e.target.value;saveD()};$('#sc2').oninput=e=>{D.ship.c2=e.target.value;saveD()};$('#sc1').onchange=$('#sc2').onchange=renderShip;
}
function drawPreview(now){
  const c=prevCv;if(!c||!c.isConnected){prevCv=null;return}const g=c.getContext('2d'),d=c.width/(c.getBoundingClientRect().width||1);
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);g.setTransform(d,0,0,d,0,0);const w=c.width/d,h=c.height/d;
  if(!prevSt.drag&&now-prevSt.last>1500&&!RM)prevSt.yaw+=.01;
  g.strokeStyle='rgba(225,232,245,.18)';g.lineWidth=1;for(let i=-4;i<=4;i++){g.beginPath();g.moveTo(w/2+i*w*.08-w*.2,h*.86);g.lineTo(w/2+i*w*.11,h*.72);g.stroke()}
  drawShip3D(g,w/2,h*.48+Math.sin(now/700)*3,Math.min(w,h)*.9,prevSt.yaw,prevSt.pitch,D.ship,now/1000);
}
/* Barra de estadística: si pasa de 12 se vuelve a llenar por encima con otro color (×2, ×3…) para no salirse */
const LAPC=['#cfd6e2','#e0aa46','#ff7b72','#d2a8ff','#7ee787'];
function statBar(v){v=Math.max(0,v);const lap=v>12?Math.floor((v-1)/12):0,r=v-lap*12;return`<span class="sb" style="${lap?'background:'+LAPC[(lap-1)%LAPC.length]:''}" title="${v}"><i style="width:${(r/12*100).toFixed(1)}%;background:${LAPC[lap%LAPC.length]}"></i>${lap?`<em class="lap">×${lap+1}</em>`:''}</span>`}
/* Mi ficha: el personaje de este jugador, en tiempo real (se repinta con cada cambio de la partida) */
function miPersonaje(){return D.crew.find(m=>m.mid&&m.st!=='perdido'&&(NET.role?m.pid===NET.me:true))||null}
function renderYo(){const el=$('#p-yo'),m=miPersonaje();ACTS=[];
  if(!m){el.innerHTML=`<div class="kick">MI FICHA</div><h2>Sin personaje</h2><p class="note">Sube tu credencial de Members para ver aquí tu personaje en tiempo real.</p><div class="row">${A('⬆ Subir mi ficha',subirCredencial,0,'pri')}</div>`;bindActs(el);return}
  const b=m.bz?baseById(m.bz):null,es=m.esp?starFromSeed(m.esp):null,up=m.s0?KS.filter(k=>m.s[k]!==m.s0[k]).map(k=>`${STATN[k]} ${m.s0[k]}→${m.s[k]}`).join(', '):'',dv=Math.max(0,Math.round(D.st.days-(m.d0||0)));
  el.innerHTML=`<div class="kick">MI FICHA · EN TIEMPO REAL</div><div class="dh">${portrait(m)}<div><h2 style="margin:0">${esc(m.nm)}</h2><div class="note">${esc(m.sp)} · ${ROLES[m.role]} · nivel ${m.lv}${m.mid?' · '+esc(m.mid):''}</div>${m.trf?`<div class="note">🔀 traspasado desde ${esc(m.trf.cn||m.trf.cr)}</div>`:''}</div></div>
  <p class="${m.st==='ok'?'ok':'bad'}">${m.st==='ok'?'En la ronda':b?'🏠 En '+esc(b.n):es?'🤝 Esperando en '+esc(starName(es)):'❄ Animación suspendida'}${incomodo(m)?' · ⚠ incómodo en esta nave':''}</p>
  <div class="res"><span>Salud</span><span>${Math.round(m.hp)}%</span></div>${meter(m.hp,100,m.hp<50?'#ff6b6b':'#7ee787')}
  <div class="res"><span>Moral</span><span>${Math.round(m.mor)}%</span></div>${meter(m.mor,100,m.mor<30?'#ff6b6b':'#78dcff')}
  <div class="res"><span>Experiencia</span><span>${Math.round(m.xp)} / ${30*m.lv}</span></div>${meter(Math.min(m.xp,30*m.lv),30*m.lv,'#e0aa46')}
  <div class="stats">${STATS.map(([k,n])=>`<span>${n}${m.role===k?' ★':''}</span>${statBar(eff(m,k))}<b>${eff(m,k)}</b>`).join('')}</div>
  <p class="note">★ +1 por tu rol. <b>${esc(m.tr)}</b>: ${esc((TRAITS[m.tr]||{d:''}).d)}</p>
  <div class="kv"><span>Días de vuelo</span><span>${fmtI((m.fv0||0)+dv)} (${fmtI(dv)} en esta partida)</span><span>Misiones</span><span>${m.ms0||0}</span>${up?`<span>Mejoras</span><span>${esc(up)}</span>`:''}</div>
  ${memberInvHtml(m)}
  ${m.mid?`<div class="row">${A('🏁 Mi ficha actualizada en Members',()=>miFicha(m),0,'pri')}</div>`:''}`;bindActs(el);bindMv(el)}
function renderCrew(){
  const el=$('#p-crew'),sp=SPEC[D.ship.d],a=alive(),lost=D.crew.filter(m=>m.st==='perdido'),zz=suspended();ACTS=[];
  el.innerHTML=`<div class="kick">FICHAS DE TRIPULACIÓN</div><h2>${crewCount()} en activo${zz.length?` · ${zz.length} ❄`:''}</h2><p class="note">Mínimo para operar: ${sp.crew[0]} · capacidad ${sp.crew[1]}${D.st.extra?` · ${fmtI(D.st.extra)} en la tripulación general`:''}.</p>
  <div class="row">${A('⬆ Subir ficha de Members',()=>openCardUpload(card=>{if(NET.role==='client')NET.host.send({t:'hello',name:D.n||card.n,card});else{toast(esc(addCardLocally(card,NET.me||'local',D.n||card.n)));refresh()}}),0,'pri')}${A('🏁 Fin de misión: QR para actualizar fichas',endGame,NET.role==='client')}</div>
  ${a.map(m=>{const up=m.s0?KS.filter(k=>m.s[k]!==m.s0[k]).map(k=>`${STATN[k]} ${m.s0[k]}→${m.s[k]}`).join(', '):'';return`<div class="card"><div class="dh">${portrait(m)}<div><b>${esc(m.nm)}</b><div class="note">${esc(m.sp)} · ${ROLES[m.role]} · nivel ${m.lv}${m.pl?' · 👤 '+esc(m.pl):''}${m.mid?' · '+esc(m.mid):''}</div>${m.trf?`<div class="note">🔀 traspasado desde ${esc(m.trf.cn||m.trf.cr)}${m.trf.n>1?` · ${m.trf.n} traspasos`:''}</div>`:''}${memberFa(m).length?`<div class="note">${memberFa(m).map(f=>`<span style="color:${FAC[f].c}">${FAC[f].ic} ${esc(FAC[f].n)}</span>`).join(' · ')}</div>`:''}</div></div>
    <div class="res"><span>Salud</span><span>${Math.round(m.hp)}%</span></div>${meter(m.hp,100,m.hp<50?'#ff6b6b':'#7ee787')}
    <div class="res"><span>Moral</span><span>${Math.round(m.mor)}%</span></div>${meter(m.mor,100,m.mor<30?'#ff6b6b':'#78dcff')}
    <div class="res"><span>Experiencia</span><span>${m.xp} / ${30*m.lv}</span></div>${meter(m.xp,30*m.lv,'#e0aa46')}
    <div class="stats">${STATS.map(([k,n])=>`<span>${n}</span>${statBar(eff(m,k))}<b>${eff(m,k)}</b>`).join('')}</div>
    <p class="note"><b>${esc(m.tr)}</b>: ${esc((TRAITS[m.tr]||{d:''}).d)}</p><p class="note">${esc(m.bio)}</p>${up?`<p class="ok">Mejoras en esta partida: ${esc(up)}</p>`:''}${memberInvHtml(m)}
    <div class="row">${A('❄ Animación suspendida',()=>cmd({k:'crew',a:'susp',id:m.id},'Dejar a '+m.nm+' en animación suspendida'),NET.role==='client')}</div>
    ${m.mid?`<div class="row">${A('Actualizar su tarjeta en Members',async()=>{const u=await exportLink(m);window.open(u,'_blank','noopener')})}${A('Copiar enlace',async()=>copy(await exportLink(m),'Enlace de actualización copiado'))}</div>`:''}</div>`}).join('')||'<p class="note">Nave no tripulada: la IA de a bordo se encarga de todo.</p>'}
  ${zz.length?`<h3>❄ En animación suspendida</h3><p class="note">Siguen a bordo y su equipo cuenta, pero no participan en la ronda: no tiran, no deciden por su rol, no reciben daño ni XP y comen un 15 %. Al volver a subir su credencial a la sala despiertan solos.</p><div class="lst">${zz.map(m=>`<div class="item"><span>${portrait(m)}</span><div class="m"><b>${esc(m.nm)}${m.pl?` <span class="dim">· ${esc(m.pl)}</span>`:''}</b><i>${esc(m.sp)} · ${ROLES[m.role]} · nivel ${m.lv}</i></div>${A('☀ Despertar',()=>cmd({k:'crew',a:'wake',id:m.id},'Despertar a '+m.nm),NET.role==='client')}</div>`).join('')}</div>`:''}
  ${esperando().length?`<h3>🤝 Esperando a la nave</h3><p class="note">Se unieron con la partida en marcha y esperan en un sistema de la facción dominante de la nave. Suben a bordo al llegar allí.</p><div class="lst">${esperando().map(m=>{const s=starFromSeed(m.esp);return`<div class="item"><span>${portrait(m)}</span><div class="m"><b>${esc(m.nm)}${m.pl?` <span class="dim">· ${esc(m.pl)}</span>`:''}</b><i>en ${esc(s?starName(s):'?')}${s?' · a '+fmtLen(gd(s,shipStar())):''}</i></div>${s?A('Ver',()=>{if(mode!=='map')exitToMap();selectStar(s,true)}):''}</div>`}).join('')}</div>`:''}
  ${enBase().length?`<h3>🏠 En bases y colonias</h3><p class="note">Fuera de la nave y de la ronda. Se recogen desde la pestaña Bases con la nave en su sistema.</p><div class="lst">${enBase().map(m=>{const b=baseById(m.bz);return`<div class="item"><span>${portrait(m)}</span><div class="m"><b>${esc(m.nm)}${m.pl?` <span class="dim">· ${esc(m.pl)}</span>`:''}</b><i>${esc(m.sp)} · ${ROLES[m.role]} · en ${esc(b?b.n:'?')}</i></div></div>`}).join('')}</div>`:''}
  ${lost.length?`<h3>En memoria</h3><p class="note">${lost.map(m=>esc(m.nm)).join(' · ')}</p>`:''}`;bindActs(el);bindMv(el);
}
async function endGame(){
  const s=D.st,ms=D.crew.filter(m=>m.mid),L=await missionLink();modalOpen=true;
  const rows=ms.map(m=>{const up=m.s0?KS.filter(k=>m.s[k]!==m.s0[k]).map(k=>`${STATN[k]} ${m.s0[k]}→${m.s[k]}`).join(', '):'',dv=Math.max(0,Math.round(s.days-(m.d0||0)));
    return`<div class="item"><span>${portrait(m)}</span><div class="m"><b>${esc(m.nm)}${m.pl?` <span class="dim">· ${esc(m.pl)}</span>`:''}</b><i>${m.st==='perdido'?'<span class="bad">Perdido en la misión</span>':`Nivel ${m.lv0||1}→${m.lv} · ${fmtT(dv/365.25)} de vuelo · salud ${Math.round(m.hp)}%`}${up?' · '+esc(up):''}</i></div></div>`}).join('');
  showModal(`<div class="kick">FIN DE LA MISIÓN${L?' · '+L.id:''}</div><h2>Informe de misión</h2>
  <div class="kv"><span>Saltos</span><span>${s.jumps} · ${fmtLen(s.ly)}</span><span>Sistemas</span><span>${Object.keys(D.disc).length}</span><span>Tiempo a bordo</span><span>${fmtT(s.days/365.25)}</span><span>Año en la Tierra</span><span>${(2026+s.yrs).toFixed(1)}</span><span>Misiones de historia</span><span>${D.q} de ${QUESTS.length}</span><span>Contratos cumplidos</span><span>${Object.values(FX().done).reduce((a,b)=>a+b,0)}</span></div>
  ${L?`<h3>QR de la misión</h3><p class="note">Cada jugador lo escanea desde la app de Members («Actualizar → Escanear QR de la misión») y luego su credencial: su ficha se renueva con estadísticas, nivel, tiempo de vuelo y misiones. Cada misión sólo se aplica una vez por credencial.</p>
    <div style="text-align:center"><div id="qrBox"><canvas id="mqr"></canvas></div></div>
    <div class="row"><button class="pri" id="mDl">Descargar QR</button><button id="mCp">Copiar enlace</button><a class="btn" href="${esc(L.url)}" target="_blank" rel="noopener">Abrir en Members</a></div>`:''}
  <h3>Tripulantes con ficha de Members</h3><div class="lst">${rows||'<p class="note">Ningún tripulante viene de Members. Súbelos desde Tripulación o al unirse a la sesión para poder actualizar sus tarjetas.</p>'}</div>
  <div class="row"><button id="no">Cerrar</button></div>`);
  if(L){try{const q=qrcode(0,'L');q.addData(L.url,'Byte');q.make();drawQR($('#mqr'),q)}catch(e){$('#qrBox').outerHTML='<p class="bad">Demasiados datos para un QR: usa el enlace.</p>'}
    $('#mCp').onclick=()=>copy(L.url,'Enlace de la misión copiado');
    $('#mDl').onclick=()=>{const c=$('#mqr'),o=document.createElement('canvas'),pad=40;o.width=c.width;o.height=c.height+pad*2;const g=o.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,o.width,o.height);g.drawImage(c,0,pad);g.fillStyle='#000';g.font='bold 16px monospace';g.textAlign='center';g.fillText('AD ASTRA · MISIÓN '+L.id,o.width/2,26);g.font='12px monospace';g.fillText(`${s.jumps} saltos · ${fmtLen(s.ly)} · ${fmtT(s.days/365.25)} a bordo`,o.width/2,o.height-14);const a=document.createElement('a');a.download=`ad-astra-mision-${L.id}.png`;a.href=o.toDataURL('image/png');a.click()}}
  if(NET.role==='host'&&L)bcast({t:'fin',id:L.id});guardarMiFicha();
  if(NET.role==='host'&&L)bcast({t:'dialog',d:{t:'Fin de la misión '+L.id,tx:'El capitán cerró la misión. Abre el enlace o escanea el QR de la misión desde Members para actualizar tu ficha.',res:L.url,who:null}});
  $('#no').onclick=()=>{modalOpen=false;closeModal()};
}
function entryLabel(e){const st=starFromSeed(e.s);if(e.k==='j')return'🚀 '+(st?starName(st):e.s);if(e.k==='s')return'★ '+(st?starName(st):'Sistema');const p=parseSeed(e.s);return p.loc?regionName(p.loc):e.s}
function renderHist(){
  const el=$('#p-hist'),favOnly=el.dataset.fav==='1',list=D.h.map((e,i)=>({e,i})).filter(x=>!favOnly||x.e.f).reverse(),s=D.st;
  el.innerHTML=`<div class="kick">HISTORIA</div>${QUESTS.map((q,i)=>`<div class="item ${i<D.q?'done':i===D.q?'cur':'lock'}"><span>${i<D.q?'✓':i===D.q?'▶':'·'}</span><div class="m"><b>${esc(q.t)}</b><i>${i<=D.q?esc(q.d):'???'}</i></div></div>`).join('')}
  <p class="note">Contratos activos: ${FX().mis.length} · cumplidos: ${Object.values(FX().done).reduce((a,b)=>a+b,0)} (ver pestaña Facciones).</p>
  <h3>Registro de la misión</h3><div class="kv"><span>Saltos</span><span>${s.jumps}</span><span>Distancia</span><span>${fmtLen(s.ly)}</span><span>Sistemas registrados</span><span>${Object.keys(D.disc).length}</span><span>Tiempo a bordo</span><span>${fmtT(s.days/365.25)}</span><span>Año en la Tierra</span><span>${(2026+s.yrs).toFixed(1)}</span></div>
  <h3>Bitácora</h3><div class="row"><label class="chk"><input type="checkbox" id="anon" ${D.anon?'checked':''}> No registrar</label><button class="sm" id="favF">${favOnly?'Ver todo':'Solo ★'}</button><button class="sm" id="clr">Borrar</button><span class="dim">${D.h.length}</span></div>
  <div class="lst">${list.slice(0,250).map(({e,i})=>`<div class="item"><button class="fav ${e.f?'on':''}" data-f="${i}">${e.f?'★':'☆'}</button><div class="m"><b>${esc(entryLabel(e))}</b><i>${esc(e.s)} · ${new Date(e.t).toLocaleString('es',{dateStyle:'short',timeStyle:'short'})}</i>${e.n?`<i style="color:var(--tx)">“${esc(e.n)}”</i>`:''}</div><button class="sm" data-n="${i}">✎</button><button class="sm" data-g="${i}">Ir</button><button class="sm" data-x="${i}">✕</button></div>`).join('')||'<p class="note">Aún no hay registros.</p>'}</div>`;
  $('#anon').onchange=e=>{D.anon=e.target.checked;saveD();refresh()};$('#favF').onclick=()=>{el.dataset.fav=favOnly?'0':'1';renderHist()};
  $('#clr').onclick=()=>{if(confirm('¿Borrar la bitácora de este navegador?')){D.h=[];saveD();renderHist()}};
  el.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{const e=D.h[+b.dataset.f];e.f=e.f?0:1;saveD();renderHist()});
  el.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{const e=D.h[+b.dataset.n],v=prompt('Nota:',e.n||'');if(v!==null){e.n=v.slice(0,120);saveD();renderHist()}});
  el.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{D.h.splice(+b.dataset.x,1);saveD();renderHist()});
  el.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{const e=D.h[+b.dataset.g];if(mode!=='map')exitToMap();const st=e.k!=='m'&&starFromSeed(e.s);if(st){selectStar(st,true);return}gotoSeed(e.s)});
}
function gotoSeed(s){
  const p=parseSeed(s);if(p.err){toast(esc(p.err));return false}if(mode!=='map')exitToMap();
  const c=cellOf(p.loc),g=cellCenterG(c);if(c.depth>=9){const st=starInCell(c);if(st){selectStar(st,true);record('m',p.loc,true);return true}}
  flyTo(g[0],g[1],g[2],clamp(c.size*.6,1.5,2500));record('m',p.loc,true);return true;
}
function renderNav(){
  const el=$('#p-nav');ACTS=[];
  el.innerHTML=`<div class="kick">NAVEGAR LA CARTA</div><p class="note">La cámara de la carta es libre y no tiene límites; tu nave sólo se mueve con saltos y recursos.</p>
  <h3>Destinos del mapa</h3><div class="lst">${ANCHSTARS.map(s=>`<div class="item">${'<span style="color:'+(infected(s)&&opt.pet?'#ff3b5c':'#fff')+'">●</span>'}<div class="m"><b>${esc(s.anchor.name)}</b><i>${fmtLen(Math.hypot(s.gx,s.gy,s.gz))} del Sol</i></div>${A('Ver',()=>selectStar(s,true))}</div>`).join('')}</div>
  <h3>Por coordenadas</h3><div class="field"><label>x (al)</label><input id="cx" type="number" step="any" value="${cam.fx.toFixed(2)}"></div><div class="field"><label>y (al)</label><input id="cy" type="number" step="any" value="${cam.fy.toFixed(2)}"></div><div class="field"><label>z (al)</label><input id="cz" type="number" step="any" value="${cam.fz.toFixed(2)}"></div>
  <div class="row"><button class="pri" id="cgo">Ir</button><button id="rnd2">🎲 Lugar aleatorio</button></div>
  <h3>Cómo leer una semilla</h3><p class="note"><b>CABECERA-DETALLE</b>. La cabecera (A … Z, AA, AB, AC … AAA …) numera sectores de ${SEC} al en capas alrededor del Sol; crece al alejarte, así que no hay borde. Cada carácter de detalle (0-9, A-Q) afina la posición 3 veces por eje: 3 caracteres ≈ ${fmtLen(SEC/27)}, 6 ≈ ${fmtLen(SEC/729)}, 14 identifican una estrella.</p>
  <p class="note">Controles: arrastrar = orbitar · Shift/botón derecho/dos dedos = desplazar · rueda o pellizco = zoom · WASD/flechas = volar · Q/E = bajar/subir · Inicio = tu nave · M = panel · Intro = iniciar viaje · F = pilotaje libre (WASD mueve la nave, Shift turbo).</p>`;
  bindActs(el);
  $('#cgo').onclick=()=>{const v=['#cx','#cy','#cz'].map(s=>parseFloat($(s).value));if(v.some(n=>!isFinite(n)||Math.abs(n)>1e6)){toast('Coordenadas fuera de rango (±1 000 000 al).');return}if(mode!=='map')exitToMap();flyTo(v[0],v[1],v[2],10)};
  $('#rnd2').onclick=randomPlace;
}
function randomPlace(){const r=Math.random,l=mkLocXYZ(Math.round((r()-.5)*16),Math.round((r()-.5)*16),Math.round((r()-.5)*4),Array.from({length:4},()=>DETAIL[r()*27|0]).join(''));gotoSeed(seedStr(l))}
function copy(txt,ok){(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast(esc(ok))).catch(()=>prompt('Copia manualmente:',txt))}
