
/* ═════════ Registro del director de partida (ventana flotante movible y ocultable) ═════════ */
const DMLOG=[];
const DMICO={ev:'⚡',dlg:'📖',sys:'·',chat:'💬',cmd:'🧭'};
function logDM(h,k){
  const tx=String(h||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();if(!tx)return;
  const last=DMLOG[DMLOG.length-1];if(last&&last.tx===tx&&Date.now()-last.t<1500)return;
  DMLOG.push({t:Date.now(),tx,k:k||'sys'});if(DMLOG.length>400)DMLOG.shift();
  const L=document.getElementById('dmL');if(L&&document.getElementById('dmBox').classList.contains('show')){L.insertAdjacentHTML('beforeend',dmRow(DMLOG[DMLOG.length-1]));L.scrollTop=L.scrollHeight}
}
const dmRow=e=>`<div class="dmr dm-${e.k}"><span>${new Date(e.t).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})}</span> ${DMICO[e.k]||'·'} ${esc(e.tx)}</div>`;
function showDM(on){
  const b=document.getElementById('dmBox');b.classList.toggle('show',on);document.getElementById('logBtn').classList.toggle('on',on);
  if(on){const L=document.getElementById('dmL');L.innerHTML=DMLOG.map(dmRow).join('')||'<div class="dmr">Aún no ha pasado nada.</div>';L.scrollTop=L.scrollHeight}
}
(()=>{
  const box=document.getElementById('dmBox'),h=box.querySelector('.dmh');let st=null;
  try{const p=JSON.parse(localStorage.getItem('adastra.dmpos')||'null');if(p){box.style.left=p[0]+'px';box.style.top=p[1]+'px'}}catch(e){}
  h.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;h.setPointerCapture(e.pointerId);const r=box.getBoundingClientRect();st={dx:e.clientX-r.left,dy:e.clientY-r.top}});
  h.addEventListener('pointermove',e=>{if(!st)return;const x=clamp(e.clientX-st.dx,0,innerWidth-80),y=clamp(e.clientY-st.dy,0,innerHeight-40);box.style.left=x+'px';box.style.top=y+'px';box.style.right='auto';box.style.bottom='auto'});
  h.addEventListener('pointerup',()=>{if(!st)return;st=null;try{localStorage.setItem('adastra.dmpos',JSON.stringify([parseInt(box.style.left),parseInt(box.style.top)]))}catch(e){}});
  document.getElementById('dmMin').onclick=()=>box.classList.toggle('min');
  document.getElementById('dmX').onclick=()=>showDM(false);
  document.getElementById('dmCopy').onclick=()=>copy(DMLOG.map(e=>new Date(e.t).toLocaleTimeString('es')+' '+e.tx).join('\n'),'Registro copiado');
})();

/* ═════════ Doble pantalla: mapa en esta ventana, métricas e información en otra ═════════ */
var POP=null;let popTimer=0;
const POPCSS=`body.pop{overflow:auto;height:auto;min-height:100vh}#popWrap{display:flex;flex-direction:column;min-height:100vh}
body.pop .pophead{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid var(--line);font-size:11px;letter-spacing:.3em}
body.pop #hud{position:static!important;width:auto!important;right:auto!important;flex-direction:row!important;flex-wrap:wrap;gap:12px 18px;padding:12px 14px;border-bottom:1px solid var(--line);pointer-events:auto}
body.pop #hud div{text-align:left!important;flex:1 1 150px;display:flex!important}
body.pop .info{flex-direction:row!important;flex-wrap:wrap;gap:6px 20px;padding:10px 14px;border-bottom:1px solid var(--line)}body.pop .info div{display:flex!important}
body.pop #drawer{position:static!important;transform:none!important;width:100%!important;max-width:none!important;height:auto!important;top:auto!important;flex:1;border:0!important;backdrop-filter:none}
body.pop #drawerX{display:none}body.pop .pane{overflow:visible}`;
/* Holograma casero: el mapa se repite en 4 vistas (arriba, abajo, izquierda y derecha, giradas hacia el centro)
   para proyectarlo con una pirámide de acetato sobre una pantalla. Mientras está abierto, el panel puede ir en
   la otra ventana con «Doble pantalla». */
let HOLO=null;
function toggleHolo(){if(HOLO){HOLO.el.remove();cancelAnimationFrame(HOLO.raf);HOLO=null;return}
  const el=document.createElement('div');el.id='holo';el.innerHTML='<canvas></canvas><button class="sm" title="Salir (Esc)">✕ Salir del holograma</button>';document.body.appendChild(el);
  const c=el.querySelector('canvas'),g=c.getContext('2d');el.querySelector('button').onclick=toggleHolo;
  const draw=()=>{const S=Math.min(innerWidth,innerHeight)*(devicePixelRatio||1);if(c.width!==S){c.width=c.height=S;c.style.width=c.style.height=Math.min(innerWidth,innerHeight)+'px'}
    const q=S/3,src=Math.min(cv.width,cv.height),sx=(cv.width-src)/2,sy=(cv.height-src)/2;g.fillStyle='#000';g.fillRect(0,0,S,S);
    for(const [x,y,a] of [[S/2,S-q/2,0],[S/2,q/2,Math.PI],[q/2,S/2,Math.PI/2],[S-q/2,S/2,-Math.PI/2]]){g.save();g.translate(x,y);g.rotate(a);g.drawImage(cv,sx,sy,src,src,-q/2,-q/2,q,q);g.restore()}
    HOLO.raf=requestAnimationFrame(draw)};
  HOLO={el,raf:0};draw();toast('Holograma: coloca la pirámide en el centro de la pantalla. Esc para salir.')}
addEventListener('keydown',e=>{if(e.key==='Escape'&&HOLO)toggleHolo()});
function openDual(){
  if(POP&&!POP.closed){POP.focus();return}
  POP=window.open('','adastra-panel','width=560,height=920');
  if(!POP){toast('El navegador bloqueó la segunda ventana: permite las ventanas emergentes para este sitio.');return}
  const d=POP.document;d.open();d.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ad Astra · Panel de mando</title></head><body class="pop"></body></html>');d.close();
  const st=d.createElement('style');st.textContent=[...document.querySelectorAll('style')].map(s=>s.textContent).join('\n')+POPCSS;d.head.appendChild(st);
  const ic=d.createElement('link');ic.rel='icon';ic.href=new URL('../icons/favicon.png',location.href).href;d.head.appendChild(ic);
  const w=d.createElement('div');w.id='popWrap';w.innerHTML='<div class="pophead"><span>AD ASTRA · PANEL DE MANDO</span><button id="popBack" class="sm">Volver a una pantalla</button></div>';d.body.appendChild(w);
  for(const id of['info','hud','drawer'])w.appendChild(d.adoptNode(document.getElementById(id)));
  d.getElementById('drawer').classList.add('open');document.body.classList.add('dual');$('#dualBtn').classList.add('on');
  d.getElementById('popBack').onclick=()=>{const w=POP;closeDual();if(w)w.close()};
  POP.addEventListener('pagehide',closeDual);
  POP.addEventListener('keydown',e=>{if(e.key==='Escape'&&modalOpen)return});
  clearInterval(popTimer);popTimer=setInterval(()=>{if(!POP||POP.closed)closeDual()},800);
  setTimeout(()=>{resize();refresh();if(tab==='ship')renderShip()},60);
  toast('Doble pantalla: lleva la ventana del panel a tu otro monitor. Aquí queda el mapa con los mensajes de la partida.');
}
function closeDual(){
  if(!POP)return;const d=POP.document;clearInterval(popTimer);
  try{const info=d.getElementById('info'),hud=d.getElementById('hud'),dr=d.getElementById('drawer');
    if(info)document.getElementById('brand').appendChild(document.adoptNode(info));
    if(hud)document.getElementById('stage').appendChild(document.adoptNode(hud));
    if(dr)document.getElementById('app').appendChild(document.adoptNode(dr));}catch(e){}
  POP=null;document.body.classList.remove('dual');$('#dualBtn').classList.remove('on');prevCv=null;
  setTimeout(()=>{resize();refresh();toggleDrawer(innerWidth>1100)},60);
}
addEventListener('beforeunload',()=>{if(POP&&!POP.closed)POP.close()});
