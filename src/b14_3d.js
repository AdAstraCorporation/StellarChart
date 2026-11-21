
/* ═════════ Vistas 3D: sistema estelar y escáner de terreno al aterrizar ═════════
   Arrastrar = girar · rueda/pellizco = acercar. La vista 2D antigua queda como drawSystem2D/drawSurface2D. */
const V3={yaw:.5,pitch:.55,z:1};
function p3(x,y,z,cx,cy,f){const cy_=Math.cos(V3.yaw),sy=Math.sin(V3.yaw),cp=Math.cos(V3.pitch),sp=Math.sin(V3.pitch);
  const x1=x*cy_-z*sy,z1=x*sy+z*cy_,y1=y*cp-z1*sp,z2=y*sp+z1*cp,k=f/(f+z2);return[cx+x1*k,cy-y1*k,k,z2]}
function drawSystem(now){
  const ent=RM?1:ease(clamp((now-sysT0)/1000,0,1)),S=SYS,P=S.P,cx=W/2,cy=H/2+20,t=now/1000,here=sameStar(S.star,shipStar()),f=Math.max(W,H)*1.3;
  if(!drag)V3.yaw+=.0006;
  const Rmax=(Math.min(W,H)/2-30)*(.35+.65*ent)*V3.z;ctx.letterSpacing='1.6px';drawSky(now);ctx.globalAlpha=.15+.85*ent;
  const all=S.planets.map(p=>p.a).concat(S.belts.flat());const amax=Math.max(...all,S.hz[1],.5)*1.12,a0=Math.min(...all,S.hz[0])*.55,starPx=clamp(6+Math.log10(P.rad+1)*14,7,34);
  const rp=a=>starPx+14+(Rmax-starPx-14)*Math.log(1+Math.max(a,0)/a0)/Math.log(1+amax/a0);
  const inc=i=>((hash(S.star.h,i,91)%1000)/1000-.5)*.18,pt=(r,ang,i)=>{const c=Math.cos(ang),s=Math.sin(ang),ti=inc(i);return p3(c*r,s*r*Math.sin(ti),s*r*Math.cos(ti),cx,cy,f)};
  const ring=(r,i,col,lw,dash)=>{ctx.strokeStyle=col;ctx.lineWidth=lw;if(dash)ctx.setLineDash(dash);ctx.beginPath();for(let k=0;k<=72;k++){const q=pt(r,k/72*6.2832,i);k?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])}ctx.stroke();ctx.setLineDash([])};
  // plano de referencia (rejilla polar tenue)
  for(let k=1;k<=4;k++)ring(Rmax*k/4,-1,'rgba(120,220,255,.05)',1);
  for(let k=0;k<12;k++){const a=k/12*6.2832,q0=pt(starPx*1.5,a,-1),q1=pt(Rmax,a,-1);ctx.strokeStyle='rgba(120,220,255,.04)';ctx.beginPath();ctx.moveTo(q0[0],q0[1]);ctx.lineTo(q1[0],q1[1]);ctx.stroke()}
  // zona habitable
  ctx.globalAlpha*=1;const hzr=(rp(S.hz[0])+rp(S.hz[1]))/2;ring(hzr,-1,'rgba(126,231,135,.14)',Math.max(2,(rp(S.hz[1])-rp(S.hz[0]))*.6));
  // cinturones
  for(const [a,b] of S.belts){const r=rng(hash(S.star.h,a*100|0));ctx.fillStyle='rgba(200,200,200,.55)';for(let k=0;k<220;k++){const q=pt(lerp(rp(a),rp(b),r()),r()*6.283+t*.02,-1),h=(r()-.5)*6;ctx.fillRect(q[0],q[1]-h*q[2],1.3,1.3)}}
  // órbitas
  S.planets.forEach((p,i)=>ring(rp(p.a),i,p===selPlanet?'rgba(88,208,255,.7)':'rgba(190,205,235,.16)',1));
  // estrella (o remanente)
  const fate=destino(S.star),c0=p3(0,0,0,cx,cy,f);
  if(fate==='bh'){ctx.fillStyle='#000';ctx.beginPath();ctx.arc(c0[0],c0[1],starPx*.9,0,7);ctx.fill();for(let k=0;k<3;k++){ctx.strokeStyle=`rgba(255,${150+k*30},80,${.6-k*.15})`;ctx.lineWidth=3-k;ctx.beginPath();for(let j=0;j<=60;j++){const q=pt(starPx*(1.6+k*.5),j/60*6.283+t*(1-k*.2),-1);j?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])}ctx.stroke()}}
  else{const col=fate?'#bcd4ff':P.col,g=ctx.createRadialGradient(c0[0],c0[1],0,c0[0],c0[1],starPx*3.2);g.addColorStop(0,col);g.addColorStop(.35,col+'88');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(c0[0],c0[1],starPx*(fate?1.6:3.2),0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(c0[0],c0[1],starPx*(fate?.35:.7),0,7);ctx.fill();
    if(fate==='ns'){ctx.strokeStyle='rgba(180,210,255,.5)';ctx.lineWidth=2;const a=t*3;ctx.beginPath();ctx.moveTo(c0[0]-Math.cos(a)*Rmax*.5,c0[1]-Math.sin(a)*Rmax*.2);ctx.lineTo(c0[0]+Math.cos(a)*Rmax*.5,c0[1]+Math.sin(a)*Rmax*.2);ctx.stroke()}}
  if(infected(S.star))ring(starPx*2.4,-1,'rgba(255,59,92,.6)',1.2,[4,4]);
  // planetas (de atrás hacia delante)
  sysHits=[];let shipP=null;
  const items=S.planets.map((p,i)=>{const R=rp(p.a),w=Math.min(1.2,.3*Math.pow(Math.max(p.a,.03),-.75)),q=pt(R,p.phase+t*w*.5,i);return{p,i,x:q[0],y:q[1],k:q[2],z:q[3]}}).sort((a,b)=>b.z-a.z);
  for(const {p,x,y,k} of items){
    const pr=clamp((2.5+Math.log2(p.r+.5)*2.6)*k,2,16),col=KIND[p.kind][1],sh=ctx.createRadialGradient(x-pr*.4,y-pr*.4,pr*.1,x,y,pr);sh.addColorStop(0,col);sh.addColorStop(1,'#05070c');
    // sombra hacia el plano
    ctx.strokeStyle='rgba(120,220,255,.12)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y+pr);ctx.lineTo(x,y+pr+6*k);ctx.stroke();
    ctx.fillStyle=sh;ctx.beginPath();ctx.arc(x,y,pr,0,7);ctx.fill();
    if(p.ring){ctx.strokeStyle='rgba(230,210,170,.7)';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(x,y,pr*1.9,pr*.55*(.4+Math.abs(Math.sin(V3.pitch))),-.3,0,7);ctx.stroke()}
    if(p.hz){ctx.strokeStyle='#7ee787';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,pr+3,0,7);ctx.stroke()}
    if(p===selPlanet){ctx.strokeStyle='#58d0ff';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.lineDashOffset=-now/50;ctx.beginPath();ctx.arc(x,y,pr+7,0,7);ctx.stroke();ctx.setLineDash([]);shipP=[x+pr+14+Math.cos(t*2)*3,y-pr-10+Math.sin(t*2)*3]}
    ctx.font='10px ui-monospace,Menlo,monospace';ctx.fillStyle=p===selPlanet?'#58d0ff':`rgba(205,215,235,${clamp(.35+k*.4,.35,.85)})`;ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(spaced(p.name.replace(S.name+' ','').toUpperCase()),x+pr+6,y);sysHits.push({x,y,r:Math.max(12,pr+6),planet:p});
  }
  if(!shipP){const q=pt(starPx+30,-1.2+t*.2,-1);shipP=[q[0],q[1]-14]}
  ctx.globalAlpha=1;
  if(here){drawShip3D(ctx,shipP[0],shipP[1],30,t*.9,.5,D.ship,t);ctx.font='9px ui-monospace,Menlo,monospace';ctx.fillStyle='rgba(205,230,255,.75)';ctx.textAlign='center';ctx.fillText(spaced((D.ship.n||SHIPS[D.ship.d].n).toUpperCase()),shipP[0],shipP[1]+22)}
  ctx.font='10px ui-monospace,Menlo,monospace';ctx.textAlign='left';ctx.fillStyle='rgba(126,231,135,.7)';ctx.fillText(spaced('▮ ZONA HABITABLE · ARRASTRA PARA GIRAR'),70,H-60);
  if(estacion(S.star)){ctx.fillStyle='rgba(120,220,255,.8)';ctx.fillText(spaced('🛰 '+estacion(S.star).n.toUpperCase()),70,H-76)}
  if(fate){ctx.fillStyle='rgba(255,190,120,.85)';ctx.fillText(spaced(FATE[fate].ic+' '+FATE[fate].n.toUpperCase()+' · FUENTE DE ENERGÍA NEGATIVA'),70,H-92)}
  if(!here){ctx.fillStyle='rgba(255,180,84,.8)';ctx.fillText(spaced('VISTA REMOTA · DATOS DE SONDEO'),70,H-44)}
  ctx.letterSpacing='0px';
}
/* Escáner de terreno: malla 3D del relieve con un barrido del escáner */
const _mesh=new Map();
function malla(key,p,seed){let m=_mesh.get(key);if(m)return m;const N=44,h=[];const amp=p.g>1.5?.55:p.kind==='ocean'?.35:1;
  for(let j=0;j<N;j++){h[j]=[];for(let i=0;i<N;i++){const x=i/N,y=j/N;h[j][i]=(vn3(x*4+seed,y*4,1,5)*.65+vn3(x*11+seed,y*11,2,7)*.25+vn3(x*29,y*29+seed,3,9)*.1)*amp}}
  m={N,h};if(_mesh.size>12)_mesh.clear();_mesh.set(key,m);return m}
function drawSurface(now){
  ctx.letterSpacing='1.6px';const {info}=surf,p=info.p,k=p.kind,sky=SKY[k]||SKY.barren,t=now/1000,ent=RM?1:ease(clamp((now-surf.t0)/1200,0,1));
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,sky[0]);g.addColorStop(.6,sky[1]);g.addColorStop(1,'#020305');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  if(!info.breath){ctx.fillStyle='rgba(255,255,255,.7)';const r=rng(5);for(let i=0;i<140;i++)ctx.fillRect(r()*W,r()*H*.45,1,1)}
  const P=SYS.P,sx=W*.78,sy=H*.14,sg=ctx.createRadialGradient(sx,sy,0,sx,sy,50);sg.addColorStop(0,P.col);sg.addColorStop(.2,P.col+'aa');sg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.arc(sx,sy,50,0,7);ctx.fill();
  if(!drag)V3.yaw+=.0008;
  const seed=hash(SYS.star.h,surf.i,321)%1000/10,M=malla(info.key,p,seed),N=M.N,S=Math.min(W,H)*.95*V3.z,cx=W/2,cy=H*.62,f=Math.max(W,H)*1.2,hgt=S*.16*(.3+.7*ent);
  const P3=(i,j)=>p3((i/(N-1)-.5)*S,M.h[j][i]*hgt-hgt*.4,(j/(N-1)-.5)*S,cx,cy,f);
  const pts=[];for(let j=0;j<N;j++){pts[j]=[];for(let i=0;i<N;i++)pts[j][i]=P3(i,j)}
  const quads=[];for(let j=0;j<N-1;j++)for(let i=0;i<N-1;i++){const a=pts[j][i],b=pts[j][i+1],c=pts[j+1][i+1],d=pts[j+1][i];quads.push([a,b,c,d,(a[3]+c[3])/2,(M.h[j][i]+M.h[j+1][i+1])/2,i,j])}
  quads.sort((q,r)=>r[4]-q[4]);
  const base=GROUND[k]||'#2a2826',scan=((t*.18)%1.2)-.1;
  for(const [a,b,c,d,z,h,i,j] of quads){const sh=clamp(.35+h*.9,.2,1.25),u=i/(N-1),near=Math.abs(u-scan)<.025;
    ctx.fillStyle=near?'rgba(120,230,255,.55)':shade(base,sh);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.lineTo(d[0],d[1]);ctx.closePath();ctx.fill();
    ctx.strokeStyle=near?'rgba(160,240,255,.9)':'rgba(120,220,255,.13)';ctx.lineWidth=near?1.2:.6;ctx.stroke()}
  // condiciones anómalas visibles
  for(const h of info.hz){if(!h[4])continue;if(h[0]==='Tormenta de iones'&&Math.random()<.05){ctx.fillStyle='rgba(180,220,255,.15)';ctx.fillRect(0,0,W,H)}if(h[0]==='Niebla de esporas'){ctx.fillStyle='rgba(140,220,120,.06)';ctx.fillRect(0,H*.4,W,H*.6)}}
  // nave posada y puntos de interés sobre la malla
  const at=(i,j)=>pts[clamp(j,0,N-1)][clamp(i,0,N-1)],sp=at(N*.3|0,N*.55|0),shPx=clamp(SPEC[D.ship.d].len*.6,22,120)*sp[2];
  drawShip3D(ctx,sp[0],sp[1]-shPx*.3-(1-ent)*H*.5,shPx,.9,.15,D.ship,t,ent<1);
  info.pois.forEach((n,j)=>{const r=rng(hash(seed*100|0,j,77)),q=at(6+(r()*(N-12)|0),6+(r()*(N-12)|0)),x=q[0],y=q[1],done=D.ex[info.key+':'+n];
    ctx.strokeStyle=done?'rgba(126,231,135,.9)':'rgba(255,180,84,.95)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-38);ctx.stroke();
    ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(x,y-44);ctx.lineTo(x+5,y-39);ctx.lineTo(x,y-34);ctx.lineTo(x-5,y-39);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.ellipse(x,y,7,3,0,0,7);ctx.stroke();ctx.font='9px ui-monospace,Menlo,monospace';ctx.textAlign='center';ctx.fillText(spaced(n.toUpperCase()),x,y-52)});
  ctx.font='10px ui-monospace,Menlo,monospace';ctx.textAlign='left';ctx.fillStyle='rgba(160,240,255,.85)';ctx.fillText(spaced('ESCÁNER DE TERRENO · ARRASTRA PARA GIRAR'),70,H-60);
  ctx.fillStyle='rgba(230,235,245,.8)';ctx.fillText(spaced(`${p.name.toUpperCase()} · ${Math.round(p.T-273)} °C · ${p.g.toFixed(2)} G · ${info.atm.toUpperCase()}`),70,H-44);
  ctx.letterSpacing='0px';
}
function shade(hex,k){const n=parseInt(hex.slice(1),16),r=Math.min(255,((n>>16)&255)*k|0),g=Math.min(255,((n>>8)&255)*k|0),b=Math.min(255,(n&255)*k|0);return`rgb(${r},${g},${b})`}
