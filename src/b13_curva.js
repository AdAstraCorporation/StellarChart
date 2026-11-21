
/* ═════════ Motor de curvatura, plaga dinámica, estrellas muertas, agujeros negros, supernovas,
   estaciones de comercio, aditamentos, bonos de rol, tolerancias de la nave y emergencias ═════════
   · El motor de curvatura gasta MATERIA (t, se extrae en cualquier sistema) y ENERGÍA NEGATIVA (EN: estrellas
     muertas, agujeros negros, contratos o comprándola). D.st.fuel es la energía negativa; D.st.mat, la materia.
   · Saltar desde o hacia un agujero negro no gasta nada: la curvatura ya la pone él.                                  */
const EN_N='Energía negativa',EN_U='EN',MAT_N='Materia';
const EN_POR=.5; // EN por año luz = burn × 0,5; materia por año luz = burn
/* ── Aditamentos de la nave ── */
const MODS={
  tanque:{n:'Tanque de energía ampliado',ic:'🔋',d:'+40 % de capacidad de energía negativa.',c:120},
  bodega:{n:'Bodega de materia',ic:'📦',d:'+60 % de capacidad de materia.',c:80},
  bobinas:{n:'Bobinas de curvatura afinadas',ic:'🌀',d:'−20 % de consumo por año luz.',c:220},
  colector:{n:'Colector de materia',ic:'🧲',d:'+60 % al extraer materia y energía.',c:90},
  invernadero:{n:'Invernadero estelar',ic:'🌱',d:'+60 % de comida al cultivar con luz estelar.',c:70},
  blindaje:{n:'Blindaje reforzado',ic:'🛡',d:'−40 % de daño al casco.',c:110},
  reciclador:{n:'Reciclador de provisiones',ic:'♻',d:'−20 % de consumo de provisiones.',c:100},
  sensores:{n:'Sensores de largo alcance',ic:'📡',d:'+2 a las pruebas de Ciencia y Pilotaje en eventos.',c:60},
  habitat:{n:'Módulo de hábitat adaptable',ic:'🏠',d:'Cualquier especie viaja cómoda en esta nave.',c:90}};
const modSlots=()=>{const L=SPEC[D.ship.d].len;return L<20?1:L<60?2:L<400?3:4};
const hasMod=k=>!!(D.ship.mods||[]).includes(k);
const MATC=()=>Math.round(SPEC[D.ship.d].tank*2*(hasMod('bodega')?1.6:1));
const ENC=()=>Math.round(SPEC[D.ship.d].tank*(hasMod('tanque')?1.4:1));
function ensureSt(){if(!Array.isArray(D.ship.mods))D.ship.mods=[];D.ship.mods=D.ship.mods.filter(k=>MODS[k]);const s=D.st;if(!s)return;if(!isFinite(s.mat))s.mat=MATC()}
ensureSt();
/* ── Bonos de rol: cada rol activo a bordo aporta algo a la nave (y +1 a sus propias tiradas de su rol) ── */
const rolMejor=k=>{let b=0;for(const m of alive())if(m.role===k&&m.st==='ok')b=Math.max(b,eff(m,k));return b};
const rolF=(k,por,max)=>clamp((rolMejor(k)-4)*por,0,max);
function bonosRol(){return[
  ['pil',`Pilotaje: −${Math.round(rolF('pil',.025,.2)*100)} % de consumo en los saltos`],
  ['ing',`Ingeniería: reparaciones +${Math.round(rolF('ing',.1,.8)*100)} % · −${Math.round(rolF('ing',.04,.3)*100)} % de daño al casco`],
  ['cie',`Ciencia: +${Math.round(rolF('cie',.05,.5)*100)} % al extraer materia y energía`],
  ['med',`Medicina: curación +${Math.round(rolF('med',.1,1)*100)} %`],
  ['seg',`Seguridad: +${Math.round(rolF('seg',.5,3))} en encuentros hostiles`],
  ['soc',`Diplomacia: −${Math.round(rolF('soc',.03,.3)*100)} % en los precios de las estaciones`]].filter(([k])=>rolMejor(k)>0)}
const consumoMul=()=>(hasMod('bobinas')?.8:1)*(1-rolF('pil',.025,.2));
const extraeMul=()=>(hasMod('colector')?1.6:1)*(1+rolF('cie',.05,.5));
const precioMul=()=>1-rolF('soc',.03,.3);
const cascoMul=()=>(hasMod('blindaje')?.6:1)*(1-rolF('ing',.04,.3));
/* ── Tolerancias: cada nave acomoda mejor a unas especies que a otras ── */
const INCOMODA={caza:['Oso','Dragón','Ciervo','Tigre'],velero:['Oso','Dragón','Tigre'],corbeta:['Dragón'],sonda:[],carguero:[],carguero2:['Murciélago'],generacional:[],plataforma:[]};
const incomodo=m=>!!m&&m.st!=='perdido'&&!hasMod('habitat')&&(INCOMODA[D.ship.d]||[]).includes(m.sp);
function tolTick(n){for(const m of alive())if(incomodo(m)){m.mor=Math.max(0,m.mor-n*.08);if(n>=20)m.hp=Math.max(10,m.hp-n*.02)}}

/* ── Estrellas muertas, agujeros negros y supernovas ── */
if(!D.nova||typeof D.nova!=='object')D.nova={};
function destino(s){if(!s||s.point||s.anchor)return null;const n=D.nova[sSeed(s)];if(n)return n.f;const h=hash(s.h,77)%1000;return h<2?'bh':h<10?'ns':h<30?'wd':null}
const FATE={bh:{n:'Agujero negro',ic:'⚫',en:.6},ns:{n:'Estrella de neutrones',ic:'✳',en:.35},wd:{n:'Enana blanca',ic:'◦',en:.2}};
const esBH=s=>destino(s)==='bh';
const muerta=s=>!!destino(s);
/* Supernovas: de vez en cuando una estrella masiva cercana colapsa y explota; deja una estrella de neutrones o un agujero negro */
function supernova(force){
  if(NET.role==='client'||!D.st)return'';const sh=shipStar();const cand=[];
  starsNear(sh.gx,sh.gy,sh.gz,70,s=>{if(!s.anchor&&!destino(s)&&!sameStar(s,sh)&&(force||'OBA'.includes(s.P.k)||s.P.mass>2))cand.push(s)});
  if(!cand.length)return'';const s=cand[Math.random()*cand.length|0],seed=sSeed(s),d=gd(s,sh),f=s.P.mass>3||Math.random()<.3?'bh':'ns';
  D.nova[seed]={f,d:+D.st.days.toFixed(1),rt:Date.now(),n:starName(s)};const ks=Object.keys(D.nova);if(ks.length>60)delete D.nova[ks[0]];
  let t=`💥 Supernova: ${starName(s)} colapsa y explota a ${fmtLen(d)}. Deja ${f==='bh'?'un agujero negro':'una estrella de neutrones'}: fuente de ${EN_N.toLowerCase()}.`;
  if(d<4){const dm=Math.round(25*cascoMul());D.st.hull=Math.max(1,D.st.hull-dm);for(const m of alive())hurt(m,12);morAll(-10);t+=` ¡La onda de choque alcanza la nave! Casco −${dm} %.`}
  else if(d<15){morAll(-3);t+=' Su luz ilumina la cabina durante días.'}
  logDM(t,'ev');toast(esc(t));if(NET.role==='host')bcast({t:'toast',h:esc(t)});saveD();return t}
function drawRemanentes(vis,R){
  const now=Date.now();for(const s of vis){if(s._f!==frameNo)continue;const f=destino(s);if(!f)continue;const x=s._x,y=s._y;
    if(f==='bh'){ctx.fillStyle='#000';ctx.beginPath();ctx.arc(x,y,3.4,0,7);ctx.fill();ctx.strokeStyle='rgba(255,170,80,.8)';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(x,y,7,2.6,-.3,0,7);ctx.stroke();if(R<60)labelAt(x,y,'⚫ '+starName(s),'rgba(255,190,120,.85)',9)}
    else if(R<(f==='wd'?50:120)){ctx.strokeStyle=f==='ns'?'rgba(160,200,255,.8)':'rgba(220,230,255,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,f==='ns'?4.5:3.5,0,7);ctx.stroke()}
    const n=D.nova[sSeed(s)];if(n&&n.rt&&now-n.rt<90000){const p=(now-n.rt)/90000,r=8+p*120;ctx.strokeStyle=`rgba(255,220,150,${(1-p)*.8})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.stroke();ctx.fillStyle=`rgba(255,240,200,${(1-p)*.5})`;ctx.beginPath();ctx.arc(x,y,6+(1-p)*10,0,7);ctx.fill()}}}

/* ── Plaga dinámica (nombre configurable, se puede desactivar) ──
   Población global de la plaga (P) y de su depredador (Q), Lotka-Volterra: se controlan entre sí y oscilan.
   Avanza con los días a bordo y también con el reloj real (cada 10 s ≈ 2 días), así la propagación se ve en directo.
   Cada estrella se infecta según su susceptibilidad (semilla + un campo de ruido que se desplaza con el tiempo).
   Algunos sistemas son inmunes; donde está el depredador, la plaga no prospera.                                     */
function PLG(){if(!D.pl||typeof D.pl!=='object')D.pl={on:1,n:'Astrófago',P:.3,Q:.25,t:0};return D.pl}
const PLN=()=>PLG().n||'Astrófago',pln=()=>`plaga «${PLN()}»`;
function plagaPaso(dias){const p=PLG();if(!p.on)return;let P=p.P,Q=p.Q;const n=Math.max(1,Math.ceil(dias/5)),h=dias/n;
  for(let i=0;i<n;i++){const dP=.004*P*(1-P)-.012*P*Q,dQ=.006*P*Q-.0016*Q;P=clamp(P+dP*h*(1+(Math.random()-.5)*.4),.03,.95);Q=clamp(Q+dQ*h,.02,.9)}p.P=+P.toFixed(4);p.Q=+Q.toFixed(4);p.t=(p.t||0)+dias}
const inmune=s=>s.anchor?s.anchor.id==='tceti':hash(s.h,31)%6===0;
const depredador=s=>!s.point&&(s.anchor?s.anchor.id==='tceti':(hash(s.h,29)%1000)/1000<PLG().Q*.3);
function infectado(s){const p=PLG();if(!p.on||!s||s.point||muerta(s))return false;if(s.anchor)return INF.has(s.anchor.id)&&p.P>.08&&!inmune(s);
  if(!PETROVA.has(s.P.k)||inmune(s)||depredador(s))return false;const w=(p.t||0)/400,u=.75*(hash(s.h,13)%1000)/1000+.25*vn3(s.gx/60+w,s.gy/60,s.gz/60,3);return u<p.P*1.4}
function plagaTag(s){if(s.point)return'';if(infectado(s))return`<span class="tag pet">${esc(PLN())}</span>`;if(!PLG().on)return'';if(depredador(s))return'<span class="tag">depredador de la plaga</span>';if(inmune(s))return'<span class="tag">inmune</span>';return''}

/* ── Estaciones de comercio ── */
function estacion(s){if(!s||s.point)return null;if(s.anchor&&s.anchor.id==='sol')return{n:'Estación Lagrange · Tierra',f:'aa',r:rng(11)};if(s.anchor)return null;
  if(hash(s.h,55)%4)return null;const r=rng(hash(s.h,56)),t=facOf(s);return{n:`Estación ${pick2(r,['Kepler','Halo','Mercado','Encrucijada','Faro','Bazar','Ancla','Muelle'])} ${genName(hash(s.h,57)).split(' ')[0]}`,f:t?t.f:null,r}}
function preciosDe(s){const e=estacion(s);if(!e)return null;const r=rng(hash(s.anchor?7:s.h,58)),m=precioMul(),v=(a,b)=>+(lerp(a,b,r())*m).toFixed(2);
  return{en:v(5,9),mat:v(.8,1.6),prov:v(.6,1.2),venta:+lerp(.5,.9,r()).toFixed(2),mods:Object.keys(MODS).filter((k,i)=>s.anchor||hash(s.h,60+i)%3!==0)}}
function comprar(que,cant){const st=shipStar(),pr=preciosDe(st);if(!pr)return'Aquí no hay estación.';const s=D.st;cant=Math.max(0,+cant||0);
  if(que==='en'){const c=Math.min(cant,ENC()-s.fuel),cost=Math.ceil(c*pr.en);if(c<=0)return'Los tanques de energía están llenos.';if(s.min<cost)return`Hacen falta ${cost} t de minerales.`;s.min-=cost;s.fuel+=c;saveD();return`Compras ${fmtI(c)} ${EN_U} por ${cost} t de minerales.`}
  if(que==='mat'){const c=Math.min(cant,MATC()-s.mat),cost=Math.ceil(c*pr.mat);if(c<=0)return'La bodega de materia está llena.';if(s.min<cost)return`Hacen falta ${cost} t de minerales.`;s.min-=cost;s.mat+=c;saveD();return`Compras ${fmtI(c)} t de materia por ${cost} t de minerales.`}
  if(que==='prov'){const sp=SPEC[D.ship.d],c=Math.min(cant*100,sp.prov-s.prov),cost=Math.ceil(c/100*pr.prov);if(c<=0)return'La despensa está llena.';if(s.min<cost)return`Hacen falta ${cost} t de minerales.`;s.min-=cost;s.prov+=c;saveD();return`Compras ${fmtI(c)} días-persona de provisiones por ${cost} t.`}
  if(que==='vmat'){const c=Math.min(cant,s.mat),g=Math.floor(c*pr.venta);if(c<=0)return'';s.mat-=c;s.min=Math.min(SPEC[D.ship.d].cargo,s.min+g);saveD();return`Vendes ${fmtI(c)} t de materia por ${g} t de minerales.`}
  if(que.startsWith('mod:')){const k=que.slice(4),M=MODS[k];if(!M||!pr.mods.includes(k))return'Ese aditamento no se vende aquí.';if(hasMod(k))return'Ya lo tenéis instalado.';
    if(D.ship.mods.length>=modSlots())return`No quedan huecos (${modSlots()}): desmonta otro aditamento.`;const cost=Math.ceil(M.c*precioMul());if(s.min<cost)return`Hacen falta ${cost} t de minerales.`;
    s.min-=cost;D.ship.mods.push(k);passDays(3);saveD();return`${M.ic} Instaláis ${M.n} (${cost} t, 3 días).`}
  if(que.startsWith('desm:')){const k=que.slice(5);if(!hasMod(k))return'';D.ship.mods=D.ship.mods.filter(x=>x!==k);s.min=Math.min(SPEC[D.ship.d].cargo,s.min+Math.floor(MODS[k].c*.4));saveD();return`Desmontáis ${MODS[k].n} y lo vendéis por ${Math.floor(MODS[k].c*.4)} t.`}
  return''}
function estacionHtml(S){const e=estacion(S.star),pr=preciosDe(S.star);if(!e)return'';const cl=NET.role==='client',s=D.st;
  const B=(lab,que,c,dis)=>A(lab,()=>cmd({k:'tienda',q:que,c},lab),cl||dis);
  return`<h3>🛰 ${esc(e.n)}${e.f?` <span class="dim">· ${FAC[e.f].ic} ${esc(FAC[e.f].s)}</span>`:''}</h3><p class="note">Se paga con minerales (tenéis ${fmtI(s.min)} t).${precioMul()<1?` Vuestra diplomacia rebaja los precios un ${Math.round((1-precioMul())*100)} %.`:''}</p>
  <div class="kv"><span>${EN_N}</span><span>${pr.en} t / ${EN_U}</span><span>Materia</span><span>${pr.mat} t / t · se compra a ${pr.venta}</span><span>Provisiones</span><span>${pr.prov} t / 100 días-persona</span></div>
  <div class="row">${B('Comprar 10 '+EN_U,'en',10,s.min<Math.ceil(10*pr.en))}${B('Comprar 50 t de materia','mat',50,s.min<Math.ceil(50*pr.mat))}${B('Comprar 1 000 d-p','prov',10,s.min<Math.ceil(10*pr.prov))}${B('Vender 50 t de materia','vmat',50,s.mat<1)}</div>
  <h3>Aditamentos (${D.ship.mods.length}/${modSlots()} huecos)</h3><div class="lst">${pr.mods.map(k=>{const M=MODS[k],c=Math.ceil(M.c*precioMul());return`<div class="item"><span>${M.ic}</span><div class="m"><b>${esc(M.n)}</b><i>${esc(M.d)} · ${c} t</i></div>${hasMod(k)?'<span class="tag">instalado</span>':B('Instalar','mod:'+k,0,s.min<c||D.ship.mods.length>=modSlots())}</div>`}).join('')}</div>`}

/* ── Acciones nuevas en órbita: extraer materia, energía negativa y cultivar con luz estelar ── */
function plnetasAtm(S){return S.planets.filter(p=>p.kind==='gas'||p.kind==='ocean'||p.kind==='temperate'||p.kind==='ice').length}
function accionCurva(act,S,st,sk){const s=D.st,sp=SPEC[D.ship.d];
  if(act==='mat'){if(s.mat>=MATC())return'La bodega de materia está llena.';const rico=1+.15*S.planets.length+.3*S.belts.length;
    return orbitDo(sk+':mat',15,()=>{const v=Math.round(Math.min(MATC()-s.mat,MATC()*.18*rico*extraeMul()));s.mat+=v;questEvent({type:'harvest',what:'fuel'});return`Los drones de extracción cargan ${fmtI(v)} t de materia de los planetas y cinturones.`})}
  if(act==='en'){const f=destino(st);if(!f)return'Sólo las estrellas muertas y los agujeros negros dan energía negativa.';if(s.fuel>=ENC())return'Los tanques de energía están llenos.';
    return orbitDo(sk+':en',20,()=>{const v=+Math.min(ENC()-s.fuel,ENC()*FATE[f].en*extraeMul()).toFixed(1);s.fuel+=v;let t=`Los colectores de vacío capturan ${v} ${EN_U} de energía negativa junto ${f==='bh'?'al horizonte del agujero negro':'al remanente estelar'}.`;
      if(f==='bh'&&Math.random()<.25){const dm=Math.round(10*cascoMul());s.hull=Math.max(1,s.hull-dm);t+=` Las mareas gravitatorias dañan el casco (−${dm} %).`}return t})}
  if(act==='luz'){const P=S.P;if(P.lum<.02||muerta(st))return'Esta estrella no da luz suficiente para cultivar.';if(s.prov>=sp.prov)return'La despensa está llena.';
    return orbitDo(sk+':luz',15,()=>{const v=Math.round(Math.min(sp.prov-s.prov,(sp.prov*.06+eaters()*25)*clamp(Math.sqrt(P.lum),.3,2)*(1+.2*plnetasAtm(S))*(infectado(st)?.5:1)*(hasMod('invernadero')?1.6:1)));s.prov+=v;
      return`Los paneles y los cultivos aprovechan la luz de la estrella y los gases de sus planetas: +${fmtI(v)} días-persona de comida.${infectado(st)?` La ${pln()} se come parte de la luz.`:''}`})}
  return''}

/* ── Llegadas: tripulantes que esperan en un sistema de la facción dominante ── */
function faccionNave(){const x=FX(),af=x.aff||['aa'];let b=af[0]||'aa',v=-1e9;for(const f of af){const r=(x.rep||{})[f]||0;if(r>v){v=r;b=f}}return b}
function puntoDeEncuentro(){const sh=shipStar(),f=faccionNave();let best=null,bd=1e9;
  starsNear(sh.gx,sh.gy,sh.gz,25,s=>{if(s.anchor||sameStar(s,sh))return;const t=facOf(s);if(!t||t.f!==f)return;const d=gd(s,sh);if(d<bd){bd=d;best=s}});return best}
function recogerEsperando(st){const seed=sSeed(st);let out='';for(const m of D.crew)if(m.esp===seed&&m.st==='susp'){delete m.esp;m.st='ok';out+=`🤝 ${m.nm} os esperaba en ${starName(st)} y sube a bordo. `}if(out){logDM(out,'sys');saveD()}return out}

/* ── Emergencia por hambruna: sólo la propone el capitán ── */
function emergenciaHtml(){if(D.st.prov>0||!alive().length)return'';const cap=NET.role!=='client';
  return`<div class="card" style="border-color:#ff6b6b"><div class="kick" style="color:#ff6b6b">HAMBRUNA</div><p class="note">No queda comida a bordo. La tripulación pierde salud y moral cada día.${cap?' Como capitán puedes proponer una medida de emergencia: la tripulación vota y, si se aprueba, se aplica.':' Sólo el capitán puede proponer una medida de emergencia.'}</p>${cap?A('⚠ Medida de emergencia…',abrirEmergencia,0,'pri'):''}</div>`}
function abrirEmergencia(){const a=alive();if(!a.length)return;modalOpen=true;
  showModal(`<div class="kick">MEDIDA DE EMERGENCIA</div><h2>Hambruna a bordo</h2><p class="story">Sin comida y sin rescate a la vista, el capitán plantea lo impensable: que uno de los tripulantes sirva de sustento al resto. La tripulación votará; si se rechaza, no ocurre.</p>
  <div class="field"><label>¿Quién?</label><select id="emM">${a.map(m=>`<option value="${esc(m.id)}">${esc(m.nm)} · ${ROLES[m.role]}${m.pl?' · 👤 '+esc(m.pl):''}</option>`).join('')}<option value="sorteo">Que lo decida un sorteo</option></select></div>
  <div class="row"><button class="pri" id="emOk">Someterlo a votación</button><button id="no">Cancelar</button></div>`);
  $('#emOk').onclick=()=>{let id=$('#emM').value;if(id==='sorteo')id=a[Math.random()*a.length|0].id;const m=a.find(q=>q.id===id);modalOpen=false;closeModal();if(!m)return;const c={k:'emerg',id};
    if(NET.role==='host'&&NET.conns.size)propose({kind:'cmd',title:`Emergencia: ¿sacrificar a ${m.nm} para alimentar al resto?`,opts:['A favor','En contra'],cmd:c});
    else if(confirm(`¿Sacrificar a ${m.nm} para alimentar al resto?`)){const t=execCmd(c);if(t)toast(esc(t));refresh()}};
  $('#no').onclick=()=>{modalOpen=false;closeModal()}}
function emergencia(id){const m=alive().find(q=>q.id===id);if(!m||D.st.prov>0)return'';m.st='perdido';m.hp=0;const v=Math.round(Math.max(60,crewCount()*25));D.st.prov+=v;morAll(-30);
  const t=`🕯 ${m.nm} da su vida para que el resto sobreviva. Nadie habla durante días. (+${fmtI(v)} días-persona · moral −30)`;logDM(t,'ev');saveD();return t}

/* ── Encuentros con otras naves: trueque, piratas, naves en apuros, exploradores ── */
const nombreNave=r=>pick2(r,['Albatros','Peregrina','Sexta Luna','Cortavientos','Brasa','Lince Errante','Medusa','Faro de Vega','Última Canción','Tres Colas']);
function trato(dar,dk,recibir,rk){const s=D.st;if((dk==='mat'?s.mat:dk==='en'?s.fuel:dk==='prov'?s.prov:s.min)<dar)return'No tenéis suficiente.';
  const sub=(k,v)=>{if(k==='mat')s.mat-=v;else if(k==='en')s.fuel-=v;else if(k==='prov')s.prov-=v;else s.min-=v},add=(k,v)=>{const sp=SPEC[D.ship.d];if(k==='mat')s.mat=Math.min(MATC(),s.mat+v);else if(k==='en')s.fuel=Math.min(ENC(),s.fuel+v);else if(k==='prov')s.prov=Math.min(sp.prov,s.prov+v);else s.min=Math.min(sp.cargo,s.min+v)};
  sub(dk,dar);add(rk,recibir);return'Trueque hecho.'}
const RN={mat:'t de materia',en:EN_U,prov:'días-persona',min:'t de minerales'};
function eventosNaves(){return[
 {id:'nave_trueque',w:4,at:'any',t:'Nave mercante',tx:()=>`La ${nombreNave(Math.random)} se acerca con las bodegas llenas y propone un trueque.`,
  op:(()=>{const r=Math.random,a=Math.round(20+r()*30),b=Math.round(3+r()*5),c=Math.round(30+r()*40),p=Math.round(600+r()*900);return[
   {l:`Dar ${a} t de minerales → ${b} ${EN_U}`,need:()=>D.st.min>=a,run:()=>trato(a,'min',b,'en')},
   {l:`Dar ${c} t de materia → ${p} días-persona`,need:()=>D.st.mat>=c,run:()=>trato(c,'mat',p,'prov')},
   {l:'Regatear',k:'soc',dc:12,ok:()=>trato(0,'min',Math.round(b*1.5),'en')+' Os regalan energía por la conversación.',ko:()=>'Se aburren y siguen su camino.'},
   {l:'Seguir de largo',run:()=>'Intercambiáis saludos por radio.'}]})()},
 {id:'nave_piratas',w:2,at:'leg',t:'Piratas',tx:()=>`Una nave sin bandera os corta el paso: «Las bodegas o el casco».`,
  op:[{l:'Plantar cara',k:'seg',dc:13,ok:(c,r)=>{trato(0,'min',25,'min');return'Huyen dejando parte del botín: +25 t de minerales.'+gainXp(r.m,10)},ko:()=>{const dm=Math.round(20*cascoMul());D.st.hull=Math.max(1,D.st.hull-dm);return`Os acribillan antes de huir. Casco −${dm} %.`+hurt(pick(alive()),15)}},
      {l:'Escapar a máxima curvatura',k:'pil',dc:12,ok:()=>'Los dejáis atrás.',ko:()=>{const v=Math.min(D.st.fuel,4);D.st.fuel-=v;return`Os alcanzan y se llevan ${fmtI(v)} ${EN_U}.`}},
      {l:'Entregar 30 t de materia',need:()=>D.st.mat>=30,run:()=>{D.st.mat-=30;return'Se marchan satisfechos.'}}]},
 {id:'nave_apuros',w:2,at:'any',t:'Nave en apuros',tx:()=>`Una señal de socorro: la ${nombreNave(Math.random)} tiene el motor de curvatura muerto.`,
  op:[{l:'Ayudarles (cuesta 15 t de materia)',need:()=>D.st.mat>=15,k:'ing',dc:10,ok:(c,r)=>{D.st.mat-=15;D.st.fuel=Math.min(ENC(),D.st.fuel+6);morAll(8);return`Os dan las gracias con 6 ${EN_U}. Moral +8.`+gainXp(r.m,15)},ko:()=>{D.st.mat-=15;return'No hay forma de arrancar su motor. Os quedáis con su gratitud.'}},
      {l:'Acoger a un superviviente',run:()=>'Uno de ellos prefiere seguir con vosotros.'+offerMember(null,'Superviviente de una nave averiada')},
      {l:'Ignorar la señal',run:()=>{morAll(-6);return'Nadie habla de ello. Moral −6.'}}]},
 {id:'nave_ciencia',w:2,at:'arr',t:'Exploradores científicos',tx:()=>`Una nave de investigación pide vuestros datos de navegación a cambio de muestras.`,
  op:[{l:'Compartir los datos',run:()=>{D.st.fuel=Math.min(ENC(),D.st.fuel+3);return`+3 ${EN_U} y una charla interesante sobre la ${pln()}.`}},
      {l:'Intercambiar conocimientos',k:'cie',dc:11,ok:(c,r)=>{for(const m of alive())gainXp(m,8);return'Aprendéis mucho: +8 XP a la tripulación.'+gainXp(r.m,8)},ko:()=>'Hablan demasiado rápido.'}]},
 {id:'nave_fantasma',w:1,at:'leg',t:'Nave a la deriva',tx:()=>'Un casco antiguo, sin energía, gira lentamente. Sus sistemas parecen intactos.',
  op:[{l:'Abordarla',k:'seg',dc:12,ok:(c,r)=>{const libres=Object.keys(MODS).filter(k=>!hasMod(k));if(libres.length&&D.ship.mods.length<modSlots()){const k=libres[Math.random()*libres.length|0];D.ship.mods.push(k);return`Recuperáis un aditamento en buen estado: ${MODS[k].ic} ${MODS[k].n}.`+gainXp(r.m,10)}trato(0,'min',40,'mat');return'Desmontáis lo útil: +40 t de materia.'},ko:()=>hurt(pick(alive()),18)+' Algo seguía vivo ahí dentro.'},
      {l:'Dejarla',run:()=>'Sigue girando.'}]}]}

/* ── Paso del tiempo y reloj real ── */
let _plT=Date.now(),_novT=Date.now();
setInterval(()=>{if(NET.role==='client'||!D.st||typeof RONDA!=='undefined'&&!RONDA)return;const n=Date.now();
  if(n-_plT>10000){_plT=n;plagaPaso(2);if(NET.role==='host')netSync()}
  if(n-_novT>240000){_novT=n;if(Math.random()<.35)supernova()}},2000);
/* Alcance con lo que hay en los tanques (energía negativa y materia), sin pasar del máximo por salto */
function alcance(){const sp=SPEC[D.ship.d],k=Math.max(1e-9,sp.burn*consumoMul());return Math.min(D.st.fuel/(k*EN_POR),(D.st.mat||0)/k)}
