
/* ═════════ Comandos: lo que cambia la partida pasa por aquí (votación en sesión compartida) ═════════ */
function needVote(){return NET.role==='client'||(NET.role==='host'&&NET.demo&&NET.conns.size>0)}
function cmd(c,label){
  if(NET.role==='host'&&NET.conns.size>0&&(c.k==='travel'||c.k==='plan')){askRoute(c,label);return}
  logDM('Acción: '+(label||c.k),'cmd');
  if(needVote()){propose({kind:'cmd',title:label||'Acción',opts:['A favor','En contra'],cmd:c});toast('🗳 Propuesta enviada a votación: '+esc(label||''));return}
  const m=execCmd(c);if(m)toast(esc(m));refresh();
}
function askRoute(c,label){
  modalOpen=true;showModal(`<div class="kick">DECISIÓN DE RUMBO</div><h2>${esc(label||'Viaje')}</h2><p class="story">¿Cómo se decide este rumbo?</p>
  <div class="opts"><button class="pri" id="rY">Decido yo (director de partida)</button><button id="rV">Someterlo a votación de toda la tripulación</button><button id="no">Cancelar</button></div>`);
  $('#rY').onclick=()=>{modalOpen=false;closeModal();logDM('El director decide: '+label,'cmd');const m=execCmd(c);if(m)toast(esc(m));bcast({t:'toast',h:'🧭 El director fija el rumbo: <b>'+esc(label)+'</b>'});refresh()};
  $('#rV').onclick=()=>{modalOpen=false;closeModal();propose({kind:'cmd',title:label,opts:['A favor','En contra'],cmd:c})};
  $('#no').onclick=()=>{modalOpen=false;closeModal()};
}
function respFor(k){const on=new Set([NET.me,...NET.conns.keys()]);let b=null;for(const m of alive())if(m.pid&&on.has(m.pid)&&m.role===k&&(!b||eff(m,k)>eff(b,k)))b=m;return b?{pid:b.pid,m:b,pl:b.pl||((NET.players[b.pid]||{}).name)||'?'}:null}
function forceVote(id,o){const v=NET.votes.find(x=>x.id===id&&x.open);if(!v)return;v.ballots={[NET.me]:o};v.voters=[NET.me];v.forced=1;sysMsg(`El director impone «${v.opts[o]}» en «${v.title}».`);checkVotes()}
function execCmd(c){
  if(!c||typeof c!=='object')return'';
  if(c.k==='orbit')return doOrbit(String(c.act),c.i|0);
  if(c.k==='civ')return doCiv(c.i|0,String(c.a));
  if(c.k==='travel'){if(travel)return'Ya hay un viaje en curso.';const stars=(c.seeds||[]).map(s=>starFromSeed(s)||pointFromSeed(s)).filter(Boolean);if(stars.length<2)return'';stars[0]=shipStar();
    route=buildLegs(stars);const e=route.legs[0].err;if(e){route=null;return'No se puede saltar: '+e}startTravelNow();return''}
  if(c.k==='exp'){const st=shipStar();if(st.point)return'';const S=genSystem(st),info=planetInfo(S,c.i|0),team=alive().filter(m=>(c.team||[]).includes(m.id));runExpedition(info,String(c.poi),team);return''}
  if(c.k==='plan'){startPlanNow(c.plan);return'Plan de viaje en marcha.'}
  if(c.k==='rescue'){rescue('');return''}
  if(c.k==='ship'){return changeShip(String(c.d))}
  if(c.k==='fac')return doFac(c);
  if(c.k==='base')return doBase(c);
  return'';
}
function changeShip(k){
  const s=D.ship,st=D.st;if(!SHIPS[k]||k===s.d)return'';const nsp=SPEC[k];D.ship.d=k;Object.assign(st,{fuel:nsp.tank,prov:nsp.prov,hull:100,min:Math.min(st.min,nsp.cargo)});
  const a=alive();if(a.length>nsp.crew[1])a.slice(nsp.crew[1]).forEach(m=>m.st='perdido');st.extra=clamp(nsp.c0-Math.min(8,alive().length),0,Math.max(0,nsp.crew[1]-alive().length));
  while(crewCount()<nsp.crew[0]&&alive().length<6)addMember();if(crewCount()<nsp.crew[0])st.extra+=nsp.crew[0]-crewCount();saveD();return'Nueva nave: '+SHIPS[k].n;
}

/* ═════════ Fichas de Members (Corporación Ad Astra · credenciales) ═════════
   Lee el enlace/QR de la credencial (#C<base43>, formato v4) y su campo de rol x:
   R1;rol=cie;ras=Curioso;s=3,4,9,5,3,4;lv=1;xp=0;hp=100;mo=75;t=SEMILLA.N.TOTAL                        */
const MEMBERS_URL=(()=>{try{if(/^https?:$/.test(location.protocol)&&/\/carta\/(index\.html)?$/.test(location.pathname))return new URL('../credenciales/',location.href).href}catch(e){}return'https://adastracorporation.github.io/StellarChart/credenciales/'})();
const B43='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$*+-./:',MABC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const b64std=u8=>{let s='';for(let i=0;i<u8.length;i+=8192)s+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));return btoa(s)};
function aB43(b){let s='';for(let i=0;i<b.length;i+=2){if(i+1<b.length){const v=b[i]*256+b[i+1];s+=B43[v%43]+B43[Math.floor(v/43)%43]+B43[Math.floor(v/1849)]}else{const v=b[i];s+=B43[v%43]+B43[Math.floor(v/43)]}}return s}
function deB43(s){const val=c=>{const v=B43.indexOf(c);if(v<0)throw new Error('carácter');return v},o=[];for(let i=0;i<s.length;i+=3){const t=s.slice(i,i+3);if(t.length===3){const v=val(t[0])+val(t[1])*43+val(t[2])*1849;if(v>65535)throw new Error('valor');o.push(v>>8,v&255)}else if(t.length===2){const v=val(t[0])+val(t[1])*43;if(v>255)throw new Error('valor');o.push(v)}else throw new Error('largo')}return Uint8Array.from(o)}
async function membersId(n,e,i){const h=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode([n,e,i].join('|').normalize('NFC').toLowerCase())));return'AA-'+[...h.slice(0,4)].map(b=>MABC[b%32]).join('')}
function parseX(x){
  const o={};if(!x||!/^R1;/.test(x))return null;for(const kv of x.split(';').slice(1)){const i=kv.indexOf('=');if(i>0)o[kv.slice(0,i)]=kv.slice(i+1)}
  const s=(o.s||'').split(',').map(Number);if(s.length!==6||s.some(v=>!(v>=1&&v<=12)))return null;
  return{role:ROLES[o.rol]?o.rol:'pil',tr:TRAITS[o.ras]?o.ras:'Curioso',s:Object.fromEntries(KS.map((k,i)=>[k,s[i]|0])),lv:clamp(+o.lv||1,1,999),xp:Math.max(0,+o.xp||0),hp:clamp(+o.hp||100,1,100),mor:clamp(+o.mo||75,0,100),t:/^[0-9A-Fa-f]{8}\.[1-9]\.\d{1,2}$/.test(o.t||'')?o.t:'',fv:Math.max(0,+o.fv|0),ms:Math.max(0,+o.ms|0),mi:/^[0-9A-F]{8}$/.test(o.mi||'')?o.mi:'',fa:faDecode(o.fa),iv:ivDecode(o.iv)};
}
/* x ≤ 160 caracteres: si no cabe, se recorta el equipo */
const buildX=(m,mis,crewFa)=>{const fv=Math.round((m.fv0||0)+(mis?mis.dv:0)),ms=(m.ms0||0)+(mis?1:0),mi=mis?mis.id:(m.mi0||''),fa=[...new Set([...memberFa(m),...(crewFa||[])])].filter(f=>FAC[f]),iv=ivEncode(m.inv);
  const mk=n=>`R1;rol=${m.role};ras=${m.tr};s=${KS.map(k=>clamp(m.s[k],1,12)).join(',')};lv=${m.lv};xp=${Math.round(m.xp)};hp=${Math.round(m.hp)};mo=${Math.round(m.mor)}${fa.length?';fa='+fa.join('.'):''}${n?';iv='+iv.slice(0,n).join(','):''}${fv?';fv='+fv:''}${ms?';ms='+ms:''}${mi?';mi='+mi:''}${m.t?';t='+m.t:''}`;
  let n=iv.length,x=mk(n);while(x.length>160&&n>0)x=mk(--n);return x};
async function membersDecode(text){
  const mm=/#C([0-9A-Z$*+\-./:]+)/.exec(String(text||'').trim());if(!mm)throw new Error('No es un enlace ni un QR de una credencial de Members.');
  const b=deB43(mm[1]),v=b[0];if(v!==3&&v!==4)throw new Error('Versión de credencial desconocida.');const cab=v===3?11:13;if(b.length<cab+18)throw new Error('Credencial incompleta.');
  const fl=b[1],len=(b[cab+16]<<8)|b[cab+17];let t=b.slice(cab+18,cab+18+len);if(fl&8)t=await pipe(t,DecompressionStream);
  const imgs={};for(let o=cab+18+len;o+3<=b.length;){const tipo=b[o]>>4,fm=b[o]&15,ln=(b[o+1]<<8)|b[o+2],by=b.slice(o+3,o+3+ln);o+=3+ln;if(by.length!==ln)continue;let src=null;
    if(fm===1&&by.length>12&&String.fromCharCode(...by.slice(0,4))==='RIFF')src='data:image/webp;base64,'+b64std(by);else if(fm===2&&by[0]===0xff&&by[1]===0xd8)src='data:image/jpeg;base64,'+b64std(by);
    else if(fm===4){const u=new TextDecoder().decode(by).trim();if(/^https:\/\/[^\s"'<>]+$/.test(u))src=u}
    if(src&&tipo===1)imgs.foto=src;if(src&&tipo===2)imgs.logo=src}
  const [n,e,p,c,r,x]=new TextDecoder().decode(t).split('\x1f');let iv=((b[2]<<24)|(b[3]<<16)|(b[4]<<8)|b[5])>>>0,cid='';for(let k=0;k<6;k++,iv=Math.floor(iv/32))cid=MABC[iv%32]+cid;
  const dias=(b[9]<<8)|b[10],emision=new Date(Date.UTC(2020,0,1)+dias*864e5),lider=!!(fl&1),venc=!lider&&Date.now()>emision.getTime()+365.25*864e5;
  if(!n)throw new Error('La credencial no tiene nombre.');
  return{foto:imgs.foto||'',logo:imgs.logo||'',n,e:e||'',p:p||'',c:c||'',r:r||'',x:x||'',crew:'CR-'+cid,lider,vencida:venc,id:await membersId(n,e||'',('CR-'+cid)),rol:parseX(x)};
}
function memberFromCard(card){
  const sp=SPEMO[card.e]?card.e:(SPECIES.find(s=>card.e&&card.e.toLowerCase().includes(s.toLowerCase()))||card.e||'Zorro');
  const R=card.rol,r=rng(hash(...[...card.id].map(c=>c.charCodeAt(0))));
  const base=R?{role:R.role,tr:R.tr,s:R.s,lv:R.lv,xp:R.xp,hp:R.hp,mor:R.mor,t:R.t,fv:R.fv,ms:R.ms,mi:R.mi,fa:R.fa||[],iv:R.iv||{}}:(()=>{const m=genMember(r,null);return{role:m.role,tr:m.tr,s:m.s,lv:1,xp:0,hp:100,mor:75,t:''}})();
  return{id:card.id,ph:card.foto||'',e0:card.e,nm:card.n,sp,role:base.role,s:base.s,tr:base.tr,hp:base.hp,mor:base.mor,xp:base.xp,lv:base.lv,st:'ok',t:base.t,mid:card.id,crewName:card.c,
    fv0:base.fv||0,ms0:base.ms||0,mi0:base.mi||'',d0:D.st.days,...(base.fa&&base.fa.length?{fa:base.fa}:{}),...(base.iv&&Object.keys(base.iv).length?{inv:base.iv}:{}),bio:`Credencial ${card.id} · ${card.c||'sin crew'}${card.p?' · '+card.p:''}${card.r?' · '+card.r:''}.${R?'':' Sin estadísticas en la ficha: se generaron por azar.'}`,s0:{...base.s},lv0:base.lv};
}
async function readQrFromImage(file){
  const bmp=await createImageBitmap(file);
  if('BarcodeDetector' in window){try{const d=new BarcodeDetector({formats:['qr_code']}),r=await d.detect(bmp);if(r.length)return r.map(x=>x.rawValue).join('\n')}catch(e){}}
  const c=document.createElement('canvas'),k=Math.min(1,1600/Math.max(bmp.width,bmp.height));c.width=bmp.width*k;c.height=bmp.height*k;const g=c.getContext('2d');g.drawImage(bmp,0,0,c.width,c.height);
  const im=g.getImageData(0,0,c.width,c.height),q=jsQR(im.data,c.width,c.height,{inversionAttempts:'attemptBoth'});if(q)return q.data;throw new Error('No se encontró ningún QR en la imagen.');
}
/* Diálogo «Subir ficha de Members»: enlace o imagen del reverso */
function openCardUpload(onCard,title){
  modalOpen=true;showModal(`<div class="kick">FICHA DE PERSONAJE · MEMBERS</div><h2>${esc(title||'Subir mi ficha')}</h2>
  <p class="note">Sube el PNG del reverso de tu credencial de la Corporación Ad Astra (donde se ve el QR) o pega su enlace (…#C…). Tus estadísticas, rol y rasgo pasan a la partida.</p>
  <div class="row"><button class="pri" id="cuF">📷 Subir imagen del QR</button><input type="file" id="cuI" accept="image/*" hidden></div>
  <textarea id="cuT" placeholder="o pega aquí el enlace de tu credencial"></textarea><div class="row"><button id="cuL">Usar enlace</button><button id="no">Cancelar</button></div><div id="cuM" class="note"></div>
  <p class="note">¿No tienes credencial? Créala en <a href="${MEMBERS_URL}" target="_blank" rel="noopener" style="color:var(--cy)">Members</a>.</p>`);
  const go=async src=>{$('#cuM').textContent='Leyendo…';try{const card=await membersDecode(src);if(card.vencida){$('#cuM').innerHTML='<span class="bad">La credencial está vencida: renuévala en Members.</span>';return}modalOpen=false;closeModal();onCard(card)}catch(e){$('#cuM').innerHTML=`<span class="bad">${esc(e.message)}</span>`}};
  $('#cuF').onclick=()=>$('#cuI').click();$('#cuI').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{go(await readQrFromImage(f))}catch(er){$('#cuM').innerHTML=`<span class="bad">${esc(er.message)}</span>`}};
  $('#cuL').onclick=()=>go($('#cuT').value);$('#no').onclick=()=>{modalOpen=false;closeModal()};
}
function setCrewLogo(card){if(!card||!card.logo)return;if(D.crewLogo&&D.crewLogo.id&&D.crewLogo.id!==card.crew&&!(NET.crewLock&&NET.crewLock.id===card.crew))return;D.crewLogo={src:card.logo,name:card.c||'',id:card.crew};saveD();updateCrewLogo()}
function updateCrewLogo(){const im=document.getElementById('crewLogo'),l=D.crewLogo;if(!im)return;if(l&&l.src){im.src=l.src;im.alt='Logo de '+(l.name||'la tripulación');im.title=l.name||'';im.hidden=false;logoImg=null}else im.hidden=true}
let logoImg=null;function crewLogoImg(){if(!D.crewLogo||!D.crewLogo.src)return null;if(!logoImg){logoImg=new Image();logoImg.src=D.crewLogo.src}return logoImg.complete&&logoImg.naturalWidth?logoImg:null}
function addCardLocally(card,pid,pl){setCrewLogo(card);
  const sp=SPEC[D.ship.d],ex=D.crew.find(m=>m.mid===card.id&&m.st!=='perdido');if(ex){ex.pid=pid;ex.pl=pl;saveD();return`${ex.nm} ya estaba a bordo: ahora lo maneja ${pl}.`}
  if(crewCount()>=sp.crew[1]&&D.st.extra>0)D.st.extra--;else if(crewCount()>=sp.crew[1])return'No queda sitio en la nave.';
  const m=memberFromCard(card);m.n0=card.n;m.pid=pid;m.pl=pl;D.crew.push(m);saveD();return`${m.nm} (${m.sp}, ${ROLES[m.role]}) sube a bordo.`;
}
/* Fin de misión: un único QR/enlace #X (v2) con el resultado de toda la tripulación con ficha */
async function missionLink(){
  const s=D.st,ms=D.crew.filter(m=>m.mid&&m.st!=='perdido');if(!ms.length)return null;
  const idSrc=ms.map(m=>m.mid).sort().join(',')+'|'+Math.round(s.days)+'|'+s.jumps+'|'+(D.n||''),hh=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(idSrc)));
  const id=[...hh.slice(0,4)].map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase(),f=new Date().toISOString().slice(0,10);
  const c=ms.map(m=>{const dv=Math.max(0,Math.round(s.days-(m.d0||0)));return{id:m.mid,n:m.n0||m.nm,e:m.e0!=null?m.e0:m.sp,x:buildX(m,{id,dv},FX().aff),dv,
    res:`Nivel ${m.lv0||1}→${m.lv}${m.s0?'; '+KS.filter(k=>m.s[k]!==m.s0[k]).map(k=>`${STATN[k]} ${m.s0[k]}→${m.s[k]}`).join(', '):''}; ${dv} días de vuelo.`.replace('; ;',';').slice(0,200)}});
  const js=JSON.stringify({v:2,mi:{id,f,nave:`${D.ship.n||SHIPS[D.ship.d].n} (${SHIPS[D.ship.d].n})`,dn:Math.round(s.days),ye:+s.yrs.toFixed(2),ly:+s.ly.toFixed(2),sj:s.jumps,ss:Object.keys(D.disc).length,q:D.q},c});
  return{id,url:MEMBERS_URL+'#X'+aB43(await pipe(new TextEncoder().encode(js),CompressionStream)),n:ms.length};
}
/* Exportar a Members: enlace #X con las estadísticas actualizadas */
async function exportLink(m){
  const res=`Partida del ${new Date().toLocaleDateString('es')}: nivel ${m.lv0||1}→${m.lv}, salud ${Math.round(m.hp)}%, moral ${Math.round(m.mor)}%; ${D.st.jumps} saltos, ${fmtLen(D.st.ly)}, ${Object.keys(D.disc).length} sistemas.`.slice(0,300);
  const js=JSON.stringify({v:1,id:m.mid,n:m.n0||m.nm,e:m.e0!=null?m.e0:m.sp,x:buildX(m,null,FX().aff),res});return MEMBERS_URL+'#X'+aB43(await pipe(new TextEncoder().encode(js),CompressionStream));
}

/* ═════════ Sesión compartida (WebRTC con PeerJS; el anfitrión manda la partida) ═════════ */
const PEER_OPTS=(()=>{const u=new URLSearchParams(location.search).get('peer');if(u&&/^[\w.-]+:\d+$/.test(u)){const [h,p]=u.split(':');return{host:h,port:+p,path:'/',secure:location.protocol==='https:'}}return{}})();
var NET={anon:false,myVotes:{},luckPaint:null,decide:'rol',crewLock:null,role:null,peer:null,conns:new Map(),host:null,code:'',me:'',players:{},votes:[],chat:[],demo:true,vcb:{},myPlan:null,shownVote:null,syncT:0,wantJoin:''};
/* En votaciones anónimas los demás sólo reciben el recuento, nunca quién votó qué */
function voteCnt(v){return v.cnt&&!v.ballots?v.cnt:v.opts.map((_,i)=>Object.values(v.ballots||{}).filter(b=>b===i).length)}
function pubVote(v){const o={...v,cnt:voteCnt(v),nv:Object.keys(v.ballots||{}).length};if(v.anon){delete o.ballots;o.dice=Object.fromEntries(Object.values(v.dice||{}).map((d,i)=>['a'+i,d]))}return o}
function bcast(m){if(NET.role!=='host')return;for(const c of NET.conns.values())try{c.open&&c.send(m)}catch(e){}}
function netSync(){if(NET.role!=='host')return;clearTimeout(NET.syncT);NET.syncT=setTimeout(async()=>{const tok=await encodeState(300);bcast({t:'state',tok,logo:D.crewLogo||null,anon:NET.anon,players:NET.players,votes:NET.votes.map(pubVote),chat:NET.chat.slice(-60),demo:NET.demo})},250)}
const sysMsg=tx=>{logDM(tx,'sys');NET.chat.push({f:'',tx,t:Date.now()});if(NET.chat.length>120)NET.chat.shift();renderSessDyn();netSync()};
const randCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(5)),b=>MABC[b%32]).join('');
function hostSession(){
  if(typeof Peer==='undefined'){toast('No se pudo cargar el módulo de red.');return}const code=randCode(),peer=new Peer('adastra-'+code,PEER_OPTS);
  peer.on('open',id=>{Object.assign(NET,{role:'host',peer,code,me:id,players:{[id]:{name:D.n||'Director',host:1}}});sysMsg(`Partida ${code} creada por ${D.n||'Director'}${NET.crewLock?' para la tripulación '+NET.crewLock.name:''}.`);showDM(true);renderSess()});
  peer.on('connection',c=>{c.on('data',m=>hostRecv(c,m));c.on('open',()=>NET.conns.set(c.peer,c));c.on('close',()=>{NET.conns.delete(c.peer);const p=NET.players[c.peer];delete NET.players[c.peer];if(p)sysMsg(`${p.name} salió de la sala.`);checkVotes()})});
  peer.on('error',e=>{if(e.type==='unavailable-id'){peer.destroy();hostSession();return}toast('Red: '+esc(e.type||e.message));renderSess()});
  peer.on('disconnected',()=>{try{peer.reconnect()}catch(e){}});
}
function joinSession(code,card0){
  if(typeof Peer==='undefined'){toast('No se pudo cargar el módulo de red.');return}code=String(code||'').trim().toUpperCase();if(!/^[A-Z2-9]{5}$/.test(code)){toast('Código de sala no válido.');return}
  const go=card=>{
    const peer=new Peer(undefined,PEER_OPTS);peer.on('open',id=>{const c=peer.connect('adastra-'+code,{reliable:true});
      c.on('open',()=>{Object.assign(NET,{role:'client',peer,host:c,code,me:id});c.send({t:'hello',name:D.n||card.n,card:{...card,rol:card.rol}});toast('Conectado a la sala '+code+'. Esperando la partida…');renderSess()});
      c.on('data',clientRecv);c.on('close',()=>{toast('Se perdió la conexión con el anfitrión.');leaveSession(true)})});
    peer.on('error',e=>{toast(e.type==='peer-unavailable'?'No existe la sala '+esc(code)+' (o el anfitrión se desconectó).':'Red: '+esc(e.type||e.message));renderSess()});
  };if(card0&&card0.n)go(card0);else openCardUpload(go,'Únete con tu ficha de personaje');
}
function leaveSession(reload){try{NET.peer&&NET.peer.destroy()}catch(e){}const wasClient=NET.role==='client';Object.assign(NET,{role:null,peer:null,conns:new Map(),host:null,players:{},votes:[],chat:[]});if(wasClient||reload)location.reload();else refresh()}
function hostRecv(c,m){
  if(!m||typeof m!=='object')return;const pl=NET.players[c.peer];
  if(m.t==='hello'&&NET.crewLock&&(!m.card||m.card.crew!==NET.crewLock.id)){try{c.send({t:'reject',msg:`Esta partida es sólo para la tripulación «${NET.crewLock.name}» (${NET.crewLock.id}). Sube una credencial de esa tripulación.`})}catch(e){}logDM(`Rechazado: ${String(m.name||'?').slice(0,24)} (otra tripulación)`,'sys');setTimeout(()=>{try{c.close()}catch(e){}},600);return}
  if(m.t==='hello'){const name=String(m.name||'Tripulante').slice(0,24);NET.players[c.peer]={name};sysMsg(`${name} se une a la sala.`);
    if(m.card&&m.card.n){const card={...m.card,n:String(m.card.n).slice(0,40),e:String(m.card.e||'').slice(0,40),c:String(m.card.c||'').slice(0,30),p:String(m.card.p||''),r:String(m.card.r||''),id:String(m.card.id||'').slice(0,8),rol:(()=>{try{const r=m.card.rol;return r?parseX(buildX({...r,fv0:r.fv,ms0:r.ms,mi0:r.mi,fa:r.fa,inv:r.iv&&typeof r.iv==='object'?Object.fromEntries(Object.entries(r.iv).filter(([k])=>okItem(k))):null},null)):null}catch(e){return null}})()};
      const msg=addCardLocally(card,c.peer,name);NET.players[c.peer].ch=card.id;sysMsg(msg)}
    netSync();return}
  if(!pl)return;
  if(m.t==='chat'){logDM(`💬 ${pl.name}: ${String(m.tx||'').slice(0,300)}`,'chat');NET.chat.push({f:pl.name,tx:String(m.tx||'').slice(0,300),t:Date.now()});renderSessDyn();netSync()}
  else if(m.t==='propose'&&m.v){propose({...m.v,by:c.peer,title:String(m.v.title||'').slice(0,140),opts:(m.v.opts||[]).slice(0,6).map(o=>String(o).slice(0,80))})}
  else if(m.t==='vote')castVote(String(m.id),c.peer,m.o|0);
  else if(m.t==='dice')castDice(String(m.id),c.peer,m.d|0);
  else if(m.t==='editchar'){const x=D.crew.find(q=>q.pid===c.peer&&q.id===m.id);if(x){x.nm=String(m.nm||x.nm).slice(0,40);x.bio=String(m.bio||x.bio).slice(0,200);saveD()}}
}
async function clientRecv(m){
  if(!m||typeof m!=='object')return;
  if(m.t==='state'){try{const st=await decodeState(m.tok);applyRemote(st)}catch(e){}if(m.logo&&typeof m.logo.src==='string'&&/^(data:image\/(webp|jpeg);base64,|https:\/\/)/.test(m.logo.src)&&(!D.crewLogo||D.crewLogo.src!==m.logo.src)){D.crewLogo={src:m.logo.src,name:String(m.logo.name||'').slice(0,30),id:String(m.logo.id||'')};updateCrewLogo()}NET.players=m.players||{};NET.votes=m.votes||[];NET.anon=!!m.anon;NET.chat=m.chat||[];NET.demo=!!m.demo;renderSessDyn();showEvVote();const v=NET.votes.find(x=>x.id===NET.shownVote);if(v&&$('#luck'))$('#luck').innerHTML=luckTxt(v.dice,v.anon);refresh()}
  else if(m.t==='travel'&&!travel){const stars=(m.seeds||[]).map(s=>starFromSeed(s)||pointFromSeed(s)).filter(Boolean);if(stars.length>1){route=null;travel={legs:stars.slice(1).map((s,i)=>({from:stars[i],to:s})),i:0,t0:0,pos:null,int:0,ghost:1};$('#travel').classList.add('show')}}
  else if(m.t==='dialog'&&m.d)queueDialog({...m.d,local:1});
  else if(m.t==='toast')toast(String(m.h||''));
  else if(m.t==='reject'){alert(String(m.msg||'El director rechazó tu credencial.'));leaveSession(true)}
}
function applyRemote(st){
  const g=st.game;if(!g)return;D.st=g;D.crew=st.crew;D.hib=st.flags.hib;D.cr=st.flags.cr;D.q=st.flags.q;D.ex=st.ex;D.scan=st.scan;D.disc=st.disc;D.h=st.h;
  if(st.ship)D.ship=st.ship;if(st.sp&&!travel){D.sp=st.sp;_sp=''}if(st.n)D.n=D.n||st.n;D.plan=st.plan||D.plan;D.rep=st.rep||D.rep;if(st.fx)D.fx=st.fx;D.bases=st.bases||[];D.conv=st.conv||[];D.rutas=st.rutas||[];
}
function propose(v){
  if(NET.role==='client'){NET.host.send({t:'propose',v:{kind:v.kind,title:v.title,opts:v.opts,cmd:v.cmd}});return}
  return createVote({...v,by:v.by||NET.me});
}
function createVote(v){
  const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  NET.votes.push({id,by:v.by,byName:(NET.players[v.by]||{}).name||'?',kind:v.kind||'free',title:v.title,tx:v.tx||'',opts:v.opts&&v.opts.length?v.opts:['Sí','No'],cmd:v.cmd||null,ballots:{},dice:{},anon:!!NET.anon,open:true,ends:Date.now()+(v.kind==='ev'?60000:90000),voters:v.voters||null,who:v.who||''});
  sysMsg(v.voters?`🎭 Decide ${v.who}: ${v.title}`:`🗳 Nueva votación: ${v.title}`);bcast({t:'toast',h:'🗳 Nueva votación: <b>'+esc(v.title)+'</b>'});checkVotes();return id;
}
function castDice(id,pid,d){if(!(d>=1&&d<=6))return;if(NET.role==='client'){NET.host.send({t:'dice',id,d});return}const v=NET.votes.find(x=>x.id===id&&x.open);if(!v||!v.dice||pid in v.dice)return;v.dice[pid]=d;
  sysMsg(`🎲 ${v.anon?'Alguien':((NET.players[pid]||{}).name||'?')} tira el dado de fortuna en «${v.title}»: ${d} (${DIEM[d]>0?'+':''}${DIEM[d]}).`);if(NET.luckPaint)NET.luckPaint();netSync()}
function castVote(id,pid,o){if(NET.role==='client'){NET.myVotes[id]=o;NET.host.send({t:'vote',id,o});return}const v=NET.votes.find(x=>x.id===id&&x.open);if(!v||o<0||o>=v.opts.length)return;if(v.voters&&!v.voters.includes(pid)&&pid!==NET.me)return;v.ballots[pid]=o;checkVotes();netSync();renderSessDyn()}
function checkVotes(){
  if(NET.role!=='host')return;const everyone=[NET.me,...NET.conns.keys()];
  for(const v of NET.votes){if(!v.open)continue;let voters=v.voters&&v.voters.some(p=>everyone.includes(p))?v.voters.filter(p=>everyone.includes(p)):everyone;const all=voters.every(p=>p in v.ballots);if(!all&&Date.now()<v.ends)continue;
    const cnt=v.opts.map((_,i)=>Object.values(v.ballots).filter(b=>b===i).length),max=Math.max(...cnt);let w=cnt.indexOf(max);
    if(v.kind==='cmd'&&cnt[0]===cnt[1])w=1;if(!Object.keys(v.ballots).length&&v.kind==='ev')w=0;v.open=false;v.result=w;
    sysMsg(`Resultado de «${v.title}»: ${v.opts[w]} (${v.anon?cnt.join(' / ')+' · voto anónimo':v.opts.map((o,i)=>`${o}: ${Object.entries(v.ballots).filter(([,b])=>b===i).map(([p])=>(NET.players[p]||{}).name||'?').join(', ')||'—'}`).join(' · ')})`);
    if(v.kind==='cmd'&&w===0){const msg=execCmd(v.cmd);if(msg){toast(esc(msg));bcast({t:'toast',h:esc(msg)})}}
    if(v.kind==='ev'&&NET.vcb[v.id]){const f=NET.vcb[v.id];delete NET.vcb[v.id];f(w)}}
  const closed=NET.votes.filter(v=>!v.open);if(closed.length>12)NET.votes=NET.votes.filter(v=>v.open).concat(closed.slice(-12));refresh();
}
setInterval(()=>{if(NET.role==='host'&&NET.votes.some(v=>v.open))checkVotes();if(tab==='sess')renderSessDyn()},1000);
function showEvVote(){
  const v=NET.votes.find(x=>x.open&&x.kind==='ev');
  if(NET.shownVote&&!NET.votes.some(x=>x.id===NET.shownVote&&x.open)){if(NET.shownVote&&modalOpen&&$('#evv')){modalOpen=false;closeModal()}NET.shownVote=null}
  if(!v||NET.shownVote===v.id||modalOpen)return;NET.shownVote=v.id;
  const spect=v.voters&&!v.voters.includes(NET.me),hasK=/·\s*(Pilotaje|Ingeniería|Ciencia|Medicina|Seguridad|Diplomacia)\s\d+/.test(v.opts.join('|'))||Object.values(STATN).some(n=>v.opts.some(o=>o.includes('· '+n+' ')));
  modalOpen=true;
  showModal(`<div id="evv" class="kick">EVENTO · ${spect?'DECIDE '+esc(v.who).toUpperCase():v.voters?'TE TOCA DECIDIR POR TU ROL':'VOTACIÓN DE LA TRIPULACIÓN'}${v.anon?' · VOTO ANÓNIMO':''}</div><h2>${esc(v.title)}</h2><p class="story">${esc(v.tx)}</p>
  ${hasK?`<div class="row"><button id="dice">🎲 Tirar dado de fortuna</button></div><div id="luck" class="note">${luckTxt(v.dice,v.anon)}</div>`:''}
  ${spect?`<p class="note">Decide ${esc(v.who)}. Tu dado de fortuna también cuenta para la prueba.</p><div class="row"><button id="evHide">Ocultar</button></div>`:`<div class="opts">${v.opts.map((o,i)=>`<button data-o="${i}">${esc(o)}</button>`).join('')}</div><div class="note" id="vstat">${v.anon?'Voto secreto: nadie sabrá qué elegiste.':'Voto público: la tripulación verá qué elegiste.'}</div>`}`);
  if($('#dice'))$('#dice').onclick=e=>dieAnim(e.currentTarget,d=>castDice(v.id,NET.me,d));if($('#evHide'))$('#evHide').onclick=()=>{modalOpen=false;closeModal()};
  $('#modalBox').querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{castVote(v.id,NET.me,+b.dataset.o);$('#modalBox').querySelectorAll('[data-o]').forEach(x=>x.classList.toggle('pri',x===b));$('#vstat').textContent='Voto registrado. Esperando al resto…'});
}
/* Pestaña Sesión */
function renderSess(){
  const el=$('#p-sess');ACTS=[];
  if(!NET.role){el.innerHTML=`<div class="kick">SESIÓN COMPARTIDA</div><h2>Jugar con tu crew</h2>
    <p class="note">Una persona crea la sala (anfitrión: su navegador guarda la partida) y comparte el código. Cada jugador se une subiendo su ficha de personaje de Members y maneja su propio rol. Viajes, acciones y eventos se deciden por votación.</p>
    <div class="field"><label>Tu nombre</label><input id="snick" maxlength="24" value="${esc(D.n||'')}" placeholder="nombre de jugador"></div>
    <div class="card"><div class="kick">DIRECTOR DE PARTIDA</div><p class="note">Crea la partida como director. Si fijas una tripulación, sólo podrán unirse quienes suban una credencial de esa tripulación.</p>
    <div class="row"><button id="sLock">${NET.crewLock?'Tripulación: '+esc(NET.crewLock.name)+' ✓':'Fijar tripulación con una credencial'}</button>${NET.crewLock?'<button id="sUnlock" class="sm">Quitar</button>':''}</div>
    <div class="row"><button class="pri" id="sHost">Crear partida</button></div></div>
    <div class="field"><label>Código</label><input id="scode" maxlength="5" style="text-transform:uppercase" value="${esc(NET.wantJoin||'')}" placeholder="ABCDE"></div><div class="row"><button class="pri" id="sJoin">Unirme con mi ficha</button></div>
    <p class="note">Usa conexión directa entre navegadores (WebRTC) con el servidor de enlace gratuito de PeerJS. Algunas redes corporativas o móviles bloquean estas conexiones.</p>`;
    $('#snick').onchange=e=>{D.n=e.target.value.slice(0,24);saveD()};
    $('#sLock').onclick=()=>openCardUpload(card=>{NET.crewLock={id:card.crew,name:card.c||card.crew};D.crewLogo=null;setCrewLogo(card);renderSess()},'Credencial de la tripulación');if($('#sUnlock'))$('#sUnlock').onclick=()=>{NET.crewLock=null;renderSess()};$('#sHost').onclick=()=>{D.n=$('#snick').value.slice(0,24)||D.n;hostSession()};$('#sJoin').onclick=()=>{D.n=$('#snick').value.slice(0,24)||D.n;joinSession($('#scode').value)};return}
  const link=baseUrl()?baseUrl()+'#sala='+NET.code:'';
  el.innerHTML=`<div class="kick">SESIÓN · ${NET.role==='host'?'ANFITRIÓN':'TRIPULANTE'}</div><h2 style="letter-spacing:.3em">${esc(NET.code)}</h2>
  <div class="row"><button id="sCopy">Copiar ${link?'enlace':'código'}</button><button id="sLeave">Salir</button></div>
  ${NET.role==='host'?`<div class="card"><div class="kick">DIRECTOR DE PARTIDA</div>${NET.crewLock?`<p class="note">Sólo tripulación «${esc(NET.crewLock.name)}» (${esc(NET.crewLock.id)}).</p>`:'<p class="note">Abierta a cualquier tripulación.</p>'}
    <div class="field"><label>Eventos</label><select id="sDec"><option value="rol" ${NET.decide==='rol'?'selected':''}>Decide el rol responsable</option><option value="todos" ${NET.decide==='todos'?'selected':''}>Vota toda la tripulación</option><option value="yo" ${NET.decide==='yo'?'selected':''}>Decido yo</option></select></div>
    <label class="chk"><input type="checkbox" id="sDemo" ${NET.demo?'checked':''}> Las acciones de los sistemas también se votan</label>
    <label class="chk"><input type="checkbox" id="sAnon" ${NET.anon?'checked':''}> Votos anónimos (sólo se ve el recuento)</label><p class="note">Los rumbos siempre te preguntan si decides tú o se vota.</p>
    <div class="row"><button id="sLog">📜 Registro de la partida</button></div></div>`:''}
  <div id="sessDyn"></div>
  <h3>Proponer votación</h3><input id="vT" placeholder="¿Qué se vota?" style="width:100%" maxlength="140"><input id="vO" placeholder="Opciones separadas por comas (Sí, No)" style="width:100%;margin-top:4px" maxlength="200"><div class="row"><button id="vGo">🗳 Proponer</button></div>
  <h3>Chat</h3><div id="chatL" class="lst" style="max-height:220px;overflow:auto"></div><div class="row"><input id="chT" style="flex:1" maxlength="300" placeholder="Mensaje a la tripulación"><button id="chGo">Enviar</button></div>`;
  $('#sCopy').onclick=()=>copy(link||NET.code,'Copiado');$('#sLeave').onclick=()=>{if(confirm(NET.role==='host'?'¿Cerrar la sala? Los demás se desconectarán.':'¿Salir de la sala? Se recargará tu partida local.'))leaveSession()};
  if($('#sDemo'))$('#sDemo').onchange=e=>{NET.demo=e.target.checked;netSync()};if($('#sAnon'))$('#sAnon').onchange=e=>{NET.anon=e.target.checked;sysMsg(NET.anon?'🕶 Las votaciones nuevas serán anónimas.':'👁 Las votaciones nuevas serán públicas.')};if($('#sDec'))$('#sDec').onchange=e=>{NET.decide=e.target.value;logDM('Eventos: '+e.target.selectedOptions[0].text,'sys')};if($('#sLog'))$('#sLog').onclick=()=>showDM(true);
  $('#vGo').onclick=()=>{const t=$('#vT').value.trim();if(!t)return;const o=$('#vO').value.split(',').map(s=>s.trim()).filter(Boolean);propose({kind:'free',title:t,opts:o.length>1?o:['Sí','No']});$('#vT').value='';$('#vO').value=''};
  const send=()=>{const tx=$('#chT').value.trim();if(!tx)return;if(NET.role==='client')NET.host.send({t:'chat',tx});else{NET.chat.push({f:(NET.players[NET.me]||{}).name||'Anfitrión',tx,t:Date.now()});renderSessDyn();netSync()}$('#chT').value=''};
  $('#chGo').onclick=send;$('#chT').onkeydown=e=>{if(e.key==='Enter')send()};renderSessDyn();
}
function renderSessDyn(){
  const el=$('#sessDyn');if(!el||!NET.role)return;
  const mine=D.crew.find(m=>m.pid===NET.me&&m.st!=='perdido');
  el.innerHTML=`<h3>Jugadores</h3><div class="lst">${Object.entries(NET.players).map(([id,p])=>{const ch=D.crew.find(m=>m.pid===id&&m.st!=='perdido');return`<div class="item">${portrait(ch)}<div class="m"><b>${esc(p.name)}${p.host?' · anfitrión':''}${id===NET.me?' (tú)':''}</b><i>${ch?esc(ch.nm)+' · '+ROLES[ch.role]+' · nivel '+ch.lv:'sin personaje'}</i></div></div>`}).join('')}</div>
  ${mine?'':`<div class="row"><button class="pri" id="myCard">Subir mi ficha de Members</button></div>`}
  <h3>Votaciones ${NET.anon?'<span class="tag">🕶 anónimas</span>':'<span class="tag">👁 públicas</span>'}</h3><div class="lst">${NET.votes.slice().reverse().map(v=>{const my=v.ballots&&NET.me in v.ballots?v.ballots[NET.me]:NET.myVotes[v.id],cnt=voteCnt(v);
    const who=i=>v.anon||!v.ballots?'':Object.entries(v.ballots).filter(([,b])=>b===i).map(([p])=>(NET.players[p]||{}).name||'?').join(', ');
    return`<div class="item col"><div><b>${esc(v.title)}</b> <span class="dim">· ${esc(v.byName||'')} · ${v.anon?'🕶 ':''}${v.open?Math.max(0,Math.round((v.ends-Date.now())/1000))+' s':'cerrada'}</span></div><div class="row">${v.opts.map((o,i)=>`<button class="sm ${my===i?'pri':''} ${!v.open&&v.result===i?'pri':''}" data-v="${v.id}" data-o="${i}" ${v.open?'':'disabled'} title="${esc(who(i))}">${esc(o)} · ${cnt[i]}</button>`).join('')}</div>${!v.anon&&v.ballots&&Object.keys(v.ballots).length?`<div class="note">${v.opts.map((o,i)=>who(i)?`${esc(o)}: ${esc(who(i))}`:'').filter(Boolean).join(' · ')}</div>`:''}${v.dice&&Object.keys(v.dice).length?`<div class="note">${luckTxt(v.dice,v.anon)}</div>`:''}</div>`}).join('')||'<p class="note">Sin votaciones.</p>'}</div>`;
  el.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>castVote(b.dataset.v,NET.me,+b.dataset.o));
  if($('#myCard'))$('#myCard').onclick=()=>openCardUpload(card=>{if(NET.role==='client')NET.host.send({t:'hello',name:D.n||card.n,card});else{toast(esc(addCardLocally(card,NET.me,D.n||'Anfitrión')));netSync();refresh()}});
  const cl=$('#chatL');if(cl){cl.innerHTML=NET.chat.map(c=>`<div class="note" style="margin:0">${c.f?`<b style="color:var(--tx)">${esc(c.f)}:</b> `:'· '}${esc(c.tx)}</div>`).join('');cl.scrollTop=cl.scrollHeight}
}
