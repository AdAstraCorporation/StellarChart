
/* ═════════ Compartir: enlace, QR y partida ═════════ */
function baseUrl(){const b=(D.base||'').trim();if(b)return b.split('#')[0];return /^https?:/.test(location.protocol)?location.href.split('#')[0]:''}
const b64u=u8=>{let s='';for(let i=0;i<u8.length;i+=8192)s+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const unb64u=s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u};
async function pipe(u8,Ctor){const s=new Ctor('deflate-raw'),w=s.writable.getWriter();w.write(u8).catch(()=>{});w.close().catch(()=>{});return new Uint8Array(await new Response(s.readable).arrayBuffer())}
const KS=STATS.map(s=>s[0]);
function snapshot(maxN){
  const sh=D.ship,s=D.st;
  return{v:3,n:D.n||'',c:seedStr(focusLoc(14)),sh:[sh.d,sh.n||'',sh.c1,sh.c2],sp:D.sp,
    st:[+s.fuel.toFixed(2),Math.round(s.prov),s.extra|0,Math.round(s.hull),Math.round(s.min),+s.days.toFixed(1),+s.yrs.toFixed(3),s.jumps,+s.ly.toFixed(2)],
    cw:D.crew.map(m=>[m.nm,m.sp,m.role,KS.map(k=>m.s[k]),m.tr,Math.round(m.hp),Math.round(m.mor),m.xp,m.lv,m.st==='perdido'?1:m.st==='susp'?2:0,m.bio,m.mid||'',m.pid||'',m.pl||'',m.e0??'',m.s0?KS.map(k=>m.s0[k]):0,m.lv0||0,m.t||'',m.n0||'',m.id,m.fv0||0,m.ms0||0,m.mi0||'',m.d0||0,m.ph||'',m.inv&&invCount(m.inv)?m.inv:0,memberFa(m).length?memberFa(m):0]),lg:D.crewLogo||null,pl:D.plan||null,rp:D.rep||{},fx:D.fx||null,bs:D.bases||[],cv:D.conv||[],rt:D.rutas||[],
    f:[D.hib?1:0,D.cr?1:0,D.q|0,D.anon?1:0],ex:D.ex,sc:Object.keys(D.scan),ds:Object.keys(D.disc),
    cm:[cam.fx,cam.fy,cam.fz,cam.R,cam.yaw,cam.pitch].map(v=>+v.toFixed(3)),op:[opt.color?1:0,opt.spin?1:0,opt.nav?1:0,opt.pet?1:0],b:D.base||'',
    h:D.h.slice(-maxN).map(e=>[e.s,Math.round(e.t/1000).toString(36),e.k,e.f?1:0,e.n||''])};
}
function normState(st){
  if(!st||(st.v!==2&&st.v!==3)||!Array.isArray(st.h))throw new Error('formato');
  st.h=st.h.map(a=>({s:String(a[0]||''),t:parseInt(a[1],36)*1000,k:['m','s','j'].includes(a[2])?a[2]:'m',f:a[3]?1:0,n:String(a[4]||'').slice(0,120)})).filter(e=>parseSeed(e.s).loc);
  if(Array.isArray(st.sh))st.ship=cleanShip({d:st.sh[0],n:st.sh[1],c1:st.sh[2],c2:st.sh[3]});
  if(st.sp&&!starFromSeed(st.sp))delete st.sp;
  if(st.v===3){const a=st.st,num=(v,d)=>isFinite(+v)?+v:d;
    st.game={fuel:Math.max(0,num(a[0],0)),prov:Math.max(0,num(a[1],0)),extra:Math.max(0,num(a[2],0)|0),hull:clamp(num(a[3],100),0,100),min:Math.max(0,num(a[4],0)),days:num(a[5],0),yrs:num(a[6],0),jumps:num(a[7],0)|0,ly:num(a[8],0)};
    st.crew=(st.cw||[]).slice(0,12).map(c=>({id:Math.random().toString(36).slice(2),nm:String(c[0]).slice(0,40),sp:SPEMO[c[1]]?c[1]:'Zorro',role:ROLES[c[2]]?c[2]:'pil',s:Object.fromEntries(KS.map((k,i)=>[k,clamp(+((c[3]||[])[i])||3,1,12)])),
      tr:TRAITS[c[4]]?c[4]:'Curioso',hp:clamp(+c[5]||100,0,100),mor:clamp(+c[6]||70,0,100),xp:+c[7]||0,lv:clamp(+c[8]||1,1,20),st:c[9]===2?'susp':c[9]?'perdido':'ok',bio:String(c[10]||'').slice(0,200),
      ...(c[11]?{mid:String(c[11]).slice(0,8)}:{}),...(c[12]?{pid:String(c[12]).slice(0,60)}:{}),...(c[13]?{pl:String(c[13]).slice(0,24)}:{}),...(c[14]!==undefined&&c[14]!==''?{e0:String(c[14]).slice(0,40)}:{}),
      ...(Array.isArray(c[15])?{s0:Object.fromEntries(KS.map((k,i)=>[k,clamp(+c[15][i]||3,1,12)]))}:{}),...(c[16]?{lv0:+c[16]|0}:{}),...(c[17]?{t:String(c[17]).slice(0,30)}:{}),...(c[18]?{n0:String(c[18]).slice(0,40)}:{}),...(c[19]?{id:String(c[19]).slice(0,40)}:{}),...(c[20]?{fv0:+c[20]|0}:{}),...(c[21]?{ms0:+c[21]|0}:{}),...(c[22]?{mi0:String(c[22]).slice(0,8)}:{}),...(c[23]?{d0:+c[23]||0}:{}),...(okImg(c[24])?{ph:c[24]}:{}),...(c[25]&&typeof c[25]==='object'?{inv:Object.fromEntries(Object.entries(c[25]).filter(([k,n])=>okItem(k)&&+n>0).slice(0,CAP_M).map(([k,n])=>[k,Math.min(CAP_M,+n|0)]))}:{}),...(Array.isArray(c[26])&&c[26].length?{fa:c[26].filter(f=>FAC[f]).slice(0,6)}:{})}));
    st.logo=st.lg&&okImg(st.lg.src)?{src:st.lg.src,name:String(st.lg.name||'').slice(0,30),id:String(st.lg.id||'').slice(0,10)}:null;
    st.plan=st.pl&&Array.isArray(st.pl.stops)?{stops:st.pl.stops.slice(0,40).map(s=>({s:String(s.s).slice(0,40),a:(s.a||[]).slice(0,12).map(x=>String(x).slice(0,20))}))}:null;
    st.rep=st.rp&&typeof st.rp==='object'?Object.fromEntries(Object.entries(st.rp).slice(0,500).map(([k,v])=>[String(k).slice(0,60),clamp(+v||0,-100,100)])):{};
    st.fx=normFx(st.fx);st.bases=normBases(st.bs);st.conv=normConv(st.cv);st.rutas=normRutas(st.rt);
    const f=st.f||[];st.flags={hib:f[0]?1:0,cr:f[1]?1:0,q:clamp(f[2]|0,0,QUESTS.length),anon:!!f[3]};
    st.ex=st.ex&&typeof st.ex==='object'?Object.fromEntries(Object.entries(st.ex).slice(0,5000).map(([k,v])=>[String(k).slice(0,80),+v|0])):{};
    st.scan=Object.fromEntries((st.sc||[]).slice(0,5000).map(k=>[String(k).slice(0,80),1]));st.disc=Object.fromEntries((st.ds||[]).slice(0,5000).map(k=>[String(k).slice(0,40),1]));}
  return st;
}
async function encodeState(maxN){const raw=new TextEncoder().encode(JSON.stringify(snapshot(maxN)));if(typeof CompressionStream!=='undefined')return 'z'+b64u(await pipe(raw,CompressionStream));return 'p'+b64u(raw)}
async function decodeState(tok){const kind=tok[0],u8=unb64u(tok.slice(1)),raw=kind==='z'?await pipe(u8,DecompressionStream):u8;return normState(JSON.parse(new TextDecoder().decode(raw)))}
/* Partida: binario «ADA» + versión + bandera + deflate + CRC32 */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=u=>{let c=-1;for(let i=0;i<u.length;i++)c=CRC[(c^u[i])&255]^(c>>>8);return(c^-1)>>>0};
async function packFile(){const raw=new TextEncoder().encode(JSON.stringify(snapshot(D.h.length)));let flag=0,body=raw;if(typeof CompressionStream!=='undefined'){body=await pipe(raw,CompressionStream);flag=1}
  const out=new Uint8Array(5+body.length+4);out.set([0x41,0x44,0x41,3,flag]);out.set(body,5);new DataView(out.buffer).setUint32(5+body.length,crc32(raw));return out}
async function unpackFile(buf){const u=new Uint8Array(buf);if(u.length<10||u[0]!==0x41||u[1]!==0x44||u[2]!==0x41)throw new Error('magic');
  const body=u.subarray(5,u.length-4),raw=u[4]===1?await pipe(body,DecompressionStream):body;if(new DataView(u.buffer,u.byteOffset).getUint32(u.length-4)!==crc32(raw))throw new Error('crc');
  return normState(JSON.parse(new TextDecoder().decode(raw)))}
async function downloadSave(){const u=await packFile(),blob=new Blob([u],{type:'application/octet-stream'}),a=document.createElement('a'),d=new Date(),p=n=>String(n).padStart(2,'0');
  a.href=URL.createObjectURL(blob);a.download=`ad-astra-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.partida`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3000);return u.length}
async function loadSaveFile(f){try{offerImport(await unpackFile(await f.arrayBuffer()))}catch(e){alert(e.message==='magic'?'Ese archivo no es una partida de Ad Astra.':'La partida está dañada (falló la verificación).')}}
async function buildShare(){
  const base=baseUrl();let n=D.h.length,tok=await encodeState(n),full=base+'#d='+tok,qrText=full,qrN=n,qr=null;
  const tryQr=t=>{const q=qrcode(0,'L');q.addData(t,'Byte');q.make();return q};
  while(true){try{qr=tryQr(qrText);break}catch(e){if(qrN<=0){qr=null;break}qrN=Math.floor(qrN*.7);tok=await encodeState(qrN);qrText=base+'#d='+tok}}
  return{full,fullLen:full.length,qr,qrN,total:n,base};
}
function drawQR(canvas,qr){const n=qr.getModuleCount(),m=Math.max(2,Math.floor(300/(n+8)));canvas.width=canvas.height=(n+8)*m;const c=canvas.getContext('2d');
  c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#000';for(let r=0;r<n;r++)for(let k=0;k<n;k++)if(qr.isDark(r,k))c.fillRect((k+4)*m,(r+4)*m,m,m)}
async function renderShare(){
  const el=$('#p-share');
  el.innerHTML=`<div class="kick">TRASLADAR LA PARTIDA</div><div class="field"><label>Apodo</label><input id="nick" maxlength="24" placeholder="tu nombre de capitán" value="${esc(D.n||'')}"></div>
  <div class="field"><label>URL pública</label><input id="base" placeholder="https://…/ (para que el QR abra la carta)" value="${esc(D.base||'')}"></div>
  <h3>Partida (archivo)</h3><p class="note">Archivo binario comprimido con toda la sesión: nave, recursos, tripulación, misiones, descubrimientos, bitácora y cámara. Cárgalo en otro dispositivo o arrástralo a la ventana.</p>
  <div class="row"><button class="pri" id="dls">⬇ Descargar partida</button><button id="lds">Cargar partida…</button><input type="file" id="ldf" hidden></div><div id="saveMsg" class="note"></div>
  <div id="shareBody" class="note">Generando enlace…</div>`;
  $('#nick').onchange=e=>{D.n=e.target.value.slice(0,24);saveD();renderShare()};$('#base').onchange=e=>{D.base=e.target.value.trim();saveD();renderShare()};
  $('#dls').onclick=async()=>{const n=await downloadSave();$('#saveMsg').textContent=`Partida descargada (${(n/1024).toFixed(1)} KB).`;$('#saveMsg').className='note ok'};
  $('#lds').onclick=()=>$('#ldf').click();$('#ldf').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)loadSaveFile(f)};
  const info=await buildShare();if(tab!=='share'||!$('#shareBody'))return;
  $('#shareBody').innerHTML=`${info.base?'':'<p class="bad">Estás abriendo el archivo localmente: escribe arriba la URL donde publiques la carta (p. ej. GitHub Pages) para que el enlace y el QR funcionen en otros dispositivos.</p>'}
  <h3>Enlace con toda la partida</h3><textarea id="lnk" readonly>${esc(info.full)}</textarea><div class="row"><button class="pri" id="cpl">Copiar enlace</button><span class="dim">${info.fullLen.toLocaleString()} caracteres</span></div>
  <h3>QR</h3>${info.qr?`<div id="qrBox"><canvas id="qr"></canvas></div><div class="row"><button id="dlq">Descargar PNG</button></div><p class="note ${info.qrN<info.total?'bad':''}">${info.qrN<info.total?`Por capacidad, el QR lleva la partida completa pero sólo los últimos ${info.qrN} de ${info.total} registros de bitácora.`:'Incluye toda la partida.'}</p>`:'<p class="bad">La partida no cabe en un QR. Usa el archivo o el enlace.</p>'}`;
  if(info.qr)drawQR($('#qr'),info.qr);$('#cpl').onclick=()=>copy(info.full,'Enlace copiado');
  if($('#dlq'))$('#dlq').onclick=()=>{const a=document.createElement('a');a.download='ad-astra-partida.png';a.href=$('#qr').toDataURL('image/png');a.click()};
}
function offerImport(st){
  modalOpen=true;const g=st.game,sh=st.ship;
  showModal(`<div class="kick">PARTIDA RECIBIDA</div><h2>${st.n?esc(st.n):'Capitán sin nombre'}</h2>
  ${sh?`<div class="dh">${shipImg(sh.d,sh.c1,sh.c2,48)}<div><b>${esc(sh.n||SHIPS[sh.d].n)}</b><div class="note">${SHIPS[sh.d].n}${st.sp?' · en '+esc(starName(starFromSeed(st.sp))):''}</div></div></div>`:''}
  ${g?`<div class="kv"><span>Tripulación</span><span>${(st.crew||[]).filter(m=>m.st!=='perdido').length+g.extra}</span><span>Saltos</span><span>${g.jumps} · ${fmtLen(g.ly)}</span><span>Sistemas</span><span>${Object.keys(st.disc||{}).length}</span><span>Bitácora</span><span>${st.h.length} registros</span></div>`:`<p class="note">${st.h.length} registros de bitácora (formato antiguo).</p>`}
  <div class="row"><button class="pri" id="mFull">Cargar partida completa</button><button id="mMerge">Sólo fusionar bitácora</button><button id="no">Cancelar</button></div>`);
  const done=()=>{modalOpen=false;closeModal();_sp='';const p=shipStar();if(!(Array.isArray(st.cm)&&st.v===3))flyTo(p.gx,p.gy,p.gz,20);selStar=null;route=null;mode='map';SYS=null;surf=null;refresh();toast('Partida cargada.')};
  $('#mFull').onclick=()=>{if(D.h.length&&!confirm('Esto sustituye tu partida local. ¿Seguro?'))return;
    D.h=st.h.sort((a,b)=>a.t-b.t);if(st.n)D.n=st.n;if(st.ship)D.ship=st.ship;if(st.sp)D.sp=st.sp;if(st.b)D.base=st.b;
    if(g){D.st=g;D.crew=st.crew;D.hib=st.flags.hib;D.cr=st.flags.cr;D.q=st.flags.q;D.anon=st.flags.anon;D.ex=st.ex;D.scan=st.scan;D.disc=st.disc;if(st.plan)D.plan=st.plan;D.rep=st.rep||{};if(st.fx)D.fx=st.fx;D.bases=st.bases||[];D.conv=st.conv||[];D.rutas=st.rutas||[];D.crewLogo=st.logo||null;updateCrewLogo()}
    if(Array.isArray(st.cm)&&st.cm.length===6&&st.cm.every(v=>isFinite(v))){[tg.fx,tg.fy,tg.fz,tg.R,tg.yaw,tg.pitch]=st.cm.map(Number);Object.assign(cam,tg)}
    if(Array.isArray(st.op)&&st.v===3){opt.color=!!st.op[0];opt.spin=!!st.op[1]&&!RM;opt.nav=!!st.op[2];opt.pet=!!st.op[3]}
    saveD();done()};
  $('#mMerge').onclick=()=>{const seen=new Set(D.h.map(e=>e.s+'|'+e.t));for(const e of st.h)if(!seen.has(e.s+'|'+e.t))D.h.push(e);D.h.sort((a,b)=>a.t-b.t);if(D.h.length>3000)D.h.splice(0,D.h.length-3000);
    if(st.disc)Object.assign(D.disc,st.disc);saveD();done()};
  $('#no').onclick=()=>{modalOpen=false;closeModal()};
}
async function handleHash(){
  const h=location.hash.slice(1),sm=h.match(/^sala=([A-Z2-9]{5})$/i);if(sm){history.replaceState(null,'',location.pathname+location.search);NET.wantJoin=sm[1].toUpperCase();toggleDrawer(true);setTab('sess');return}
  const m=h.match(/^(s|d)=(.*)$/);if(!m)return;history.replaceState(null,'',location.pathname+location.search);
  if(m[1]==='s')gotoSeed(decodeURIComponent(m[2]));else{try{offerImport(await decodeState(m[2]))}catch(e){alert('El enlace de la partida está incompleto o dañado.')}}
}

/* ═════════ Arranque ═════════ */
$('#seedForm').addEventListener('submit',e=>{e.preventDefault();gotoSeed($('#seedIn').value);$('#seedIn').blur()});
$('#rndBtn').onclick=randomPlace;
addEventListener('dragover',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files'))e.preventDefault()});
addEventListener('drop',e=>{const f=e.dataTransfer&&e.dataTransfer.files[0];if(f){e.preventDefault();loadSaveFile(f)}});
updateCrewLogo();$('#logBtn').onclick=()=>showDM(!document.getElementById('dmBox').classList.contains('show'));$('#dualBtn').onclick=()=>{if(POP&&!POP.closed){const w=POP;closeDual();w.close()}else openDual()};
resize();toggleDrawer(innerWidth>1100);setTab('carta');refresh();requestAnimationFrame(frame);handleHash();
setTimeout(()=>{const b=$('#boot');if(b){b.classList.add('out');setTimeout(()=>b.remove(),700)}
  if(!D.intro){D.intro=1;saveD();queueDialog({t:'Corporación Ad Astra · Orden de misión',who:alive()[0]||null,tx:`Capitán: el Sol pierde brillo y nadie sabe por qué, salvo que hay algo —lo llaman astrófago— alimentándose de su luz. Tau Ceti, a 11,9 años luz, parece inmune. Tu nave y tu tripulación están listas. Cada salto cuesta astrófago, provisiones y años. Elige bien.`,res:'Primera misión: '+QUESTS[0].t,next:'Consejo: selecciona una estrella en la carta para calcular el salto.'})}
},RM?0:1400);
window.__adastra={parseX,buildX,baseRes,buildBase,sendBase,addRoute,doBase,convTick,routeTick,baseTick,FX,facOf,boardFor,doFac,facEvent,exposure,genMission,EV,queueDialog,missionLink,endGame,NET,starsNearPub:starsNear,seedOf,starFromSeed,genSystem,starName,membersDecode,addCardLocally,exportLink,memberFromCard,doCiv,civInfo,getPlan,addToPlan,simulatePlan,startPlanNow,get planRun(){return planRun},cmd,execCmd,hostSession,joinSession,createVote,castVote,D:()=>D,cam,tg,selectStar,startTravel,get travel(){return travel},get route(){return route},ANCHSTARS,enterSystem,land,planetInfo,get SYS(){return SYS},openExpedition,packFile,unpackFile,gotoSeed,shipStar,A_BY,questEvent,crewCount,get mode(){return mode},setTab,exitToMap,centerOnShip};
})();
