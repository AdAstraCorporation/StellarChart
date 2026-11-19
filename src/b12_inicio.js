
/* ═════════ Inicio: elegir partida antes de entrar · espera de tripulación antes de la ronda ═════════
   · Al abrir la Carta se decide: continuar la partida guardada, empezar una nueva o cargar un archivo,
     y si se juega en este dispositivo o se crea una sala como director (o se une a una sala).
   · La ronda no empieza hasta que hay al menos 1 tripulante con credencial activo; hasta entonces
     la carta se puede mirar, pero no se viaja, ni se pilota, ni se explora.                         */
var RONDA=false;
function miembrosActivos(){return D.crew.filter(m=>m.mid&&m.st==='ok')}
const BLOQ_RONDA=new Set(['travel','plan','orbit','civ','exp','base','rescue']);
function rondaBloquea(c){if(RONDA||!c)return false;if(c.k==='fac')return!['move','drop'].includes(c.a);return BLOQ_RONDA.has(c.k)}
const MSG_RONDA='⏳ La ronda todavía no ha empezado: hace falta al menos un tripulante con credencial.';
function hayPartida(){const s=D.st||{};return(s.jumps|0)>0||(s.days||0)>0||D.crew.some(m=>m.mid)||Object.keys(D.disc||{}).length>1||(D.bases||[]).length>0}
function nuevaPartida(pnj){
  const sp=SPEC[D.ship.d];D.st=freshState(D.ship.d);D.crew=[];if(pnj){const n=newCrew(D.ship.d);D.crew=n.c;D.st.extra=n.extra}else D.st.extra=sp.c0;
  Object.assign(D,{sp:sSeed(SOL),hib:0,cr:0,ex:{},scan:{},disc:{},q:0,qf:{},plan:null,rep:{},fx:null,bases:[],conv:[],rutas:[],intro:0,crewLogo:null});
  _sp='';travel=null;route=null;selStar=null;if(mode!=='map')exitToMap();saveD();updateCrewLogo();centerOnShip();refresh();
}
function introRonda(){if(D.intro)return;D.intro=1;saveD();queueDialog({t:'Corporación Ad Astra · Orden de misión',who:alive()[0]||null,tx:`Capitán: el Sol pierde brillo y nadie sabe por qué, salvo que hay algo —lo llaman astrófago— alimentándose de su luz. Tau Ceti, a 11,9 años luz, parece inmune. Tu nave y tu tripulación están listas. Cada salto cuesta astrófago, provisiones y años. Elige bien.`,res:'Primera misión: '+QUESTS[0].t,next:'Consejo: selecciona una estrella en la carta para calcular el salto.'})}
function empezarRonda(){
  if(NET.role==='client')return;const n=miembrosActivos().length;if(!n){toast('Sube al menos una credencial de Members para empezar.');return}
  RONDA=true;const t=`▶ Empieza la ronda con ${n} tripulante${n===1?'':'s'}: ${miembrosActivos().map(m=>m.nm).join(', ')}.`;logDM(t,'sys');toast(esc(t));
  if(NET.role==='host'){bcast({t:'toast',h:esc(t)});sysMsg(t)}saveD();updEspera();refresh();introRonda();
}
function subirCredencial(){openCardUpload(card=>{if(NET.role==='client'){NET.host.send({t:'hello',name:D.n||card.n,card});return}toast(esc(addCardLocally(card,NET.me||'local',D.n||card.n)));if(NET.role==='host')netSync();updEspera();refresh()},'Sube tu credencial de Members')}
function updEspera(){
  let el=document.getElementById('espera');if(!el){el=document.createElement('div');el.id='espera';el.className='ov';(document.getElementById('stage')||document.body).appendChild(el)}
  if(RONDA||document.getElementById('inicio')){el.hidden=true;return}el.hidden=false;
  const n=miembrosActivos().length,cl=NET.role==='client',key=[n,NET.role,NET.code,cl?NET.players&&Object.keys(NET.players).length:0].join('|');if(el.dataset.k===key)return;el.dataset.k=key;
  el.innerHTML=cl?`<b>⏳ Esperando a que el director empiece la ronda</b><span class="note">${n} tripulante${n===1?'':'s'} con credencial a bordo.</span>`
   :`<b>⏳ Esperando tripulación</b><span class="note">${n?`${n} tripulante${n===1?'':'s'} con credencial: ${esc(miembrosActivos().map(m=>m.nm).join(', '))}.`:'Hace falta al menos 1 tripulante con credencial para empezar la ronda.'}${NET.role==='host'?` Sala <b>${esc(NET.code)}</b>.`:''}</span>
    <span class="row"><button class="sm" id="espSub">⬆ Subir credencial</button><button class="sm pri" id="espGo" ${n?'':'disabled'}>▶ Empezar la ronda</button></span>`;
  const s=document.getElementById('espSub'),g=document.getElementById('espGo');if(s)s.onclick=subirCredencial;if(g)g.onclick=empezarRonda;
}
setInterval(updEspera,1000);

function pantallaInicio(join){
  const ov=document.createElement('div');ov.id='inicio';const hay=hayPartida(),s=D.st,sp=SHIPS[D.ship.d],mem=D.crew.filter(m=>m.mid&&m.st!=='perdido');
  ov.innerHTML=`<div class="ini-box"><div class="ini-h"><img src="../icons/logo.png" alt="" onerror="this.remove()"><div><div class="kick">CORPORACIÓN AD ASTRA</div><h2>Carta Estelar</h2></div></div>
  ${hay?`<div class="card ini-sel"><div class="kick">PARTIDA GUARDADA EN ESTE DISPOSITIVO</div><b>${esc(D.ship.n||sp.n)}</b> <span class="dim">· ${esc(sp.n)}</span>
    <div class="note">${fmtT(s.days/365.25)} a bordo · ${s.jumps} saltos · ${fmtLen(s.ly)} · ${Object.keys(D.disc||{}).length} sistemas · ${(D.bases||[]).length} bases</div>
    <div class="note">${mem.length?'Tripulantes con credencial: '+esc(mem.map(m=>m.nm).join(', ')):'Sin tripulantes con credencial'}</div>
    <label class="chk"><input type="radio" name="iniP" value="seguir" checked> Continuar esta partida</label></div>`:''}
  <div class="card"><label class="chk"><input type="radio" name="iniP" value="nueva" ${hay?'':'checked'}> Nueva partida${hay?' <span class="bad">(reemplaza la guardada)</span>':''}</label>
    <label class="chk" style="margin-left:22px"><input type="checkbox" id="iniPnj"> Añadir tripulantes generados (PNJ) además de los jugadores</label>
    <label class="chk"><input type="radio" name="iniP" value="archivo"> Cargar una partida desde archivo (.partida)</label><input type="file" id="iniFile" accept=".partida,application/octet-stream" hidden></div>
  <div class="card"><div class="kick">CÓMO SE JUEGA</div>
    <label class="chk"><input type="radio" name="iniM" value="solo" checked> En este dispositivo</label>
    <label class="chk"><input type="radio" name="iniM" value="host"> Crear sala como director (los demás se unen con código)</label></div>
  <div class="row"><button class="pri" id="iniGo">Entrar a la carta</button></div>
  <div class="card"><div class="kick">UNIRSE A UNA SALA</div><div class="row"><input id="iniCode" maxlength="5" placeholder="CÓDIGO" style="text-transform:uppercase;width:110px" value="${esc(join||'')}"><button id="iniJoin" ${join?'class="pri"':''}>Unirme con mi credencial</button></div></div>
  <p class="note">Antes de la primera ronda hace falta al menos un tripulante con credencial de Members a bordo. <a href="../">← Volver al menú</a></p></div>`;
  document.body.appendChild(ov);
  const cerrar=()=>{ov.classList.add('out');setTimeout(()=>{ov.remove();updEspera()},350)};
  const elegido=n=>(ov.querySelector(`input[name=${n}]:checked`)||{}).value;
  ov.querySelector('#iniGo').onclick=async()=>{
    const p=elegido('iniP'),m=elegido('iniM');
    if(p==='archivo'){const f=ov.querySelector('#iniFile');f.onchange=()=>{if(f.files[0]){cerrar();loadSaveFile(f.files[0]);if(m==='host')setTimeout(hostSession,300)}};f.click();return}
    if(p==='nueva'){if(hay&&!confirm('¿Empezar una partida nueva? La guardada en este dispositivo se perderá (descárgala antes desde «Partida» si la quieres).'))return;nuevaPartida(ov.querySelector('#iniPnj').checked)}
    cerrar();if(m==='host'){D.n=D.n||'Director';hostSession();toggleDrawer(true);setTab('sess')}
    else if(!miembrosActivos().length)setTimeout(subirCredencial,450)};
  ov.querySelector('#iniJoin').onclick=()=>{const c=ov.querySelector('#iniCode').value.trim().toUpperCase();if(!/^[A-Z2-9]{5}$/.test(c)){toast('Escribe el código de 5 caracteres de la sala.');return}cerrar();joinSession(c)};
}
/* Al cargar: pantalla de inicio salvo que se abra un enlace de partida o de semilla */
(()=>{const h=HASH0.slice(1);RONDA=false;if(/^(d|s)=/.test(h)){updEspera();return}setTimeout(()=>pantallaInicio(NET.wantJoin||''),RM?0:1450)})();
