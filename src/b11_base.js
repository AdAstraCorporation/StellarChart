
/* ═════════ Bases planetarias y envíos de recursos ═════════
   · Cada planeta sólido tiene una riqueza determinista (semilla del sistema): minerales, astrófago y alimento; puede ser cero.
   · La base produce con el tiempo de a bordo y acumula hasta su capacidad.
   · Los envíos viajan en tiempo real: 1 año luz cada 5 segundos (mínimo 5 s), desde la base hasta donde esté la nave al pedirlos. */
const BSPEED=5000,BMAX=8,WH={min:1000,fuel:300,prov:60000},RMAX=12;
const BTY={
 mina:{n:'Mina',ic:'⛏',r:'min',rate:25,cap:400,d:'Extrae minerales del subsuelo.'},
 refineria:{n:'Refinería de astrófago',ic:'⚗',r:'fuel',rate:10,cap:120,d:'Cultiva y refina astrófago.'},
 granja:{n:'Granja hidropónica',ic:'🌱',r:'prov',rate:1500,cap:30000,d:'Produce comida para la tripulación.'},
 puesto:{n:'Puesto avanzado',ic:'⛺',r:null,rate:0,cap:0,d:'Un poco de todo y refugio: +2 moral al visitarlo.'}};
const RESN={min:['Minerales','t'],fuel:['Astrófago','t'],prov:['Provisiones','días-persona']};
function baseRes(S,i){
  const info=planetInfo(S,i),p=info.p,r=rng(hash(S.star.h,i,1312));if(info.gas)return null;const has=n=>info.pois.includes(n);
  let min=({lava:1.2,desert:1,barren:1,ice:.5,frozen:.6,temperate:.6,ocean:.3})[p.kind]??.5;if(has('Depósito mineral'))min+=.8;if(has('Géiser de lava'))min+=.5;min*=.4+r();if(r()<.12)min=0;
  let fuel=(has('Cristales de astrófago')?1.2:0)+(infected(S.star)?.6:0);fuel*=.5+r();
  let prov=(p.hz?.8:0)+(has('Flora comestible')?.8:0)+(info.breath?.3:0)+(has('Hielo puro')?.25:0);if(p.T<150||p.T>420)prov*=.25;prov*=.5+r()*.8;
  return{min:+min.toFixed(2),fuel:+fuel.toFixed(2),prov:+prov.toFixed(2),info}}
const richLab=v=>v<=0?'nula':v<.4?'pobre':v<.9?'media':v<1.5?'rica':'muy rica';
function baseRate(b){const t=BTY[b.ty];if(!t)return{};if(b.ty==='puesto')return{min:3*b.lv,fuel:1*b.lv,prov:150*b.lv};return{[t.r]:t.rate*(b.rich[t.r]||0)*b.lv}} // por 100 días
const baseCap=b=>b.ty==='puesto'?{min:60*b.lv,fuel:20*b.lv,prov:4000*b.lv}:{[BTY[b.ty].r]:BTY[b.ty].cap*b.lv};
function baseTick(){if(!Array.isArray(D.bases))D.bases=[];const now=D.st.days;for(const b of D.bases){const dt=Math.max(0,now-b.t);if(!dt)continue;b.t=now;const rt=baseRate(b),cp=baseCap(b);
  for(const k in rt){const v=b.stk[k]||0;b.stk[k]=Math.max(v,Math.min(cp[k]||0,v+rt[k]*dt/100))}}}
const whCap=(b,k)=>Math.max((baseCap(b)[k]||0),WH[k]*b.lv);
const baseStar=b=>starFromSeed(b.s);
function shipXYZ(){const p=typeof pilot!=='undefined'&&pilot?pilot.pos:null;if(p)return p.slice();const s=shipStar();return[s.gx,s.gy,s.gz]}
function buildBase(i,ty){
  const st=shipStar();if(st.point)return'Aquí no hay planetas.';const S=genSystem(st),rs=baseRes(S,i);if(!rs)return'No se puede construir sobre un gigante gaseoso.';if(!BTY[ty])return'';
  if(!Array.isArray(D.bases))D.bases=[];if(D.bases.length>=BMAX)return`Máximo ${BMAX} bases.`;const key=sSeed(st)+':'+i;if(D.bases.some(b=>b.k===key))return'Ya hay una base en ese planeta.';
  if(D.st.min<40&&!D.cr)return'Hacen falta 40 t de minerales.';baseTick();if(!D.cr)D.st.min-=40;passDays(20);
  let id;do id=Math.random().toString(36).slice(2,8).toUpperCase();while(D.bases.some(q=>q.id===id));const b={id,k:key,s:sSeed(st),i,n:`${BTY[ty].n} ${S.planets[i].name}`,sn:S.name,pn:S.planets[i].name,ty,lv:1,t:D.st.days,stk:{},rich:{min:rs.min,fuel:rs.fuel,prov:rs.prov}};D.bases.push(b);
  let s=`${BTY[ty].ic} Base construida en ${b.pn}: ${b.n}.`;const rt=baseRate(b);if(ty!=='puesto'&&!Object.values(rt).some(v=>v>0))s+=' El planeta no tiene ese recurso: no producirá nada.';
  const ter=typeof facOf==='function'?facOf(st):null;if(ter){const f=ter.f,v=FX().aff.includes(f)?3:rel(f,'aa')>=1?1:-4;s+=` ${FAC[f].ic} ${FAC[f].s} ${v>0?'lo aprueba':'no lo ve con buenos ojos'}.`+addRep(f,v)}
  logDM(s,'cmd');saveD();return s}
function upBase(id){const b=(D.bases||[]).find(q=>q.id===id);if(!b)return'';if(b.lv>=3)return'La base ya está al máximo.';const c=50*b.lv;if(!sameStar(baseStar(b),shipStar()))return'Tenéis que estar en ese sistema.';
  if(D.st.min<c&&!D.cr)return`Hacen falta ${c} t de minerales.`;baseTick();if(!D.cr)D.st.min-=c;passDays(15);b.lv++;saveD();return`${b.n} pasa a nivel ${b.lv}.`}
const baseById=id=>(D.bases||[]).find(q=>q.id===id);
const dstName=d=>d==='nave'?(D.ship.n||SHIPS[D.ship.d].n):((baseById(d)||{}).n||'base perdida');
/* id: base de origen · dst: 'nave' o id de base · res: 'all'|'min'|'fuel'|'prov' · q: cantidad máxima (0 = todo) */
function sendBase(id,dst='nave',res='all',q=0){baseTick();const b=baseById(id),st=b&&baseStar(b);if(!b||!st)return'';if(dst===id)return'El origen y el destino son la misma base.';
  const db=dst==='nave'?null:baseById(dst);if(dst!=='nave'&&!db)return'Esa base ya no existe.';const amt={};
  for(const k of ['min','fuel','prov']){if(res!=='all'&&res!==k)continue;let v=Math.floor(b.stk[k]||0);if(q>0)v=Math.min(v,q);if(v>0){amt[k]=v;b.stk[k]-=v}}
  if(!Object.keys(amt).length)return`${b.n} no tiene ${res==='all'?'nada':RESN[res][0].toLowerCase()} que enviar todavía.`;if(!Array.isArray(D.conv))D.conv=[];if(D.conv.length>=20)return'Demasiados envíos en camino.';
  const ds=db&&baseStar(db),to=ds?[ds.gx,ds.gy,ds.gz]:shipXYZ(),d=Math.hypot(st.gx-to[0],st.gy-to[1],st.gz-to[2]),now=Date.now(),ms=Math.max(5000,d*BSPEED);
  D.conv.push({id:b.id+'-'+(now%1e6).toString(36)+Math.random().toString(36).slice(2,4),b:b.id,bn:b.n,dst,f:[st.gx,st.gy,st.gz],to,d:+d.toFixed(2),t0:now,eta:now+ms,amt});saveD();
  return`🚚 ${b.n} → ${dstName(dst)}: ${resTxt(amt)}. ${fmtLen(d)}: llega en ${fmtDur(ms)}.`}
/* Rutas automáticas: cada N días a bordo (u) o cada N minutos reales (m) */
function addRoute(c){const b=baseById(String(c.from));if(!b)return'';const dst=String(c.dst||'nave');if(dst!=='nave'&&!baseById(dst))return'';if(dst===b.id)return'El origen y el destino son la misma base.';
  if(!Array.isArray(D.rutas))D.rutas=[];if(D.rutas.length>=RMAX)return`Máximo ${RMAX} rutas.`;const u=c.u==='m'?'m':'d',ev=clamp(+c.ev||(u==='m'?5:30),1,u==='m'?1440:3650),res=['all','min','fuel','prov'].includes(c.res)?c.res:'all';
  const r={id:Date.now().toString(36).slice(-5).toUpperCase(),from:b.id,dst,res,q:Math.max(0,+c.q|0),u,ev,ld:D.st.days,lm:Date.now()};D.rutas.push(r);saveD();
  return`🔁 Ruta creada: ${b.n} → ${dstName(dst)}, ${routeTxt(r)}.`}
const routeTxt=r=>`${r.res==='all'?'todo':RESN[r.res][0].toLowerCase()}${r.q?' (máx. '+fmtI(r.q)+')':''} cada ${r.ev} ${r.u==='m'?'min reales':'días a bordo'}`;
function routeTick(){if(!Array.isArray(D.rutas)||!D.rutas.length)return;const now=Date.now();let ch=0;
  D.rutas=D.rutas.filter(r=>baseById(r.from)&&(r.dst==='nave'||baseById(r.dst)));
  for(const r of D.rutas){const due=r.u==='m'?now-r.lm>=r.ev*60000:D.st.days-r.ld>=r.ev;if(!due)continue;r.lm=now;r.ld=D.st.days;ch=1;
    const m=sendBase(r.from,r.dst,r.res,r.q);if(/^🚚/.test(m)){logDM('🔁 '+m,'sys');if(tab==='base')renderPanel()}}
  if(ch)saveD()}
const resTxt=a=>Object.entries(a).map(([k,v])=>`${fmtI(v)} ${RESN[k][1]==='t'?'t de '+RESN[k][0].toLowerCase():RESN[k][1]}`).join(', ');
const fmtDur=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return s<60?s+' s':s<3600?Math.floor(s/60)+' min '+(s%60)+' s':Math.floor(s/3600)+' h '+Math.floor(s%3600/60)+' min'};
function convTick(){
  if(!Array.isArray(D.conv)||!D.conv.length||(NET&&NET.role==='client'))return;const now=Date.now(),done=D.conv.filter(c=>now>=c.eta);if(!done.length)return;
  D.conv=D.conv.filter(c=>now<c.eta);const sp=SPEC[D.ship.d],s=D.st;
  for(const c of done){const lost=[],db=c.dst&&c.dst!=='nave'?baseById(c.dst):null;if(c.dst&&c.dst!=='nave'&&!db){logDM(`📦 El envío de ${c.bn} no encontró su base de destino.`,'sys');continue}
    if(db)baseTick();
    for(const k in c.amt){const cap=db?whCap(db,k):({min:sp.cargo,fuel:sp.tank,prov:sp.prov})[k],cur=db?(db.stk[k]||0):s[k],v=Math.max(0,Math.min(cap-cur,c.amt[k]));if(db)db.stk[k]=cur+v;else s[k]+=v;if(v<c.amt[k])lost.push(`${fmtI(c.amt[k]-v)} ${RESN[k][1]}`)}
    const m=`📦 Llega a ${db?esc(db.n):'la nave'} el envío de ${c.bn}: ${resTxt(c.amt)}.${lost.length?' No cabe todo: se pierde '+lost.join(', ')+'.':''}`;toast(esc(m));if(NET&&NET.role==='host')bcast({t:'toast',h:esc(m)})}
  saveD();refresh()}
setInterval(()=>{if(!(NET&&NET.role==='client')){routeTick();convTick()}if(tab==='base'&&((D.conv||[]).length||(D.rutas||[]).length)&&!(document.activeElement&&document.activeElement.closest&&document.activeElement.closest('#p-base')))renderBases()},1000);
function doBase(c){if(c.a==='build')return buildBase(c.i|0,String(c.ty));if(c.a==='up')return upBase(String(c.id));
  if(c.a==='send')return sendBase(String(c.id),String(c.dst||'nave'),['all','min','fuel','prov'].includes(c.res)?c.res:'all',Math.max(0,+c.q|0));
  if(c.a==='route')return addRoute(c);if(c.a==='unroute'){D.rutas=(D.rutas||[]).filter(r=>r.id!==c.id);saveD();return'Ruta eliminada.'}
  if(c.a==='drop'){const b=baseById(c.id);if(!b)return'';D.bases=D.bases.filter(q=>q!==b);D.rutas=(D.rutas||[]).filter(r=>r.from!==b.id&&r.dst!==b.id);saveD();return`Abandonáis ${b.n}.`}return''}
function normRutas(a){return(Array.isArray(a)?a:[]).slice(0,RMAX).filter(r=>r&&r.from).map(r=>({id:String(r.id).slice(0,8),from:String(r.from).slice(0,8),dst:String(r.dst||'nave').slice(0,8),res:['all','min','fuel','prov'].includes(r.res)?r.res:'all',q:Math.max(0,+r.q|0),u:r.u==='m'?'m':'d',ev:clamp(+r.ev||30,1,3650),ld:+r.ld||0,lm:+r.lm||0}))}
/* Diálogo de envío: destino, recurso, cantidad y repetición */
function openSend(id){const b=baseById(id);if(!b)return;baseTick();modalOpen=true;const others=(D.bases||[]).filter(q=>q.id!==id);
  showModal(`<div class="kick">ENVIAR RECURSOS</div><h2>${BTY[b.ty].ic} ${esc(b.n)}</h2><p class="note">En almacén: ${['min','fuel','prov'].map(k=>`${RESN[k][0]} ${fmtI(b.stk[k]||0)}`).join(' · ')}. Viajan a 1 año luz cada 5 segundos reales.</p>
  <div class="field"><label>Destino</label><select id="sdD"><option value="nave">🚀 La nave (donde esté al salir el envío)</option>${others.map(q=>{const a=baseStar(b),z=baseStar(q),d=a&&z?gd(a,z):0;return`<option value="${q.id}">${BTY[q.ty].ic} ${esc(q.n)} · ${fmtLen(d)} · ${fmtDur(Math.max(5000,d*BSPEED))}</option>`}).join('')}</select></div>
  <div class="field"><label>Recurso</label><select id="sdR"><option value="all">Todo lo almacenado</option><option value="min">Minerales</option><option value="fuel">Astrófago</option><option value="prov">Provisiones</option></select></div>
  <div class="field"><label>Cantidad máx.</label><input id="sdQ" type="number" min="0" step="1" value="0" title="0 = todo"></div>
  <label class="chk"><input type="checkbox" id="sdRep"> Repetir automáticamente</label>
  <div class="field"><label>Cada</label><input id="sdE" type="number" min="1" value="30" style="width:80px"> <select id="sdU"><option value="d">días a bordo</option><option value="m">minutos reales</option></select></div>
  <div class="row"><button class="pri" id="sdGo">Enviar</button><button id="no">Cancelar</button></div>`);
  const sync=()=>{$('#sdGo').textContent=$('#sdRep').checked?'Crear ruta y enviar ya':'Enviar'};$('#sdRep').onchange=sync;
  $('#sdGo').onclick=()=>{const c={from:id,id,dst:$('#sdD').value,res:$('#sdR').value,q:+$('#sdQ').value||0,u:$('#sdU').value,ev:+$('#sdE').value||1};modalOpen=false;closeModal();
    if(rep)cmd({k:'base',a:'route',...c},`Ruta ${b.n} → ${dstName(c.dst)}`);cmd({k:'base',a:'send',...c},`Envío ${b.n} → ${dstName(c.dst)}`)};
  let rep=false;$('#sdRep').addEventListener('change',e=>rep=e.target.checked);$('#no').onclick=()=>{modalOpen=false;closeModal()}}
function normBases(a){return(Array.isArray(a)?a:[]).slice(0,BMAX).filter(b=>b&&BTY[b.ty]&&starFromSeed(String(b.s))).map(b=>({id:String(b.id).slice(0,8),k:String(b.k).slice(0,50),s:String(b.s).slice(0,40),i:b.i|0,n:String(b.n).slice(0,60),sn:String(b.sn||'').slice(0,40),pn:String(b.pn||'').slice(0,40),ty:b.ty,lv:clamp(b.lv|0,1,3),t:+b.t||0,
  stk:Object.fromEntries(['min','fuel','prov'].filter(k=>b.stk&&+b.stk[k]>0).map(k=>[k,Math.min(1e6,+b.stk[k])])),rich:Object.fromEntries(['min','fuel','prov'].map(k=>[k,clamp(+(b.rich||{})[k]||0,0,5)]))}))}
function normConv(a){const v3=x=>Array.isArray(x)&&x.length===3&&x.every(isFinite)?x.map(Number):null;return(Array.isArray(a)?a:[]).slice(0,20).filter(c=>c&&v3(c.f)&&v3(c.to)&&isFinite(c.eta)).map(c=>({id:String(c.id).slice(0,24),dst:String(c.dst||'nave').slice(0,8),b:String(c.b).slice(0,8),bn:String(c.bn).slice(0,60),f:v3(c.f),to:v3(c.to),d:+c.d||0,t0:+c.t0,eta:+c.eta,
  amt:Object.fromEntries(['min','fuel','prov'].filter(k=>c.amt&&+c.amt[k]>0).map(k=>[k,Math.min(1e6,+c.amt[k]|0)]))}))}

/* — Carta: bases y envíos en camino — */
function drawBases(now){
  if(!Array.isArray(D.bases))return;const R=cam.R;ctx.save();ctx.font='9px ui-monospace,Menlo,monospace';ctx.textAlign='left';ctx.textBaseline='middle';
  for(const b of D.bases){const st=baseStar(b);if(!st||!proj(st.gx,st.gy,st.gz))continue;const x=_p[0],y=_p[1];ctx.strokeStyle='#7ee787';ctx.lineWidth=1.2;ctx.strokeRect(x-4,y-4,8,8);
    if(R<120){ctx.fillStyle='rgba(126,231,135,.9)';ctx.fillText(spaced(BTY[b.ty].ic+' '+b.pn.toUpperCase()),x+8,y+10)}}
  for(const c of D.conv||[]){const p=clamp((Date.now()-c.t0)/(c.eta-c.t0),0,1),pts=[];
    for(let k=0;k<=24;k++){const t=k/24;pts.push(proj(lerp(c.f[0],c.to[0],t),lerp(c.f[1],c.to[1],t),lerp(c.f[2],c.to[2],t))?[_p[0],_p[1]]:null)}
    ctx.setLineDash([2,5]);ctx.strokeStyle='rgba(126,231,135,.45)';ctx.lineWidth=1;ctx.beginPath();let on=false;for(const q of pts){if(!q){on=false;continue}on?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);on=true}ctx.stroke();ctx.setLineDash([]);
    if(proj(lerp(c.f[0],c.to[0],p),lerp(c.f[1],c.to[1],p),lerp(c.f[2],c.to[2],p))){const x=_p[0],y=_p[1],pu=1+.3*Math.sin(now/200);ctx.fillStyle='#7ee787';ctx.beginPath();ctx.arc(x,y,3*pu,0,7);ctx.fill();
      ctx.fillStyle='rgba(126,231,135,.95)';ctx.fillText(spaced('📦 '+fmtDur(c.eta-Date.now())),x+7,y-8)}}
  ctx.restore()}

/* — Paneles — */
function baseCardHtml(S,i,here){
  const key=sSeed(S.star)+':'+i,b=(D.bases||[]).find(q=>q.k===key),rs=baseRes(S,i);if(!rs)return'';const cl=NET.role==='client';
  if(b){baseTick();const rt=baseRate(b),cp=baseCap(b);return`<div class="card"><div class="kick">BASE · NIVEL ${b.lv}</div><b>${BTY[b.ty].ic} ${esc(b.n)}</b>
    <div class="note">${Object.keys(cp).map(k=>`${RESN[k][0]}: ${fmtI(b.stk[k]||0)}/${fmtI(cp[k])} ${RESN[k][1]} (+${fmtI(rt[k]||0)} cada 100 d)`).join(' · ')}</div>
    <div class="row">${A('🚚 Enviar…',()=>openSend(b.id),cl)}${here&&b.lv<3?A(`Mejorar (${50*b.lv} t · 15 d)`,()=>cmd({k:'base',a:'up',id:b.id},'Mejorar '+b.n),cl||D.st.min<50*b.lv&&!D.cr):''}</div></div>`}
  return`<div class="note">Recursos del suelo: minerales ${richLab(rs.min)} · astrófago ${richLab(rs.fuel)} · alimento ${richLab(rs.prov)}</div>${here?`<div class="row">${A('🏗 Construir base (40 t · 20 d)',()=>openBuild(S,i),cl||D.st.min<40&&!D.cr||(D.bases||[]).length>=BMAX)}</div>`:''}`}
function openBuild(S,i){
  const rs=baseRes(S,i);modalOpen=true;
  showModal(`<div class="kick">CONSTRUIR BASE</div><h2>${esc(S.planets[i].name)}</h2><p class="note">Coste: 40 t de minerales y 20 días. Producción por cada 100 días a bordo (nivel 1). Los envíos viajan a 1 año luz cada 5 segundos.</p>
  <div class="opts">${Object.entries(BTY).map(([k,t])=>{const b={ty:k,lv:1,rich:rs},rt=baseRate(b),v=Object.entries(rt);return`<button data-b="${k}">${t.ic} ${esc(t.n)}<span class="dim"> · ${v.map(([r,x])=>x>0?`+${fmtI(x)} ${RESN[r][1]==='t'?'t '+RESN[r][0].toLowerCase():RESN[r][1]}`:'sin '+RESN[r][0].toLowerCase()).join(', ')} · ${esc(t.d)}</span></button>`}).join('')}</div>
  <div class="row"><button id="no">Cancelar</button></div>`);
  $('#modalBox').querySelectorAll('[data-b]').forEach(x=>x.onclick=()=>{modalOpen=false;closeModal();cmd({k:'base',a:'build',i,ty:x.dataset.b},`Construir ${BTY[x.dataset.b].n} en ${S.planets[i].name}`)});
  $('#no').onclick=()=>{modalOpen=false;closeModal()}}
function renderBases(){
  const el=$('#p-base'),cl=NET.role==='client';ACTS=[];baseTick();const bs=D.bases||[],to=shipXYZ();
  let h=`<div class="kick">BASES, COLONIAS Y LOGÍSTICA</div><h2>${bs.length} base${bs.length===1?'':'s'} de ${BMAX}</h2><p class="note">Construye bases desde el panel de un sistema (abre un planeta en órbita). Producen con el tiempo de a bordo según los recursos del planeta, que pueden ser nulos. Los envíos tardan 5 segundos reales por año luz.</p>`;
  if((D.conv||[]).length)h+=`<h3>Envíos en camino</h3><div class="lst">${D.conv.map(c=>{const p=clamp((Date.now()-c.t0)/(c.eta-c.t0),0,1);return`<div class="item col"><div><b>📦 ${esc(c.bn)}</b> <span class="dim">· → ${esc(c.dst&&c.dst!=='nave'?dstName(c.dst):'nave')} · ${fmtLen(c.d)} · llega en ${fmtDur(c.eta-Date.now())}</span></div><div class="note">${esc(resTxt(c.amt))}</div>${meter(p,1,'#7ee787')}</div>`}).join('')}</div>`;
  h+=`<h3>Rutas automáticas</h3><div class="lst">${(D.rutas||[]).map(r=>{const b=baseById(r.from),left=r.u==='m'?fmtDur(r.ev*60000-(Date.now()-r.lm)):Math.max(0,Math.ceil(r.ev-(D.st.days-r.ld)))+' d a bordo';
    return`<div class="item"><span>🔁</span><div class="m"><b>${esc(b?b.n:'?')} → ${esc(dstName(r.dst))}</b><i>${esc(routeTxt(r))} · próximo en ${left}</i></div>${A('Quitar',()=>cmd({k:'base',a:'unroute',id:r.id},'Quitar ruta '+r.id),cl)}</div>`}).join('')||'<p class="note">Ninguna. Crea una con «Enviar…» y marca «Repetir automáticamente». Las de días a bordo avanzan con el juego; las de minutos reales, con el reloj.</p>'}</div>`;
  h+=`<h3>Bases</h3><div class="lst">${bs.map(b=>{const st=baseStar(b),rt=baseRate(b),cp=baseCap(b),d=st?Math.hypot(st.gx-to[0],st.gy-to[1],st.gz-to[2]):0,has=Object.values(b.stk).some(v=>v>=1);
    return`<div class="item col"><div class="rowi"><span>${BTY[b.ty].ic}</span><div class="m"><b>${esc(b.n)} · nivel ${b.lv}</b><i>${esc(b.sn)} · ${fmtLen(d)} de la nave · envío en ${fmtDur(Math.max(5000,d*BSPEED))}</i></div></div>
    ${Object.keys(cp).map(k=>`<div class="res"><span>${RESN[k][0]} (+${fmtI(rt[k]||0)}/100 d)</span><span>${fmtI(b.stk[k]||0)} / ${fmtI(cp[k])}</span></div>${meter(b.stk[k]||0,cp[k],k==='fuel'?'#e0aa46':k==='prov'?'#7ee787':'#9b9186')}`).join('')}
    ${b.ty!=='puesto'&&!(rt[BTY[b.ty].r]>0)?'<p class="bad">Este planeta no tiene ese recurso: la base no produce.</p>':''}
    <div class="row">${A('🚚 Pedir a la nave',()=>cmd({k:'base',a:'send',id:b.id},'Pedir envío desde '+b.n),cl||!has)}${A('Enviar…',()=>openSend(b.id),cl)}${st?A('Ver',()=>{if(mode!=='map')exitToMap();selectStar(st,true)}):''}${A('Abandonar',()=>{if(confirm('¿Abandonar '+b.n+'? Se pierde lo almacenado.'))cmd({k:'base',a:'drop',id:b.id},'Abandonar '+b.n)},cl)}</div></div>`}).join('')||'<p class="note">Todavía no hay bases.</p>'}</div>`;
  el.innerHTML=h;bindActs(el)}
