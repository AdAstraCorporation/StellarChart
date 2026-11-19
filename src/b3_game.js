
/* ═════════ Avisos y diálogos ═════════ */
let toastT;
function toast(h,bl,fn){logDM(h);const t=$('#toast');t.innerHTML=h+(bl?` <button class="sm pri" id="tbtn">${esc(bl)}</button>`:'');t.classList.remove('show');void t.offsetWidth;t.classList.add('show');
  if(bl)$('#tbtn').onclick=()=>{t.classList.remove('show');fn()};clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),bl?10000:5200)}
function showModal(html){$('#modalBox').innerHTML=html;$('#modal').style.display='flex'}
function closeModal(){$('#modal').style.display='none'}
/* Dado de fortuna: cada jugador tira 1d6 en los eventos con prueba (1→−2, 2→−1, 3-4→0, 5→+1, 6→+2; total entre −3 y +3) */
const DIEM=[0,-2,-1,0,0,1,2],DIEF=['','⚀','⚁','⚂','⚃','⚄','⚅'];
const luckOf=rolls=>clamp(Object.values(rolls||{}).reduce((a,d)=>a+(DIEM[d]||0),0),-3,3);
function luckTxt(rolls,anon){const e=Object.entries(rolls||{});if(!e.length)return'Nadie ha tirado el dado de fortuna todavía.';const l=luckOf(rolls);
  return`Fortuna ${l>0?'+':''}${l} (≈ ${l>0?'+':''}${l*10}% en las pruebas) · `+e.map(([p,d])=>`${anon?'':esc(((NET.players||{})[p]||{}).name||'Tú')+' '}${DIEF[d]}`).join(' ')}
function dieAnim(btn,cb){const d=1+(Math.random()*6|0);if(RM){cb(d);return}let n=0;btn.disabled=true;const t=setInterval(()=>{btn.textContent='🎲 '+DIEF[1+(Math.random()*6|0)];if(++n>9){clearInterval(t);btn.textContent='🎲 Sacaste '+DIEF[d]+' '+d+' ('+(DIEM[d]>0?'+':'')+DIEM[d]+')';cb(d)}},70)}
const dq=[];
function queueDialog(d){
  if(!d.ev)logDM(`${d.t}: ${d.tx||''} ${d.res||''}`,'dlg');
  if(NET&&NET.role==='host'&&!d.ev&&!d.local)bcast({t:'dialog',d:{t:d.t,tx:d.tx,res:d.res||'',next:d.next||'',who:d.who?{nm:d.who.nm,sp:d.who.sp,role:d.who.role}:null}});
  dq.push(d);if(!modalOpen)nextDialog();
}
function nextDialog(){
  const d=dq.shift();if(!d){modalOpen=false;closeModal();refresh();return}modalOpen=true;
  if(!d.ev){showModal(`<div class="dh">${portrait(d.who)}<div><div class="kick">BITÁCORA</div><b>${esc(d.t)}</b>${d.who?`<div class="note">${esc(d.who.nm)} · ${ROLES[d.who.role]||''}</div>`:''}</div></div>
    <p class="story">${esc(d.tx)}</p>${d.res?`<p class="ok">${esc(d.res)}</p>`:''}${d.next?`<p class="note">${esc(d.next)}</p>`:''}<div class="row"><button class="pri" id="dOk">Continuar</button></div>`);
    $('#dOk').onclick=()=>{d.done&&d.done();nextDialog()};return}
  const ev=d.ev,who=pick(alive())||null,tx=typeof ev.tx==='function'?ev.tx(d.ctx):ev.tx;
  const optLab=o=>o.l+(o.k?` · ${STATN[o.k]} ${o.dc}`:'');const local={},hasK=ev.op.some(o=>o.k);
  const getRolls=()=>vid?((NET.votes.find(x=>x.id===vid)||{}).dice||{}):local;
  const paint=()=>{const l=luckOf(getRolls());$('#modalBox').querySelectorAll('[data-o]').forEach(b=>{const o=ev.op[+b.dataset.o],s=b.querySelector('.dim');if(o&&o.k&&s)s.textContent=` · ${STATN[o.k]} ${o.dc} · ${Math.round(chance(o.k,o.dc,null,l)*100)}%`});const L=$('#luck');if(L)L.innerHTML=luckTxt(getRolls(),NET.anon)};
  const voting=NET&&NET.role==='host'&&NET.conns.size>0&&NET.decide!=='yo';let vid=null;logDM('Evento: '+ev.t+' — '+tx,'ev');
  const k0=(ev.op.find(o=>o.k)||{}).k,resp=voting&&NET.decide!=='todos'&&k0?respFor(k0):null;
  const resolveOpt=i=>{
    let o=ev.op[i];if(o.need&&!o.need()){const j=ev.op.findIndex(x=>!x.need||x.need());o=ev.op[j]}
    let res,line='';
    NET.luckPaint=null;if(o.k){const r=roll(o.k,o.dc,null,luckOf(getRolls()));line=r.line;res=(r.ok?o.ok(d.ctx,r):o.ko(d.ctx,r))||'';if(r.ok)res+=gainXp(r.m,10)}else res=o.run(d.ctx)||'';
    if(D.st.hull<=0)res+=' El casco no resiste.';saveD();
    logDM(`→ ${o.l}. ${line.replace(/<[^>]+>/g,'')} ${res}`,'ev');
    if(voting)bcast({t:'dialog',d:{t:ev.t+' · '+o.l,tx:res,res:line.replace(/<[^>]+>/g,''),who:null}});
    showModal(`<div class="dh">${portrait(who)}<div><div class="kick">RESULTADO</div><b>${esc(ev.t)}</b><div class="note">${esc(o.l)}</div></div></div>${line?`<p class="roll">${line}</p>`:''}<p class="story">${esc(res)}</p><div class="row"><button class="pri" id="dOk">Continuar</button></div>`);
    $('#dOk').onclick=()=>{if(D.st.hull<=0)rescue('El casco cedió.');d.done&&d.done();nextDialog()};
  };
  showModal(`<div class="dh">${portrait(who)}<div><div class="kick">EVENTO${voting?' · VOTACIÓN DE LA TRIPULACIÓN':''}</div><b>${esc(ev.t)}</b><div class="note">${who?esc(who.nm)+' informa':'IA de a bordo informa'}</div></div></div>
    <p class="story">${esc(tx)}</p>${hasK?`<div class="row"><button id="dice">🎲 Tirar dado de fortuna</button></div><div id="luck" class="note"></div>`:''}<div class="opts">${ev.op.map((o,i)=>`<button data-o="${i}" ${o.need&&!o.need()?'disabled':''}>${esc(o.l)}${o.k?`<span class="dim"> · ${STATN[o.k]} ${o.dc} · ${Math.round(chance(o.k,o.dc)*100)}%</span>`:''}</button>`).join('')}</div><div id="vstat" class="note"></div>`);
  if(voting){vid=createVote({kind:'ev',title:ev.t,tx,opts:ev.op.map(optLab),by:NET.me,voters:resp?[resp.pid]:null,who:resp?`${resp.m.nm} (${resp.pl}, ${ROLES[resp.m.role]})`:''});NET.vcb[vid]=resolveOpt;
    $('#vstat').textContent=resp&&resp.pid!==NET.me?`Decide ${resp.m.nm} (${resp.pl}, ${ROLES[resp.m.role]}). Como director puedes imponer una opción.`:resp?'Te toca decidir por tu rol.':'Vota tu opción; se decide por mayoría (60 s).'}
  if(hasK){paint();NET.luckPaint=paint;$('#dice').onclick=e=>dieAnim(e.currentTarget,d=>{if(vid)castDice(vid,NET.me,d);else local[NET.me||'yo']=d;logDM(`🎲 Dado de fortuna: ${d} (${DIEM[d]>0?'+':''}${DIEM[d]})`,'ev');paint()})}
  $('#modalBox').querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{
    if(vid&&resp&&resp.pid!==NET.me){forceVote(vid,+b.dataset.o);return}
    if(vid){castVote(vid,NET.me,+b.dataset.o);$('#modalBox').querySelectorAll('[data-o]').forEach(x=>x.classList.toggle('pri',x===b));$('#vstat').textContent='Voto registrado. Esperando al resto de la tripulación…';return}
    resolveOpt(+b.dataset.o)});
}
function passDays(n){
  const s=D.st,c=crewCount();if(!D.cr)s.prov=Math.max(0,s.prov-c*n);s.days+=n;s.yrs+=n/365.25;const med=best('med').v;
  for(const m of alive()){m.hp=Math.min(100,m.hp+n*(.3+med*.08));if(s.prov<=0&&c){m.hp=Math.max(5,m.hp-n*.8);m.mor=Math.max(0,m.mor-n*.6)}}
}

/* ═════════ Astrófago: estrellas infectadas (modo Petrova) ═════════ */
const INF=new Set(['sol','tceti','eeri','40eri','acen']);
const infected=s=>s.point?false:s.anchor?INF.has(s.anchor.id):PETROVA.has(s.P.k)&&hash(s.h,13)%4===0;

/* ═════════ Cálculo de viaje (relativista, aceleración constante con volteo a mitad de camino) ═════════ */
function legCalc(a,b){
  const sp=SPEC[D.ship.d],d=gd(a,b),acc=sp.acc*1.0323,x=d/2,tE=2*Math.sqrt(x*x+2*x/acc),ph=Math.acosh(1+acc*x),tau=2*ph/acc,days=tau*365.25;
  const prov=sp.prov?crewCount()*days*(D.hib&&sp.hib?.15:1)*(1-(sp.farm||0)):0;
  return{from:a,to:b,d,tE,tau,v:Math.tanh(ph),g:Math.cosh(ph),days,fuel:d*sp.burn,prov};
}
function legErr(L,s){
  const sp=SPEC[D.ship.d],ml=legMax(D.ship.d);
  if(L.d>ml+1e-9&&!D.cr)return`el salto de ${fmtLen(L.d)} supera el alcance máximo (${fmtLen(ml)})`;
  if(crewCount()<sp.crew[0])return'tripulación insuficiente para operar la nave';
  if(s.hull<=0)return'casco destruido';if(D.cr)return'';
  if(s.fuel+1e-9<L.fuel)return`falta astrófago (${L.fuel.toFixed(1)} t necesarias, hay ${s.fuel.toFixed(1)} t)`;
  if(sp.prov&&s.prov+1e-9<L.prov)return`faltan provisiones (${fmtI(L.prov)} días-persona, hay ${fmtI(s.prov)})`+(sp.hib&&!D.hib?'; activa la hibernación':'');
  return'';
}
function buildLegs(stars){
  const legs=[],tot={d:0,tau:0,tE:0,fuel:0,prov:0},s={...D.st},sp=SPEC[D.ship.d];let bad=false;
  for(let i=0;i<stars.length-1;i++){const L=legCalc(stars[i],stars[i+1]);for(const k in tot)tot[k]+=L[k];
    if(bad)L.pend=1;else{L.err=legErr(L,s);if(L.err)bad=true;else{if(!D.cr){s.fuel-=L.fuel;s.prov-=L.prov}if(sp.solar)s.fuel=sp.tank}}legs.push(L)}
  return{stars,legs,tot,ok:!bad};
}
/* Ruta con A* sobre las estrellas de un corredor alrededor de la línea recta */
function planRoute(from,to){
  const ml=legMax(D.ship.d)*.999,D0=gd(from,to);if(D0<=ml||D.cr)return[from,to];if(D0>400)return null;
  const rc=clamp(ml*1.6,12,45),u=[(to.gx-from.gx)/D0,(to.gy-from.gy)/D0,(to.gz-from.gz)/D0],cand=new Map(),key=s=>s.h+':'+Math.round(s.gx*1e3);
  const segD=(x,y,z)=>{const t=clamp((x-from.gx)*u[0]+(y-from.gy)*u[1]+(z-from.gz)*u[2],0,D0);return Math.hypot(x-from.gx-u[0]*t,y-from.gy-u[1]*t,z-from.gz-u[2]*t)};
  const lo=[Math.min(from.gx,to.gx)-rc,Math.min(from.gy,to.gy)-rc,Math.min(from.gz,to.gz)-rc],hi=[Math.max(from.gx,to.gx)+rc,Math.max(from.gy,to.gy)+rc,Math.max(from.gz,to.gz)+rc];
  for(let k=gi(lo[2]);k<=gi(hi[2]);k++)for(let j=gi(lo[1]);j<=gi(hi[1]);j++)for(let i=gi(lo[0]);i<=gi(hi[0]);i++){
    if(segD(-HALF+(i+.5)*SC,-HALF+(j+.5)*SC,-HALF+(k+.5)*SC)>rc+7)continue;for(const s of gridStars(i,j,k))if(segD(s.gx,s.gy,s.gz)<=rc)cand.set(key(s),s)}
  cand.set(key(from),from);cand.set(key(to),to);
  const B=new Map(),bk=(x,y,z)=>Math.floor(x/ml)+','+Math.floor(y/ml)+','+Math.floor(z/ml);
  for(const s of cand.values()){const k=bk(s.gx,s.gy,s.gz);(B.get(k)||B.set(k,[]).get(k)).push(s)}
  const g=new Map([[key(from),0]]),came=new Map(),open=[[D0,from]],done=new Set();let it=0;
  const push=(f,s)=>{open.push([f,s]);let i=open.length-1;while(i>0){const p=(i-1)>>1;if(open[p][0]<=open[i][0])break;[open[p],open[i]]=[open[i],open[p]];i=p}};
  const pop=()=>{const top=open[0],last=open.pop();if(open.length){open[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<open.length&&open[l][0]<open[m][0])m=l;if(r<open.length&&open[r][0]<open[m][0])m=r;if(m===i)break;[open[m],open[i]]=[open[i],open[m]];i=m}}return top};
  while(open.length&&it++<8000){
    const [,n]=pop(),nk=key(n);if(done.has(nk))continue;done.add(nk);
    if(nk===key(to)){const path=[n];let c=nk;while(came.has(c)){const p=came.get(c);path.unshift(p);c=key(p)}return path}
    const cx=Math.floor(n.gx/ml),cy=Math.floor(n.gy/ml),cz=Math.floor(n.gz/ml),gn=g.get(nk);
    for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++){const arr=B.get((cx+a)+','+(cy+b)+','+(cz+c));if(!arr)continue;
      for(const m of arr){const mk=key(m);if(done.has(mk))continue;const d=gd(n,m);if(d>ml||d<1e-6)continue;const ng=gn+d+ml*.35;if(ng<(g.get(mk)??Infinity)){g.set(mk,ng);came.set(mk,n);push(ng+gd(m,to),m)}}}
  }
  return null;
}
function selectStar(s,fly){
  selStar=s;route=null;selPlanet=null;
  if(s&&!sameStar(s,shipStar())){const p=planRoute(shipStar(),s);route=p?buildLegs(p):{none:true}}
  if(fly&&s)flyTo(s.gx,s.gy,s.gz,Math.min(tg.R,16));
  if(s){if(tab!=='carta')setTab('carta');toggleDrawer(true)}renderPanel();
}

/* ═════════ Viaje animado ═════════ */
function startTravel(){
  if(!route||!route.legs||travel)return;const e0=legErr(route.legs[0],D.st);if(e0&&!(NET&&NET.role==='client')){toast('No se puede saltar: '+e0);return}
  cmd({k:'travel',seeds:route.stars.map(seedOf)},`Viajar a ${starName(route.stars[route.stars.length-1])} (${fmtLen(route.tot.d)}, ${route.legs.length} salto${route.legs.length>1?'s':''})`);
}
function startTravelNow(){
  if(!route||!route.legs||travel)return;if(pilot)pilot=null;bcast({t:'travel',seeds:route.stars.map(seedOf)});const e=legErr(route.legs[0],D.st);if(e){toast('No se puede saltar: '+e);return}
  if(mode!=='map')exitToMap();travel={legs:route.legs.map(l=>({from:l.from,to:l.to})),i:0,t0:0,pos:null,int:0};route=null;$('#travel').classList.add('show');renderPanel();
}
function stepTravel(now){
  if(travel.wait)return;
  if(!travel.t0){const seg=travel.legs[travel.i],L=legCalc(seg.from,seg.to),e=travel.ghost?'':legErr(L,D.st);if(e){endTravel('Viaje detenido: '+e);return}
    travel.leg=L;travel.t0=now;travel.dur=RM?600:clamp(1700+Math.log10(1+L.d)*1500,1900,5200);tg.R=clamp(L.d*.9,6,3000);travel.evAt=travel.ghost?2:Math.random()<.45?.5:2}
  const L=travel.leg,p=clamp((now-travel.t0)/travel.dur,0,1),e=ease(p),lift=Math.sin(Math.PI*e)*L.d*.18;
  travel.pos=[lerp(L.from.gx,L.to.gx,e),lerp(L.from.gy,L.to.gy,e),lerp(L.from.gz,L.to.gz,e)+lift];travel.int=Math.sin(Math.PI*p);
  cam.fx=tg.fx=travel.pos[0];cam.fy=tg.fy=travel.pos[1];cam.fz=tg.fz=travel.pos[2];
  $('#trTxt').innerHTML=`SALTO ${travel.i+1}/${travel.legs.length} → ${esc(starName(L.to).toUpperCase())} · ${fmtLen(L.d*(1-e))} · v ${(L.v*Math.sin(Math.PI*e)).toFixed(3)} c · τ ${fmtT(L.tau*e)} · Tierra ${fmtT(L.tE*e)}`;$('#trBar').style.width=(p*100)+'%';
  if(p>=travel.evAt){travel.evAt=2;const ev=pickEvent('leg',{leg:L});if(ev){travel.wait=true;const at=performance.now();queueDialog({ev,ctx:{leg:L},done:()=>{travel.wait=false;travel.t0+=performance.now()-at}})}}
  if(p>=1)arrive(L);
}
function arrive(L){
  if(travel.ghost){D.sp=seedOf(L.to);_sp='';travel.pos=null;travel.i++;travel.t0=0;if(travel.i>=travel.legs.length)endTravel();return}
  const s=D.st,sp=SPEC[D.ship.d],hib=D.hib&&sp.hib;
  if(!D.cr){s.fuel=Math.max(0,s.fuel-L.fuel);if(sp.prov)s.prov=Math.max(0,s.prov-L.prov)}
  s.days+=L.days;s.yrs+=L.tE;s.jumps++;s.ly+=L.d;if(sp.solar)s.fuel=sp.tank;
  if(!hib)morAll(-Math.min(18,L.days/80));
  else{const risk=.025+(alive().some(m=>m.tr==='Insomne')?.03:0)-best('med').v*.002;if(Math.random()<risk){const w=loseRandom();if(w)queueDialog({t:'Despertar',who:pick(alive())||null,tx:`Al abrir las cápsulas, ${w} no despierta del coma inducido. La tripulación despide a su compañero en silencio.`,res:''})}}
  D.sp=seedOf(L.to);ping=performance.now();travel.pos=null;record('j',D.sp,true);travel.i++;travel.t0=0;
  questEvent({type:'arrive',star:L.to});facTick();
  if(travel.i>=travel.legs.length){
    const st=L.to;endTravel();selStar=st;
    if(st.point)toast(`Llegada al espacio profundo · ${fmtT(L.tau)} a bordo`);else toast(`Llegada a <b>${esc(starName(st))}</b> · ${fmtT(L.tau)} a bordo`,'Entrar al sistema',()=>enterSystem(st));
    if(Math.random()<.3){const ev=pickEvent('arr',{star:st});if(ev)queueDialog({ev,ctx:{star:st}})}else crewChatter();
  }
  saveD();refresh();
}
function endTravel(msg){travel=null;$('#travel').classList.remove('show');if(msg)toast(esc(msg));saveD();refresh()}
function rescue(why){
  const s=D.st,sp=SPEC[D.ship.d];if(typeof pilot!=='undefined')pilot=null;D.sp=sSeed(SOL);s.fuel=sp.tank*.5;s.prov=Math.max(s.prov,sp.prov*.5);s.hull=Math.max(s.hull,60);s.min=0;s.days+=365;s.yrs+=10;
  if(travel){travel=null;$('#travel').classList.remove('show')}mode='map';SYS=null;surf=null;selStar=null;route=null;
  const p=shipStar();flyTo(p.gx,p.gy,p.gz,20);saveD();
  queueDialog({t:'Rescate',who:null,tx:(why?why+' ':'')+'Una nave de la Corporación Ad Astra remolca la tuya hasta la Tierra. Diez años perdidos y la bodega vacía, pero seguís con vida.',res:'Combustible al 50%, casco reparado al 60%.'});refresh();
}

/* ═════════ Sistemas: vista orbital ═════════ */
let sysHits=[];
function enterSystem(st){
  if(travel||!st||st.point){if(st&&st.point)toast('Aquí no hay ningún sistema estelar.');return}SYS=genSystem(st);mode='system';surf=null;selPlanet=null;sysT0=performance.now();if(!RM)warp={t0:sysT0,dur:520};
  const here=sameStar(st,shipStar()),seed=sSeed(st);
  if(here&&!D.disc[seed]){D.disc[seed]=1;record('s',seed,true);morAll(2);for(const m of alive())if(m.tr==='Curioso')m.mor=Math.min(100,m.mor+4);toast(`Sistema registrado: <b>${esc(SYS.name)}</b> (${Object.keys(D.disc).length} en total)`);questEvent({type:'disc'})}
  if(here)questEvent({type:'enter',star:st});
  saveD();refresh();
}
function exitToMap(){mode='map';SYS=null;surf=null;selPlanet=null;refresh()}
function drawSystem(now){
  const ent=RM?1:ease(clamp((now-sysT0)/1000,0,1)),S=SYS,P=S.P,cx=W/2,cy=H/2,Rmax=(Math.min(W,H)/2-40)*(.35+.65*ent),t=now/1000,here=sameStar(S.star,shipStar());
  ctx.letterSpacing='1.6px';ctx.globalAlpha=.15+.85*ent;const starPx=clamp(6+Math.log10(P.rad+1)*14,7,34);
  drawSky(now);
  const all=S.planets.map(p=>p.a).concat(S.belts.flat());const amax=Math.max(...all,S.hz[1],.5)*1.12,a0=Math.min(...all,S.hz[0])*.55;
  const rp=a=>starPx+12+(Rmax-starPx-12)*Math.log(1+Math.max(a,0)/a0)/Math.log(1+amax/a0),tilt=.42;
  const E=(r,a)=>[cx+Math.cos(a)*r,cy+Math.sin(a)*r*tilt];
  ctx.strokeStyle='rgba(126,231,135,.09)';ctx.lineWidth=Math.max(1,(rp(S.hz[1])-rp(S.hz[0])));ctx.beginPath();ctx.ellipse(cx,cy,(rp(S.hz[0])+rp(S.hz[1]))/2,(rp(S.hz[0])+rp(S.hz[1]))/2*tilt,0,0,7);ctx.stroke();
  for(const [a,b] of S.belts){const r=rng(hash(S.star.h,a*100|0));ctx.fillStyle='rgba(200,200,200,.5)';for(let k=0;k<180;k++){const ang=r()*6.283+t*.02,[x,y]=E(lerp(rp(a),rp(b),r()),ang);ctx.fillRect(x,y,1.3,1.3)}}
  const g=ctx.createRadialGradient(cx,cy,0,cx,cy,starPx*3.2);g.addColorStop(0,P.col);g.addColorStop(.35,P.col+'88');g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,starPx*3.2,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx,cy,starPx*.7,0,7);ctx.fill();
  if(infected(S.star)){ctx.lineWidth=1.2;ctx.strokeStyle='rgba(255,59,92,.6)';ctx.setLineDash([4,4]);ctx.beginPath();ctx.ellipse(cx,cy,starPx*2.2,starPx*2.2*tilt+starPx,0,0,7);ctx.stroke();ctx.setLineDash([])}
  sysHits=[];let shipP=E(starPx+26,-1.2+t*.2);
  const items=S.planets.map((p,i)=>{const R=rp(p.a),w=Math.min(1.2,.3*Math.pow(Math.max(p.a,.03),-.75)),ang=p.phase+t*w,[x,y]=E(R,ang);return{p,i,R,x,y}}).sort((a,b)=>a.y-b.y);
  for(const it of S.planets.map((p,i)=>i)){const p=S.planets[it],R=rp(p.a);ctx.strokeStyle=p===selPlanet?'rgba(88,208,255,.7)':'rgba(190,205,235,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cx,cy,R,R*tilt,0,0,7);ctx.stroke()}
  for(const {p,x,y} of items){
    const pr=clamp(2.5+Math.log2(p.r+.5)*2.6,2.5,13),col=KIND[p.kind][1],sh=ctx.createRadialGradient(x-pr*.4,y-pr*.4,pr*.1,x,y,pr);sh.addColorStop(0,col);sh.addColorStop(1,'#05070c');
    ctx.fillStyle=sh;ctx.beginPath();ctx.arc(x,y,pr,0,7);ctx.fill();
    if(p.ring){ctx.strokeStyle='rgba(230,210,170,.7)';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(x,y,pr*1.9,pr*.55,-.3,0,7);ctx.stroke()}
    if(p.hz){ctx.strokeStyle='#7ee787';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,pr+3,0,7);ctx.stroke()}
    if(p===selPlanet){ctx.strokeStyle='#58d0ff';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.lineDashOffset=-now/50;ctx.beginPath();ctx.arc(x,y,pr+7,0,7);ctx.stroke();ctx.setLineDash([]);shipP=[x+pr+14+Math.cos(t*2)*3,y-pr-10+Math.sin(t*2)*3]}
    ctx.font='10px ui-monospace,Menlo,monospace';ctx.fillStyle=p===selPlanet?'#58d0ff':'rgba(205,215,235,.7)';ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(spaced(p.name.replace(S.name+' ','').toUpperCase()),x+pr+6,y);sysHits.push({x,y,r:Math.max(12,pr+6),planet:p});
  }
  ctx.globalAlpha=1;
  if(here){drawShip3D(ctx,shipP[0],shipP[1],30,t*.9,.5,D.ship,t);ctx.font='9px ui-monospace,Menlo,monospace';ctx.fillStyle='rgba(205,230,255,.75)';ctx.textAlign='center';ctx.fillText(spaced((D.ship.n||SHIPS[D.ship.d].n).toUpperCase())+' · SÍMBOLO',shipP[0],shipP[1]+22)}
  ctx.font='10px ui-monospace,Menlo,monospace';ctx.textAlign='left';ctx.fillStyle='rgba(126,231,135,.7)';ctx.fillText(spaced('▮ ZONA HABITABLE'),70,H-60);
  if(!here){ctx.fillStyle='rgba(255,180,84,.8)';ctx.fillText(spaced('VISTA REMOTA · DATOS DE SONDEO'),70,H-44)}
  ctx.letterSpacing='0px';
}

/* ═════════ Superficie (aterrizaje) ═════════ */
const SKY={lava:['#3a0d05','#a0300a'],desert:['#3b2a14','#c9965a'],ocean:['#071a33','#3f8fe0'],temperate:['#0b2238','#6fb0d8'],ice:['#0d1f2c','#9fd0e6'],frozen:['#0a0f18','#7d8ea3'],barren:['#050608','#3a3a40']};
const GROUND={lava:'#1a0804',desert:'#5a3d1d',ocean:'#0b2b4a',temperate:'#183a22',ice:'#a8c8d8',frozen:'#5d6a7a',barren:'#2a2826'};
function land(i){
  const info=planetInfo(SYS,i),sp=SPEC[D.ship.d];if(info.gas){toast('No hay superficie sólida.');return}
  if(!D.scan[info.key]){D.scan[info.key]=1}if(!(NET&&NET.role==='client'))passDays(sp.land?1:2);mode='surface';surf={i,info,t0:performance.now()};if(!RM)warp={t0:performance.now(),dur:600};saveD();refresh();
}
function drawSurface(now){
  ctx.letterSpacing='1.6px';const {info}=surf,p=info.p,k=p.kind,sky=SKY[k]||SKY.barren,t=now/1000,ent=RM?1:ease(clamp((now-surf.t0)/1200,0,1));
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,sky[0]);g.addColorStop(.75,sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  if(!info.breath){ctx.fillStyle='rgba(255,255,255,.7)';const r=rng(5);for(let i=0;i<140;i++)ctx.fillRect(r()*W,r()*H*.6,1,1)}
  const P=SYS.P,sx=W*.72,sy=H*.22;const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,60);sg.addColorStop(0,P.col);sg.addColorStop(.2,P.col+'aa');sg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.arc(sx,sy,60,0,7);ctx.fill();
  const r=rng(hash(SYS.star.h,surf.i,321));
  for(let L=0;L<3;L++){const base=H*(.5+L*.1),amp=H*(.16-L*.04)*(p.g>1.5?.6:1),seed=r()*1000;ctx.fillStyle=L===2?GROUND[k]:`rgba(0,0,0,${.25+L*.15})`;
    ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W;x+=8){const n=vn3(x/(140-L*30)+seed,L,0,7)*.7+vn3(x/40+seed,L,1,9)*.3;ctx.lineTo(x,base-amp*n)}ctx.lineTo(W,H);ctx.closePath();ctx.fill()}
  // condiciones anómalas visibles
  for(const h of info.hz){if(!h[4])continue;const r2=rng(hash(t*10|0,7));
    if(h[0]==='Tormenta de iones'&&r2()<.08){ctx.fillStyle='rgba(180,220,255,.15)';ctx.fillRect(0,0,W,H)}
    if(h[0]==='Niebla de esporas'){ctx.fillStyle='rgba(140,220,120,.08)';for(let i=0;i<40;i++){const x=(i*97+t*20)%W,y=H*.5+Math.sin(i+t)*H*.2;ctx.beginPath();ctx.arc(x,y,30,0,7);ctx.fill()}}
    if(h[0]==='Cristales cantores'){for(let i=0;i<30;i++){ctx.fillStyle=`rgba(200,170,255,${.5+.5*Math.sin(t*3+i)})`;ctx.fillRect((i*131)%W,H*.7+(i*37)%(H*.2),2,2)}}
    if(h[0]==='Ecos temporales'){ctx.globalAlpha=.15;ctx.drawImage(cv,6*Math.sin(t),0,W*dpr,H*dpr,0,0,W,H);ctx.globalAlpha=1}
    if(h[0]==='Sismos periódicos'&&Math.sin(t*.8)>.97){ctx.translate((Math.random()-.5)*4,0)}}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  // nave posada, a escala respecto a una figura humana de referencia
  const gy=H*.82,shx=W*.3,shPx=clamp(SPEC[D.ship.d].len*.9,24,180),y0=gy-shPx*.25-(1-ent)*H*.6;
  drawShip3D(ctx,shx,y0,shPx,.9,.15,D.ship,t,ent<1);
  ctx.fillStyle='#cdd7ea';const hp=clamp(1.8*.9,1.5,4);ctx.fillRect(shx+shPx*.7,gy-hp*4,1.5,hp*4);
  ctx.font='9px ui-monospace,Menlo,monospace';ctx.textAlign='center';ctx.fillStyle='rgba(230,235,245,.85)';ctx.fillText(spaced(`${SPEC[D.ship.d].len} M`),shx,gy+16);
  // puntos de interés
  info.pois.forEach((n,j)=>{const x=W*(.48+j*.5/Math.max(1,info.pois.length)),y=gy-20-(j%2)*26,done=D.ex[info.key+':'+n];
    ctx.strokeStyle=done?'rgba(126,231,135,.8)':'rgba(255,180,84,.9)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-34);ctx.stroke();
    ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(x,y-40);ctx.lineTo(x+5,y-35);ctx.lineTo(x,y-30);ctx.lineTo(x-5,y-35);ctx.closePath();ctx.fill();
    ctx.textAlign='center';ctx.fillText(spaced(n.toUpperCase()),x,y-48)});
  ctx.textAlign='left';ctx.fillStyle='rgba(230,235,245,.8)';ctx.fillText(spaced(`${p.name.toUpperCase()} · ${Math.round(p.T-273)} °C · ${p.g.toFixed(2)} G · ${info.atm.toUpperCase()}`),70,H-44);
  ctx.letterSpacing='0px';
}
/* — Expediciones — */
function openExpedition(info,poiName){
  const P=POI[poiName],key=info.key+':'+poiName;if(D.ex[key]){toast('Este lugar ya fue explorado.');return}
  const team0=alive().filter(m=>m.hp>20).sort((a,b)=>eff(b,P.k)-eff(a,P.k)).slice(0,2),sel=new Set(team0.map(m=>m.id));
  const dcOf=team=>P.dc+info.hz.reduce((a,h)=>a+Math.max(0,h[2]-(team.some(m=>eff(m,h[1])>=6)?1:0)),0);
  const draw=()=>{const team=alive().filter(m=>sel.has(m.id)),dc=dcOf(team),ch=chance(P.k,dc,team);
    showModal(`<div class="kick">EXPEDICIÓN · ${esc(info.p.name.toUpperCase())}</div><h2>${esc(poiName)}</h2><p class="story">${esc(P.tx)}</p>
    <div class="calc"><span>Habilidad</span><span>${STATN[P.k]}</span><span>Dificultad</span><span>${dc} (base ${P.dc})</span><span>Duración</span><span>${P.days+(SPEC[D.ship.d].land?0:2)} días</span><span>Éxito estimado</span><span class="${ch>.5?'ok':'bad'}">${Math.round(ch*100)}%</span></div>
    ${info.hz.length?`<div class="note">Condiciones: ${info.hz.map(h=>esc(h[0])+' (+'+h[2]+', mitiga '+STATN[h[1]]+' ≥6)').join(' · ')}</div>`:''}
    <h3>Equipo (máx. 3)</h3><div class="lst">${alive().map(m=>`<label class="item"><input type="checkbox" data-m="${m.id}" ${sel.has(m.id)?'checked':''} ${m.hp<=20?'disabled':''}>${portrait(m)}<div class="m"><b>${esc(m.nm)}${m.pl?' · 👤 '+esc(m.pl):''}</b><i>${ROLES[m.role]} · ${STATN[P.k]} ${eff(m,P.k)} · salud ${Math.round(m.hp)}%</i></div></label>`).join('')||'<p class="note">Sin tripulación: irá un dron con la IA de a bordo.</p>'}</div>
    <div class="row"><button class="pri" id="go">Enviar expedición</button><button id="no">Cancelar</button></div>`);
    $('#modalBox').querySelectorAll('[data-m]').forEach(c=>c.onchange=()=>{if(c.checked){if(sel.size>=3){c.checked=false;return}sel.add(c.dataset.m)}else sel.delete(c.dataset.m);draw()});
    $('#no').onclick=()=>{modalOpen=false;closeModal()};
    $('#go').onclick=()=>{const team=alive().filter(m=>sel.has(m.id));if(alive().length&&!team.length){toast('Elige al menos un tripulante.');return}modalOpen=false;closeModal();cmd({k:'exp',i:info.i,poi:poiName,team:team.map(m=>m.id)},`Expedición a «${poiName}» en ${info.p.name} (${team.map(m=>m.nm).join(', ')||'dron'})`)}};
  modalOpen=true;draw();
}
function applyLoot(lo,mult){
  const sp=SPEC[D.ship.d],s=D.st,out=[],rr=a=>lerp(a[0],a[1],Math.random())*mult;
  if(lo.min){const v=Math.round(rr(lo.min));s.min=Math.min(sp.cargo,s.min+v);out.push(`+${v} t minerales`)}
  if(lo.prov&&sp.prov){const v=Math.round(sp.prov*rr(lo.prov));s.prov=Math.min(sp.prov,s.prov+v);out.push(`+${fmtI(v)} días-persona de provisiones`)}
  if(lo.fuel){const v=+(sp.tank*rr(lo.fuel)).toFixed(1);s.fuel=Math.min(sp.tank,s.fuel+v);out.push(`+${v} t de astrófago`)}
  if(lo.mor){morAll(lo.mor);out.push(`moral +${lo.mor}`)}
  if(lo.crew&&crewCount()<sp.crew[1])out.push(addMember());
  if(lo.lore)out.push('«'+pick(LORE)+'»');
  return out.join(' · ');
}
function bestTeam(k){return alive().filter(m=>m.hp>20).sort((a,b)=>eff(b,k)-eff(a,k)).slice(0,2)}
function expDc(info,P,team){return P.dc+info.hz.reduce((a,h)=>a+Math.max(0,h[2]-(team.some(m=>eff(m,h[1])>=6)?1:0)),0)}
function resolveExpedition(info,poiName,team){
  const P=POI[poiName],key=info.key+':'+poiName,days=P.days+(SPEC[D.ship.d].land?0:2);if(D.ex[key])return null;passDays(days);
  const dc=expDc(info,P,team),r=roll(P.k,dc,team);let txt='';
  for(const h of info.hz)if(team.length&&Math.random()<.3)txt+=` ${h[0]}:`+hurt(pick(team),5+(Math.random()*8|0));
  if(r.ok){const loot=applyLoot(P.lo,r.crit?1.5:1);D.ex[key]=1;let xp='';for(const m of team)xp+=gainXp(m,(P.lo.xp||10)+(r.crit?8:0));
    for(const m of team)if(m.tr==='Curioso')m.mor=Math.min(100,m.mor+5);morAll(3);txt=`${r.crit?'¡Éxito crítico! ':'Éxito. '}${loot}.${xp}`+txt;questEvent({type:'poi',planet:info.p.name})}
  else{if(team.length){txt='La expedición regresa sin lograrlo.'+hurt(pick(team),15+(Math.random()*20|0))+(r.fumble?hurt(pick(team),15):'')+txt;morAll(-4)}else{D.st.hull=Math.max(1,D.st.hull-5);txt='El dron vuelve dañado (casco −5%).'}}
  saveD();return{ok:r.ok,line:r.line.replace(/<[^>]+>/g,''),txt,days,team:team.map(m=>m.nm).join(', ')||'Dron'};
}
function runExpedition(info,poiName,team){
  const R=resolveExpedition(info,poiName,team);modalOpen=false;closeModal();if(!R){toast('Este lugar ya fue explorado.');return}
  queueDialog({t:'Informe de expedición · '+poiName,who:team[0]||null,tx:R.txt,res:R.line,next:`${R.days} días · ${R.team}`});
  if(Math.random()<.2){const st=shipStar(),ev=pickEvent('arr',{star:st});if(ev)queueDialog({ev,ctx:{star:st}})}refresh();
}

function orbitDo(key,days,fn,limit=3){
  if(limit&&(D.ex[key]||0)>=limit)return'Ya no queda nada aprovechable aquí.';
  passDays(days);if(limit)D.ex[key]=(D.ex[key]||0)+1;const msg=fn();saveD();return msg+` (${days} días)`;
}
function doOrbit(act,i){
  const st=shipStar();if(st.point)return'No hay ningún sistema aquí.';
  const S=genSystem(st),sk=sSeed(st),sp=SPEC[D.ship.d],s=D.st;
  if(act==='fuel'){if(!infected(st))return'Esta estrella no tiene astrófago.';if(s.fuel>=sp.tank)return'Los tanques ya están llenos.';
    return orbitDo(sk+':-1',30,()=>{const v=+(Math.min(sp.tank-s.fuel,sp.tank*.35)).toFixed(1);s.fuel+=v;questEvent({type:'harvest',what:'fuel'});return`Los colectores capturan ${v} t de astrófago en la línea Petrova.`})}
  if(act==='rest')return orbitDo(sk+':rest',10,()=>{morAll(12);return'La tripulación descansa. Moral +12.'},0);
  if(act==='rep'){if(s.min<10)return'Faltan minerales para reparar.';if(s.hull>=100)return'El casco está intacto.';return orbitDo(sk+':rep',5,()=>{s.min-=10;s.hull=Math.min(100,s.hull+12);return'Casco reparado +12%.'},0)}
  if(act==='earth'){if(!(st.anchor&&st.anchor.id==='sol'))return'Sólo se puede reabastecer en la Tierra.';return orbitDo(sk+':earth',60,()=>{s.fuel=sp.tank;s.prov=sp.prov;s.hull=100;morAll(20);for(const m of alive())m.hp=100;return'Tanques llenos, despensa completa, casco nuevo.'},0)}
  if(act==='scan'){const info=planetInfo(S,i);return orbitDo(info.key+':scan',2,()=>{D.scan[info.key]=1;return`Escaneo de ${info.p.name} completado.`},0)}
  if(act==='scanall'){const n=S.planets.filter((p,k)=>!D.scan[planetInfo(S,k).key]).length;if(!n)return'Todos los planetas ya están escaneados.';return orbitDo(sk+':scanall',2*n,()=>{S.planets.forEach((p,k)=>D.scan[planetInfo(S,k).key]=1);return`${n} planeta${n>1?'s':''} escaneado${n>1?'s':''}.`},0)}
  if(act==='gas'){const info=planetInfo(S,i);return orbitDo(info.key+':gas',4,()=>{const r=roll('cie',10);if(r.ok){s.fuel=Math.min(sp.tank,s.fuel+sp.tank*.1);return'La sonda atmosférica recoge volátiles: +10% de combustible.'+gainXp(r.m,10)}return'La sonda se pierde en las tormentas.'},1)}
  return'';
}
function orbitAct(act,i,label){cmd({k:'orbit',act,i},label)}
