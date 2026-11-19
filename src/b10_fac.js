
/* ═════════ Facciones: territorio, reputación, afiliación y objetos que delatan ═════════
   · El territorio sale de «núcleos» deterministas repartidos en una rejilla de 70 al (misma semilla = mismo mapa político).
   · La tripulación pertenece a una o varias facciones (D.fx.aff). Quien os encuentra tira para saber si lo sabe:
     cada objeto de una facción en la bodega aumenta la probabilidad de que os relacionen con ella (aunque no seáis de ella). */
var FAC={
 aa:{n:'Corporación Ad Astra',s:'la Corporación',ic:'✦',c:'#e0aa46',w:1,tipo:'corporación exploradora',val:'la exploración y salvar el Sol',k:['cie','pil'],
   who:'Una nave de la Corporación',enc:'Un explorador de la Corporación Ad Astra cruza vuestra ruta.'},
 lc:{n:'Liga de Comerciantes Libres',s:'la Liga',ic:'⚖',c:'#7ee787',w:3,tipo:'gremio mercantil',val:'los contratos cumplidos',k:['soc','ing'],
   who:'Un convoy de la Liga',enc:'Un convoy de cargueros de la Liga de Comerciantes Libres os llama por radio.'},
 mh:{n:'Manada de Hierro',s:'la Manada',ic:'⛨',c:'#ff6b6b',w:3,tipo:'hegemonía militar',val:'el orden y la jerarquía',k:['seg','pil'],
   who:'Una patrulla de la Manada',enc:'Una corbeta de la Manada de Hierro se coloca a vuestro lado y ordena detener motores.'},
 ce:{n:'Círculo de la Estrella Oscura',s:'el Círculo',ic:'☾',c:'#b48cff',w:2,tipo:'culto del astrófago',val:'el apagado de las estrellas como renacimiento',k:['soc','cie'],
   who:'Una nave del Círculo',enc:'Una nave negra del Círculo de la Estrella Oscura emite cánticos en todas las frecuencias.'},
 cv:{n:'Corsarios del Vacío',s:'los Corsarios',ic:'☠',c:'#ff9f43',w:2,tipo:'confederación pirata',val:'la libertad y el botín',k:['pil','seg'],
   who:'Una banda de corsarios',enc:'Tres cazas sin matrícula salen de la sombra de un asteroide: Corsarios del Vacío.'},
 ca:{n:'Custodios del Archivo',s:'los Custodios',ic:'⌬',c:'#78dcff',w:2,tipo:'orden de cartógrafos',val:'el conocimiento sin dueño',k:['cie','med'],
   who:'Una sonda de los Custodios',enc:'Una sonda de los Custodios del Archivo os escanea y pide intercambiar cartas estelares.'}};
const FK=Object.keys(FAC);
/* Relaciones entre facciones: −2 enemigas … +2 aliadas */
const REL={aa:{lc:1,mh:0,ce:-2,cv:-1,ca:2},lc:{aa:1,mh:0,ce:-1,cv:-2,ca:1},mh:{aa:0,lc:0,ce:-1,cv:-2,ca:-1},ce:{aa:-2,lc:-1,mh:-1,cv:1,ca:-2},cv:{aa:-1,lc:-2,mh:-2,ce:1,ca:0},ca:{aa:2,lc:1,mh:-1,ce:-2,cv:0}};
const rel=(a,b)=>a===b?3:(REL[a]||{})[b]||0;
const relLab=v=>v>=3?'propia':v>=2?'aliada':v>=1?'cordial':v>-1?'neutral':v>-2?'rival':'enemiga';
var ITEMS={
 insignia:{n:'Insignia',v:2.2,d:'Distintivo oficial: quien lo vea sabe a quién servís.'},
 uniforme:{n:'Uniformes',v:1.5,d:'Ropa con los colores de la facción.'},
 salvo:{n:'Salvoconducto',v:1,d:'Permiso firmado: sus patrullas os dejan pasar.'},
 sello:{n:'Carga sellada',v:1.2,d:'Paquete de un contrato. No debe abrirse ni perderse.'},
 reliquia:{n:'Reliquia',v:1.3,d:'Objeto de culto o de valor histórico.'},
 tec:{n:'Tecnología',v:.6,d:'Equipo fabricado por la facción; sólo un experto lo reconoce.'},
 contra:{n:'Contrabando',v:1.8,d:'Mercancía prohibida en casi todas partes.'},
 /* Equipo sin dueño (no delata): da +1 a quien lo lleva encima */
 botiquin:{n:'Botiquín de campaña',v:0,b:'med',d:'+1 a Medicina para quien lo lleve.'},
 herram:{n:'Caja de herramientas',v:0,b:'ing',d:'+1 a Ingeniería para quien la lleve.'},
 arma:{n:'Arma de mano',v:0,b:'seg',d:'+1 a Seguridad para quien la lleve.'},
 traductor:{n:'Traductor universal',v:0,b:'soc',d:'+1 a Diplomacia para quien lo lleve.'},
 sensor:{n:'Sensor portátil',v:0,b:'cie',d:'+1 a Ciencia para quien lo lleve.'},
 casco:{n:'Casco de vuelo',v:0,b:'pil',d:'+1 a Pilotaje para quien lo lleve.'}};
const GEAR={pil:'casco',ing:'herram',cie:'sensor',med:'botiquin',seg:'arma',soc:'traductor'};
const isGen=key=>String(key).startsWith('gen.');
const CAP_M=6;
const itemName=key=>{const[f,t]=key.split('.');return f==='gen'?(ITEMS[t]||{n:t}).n:`${(ITEMS[t]||{n:t}).n} · ${(FAC[f]||{s:f}).s}`};
const okItem=key=>{const[f,t]=String(key).split('.');return!!((FAC[f]||f==='gen')&&ITEMS[t]&&(f==='gen')===(ITEMS[t].v===0))};
const itemIc=key=>{const f=key.split('.')[0];return f==='gen'?'⚙':FAC[f].ic};
const itemCol=key=>{const f=key.split('.')[0];return f==='gen'?'#c9d3e0':FAC[f].c};
/* Bonificación por el equipo que lleva encima un tripulante (máx. +2 por estadística) */
function gearB(m,k){if(!m||!m.inv||typeof ITEMS==='undefined')return 0;let b=0;for(const[key,n]of Object.entries(m.inv)){if(!(n>0))continue;const[f,t]=key.split('.'),it=ITEMS[t];if(!it)continue;
  if(it.b===k)b++;else if(t==='tec'&&FAC[f]&&FAC[f].k[0]===k)b++}return Math.min(2,b)}
const mInv=m=>{if(!m.inv||typeof m.inv!=='object')m.inv={};return m.inv};
const invCount=o=>Object.values(o||{}).reduce((a,n)=>a+(n>0?n:0),0);
function ownerInv(o){if(o==='nave')return FX().inv;const m=D.crew.find(q=>q.id===o&&q.st!=='perdido');return m?mInv(m):null}
const ownerName=o=>o==='nave'?'la bodega':((D.crew.find(q=>q.id===o)||{}).nm||'?');
function moveItem(key,from,to){const a=ownerInv(from),b=ownerInv(to);if(!a||!b||from===to||!okItem(key)||!(a[key]>0))return'';
  if(to!=='nave'&&invCount(b)>=CAP_M)return`${ownerName(to)} ya lleva ${CAP_M} objetos.`;a[key]--;if(!a[key])delete a[key];b[key]=(b[key]||0)+1;return`${itemName(key)}: de ${ownerName(from)} a ${ownerName(to)}.`}
/* Busca un objeto en la nave o en cualquier tripulante; quita una unidad */
function takeAny(key){const x=FX();if(x.inv[key]>0){x.inv[key]--;if(!x.inv[key])delete x.inv[key];return true}for(const m of alive()){const v=mInv(m);if(v[key]>0){v[key]--;if(!v[key])delete v[key];return true}}return false}
const totalOf=key=>(FX().inv[key]||0)+alive().reduce((a,m)=>a+((m.inv||{})[key]||0),0);
const REP0={aa:40,lc:5,mh:0,ce:-30,cv:-10,ca:15};

function FX(){
  if(!D.fx||typeof D.fx!=='object')D.fx={};const f=D.fx;
  if(!f.rep||typeof f.rep!=='object')f.rep={};if(!Array.isArray(f.aff))f.aff=['aa'];if(!f.inv||typeof f.inv!=='object')f.inv={'aa.insignia':1,'aa.uniforme':1};
  if(!Array.isArray(f.mis))f.mis=[];if(!f.done||typeof f.done!=='object')f.done={};if(!Array.isArray(f.dn))f.dn=[];if(!f.wnt||typeof f.wnt!=='object')f.wnt={};
  if(!f.g0&&Array.isArray(D.crew)){f.g0=1;for(const m of D.crew)if(!m.inv&&GEAR[m.role])m.inv={['gen.'+GEAR[m.role]]:1}}return f}
const repF=f=>{const x=FX().rep;return f in x?x[f]:REP0[f]||0};
function addRep(f,v){if(!FAC[f]||!v)return'';const x=FX();x.rep[f]=clamp(Math.round(repF(f)+v),-100,100);return` ${FAC[f].ic} ${FAC[f].s} ${v>0?'+':''}${v}.`}
function giveItem(key,n=1){if(!okItem(key))return'';const x=FX();if(n<0){for(let i=0;i<-n;i++)takeAny(key);return''}x.inv[key]=(x.inv[key]||0)+n;return` Obtenéis: ${itemName(key)}${n>1?' ×'+n:''} (a la bodega).`}
const hasItem=key=>totalOf(key)>0;

/* — Territorio — */
const HUBG=70,_hub=new Map(),_ter=new Map();
function hubAt(i,j,k){const key=i+','+j+','+k;let h=_hub.get(key);if(h!==undefined)return h;
  const r=rng(hash(i+7000,j+7000,k+7000,4321));h=null;
  if(r()<.78){let w=FK.reduce((a,f)=>a+FAC[f].w,0)*r(),f=FK[0];for(const q of FK){w-=FAC[q].w;if(w<=0){f=q;break}}
    h={f,x:(i+.15+.7*r())*HUBG,y:(j+.15+.7*r())*HUBG,z:(k+.3+.4*r())*HUBG*.35,R:30+r()*28,name:genName(hash(i,j,k,88))}}
  if(_hub.size>5000)_hub.clear();_hub.set(key,h);return h}
function facAt(x,y,z){
  const sol=Math.hypot(x,y,z);if(sol<18)return{f:'aa',hub:'Sol',core:1};
  const i=Math.floor(x/HUBG),j=Math.floor(y/HUBG),k=Math.floor(z/(HUBG*.35));let b=null,bd=1;
  for(let a=-1;a<=1;a++)for(let c=-1;c<=1;c++)for(let e=-1;e<=1;e++){const h=hubAt(i+a,j+c,k+e);if(!h)continue;const d=Math.hypot(h.x-x,h.y-y,(h.z-z)*1.6)/h.R;if(d<bd){bd=d;b=h}}
  return b?{f:b.f,hub:b.name,core:bd<.35?1:0}:null}
function facOf(st){if(!st)return null;const key=st.point?st.seed||[st.gx,st.gy,st.gz].map(v=>v.toFixed(1)).join(','):st.h;let v=_ter.get(key);if(v!==undefined)return v;
  v=facAt(st.gx,st.gy,st.gz);if(_ter.size>40000)_ter.clear();_ter.set(key,v);return v}
const terLab=t=>t?`${FAC[t.f].ic} ${FAC[t.f].n}${t.core?' (núcleo '+t.hub+')':''}`:'Espacio libre (sin control)';

/* — Exposición: probabilidad de que la facción «obs» os relacione con cada facción — */
function exposure(obs){
  const x=FX(),out={};
  for(const f of FK){let p=0;const why=[];
    if(x.aff.includes(f)){p+=.12;const fama=Math.min(.3,(x.done[f]||0)*.04);if(fama){p+=fama;why.push('vuestra fama')}}
    const add=(inv,who)=>{for(const[k,n]of Object.entries(inv||{})){const[ff,t]=k.split('.');if(ff!==f||!(n>0)||!ITEMS[t]||!ITEMS[t].v)continue;p+=ITEMS[t].v*.11*Math.min(n,3)**.7*(who?1.15:1);why.push(ITEMS[t].n.toLowerCase()+(who?' de '+who:''))}};
    add(x.inv,'');for(const m of alive()){add(m.inv,m.nm);if(m.fa===f){p+=.08;why.push(m.nm)}}
    if(obs===f&&p>0)p+=.15;if(obs&&x.wnt[obs]&&x.aff.includes(f))p+=.25;
    p=Math.min(.95,p);if(p>.01)out[f]={p,why:[...new Set(why)].slice(0,3),aff:x.aff.includes(f)}}
  return out}
function detect(obs){const ex=exposure(obs);return Object.keys(ex).filter(f=>Math.random()<ex[f].p).map(f=>({f,...ex[f]}))}
function attitude(O,K){let a=repF(O)/25;for(const k of K)a+=rel(O,k.f)*(k.aff?1:.7);if(FX().wnt[O])a-=2;if(O==='cv'&&!K.some(k=>rel(O,k.f)>0))a-=1;return a}
const knownTxt=(O,K)=>K.length?`${cap(FAC[O].s)} os identifica${/^los /.test(FAC[O].s)?'n':''} como ${K.map(k=>(k.aff?'miembros de ':'gente relacionada con ')+FAC[k.f].n+(k.why.length?` (os delata${k.why.length>1?'n':''}: ${k.why.join(', ')})`:'')).join(' y ')}.`:'No parecen saber quiénes sois.';

/* — Encuentros con facciones (eventos generados al vuelo) — */
function facEvent(at,ctx){
  const st=at==='leg'?ctx&&ctx.leg&&ctx.leg.to:ctx&&ctx.star,ter=facOf(st);let O=ter?ter.f:null;
  if(!O||Math.random()<.25){if(Math.random()<.5)return null;O=pick(['cv','lc','ca','ce'])}
  const K=detect(O),att=attitude(O,K),F=FAC[O],sp=()=>SPEC[D.ship.d],x=FX(),tone=att>=1.4?'ami':att<=-1.4?'hos':'neu';
  const giveUp=()=>{const keys=[...new Set([x.inv,...alive().map(m=>m.inv||{})].flatMap(o=>Object.keys(o)))].filter(k=>K.some(q=>k.startsWith(q.f+'.')));let s='';for(const k of keys)s+=dropItem(k,totalOf(k),1);return s};
  const op=[];
  if(tone==='hos'){
    if(hasItem(O+'.salvo'))op.push({l:'Mostrar el salvoconducto',run:()=>{giveItem(O+'.salvo',-1);return`Leen el permiso y os dejan pasar. El salvoconducto queda retenido.`+addRep(O,2)}});
    op.push({l:'Huir a toda máquina',k:'pil',dc:12+(O==='mh'?1:0),ok:()=>'Los dejáis atrás entre el polvo de la nebulosa.',ko:()=>{const d=8+(Math.random()*14|0);D.st.hull=Math.max(1,D.st.hull-d);return`Os alcanzan sus disparos: casco −${d}%.`+addRep(O,-3)}});
    op.push({l:'Plantar cara',k:'seg',dc:13,ok:(c,r)=>{D.st.min=Math.min(sp().cargo,D.st.min+15);x.wnt[O]=1;return`Se retiran con daños. Recogéis 15 t de chatarra, pero ahora os buscan.`+addRep(O,-10)+gainXp(r.m,15)},
      ko:()=>{const d=12+(Math.random()*12|0);D.st.hull=Math.max(1,D.st.hull-d);x.wnt[O]=1;return`Os superan: casco −${d}%.`+hurt(pick(alive()),15)+addRep(O,-6)}});
    op.push({l:'Pagar para que os dejen en paz (25 t)',need:()=>D.st.min>=25,run:()=>{D.st.min-=25;return'Aceptan el pago y se alejan.'+addRep(O,1)}});
    if(K.some(k=>Object.keys(x.inv).concat(...alive().map(m=>Object.keys(m.inv||{}))).some(i=>i.startsWith(k.f+'.'))))op.push({l:'Arrojar al espacio lo que os delata',run:()=>`Los objetos flotan hacia el vacío.${giveUp()} Sin pruebas, os dejan marchar.`});
  }else if(tone==='ami'){
    op.push({l:'Pedir suministros',run:()=>{const s=sp(),a=Math.round(s.prov*.1),f=+(s.tank*.08).toFixed(1);D.st.prov=Math.min(s.prov,D.st.prov+a);D.st.fuel=Math.min(s.tank,D.st.fuel+f);return`Comparten ${fmtI(a)} días-persona de comida y ${f} t de astrófago.`+addRep(O,1)}});
    op.push({l:'Aceptar un encargo',run:()=>{const m=genMission(O,shipStar(),hash(Date.now()|0,D.st.jumps,77));if(!m)return'No tienen nada para vosotros ahora.';if(x.mis.length>=5)return'Ya tenéis demasiados contratos.';acceptMission(m);return`Nuevo contrato: ${m.tx}`}});
    op.push({l:'Intercambiar cartas estelares',k:'cie',dc:9,ok:(c,r)=>`Os pasan rutas y nombres de sistemas.`+gainXp(r.m,12)+addRep(O,2),ko:()=>'Los formatos no son compatibles.'});
  }else{
    if(O==='mh')op.push({l:'Aceptar la inspección (3 d)',run:()=>{passDays(3);const all=[...new Set([x.inv,...alive().map(m=>m.inv||{})].flatMap(o=>Object.keys(o)))];
      const bad=all.filter(k=>{const[f,t]=k.split('.');return f!=='gen'&&(t==='contra'||rel('mh',f)<=-1)});
      if(!bad.length)return'Registran la bodega y cachean a la tripulación. No encuentran nada ilegal.'+addRep('mh',3);let s='';for(const k of bad)s+=dropItem(k,totalOf(k),1);return`Registran bodega y bolsillos. Confiscan lo que no les gusta.${s}`+addRep('mh',-4)}});
    if(O==='lc')op.push({l:'Comprar equipo (10 t)',need:()=>D.st.min>=10,run:()=>{D.st.min-=10;return'Un comerciante os vende material de calidad.'+giveItem('gen.'+pick(Object.values(GEAR)))+addRep('lc',1)}});
    if(O==='lc'||O==='cv')op.push({l:'Comerciar: 20 t minerales → astrófago',need:()=>D.st.min>=20,run:()=>{const s=sp();D.st.min-=20;D.st.fuel=Math.min(s.tank,D.st.fuel+s.tank*.14);return'Trato hecho.'+addRep(O,2)}});
    if(O==='cv'||O==='ce')op.push({l:'Comprar «mercancía especial» (15 t)',need:()=>D.st.min>=15,run:()=>{D.st.min-=15;return'Os entregan un paquete sin etiqueta. Vale mucho… y delata mucho.'+giveItem(O+'.contra')+addRep(O,2)}});
    if(O==='ca')op.push({l:'Compartir vuestra bitácora',run:()=>`Los Custodios archivan ${Object.keys(D.disc).length} sistemas a vuestro nombre.`+addRep('ca',Math.min(6,1+Object.keys(D.disc).length/5|0))});
    op.push({l:'Hacerse pasar por otra facción',k:'soc',dc:13,ok:(c,r)=>{const f=pick(FK.filter(q=>rel(O,q)>=1&&q!==O))||O;return`Os creen gente de ${FAC[f].s}. Os desean buen viaje.`+gainXp(r.m,10)},ko:()=>{x.wnt[O]=1;return'Descubren el engaño y os anotan en sus registros.'+addRep(O,-6)}});
    op.push({l:'Saludar y seguir rumbo',run:()=>'Intercambiáis saludos y cada cual sigue su camino.'});
  }
  const mood=tone==='hos'?' Su actitud es hostil.':tone==='ami'?' Os reciben como amigos.':'';
  return{id:'fac-'+O,t:`${F.ic} ${F.who}`,tx:`${F.enc} ${knownTxt(O,K)}${mood}${ter&&st&&!st.point?` (Territorio: ${FAC[ter.f].n}.)`:''}`,op,fac:O};
}

/* ═════════ Contratos aleatorios ═════════ */
const MTY={
 entrega:{n:'Entrega',ic:'📦',k:null,dc:0,it:'sello',tx:(m)=>`Llevar una carga sellada de ${FAC[m.g].s} hasta ${m.tn}.`},
 contrabando:{n:'Contrabando',ic:'🕳',k:null,dc:0,it:'contra',for:['cv','ce','lc'],tx:m=>`Introducir mercancía prohibida en ${m.tn} sin que nadie lo note.`},
 rescate:{n:'Rescate',ic:'🛟',k:'med',dc:12,tx:m=>`Una tripulación de ${FAC[m.g].s} quedó varada en ${m.tn}. Sacarla con vida.`},
 reconocimiento:{n:'Reconocimiento',ic:'🔭',k:'cie',dc:11,tx:m=>`Escanear el sistema ${m.tn} y transmitir los datos.`},
 diplomacia:{n:'Diplomacia',ic:'🕊',k:'soc',dc:12,tx:m=>`Llevar un mensaje de ${FAC[m.g].s} a los habitantes de ${m.tn}.`},
 caza:{n:'Caza',ic:'🎯',k:'seg',dc:13,tx:m=>`${cap(FAC[m.e||'cv'].s)} acosan ${m.tn}. Expulsarlos.`},
 sabotaje:{n:'Sabotaje',ic:'💣',k:'ing',dc:14,tx:m=>`Sabotear una estación de ${FAC[m.e].s} en ${m.tn} sin dejar rastro.`},
 reliquia:{n:'Recuperación',ic:'🏺',k:'cie',dc:12,tx:m=>`Recuperar una reliquia en ${m.tn} y traerla a ${m.on}.`}};
const MTK=Object.keys(MTY);
function genMission(g,from,seed){
  if(!from||from.point)return null;const r=rng(seed>>>0);let ty=MTK[r()*MTK.length|0];if(MTY[ty].for&&!MTY[ty].for.includes(g))ty='entrega';
  const enem=FK.filter(f=>rel(g,f)<=-1);let e=null;if(ty==='caza'||ty==='sabotaje'){if(!enem.length)ty='reconocimiento';else e=enem[r()*enem.length|0]}
  const cand=[];starsNear(from.gx,from.gy,from.gz,ty==='sabotaje'?32:22,(s,d)=>{if(d>3&&!s.point)cand.push([s,d])});
  if(!cand.length)return null;cand.sort((a,b)=>a[1]-b[1]||a[0].h-b[0].h);
  let pool=cand;if(ty==='sabotaje'){pool=cand.filter(([s])=>{const t=facOf(s);return t&&t.f===e});if(!pool.length){ty='caza';pool=cand}}
  const[T,d]=pool[r()*pool.length|0],ty0=MTY[ty],L=legCalc(from,T);
  const m={id:(seed>>>0).toString(36).slice(-6).toUpperCase(),g,ty,o:sSeed(from),on:starName(from),t:sSeed(T),tn:starName(T),d:+d.toFixed(1),e,ph:0,
    dl:Math.round(D.st.days+L.days*(ty==='reliquia'?4:2.5)+45+r()*60),
    rw:{min:Math.round(10+d*(1.5+r())+(ty0.dc||9)),rep:Math.round(6+r()*6+(ty==='sabotaje'?6:0)),it:r()<.45?g+'.'+pick2(r,['insignia','salvo','tec','uniforme']):r()<.5?'gen.'+pick2(r,Object.values(GEAR)):null,xp:10+(ty0.dc||8)}};
  if(ty==='contrabando')m.rw.min=Math.round(m.rw.min*1.8);
  m.tx=ty0.tx(m);return m}
function boardFor(st){
  if(!st||st.point)return[];const ter=facOf(st),ep=Math.floor(D.st.days/120),x=FX(),r=rng(hash(st.h,ep,4711)),out=[];
  const S=genSystem(st),civs=S.planets.map((p,i)=>civInfo(S,i)).filter(c=>c&&c.tech>=4).length;
  const n=(ter?2:1)+(ter&&ter.core?1:0)+(civs?1:0);
  for(let i=0;i<n;i++){const g=i<2&&ter?ter.f:FK[r()*FK.length|0];const m=genMission(g,st,hash(st.h,ep,i,909));if(m&&!x.dn.includes(m.id)&&!x.mis.some(q=>q.id===m.id))out.push(m)}
  return out}
function acceptMission(m){const x=FX();x.mis.push(m);const it=MTY[m.ty].it;if(it)giveItem(m.g+'.'+it);addRep(m.g,1);logDM(`Contrato aceptado (${FAC[m.g].n}): ${m.tx}`,'cmd')}
function dropItem(key,n,silent,from){const x=FX();const src=from?ownerInv(from):null;n=Math.min(n||1,src?src[key]||0:totalOf(key));if(!n)return'';
  if(src){src[key]-=n;if(!src[key])delete src[key]}else giveItem(key,-n);let s=silent?` (${itemName(key)} perdido)`:`Arrojáis ${itemName(key)}${n>1?' ×'+n:''}.`;
  const[f,t]=key.split('.');if(t==='sello'||t==='contra'||t==='reliquia'){for(const m of x.mis.filter(m=>m.g===f&&MTY[m.ty].it===t||m.g===f&&m.ty==='reliquia'&&m.ph===1&&t==='reliquia').slice(0,n)){failMission(m,'se perdió la carga');s+=` Contrato ${m.id} fallido.`}}return s}
function failMission(m,why){const x=FX();x.mis=x.mis.filter(q=>q!==m);x.dn.push(m.id);if(x.dn.length>300)x.dn.splice(0,100);addRep(m.g,-Math.round(m.rw.rep*.8));
  queueDialog({t:`Contrato fallido · ${MTY[m.ty].n}`,who:pick(alive())||null,tx:`${m.tx} El encargo de ${FAC[m.g].n} no se ha cumplido: ${why}.`,res:`Reputación con ${FAC[m.g].s} −${Math.round(m.rw.rep*.8)}`})}
function facTick(){const x=FX();for(const m of x.mis.slice())if(D.st.days>m.dl){const it=MTY[m.ty].it;if(it&&hasItem(m.g+'.'+it))giveItem(m.g+'.'+it,-1);failMission(m,'venció el plazo')}}
const misHere=(m,st)=>st&&!st.point&&sSeed(st)===(m.ty==='reliquia'&&m.ph===1?m.o:m.t);
function doMission(id){
  const x=FX(),m=x.mis.find(q=>q.id===id),st=shipStar();if(!m)return'Ese contrato ya no está activo.';if(!misHere(m,st))return'Tenéis que estar en el sistema del contrato.';
  const ty=MTY[m.ty];let res='',line='';
  if(m.ty==='reliquia'&&m.ph===0){passDays(5);const r=roll(ty.k,ty.dc);line=r.line;if(!r.ok){passDays(5);return'No encontráis la reliquia esta vez (podéis volver a intentarlo). '+r.line.replace(/<[^>]+>/g,'')+hurt(pick(alive()),8)}
    m.ph=1;giveItem(m.g+'.reliquia');saveD();queueDialog({t:`${ty.ic} Reliquia recuperada`,who:r.m,tx:`La reliquia de ${FAC[m.g].s} ya está a bordo. Ahora hay que llevarla a ${m.on}.`,res:line.replace(/<[^>]+>/g,'')});return''}
  if(ty.it||m.ty==='reliquia'){const k=m.g+'.'+(m.ty==='reliquia'?'reliquia':ty.it);if(!hasItem(k)){failMission(m,'la carga ya no está a bordo');saveD();return''}giveItem(k,-1);passDays(2)}
  if(m.ty==='contrabando'){const ter=facOf(st);if(ter&&ter.f!==m.g&&Math.random()<.35){const r=roll('soc',13);line=r.line;if(!r.ok){addRep(ter.f,-10);x.wnt[ter.f]=1;res=` ${cap(FAC[ter.f].s)} descubre la descarga y os fichan.`}}}
  else if(ty.k){passDays(4);const r=roll(ty.k,ty.dc);line=r.line;
    if(!r.ok){let extra='';if(m.ty==='sabotaje'&&m.e){x.wnt[m.e]=1;extra=addRep(m.e,-20)+` ${cap(FAC[m.e].s)} sabe quién fue.`}if(m.ty==='caza'||m.ty==='rescate'){const d=8+(Math.random()*10|0);D.st.hull=Math.max(1,D.st.hull-d);extra+=` Casco −${d}%.`+hurt(pick(alive()),12)}
      failMission(m,'la tirada salió mal');saveD();logDM(`Contrato ${m.id} fallido.${extra}`,'ev');toast(esc(`Contrato fallido.${extra}`));return''}
    if(m.ty==='sabotaje'&&m.e)res+=addRep(m.e,-5);if(m.ty==='diplomacia')for(const f of FK)if(rel(m.g,f)>=1)res+=addRep(f,2)}
  const s=D.st,sp=SPEC[D.ship.d];s.min=Math.min(sp.cargo,s.min+m.rw.min);res=`+${m.rw.min} t de minerales.`+addRep(m.g,m.rw.rep)+res;
  for(const f of FK)if(f!==m.g&&rel(m.g,f)<=-2)res+=addRep(f,-2);
  if(m.rw.it)res+=giveItem(m.rw.it);for(const p of alive())gainXp(p,m.rw.xp);res+=` +${m.rw.xp} XP a la tripulación.`;
  x.mis=x.mis.filter(q=>q!==m);x.dn.push(m.id);x.done[m.g]=(x.done[m.g]||0)+1;saveD();
  queueDialog({t:`${ty.ic} Contrato cumplido · ${ty.n}`,who:pick(alive())||null,tx:`${m.tx} ${FAC[m.g].n} paga lo acordado.`,res:(line?line.replace(/<[^>]+>/g,'')+' · ':'')+res});return''}
function joinFac(f){const x=FX();if(!FAC[f])return'';if(x.aff.includes(f)){x.aff=x.aff.filter(q=>q!==f);return'Abandonáis '+FAC[f].n+'.'+addRep(f,-20)}
  if(repF(f)<40)return`${cap(FAC[f].s)} todavía no confía en vosotros (hace falta reputación 40).`;
  x.aff.push(f);let s=`Os unís a ${FAC[f].n}.`+giveItem(f+'.insignia');for(const q of FK)if(q!==f&&rel(f,q)<=-2)s+=addRep(q,-15);return s}
function doFac(c){
  const x=FX();let out='';
  if(c.a==='take'){const st=starFromSeed(String(c.s||''));if(!st||!sameStar(st,shipStar()))return'Tenéis que estar en ese sistema.';const m=boardFor(st).find(q=>q.id===c.id);if(!m)return'Ese contrato ya no está disponible.';
    if(x.mis.length>=5)return'Máximo 5 contratos activos.';acceptMission(m);out='Contrato aceptado: '+m.tx}
  else if(c.a==='do')out=doMission(String(c.id));
  else if(c.a==='drop'){const k=String(c.it);if(!okItem(k))return'';out=dropItem(k,1,0,c.from?String(c.from):'nave')}
  else if(c.a==='move'){const k=String(c.it);if(!okItem(k))return'';out=moveItem(k,String(c.from),String(c.to))}
  else if(c.a==='quit'){const m=x.mis.find(q=>q.id===c.id);if(!m)return'';const it=MTY[m.ty].it;if(it&&hasItem(m.g+'.'+it))giveItem(m.g+'.'+it,-1);failMission(m,'lo cancelasteis');out=''}
  else if(c.a==='join')out=joinFac(String(c.f));
  saveD();return out}
function normFx(v){
  if(!v||typeof v!=='object')return null;const o={rep:{},aff:[],inv:{},mis:[],done:{},dn:[],wnt:{}};
  for(const f of FK){if(v.rep&&isFinite(+v.rep[f]))o.rep[f]=clamp(+v.rep[f]|0,-100,100);if(v.done&&+v.done[f]>0)o.done[f]=+v.done[f]|0;if(v.wnt&&v.wnt[f])o.wnt[f]=1}
  o.aff=(Array.isArray(v.aff)?v.aff:[]).filter(f=>FAC[f]).slice(0,6);
  for(const[k,n]of Object.entries(v.inv||{}).slice(0,60))if(okItem(k)&&+n>0)o.inv[k]=Math.min(99,+n|0);
  o.mis=(Array.isArray(v.mis)?v.mis:[]).slice(0,5).filter(m=>m&&FAC[m.g]&&MTY[m.ty]).map(m=>({id:String(m.id).slice(0,8),g:m.g,ty:m.ty,o:String(m.o).slice(0,40),on:String(m.on).slice(0,40),t:String(m.t).slice(0,40),tn:String(m.tn).slice(0,40),d:+m.d||0,e:FAC[m.e]?m.e:null,ph:m.ph?1:0,dl:+m.dl||0,
    rw:{min:clamp(+(m.rw||{}).min|0,0,2000),rep:clamp(+(m.rw||{}).rep|0,0,40),it:okItem((m.rw||{}).it)?m.rw.it:null,xp:clamp(+(m.rw||{}).xp|0,0,60)},tx:String(m.tx||'').slice(0,200)}));
  o.dn=(Array.isArray(v.dn)?v.dn:[]).slice(-300).map(s=>String(s).slice(0,8));o.g0=1;return o}

/* — Inventarios: bodega de la nave y equipo de cada tripulante — */
function itemRow(k,n,from){const[f,t]=k.split('.'),it=ITEMS[t],cl=NET.role==='client',others=[['nave','Bodega'],...alive().map(m=>[m.id,m.nm])].filter(([o])=>o!==from);
  ACTS.push(v=>v&&cmd({k:'fac',a:'move',it:k,from,to:v},`Mover ${itemName(k)} a ${ownerName(v)}`));const mv=ACTS.length-1;
  return`<div class="item"><span style="color:${itemCol(k)}">${itemIc(k)}</span><div class="m"><b>${esc(itemName(k))}${n>1?' ×'+n:''}</b><i>${esc(it.d)}${it.v?` Delata ${it.v>=1.5?'mucho':it.v>=1?'bastante':'poco'}.`:''}</i></div>
  ${others.length?`<select class="sm" data-mv="${mv}" ${cl?'disabled':''}><option value="">Dar a…</option>${others.map(([o,nm])=>`<option value="${esc(o)}">${esc(nm)}</option>`).join('')}</select>`:''}${A('Arrojar',()=>{if(confirm('¿Arrojar '+itemName(k)+' al espacio?'))cmd({k:'fac',a:'drop',it:k,from},'Arrojar '+itemName(k))},cl)}</div>`}
const bindMv=el=>el.querySelectorAll('[data-mv]').forEach(s=>s.onchange=()=>ACTS[+s.dataset.mv](s.value));
function holdHtml(){const inv=Object.entries(FX().inv).filter(([,n])=>n>0);
  return`<h3>Bodega · inventario de la nave</h3><p class="note">Lo que va en la bodega no da bonificaciones; pásalo a un tripulante para que lo use. Todo lo que haya a bordo, en la bodega o encima de alguien, puede delataros.</p>
  <div class="lst">${inv.map(([k,n])=>itemRow(k,n,'nave')).join('')||'<p class="note">Bodega vacía.</p>'}</div>`}
function memberInvHtml(m){const inv=Object.entries(mInv(m)).filter(([,n])=>n>0),bon=STATS.map(([k,nm])=>[nm,gearB(m,k)]).filter(([,b])=>b);
  return`<h4 class="note" style="margin:8px 0 2px">🎒 Inventario (${invCount(m.inv)}/${CAP_M})${bon.length?' · '+bon.map(([nm,b])=>`${nm} +${b}`).join(', '):''}</h4><div class="lst">${inv.map(([k,n])=>itemRow(k,n,m.id)).join('')||'<p class="note">No lleva nada.</p>'}</div>`}

/* — Panel «Facciones» — */
function renderFac(){
  const el=$('#p-fac'),x=FX(),st=shipStar(),ter=facOf(st);ACTS=[];facTick();
  const bar=(v,c)=>`<span class="sb"><i style="width:${(v+100)/2}%;background:${c}"></i></span>`;
  const obs=ter?ter.f:null,ex=exposure(obs),inv=Object.entries(x.inv).filter(([,n])=>n>0);
  let h=`<div class="kick">FACCIONES</div><h2>${x.aff.length?x.aff.map(f=>FAC[f].ic+' '+esc(FAC[f].n)).join(' · '):'Sin afiliación'}</h2>
  <p class="note">Estáis en: <b>${esc(terLab(ter))}</b>. Quien os encuentra tira para saber si os conoce: cada objeto de una facción en la bodega aumenta la probabilidad de que os relacionen con ella, aunque no seáis de ella.</p>`;
  if(Object.keys(ex).length)h+=`<h3>Lo que pueden saber de vosotros${obs?' aquí':''}</h3><div class="lst">${Object.entries(ex).sort((a,b)=>b[1].p-a[1].p).map(([f,e])=>`<div class="item"><span style="color:${FAC[f].c}">${FAC[f].ic}</span><div class="m"><b>${Math.round(e.p*100)}% · ${e.aff?'miembros de':'relacionados con'} ${esc(FAC[f].n)}</b><i>${e.why.length?'Os delata: '+esc(e.why.join(', ')):'Sólo la afiliación'}</i></div></div>`).join('')}</div>`;
  h+=`<h3>Contratos activos (${x.mis.length}/5)</h3><div class="lst">${x.mis.map(m=>{const T=starFromSeed(m.ty==='reliquia'&&m.ph?m.o:m.t),left=Math.round(m.dl-D.st.days),ty=MTY[m.ty];
    return`<div class="item col"><div class="rowi"><span style="color:${FAC[m.g].c}">${ty.ic}</span><div class="m"><b>${ty.n} · ${esc(FAC[m.g].n)}</b><i>${esc(m.tx)}${m.ty==='reliquia'&&m.ph?' <b>(reliquia a bordo)</b>':''}</i><i>Plazo: <span class="${left<60?'bad':''}">${left} d</span> · Pago: ${m.rw.min} t, rep +${m.rw.rep}${m.rw.it?', '+esc(itemName(m.rw.it)):''}${ty.k?` · prueba de ${STATN[ty.k]} ${ty.dc}`:''}</i></div></div>
    <div class="row">${T?A('Ver destino',()=>{if(mode!=='map')exitToMap();selectStar(T,true)}):''}${misHere(m,st)?A('Cumplir aquí',()=>cmd({k:'fac',a:'do',id:m.id},'Cumplir el contrato '+m.id),NET.role==='client','pri'):''}${A('Cancelar',()=>{if(confirm('¿Cancelar el contrato? Perderéis reputación.'))cmd({k:'fac',a:'quit',id:m.id},'Cancelar el contrato '+m.id)})}</div></div>`}).join('')||'<p class="note">Ninguno. Busca el tablón de contratos en el panel de un sistema.</p>'}</div>`;
  h+=`<p class="note">Los objetos se gestionan en <b>Nave → Bodega</b> (inventario de la nave) y en cada ficha de <b>Tripulación</b> (lo que lleva encima cada tripulante).</p>`;
  h+=`<h3>Relaciones</h3>${FK.map(f=>{const v=repF(f),F=FAC[f],mine=x.aff.includes(f),rels=FK.filter(q=>q!==f).map(q=>[q,rel(f,q)]).filter(([,v])=>v);
    return`<div class="card"><b style="color:${F.c}">${F.ic} ${esc(F.n)}</b>${mine?' <span class="tag hz">miembros</span>':''}${x.wnt[f]?' <span class="tag pet">os buscan</span>':''}
    <div class="note">${esc(F.tipo)} · valora ${esc(F.val)} · contratos cumplidos: ${x.done[f]||0}</div>
    <div class="res"><span>Reputación</span><span>${repLab(v)} (${v})</span></div>${bar(v,F.c)}
    <div class="note">${rels.map(([q,v])=>`${FAC[q].ic} ${relLab(v)}`).join(' · ')}</div>
    <div class="row">${A(mine?'Abandonar':'Unirse',()=>cmd({k:'fac',a:'join',f},(mine?'Abandonar ':'Unirse a ')+F.n),!mine&&v<40)}</div></div>`}).join('')}`;
  el.innerHTML=h;bindActs(el);
}
function boardHtml(S){
  const x=FX(),list=boardFor(S.star);if(!list.length)return`<h3>Tablón de contratos</h3><p class="note">Nadie ofrece trabajo aquí ahora. Las ofertas cambian cada 120 días a bordo.</p>`;
  return`<h3>Tablón de contratos</h3><p class="note">${esc(terLab(facOf(S.star)))} · ofertas nuevas cada 120 días.</p><div class="lst">${list.map(m=>{const ty=MTY[m.ty];return`<div class="item col"><div class="rowi"><span style="color:${FAC[m.g].c}">${ty.ic}</span><div class="m"><b>${ty.n} · ${FAC[m.g].ic} ${esc(FAC[m.g].n)}</b><i>${esc(m.tx)} (${fmtLen(m.d)})</i><i>Plazo ${Math.round(m.dl-D.st.days)} d · ${m.rw.min} t, rep +${m.rw.rep}${m.rw.it?', '+esc(itemName(m.rw.it)):''}${ty.k?` · ${STATN[ty.k]} ${ty.dc} (${Math.round(chance(ty.k,ty.dc)*100)}%)`:''}${ty.it?' · <span class="bad">carga que delata</span>':''}</i></div></div>
   <div class="row">${A('Aceptar',()=>cmd({k:'fac',a:'take',id:m.id,s:sSeed(S.star)},'Aceptar contrato: '+m.tx),x.mis.length>=5||NET.role==='client','pri')}</div></div>`}).join('')}</div>`}
