
/* ═════════ Especificaciones reales de cada nave ═════════
   len: eslora real (m) · mass: masa seca (t) · acc: aceleración (g) · tank: astrófago (t) · burn: t por año luz
   prov: días-persona de provisiones · crew: [mínimo, máximo] · c0: tripulación inicial · hib: cápsulas de coma · land: puede aterrizar */
const SPEC={
 corbeta:{len:46,mass:900,acc:1.5,tank:120,burn:10,cargo:60,prov:2500,crew:[2,6],c0:3,hib:1,land:1},
 carguero:{len:310,mass:12000,acc:.6,tank:700,burn:60,cargo:2000,prov:9000,crew:[4,12],c0:6,hib:1,land:0},
 sonda:{len:7,mass:4,acc:4,tank:20,burn:1,cargo:4,prov:0,crew:[0,0],c0:0,hib:0,land:1},
 velero:{len:28,extra:'vela de 1,2 km',mass:60,acc:.3,tank:40,burn:2.5,cargo:8,prov:4000,crew:[1,3],c0:2,hib:1,solar:1,land:0},
 generacional:{len:2400,mass:2e6,acc:.1,tank:6000,burn:240,cargo:2e4,prov:6e5,crew:[40,250],c0:120,hib:0,farm:.85,land:0},
 caza:{len:19,mass:40,acc:4,tank:16,burn:3,cargo:4,prov:900,crew:[1,2],c0:1,hib:0,land:1},
 carguero2:{len:120,mass:2600,acc:1.5,tank:320,burn:20,cargo:200,prov:7000,crew:[2,8],c0:3,hib:1,land:1},
 plataforma:{len:620,mass:4e4,acc:.3,tank:1600,burn:100,cargo:5000,prov:5e4,crew:[8,40],c0:20,hib:1,land:0}};
/* El combustible rinde más: cada nave gasta un 40 % menos por año luz (alcance ×1,67) */
const RINDE=.6;for(const k in SPEC)SPEC[k].burn=+(SPEC[k].burn*RINDE).toFixed(3);
const legMax=d=>SPEC[d].tank/SPEC[d].burn;
const REFS=[['Persona',1.8],['Autobús',12],['Boeing 747',71],['Estación Espacial Internacional',109],['Torre Eiffel',330],['Burj Khalifa',828],['Puente Golden Gate',2737]];
const PETROVA=new Set(['M','K','G','F','A']);
const smooth=(x,a,b)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const niceStep=v=>{const p=Math.pow(10,Math.floor(Math.log10(v))),m=v/p;return(m<1.5?1:m<3.5?2:m<7.5?5:10)*p};
const fmtT=y=>{if(!isFinite(y))return '∞';const d=y*365.25;return d<1?(d*24).toFixed(1)+' h':d<120?d.toFixed(0)+' días':y.toFixed(y<10?2:1)+' años'};
const fmtI=n=>Math.round(n).toLocaleString('es');
const gd=(a,b)=>Math.hypot(a.gx-b.gx,a.gy-b.gy,a.gz-b.gz);
const sameStar=(a,b)=>!!(a&&b&&a.h===b.h&&a.gx===b.gx&&a.gy===b.gy);
const sSeed=st=>seedStr(starLoc(st,14));
function starFromSeed(s){const p=parseSeed(s);return p.loc?starInCell(cellOf(p.loc)):null}
const cleanShip=s=>({d:SHIPS[s.d]?s.d:'corbeta',n:String(s.n||'').slice(0,24),c1:/^#[0-9a-f]{6}$/i.test(s.c1)?s.c1:DEF_SHIP.c1,c2:/^#[0-9a-f]{6}$/i.test(s.c2)?s.c2:DEF_SHIP.c2,mods:Array.isArray(s.mods)?[...new Set(s.mods.filter(k=>/^[a-z]{3,12}$/.test(k)))].slice(0,4):[]});

/* ═════════ Rejilla global de estrellas (celdas de 8 al, con caché) ═════════ */
const gridCache=new Map();
for(const a of ANCHSTARS){a.gx=a.lx;a.gy=a.ly;a.gz=a.lz;a.ck=[a.lx,a.ly,a.lz].map(v=>Math.floor((v+HALF)/SC)).join()}
function gridStars(I,J,K){
  const key=I+','+J+','+K;let a=gridCache.get(key);if(a)return a;
  const sx=Math.floor(I/NC),sy=Math.floor(J/NC),sz=Math.floor(K/NC);a=[];cellStars(sx,sy,sz,I-sx*NC,J-sy*NC,K-sz*NC,a);
  if(!sx&&!sy&&!sz)for(const s of ANCHSTARS)if(s.ck===key)a.push(s);
  if(gridCache.size>260000)gridCache.clear();gridCache.set(key,a);return a;
}
const gi=v=>Math.floor((v+HALF)/SC);
function starsNear(x,y,z,r,fn){
  const i0=gi(x-r),i1=gi(x+r),j0=gi(y-r),j1=gi(y+r),k0=gi(z-r),k1=gi(z+r),rr=r*r,m=(r+SC*.87)**2;
  for(let k=k0;k<=k1;k++){const cz=-HALF+(k+.5)*SC-z;for(let j=j0;j<=j1;j++){const cy=-HALF+(j+.5)*SC-y;for(let i=i0;i<=i1;i++){const cx=-HALF+(i+.5)*SC-x;
    if(cx*cx+cy*cy+cz*cz>m)continue;
    for(const s of gridStars(i,j,k)){const dx=s.gx-x,dy=s.gy-y,dz=s.gz-z,d2=dx*dx+dy*dy+dz*dz;if(d2<=rr)fn(s,Math.sqrt(d2))}}}}
}

/* ═════════ Estado del juego ═════════ */
function freshState(d){const s=SPEC[d];return{fuel:s.tank,mat:s.tank*2,prov:s.prov,extra:0,hull:100,min:20,days:0,yrs:0,jumps:0,ly:0}}
let D={v:3,n:'',h:[],base:'',anon:false,ship:{...DEF_SHIP},sp:'',st:null,crew:null,hib:0,cr:0,ex:{},scan:{},disc:{},q:0,qf:{},cm:null,op:null,c:''};
try{const raw=localStorage.getItem(LS_KEY);if(raw)Object.assign(D,JSON.parse(raw));else{const o=localStorage.getItem('adastra.explorer.v2');if(o){const j=JSON.parse(o);for(const k of['n','h','base','anon','ship'])if(j[k]!=null)D[k]=j[k]}}}catch(e){}
const saveD=()=>{if(NET&&NET.role==='client')return;try{localStorage.setItem(LS_KEY,JSON.stringify(D))}catch(e){}if(NET&&NET.role==='host')netSync()};
D.ship=cleanShip(Object.assign({...DEF_SHIP},D.ship||{}));
const SOL=A_BY('sol');
const HASH0=location.hash; // se lee antes de que handleHash lo borre
if(!D.sp||!parseSeed(D.sp).loc)D.sp=sSeed(SOL);
if(!Array.isArray(D.h))D.h=[];
for(const k of['ex','scan','disc','qf'])if(!D[k]||typeof D[k]!=='object')D[k]={};
let _sp='',_ss=null;
function pointAt(x,y,z){const seed=seedStr(globalToLoc(x,y,z,MAXD)),c=cellOf(parseSeed(seed).loc),g=cellCenterG(c);
  return{point:1,name:'Espacio profundo',gx:g[0],gy:g[1],gz:g[2],h:hash(Math.round(g[0]*1e4),Math.round(g[1]*1e4),Math.round(g[2]*1e4),3),P:{k:'—',lab:'Espacio profundo',T:0,lum:0,mass:0,rad:0,col:'#78dcff'},seed}}
function pointFromSeed(s){const p=parseSeed(s);if(!p.loc)return null;const g=cellCenterG(cellOf(p.loc));return pointAt(g[0],g[1],g[2])}
const seedOf=s=>s.point?s.seed:sSeed(s);
function shipStar(){if(_sp!==D.sp){_sp=D.sp;_ss=starFromSeed(D.sp)||pointFromSeed(D.sp)||SOL}return _ss}
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const opt={color:true,spin:!RM};if(Array.isArray(D.op)){opt.color=D.op[0]!==0;opt.spin=D.op[1]!==0&&!RM}

/* ═════════ Cámara libre y suave ═════════ */
const cam={fx:0,fy:0,fz:0,R:24,yaw:.6,pitch:.55},tg={...cam};
(()=>{const s=shipStar();if(Array.isArray(D.cm)&&D.cm.length===6&&D.cm.every(v=>isFinite(v))){[cam.fx,cam.fy,cam.fz,cam.R,cam.yaw,cam.pitch]=D.cm.map(Number);cam.R=clamp(cam.R,1,3000);cam.pitch=clamp(cam.pitch,-1.45,1.45)}else{cam.fx=s.gx;cam.fy=s.gy;cam.fz=s.gz}Object.assign(tg,cam)})();
let mode='map',SYS=null,selStar=null,selPlanet=null,route=null,hoverStar=null,travel=null,warp=null,surf=null;
let lastInput=performance.now(),idleDone=true,lastT=0,lastUi=0,frameNo=0,ping=0,sysT0=0,tab='carta',modalOpen=false;
const keys=new Set();
function flyTo(x,y,z,R,pitch){
  lastInput=performance.now();idleDone=false;const far=Math.hypot(x-cam.fx,y-cam.fy,z-cam.fz)>Math.max(cam.R,R||cam.R)*25;
  tg.fx=x;tg.fy=y;tg.fz=z;if(R)tg.R=clamp(R,1,3000);if(pitch!=null)tg.pitch=pitch;
  if(far){cam.fx=x;cam.fy=y;cam.fz=z;cam.R=tg.R;if(!RM)warp={t0:performance.now(),dur:900}}
}
const viewDepth=()=>clamp(Math.round(Math.log(SEC*2/cam.R)/Math.log(3)),0,MAXD);
const focusLoc=d=>globalToLoc(cam.fx,cam.fy,cam.fz,d==null?viewDepth():d);

function record(kind,l,force){
  if(D.anon)return;const s=typeof l==='string'?l:seedStr(l),last=D.h[D.h.length-1];
  if(!force&&last&&last.s===s&&last.k===kind)return;
  D.h.push({s,t:Date.now(),k:kind,f:0,n:''});if(D.h.length>3000)D.h.splice(0,D.h.length-3000);saveD();if(tab==='hist')renderHist();
}

/* ═════════ Canvas y proyección ═════════ */
const cv=$('#cv'),ctx=cv.getContext('2d');let W=0,H=0,dpr=1,CP=null;
function resize(){const r=cv.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr}
new ResizeObserver(resize).observe(cv);
const dust=Array.from({length:240},(_,i)=>{const r=rng(i*977+5);return[r(),r(),.3+r()*r()*1.2]});
function camSetup(){const c=cam;CP={cy:Math.cos(c.yaw),sy:Math.sin(c.yaw),cp:Math.cos(c.pitch),sp:Math.sin(c.pitch),dist:c.R*2.6,F:Math.min(W,H)*1.05,cx:W/2,cy0:H/2,fx:c.fx,fy:c.fy,fz:c.fz}}
const _p=[0,0,0];
function proj(x,y,z){const c=CP,rx=x-c.fx,ry=y-c.fy,rz=z-c.fz,x1=rx*c.cy-ry*c.sy,y1=rx*c.sy+ry*c.cy,Y=y1*c.cp-rz*c.sp,Z=y1*c.sp+rz*c.cp,d=Y+c.dist;
  if(d<c.dist*.04)return false;const k=c.F/d;_p[0]=c.cx+x1*k;_p[1]=c.cy0-Z*k;_p[2]=d;return true}
const RINGU=Array.from({length:73},(_,i)=>[Math.cos(i/72*6.2832),Math.sin(i/72*6.2832)]);
function ringPath(cx,cy,cz,r){ctx.beginPath();let pen=false;for(const [u,v] of RINGU){if(proj(cx+u*r,cy+v*r,cz)){pen?ctx.lineTo(_p[0],_p[1]):ctx.moveTo(_p[0],_p[1]);pen=true}else pen=false}}

/* — Estrellas visibles (se recalculan solo al moverse lo suficiente) — */
let vis=[],visB=null;
function needVis(){if(!visB)return true;const R=cam.R;if(R>visB.R||R<visB.R/3)return true;return Math.hypot(cam.fx-visB.x,cam.fy-visB.y,cam.fz-visB.z)>visB.R*.25}
function buildVis(){
  const R=cam.R*1.3;visB={x:cam.fx,y:cam.fy,z:cam.fz,R};
  if(cam.R>240){vis=[];return}
  const cull=Math.min(R*1.35,180),lim=cam.R<14?0:.0004*Math.pow(cam.R/14,2.3),out=[];
  starsNear(cam.fx,cam.fy,cam.fz,cull,(s,d)=>{if(s.P.lum>=lim||d<R*.18||s.anchor)out.push(s)});vis=out;
}
/* — Halo galáctico a escalas grandes — */
let haze=[],hzB=null;
function needHaze(){return !hzB||cam.R>hzB.R*1.4||cam.R<hzB.R/1.4||Math.hypot(cam.fx-hzB.x,cam.fy-hzB.y,cam.fz-hzB.z)>hzB.R*.5}
function buildHaze(){
  const R=cam.R,st=R/3,N=7;hzB={x:cam.fx,y:cam.fy,z:cam.fz,R,st};haze=[];
  const bx=Math.round(cam.fx/st),by=Math.round(cam.fy/st),bz=Math.round(cam.fz/st);
  for(let k=-N;k<=N;k++)for(let j=-N;j<=N;j++)for(let i=-N;i<=N;i++){if(i*i+j*j+k*k>N*N)continue;const x=(bx+i)*st,y=(by+j)*st,z=(bz+k)*st,d=density(x,y,z);if(d<.05)continue;
    const r=rng(hash(bx+i,by+j,bz+k,61)),n=Math.round(d*16);for(let q=0;q<n;q++)haze.push(x+(r()-.5)*st,y+(r()-.5)*st,z+(r()-.5)*st,d*(.4+r()*.6))}
}
function drawHaze(a){
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='#e8eef8';
  for(let i=0;i<haze.length;i+=4){if(!proj(haze[i],haze[i+1],haze[i+2]))continue;const s=haze[i+3];ctx.globalAlpha=Math.min(1,a*s*.9);ctx.fillRect(_p[0],_p[1],s>.7?1.6:1.1,s>.7?1.6:1.1)}
  ctx.restore();
}
/* — Plano de referencia: anillos de distancia y radios (estilo carta de navegación) — */
function drawPlane(){
  const R=cam.R,step=niceStep(R/3),fx=cam.fx,fy=cam.fy,fz=cam.fz;
  ctx.lineWidth=1;ctx.font='10px ui-monospace,Menlo,monospace';ctx.textAlign='left';ctx.textBaseline='bottom';
  for(let k=1;k*step<=R*1.2&&k<9;k++){const r=k*step;ctx.strokeStyle=`rgba(88,160,230,${k%5===0?.28:.16})`;ringPath(fx,fy,fz,r);ctx.stroke();
    if(proj(fx+r*CP.cy,fy-r*CP.sy,fz)){ctx.fillStyle='rgba(120,170,230,.55)';ctx.fillText(fmtLen(r),_p[0]+3,_p[1]-2)}}
  ctx.strokeStyle='rgba(88,160,230,.08)';ctx.beginPath();
  for(let a=0;a<12;a++){const u=Math.cos(a/12*6.2832),v=Math.sin(a/12*6.2832);if(!proj(fx,fy,fz))continue;const x0=_p[0],y0=_p[1];if(!proj(fx+u*R*1.2,fy+v*R*1.2,fz))continue;ctx.moveTo(x0,y0);ctx.lineTo(_p[0],_p[1])}
  ctx.stroke();
}
const STREAKS=Array.from({length:150},(_,i)=>{const r=rng(i*131+9);return[r()*6.2832,.12+r()*.88,.5+r()*.5]});
function drawStreaks(e,t){
  if(e<=0)return;const cx=W/2,cy=H/2,R=Math.hypot(W,H)/2;ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  for(const s of STREAKS){const rho=R*((s[1]+t*s[2])%1),L=R*.45*e*s[2]+2,ca=Math.cos(s[0]),sa=Math.sin(s[0]);
    ctx.strokeStyle=`rgba(${150+s[2]*90|0},${190+s[2]*50|0},255,${.8*e*s[2]})`;ctx.lineWidth=.8+s[2]*1.4*e;ctx.beginPath();ctx.moveTo(cx+ca*Math.max(0,rho-L),cy+sa*Math.max(0,rho-L));ctx.lineTo(cx+ca*rho,cy+sa*rho);ctx.stroke()}
  const g=ctx.createRadialGradient(cx,cy,0,cx,cy,R*.5);g.addColorStop(0,`rgba(210,230,255,${e*e*.35})`);g.addColorStop(1,'rgba(210,230,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.restore();
}
function drawWarp(now){if(!warp)return;const t=(now-warp.t0)/warp.dur;if(t>=1){warp=null;return}drawStreaks((1-t)*(1-t),t*.8)}
let pilot=null;
function shipPos(){return pilot?pilot.pos:travel&&travel.pos?travel.pos:(s=>[s.gx,s.gy,s.gz])(shipStar())}
function drawGizmo(){
  const gx=W-52,gy=H-150,c=CP,L=24;ctx.save();ctx.font='10px ui-monospace,Menlo,monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  for(const [v,col,lab] of[[[1,0,0],'#ff7a7a','X'],[[0,1,0],'#7ee787','Y'],[[0,0,1],'#7aa7ff','Z']]){
    const x1=v[0]*c.cy-v[1]*c.sy,y1=v[0]*c.sy+v[1]*c.cy,Z=y1*c.sp+v[2]*c.cp,dx=x1*L,dy=-Z*L;
    ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx+dx,gy+dy);ctx.stroke();ctx.fillStyle=col;ctx.fillText(lab,gx+dx*1.3,gy+dy*1.3)}
  ctx.restore();
}

