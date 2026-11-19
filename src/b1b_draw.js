
/* ═════════ Estilo de carta de navegación (tipo «Hail Mary – Stellar Navigation Chart») ═════════ */
const spaced=s=>String(s);
opt.nav=true;opt.pet=true;if(!Array.isArray(D.op))opt.color=false;if(Array.isArray(D.op)){opt.nav=D.op[2]!==0;opt.pet=D.op[3]!==0}
/* — Fondo de todo el cielo con la banda de la Vía Láctea (sólo rota con la cámara) — */
const SKYP=(()=>{
  const n=NGP,a=Math.abs(n[0])<.9?[1,0,0]:[0,1,0],e1=[n[1]*a[2]-n[2]*a[1],n[2]*a[0]-n[0]*a[2],n[0]*a[1]-n[1]*a[0]],l1=Math.hypot(...e1);e1.forEach((v,i)=>e1[i]=v/l1);
  const e2=[n[1]*e1[2]-n[2]*e1[1],n[2]*e1[0]-n[0]*e1[2],n[0]*e1[1]-n[1]*e1[0]],GC=eq2ecl(266.405,-28.936,1),gc=Math.atan2(GC[0]*e2[0]+GC[1]*e2[1]+GC[2]*e2[2],GC[0]*e1[0]+GC[1]*e1[1]+GC[2]*e1[2]);
  const r=rng(424242),out=[];
  for(let i=0;i<3200;i++){const z=r()*2-1,t=r()*6.2832,q=Math.sqrt(1-z*z);out.push([q*Math.cos(t),q*Math.sin(t),z,.5+r()*r()*1.6,.25+r()*.6])}
  for(let i=0;i<6500;i++){const th=gc+(r()<.55?(r()+r()+r()-1.5)*1.6:(r()*2-1)*Math.PI),b=(r()+r()+r()+r()-2)*.09,cb=Math.cos(b),sb=Math.sin(b);
    out.push([cb*(Math.cos(th)*e1[0]+Math.sin(th)*e2[0])+sb*n[0],cb*(Math.cos(th)*e1[1]+Math.sin(th)*e2[1])+sb*n[1],cb*(Math.cos(th)*e1[2]+Math.sin(th)*e2[2])+sb*n[2],.4+r()*.8,.08+r()*.22])}
  return out;
})();
function drawSky(){
  if(!CP)camSetup();const c=CP,F=Math.min(W,H)*.75;ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='#fff';
  for(const s of SKYP){const x1=s[0]*c.cy-s[1]*c.sy,y1=s[0]*c.sy+s[1]*c.cy,Y=y1*c.cp-s[2]*c.sp;if(Y<.08)continue;const Z=y1*c.sp+s[2]*c.cp,x=c.cx+x1/Y*F,y=c.cy0-Z/Y*F;
    if(x<0||y<0||x>W||y>H)continue;ctx.globalAlpha=s[4];ctx.fillRect(x,y,s[3],s[3])}
  ctx.restore();
}
/* — Rejillas en perspectiva (plano de la eclíptica a la altura del foco, y una más tenue debajo) — */
function drawGrid(z,alpha){
  const R=cam.R,st=niceStep(R/4),ext=Math.ceil(R*1.3/st)*st,x0=Math.round(cam.fx/st)*st,y0=Math.round(cam.fy/st)*st;
  ctx.lineWidth=1;
  for(let a=0;a<2;a++)for(let k=-ext;k<=ext+1e-9;k+=st){
    const pts=[];for(let u=-ext;u<=ext+1e-9;u+=st/2){const X=a?x0+k:x0+u,Y=a?y0+u:y0+k,d=Math.hypot(X-cam.fx,Y-cam.fy),al=alpha*(1-smooth(d,R*.5,R*1.3));if(al<=.003){pts.push(null);continue}
      pts.push(proj(X,Y,z)?[_p[0],_p[1],al]:null)}
    for(let i=0;i<pts.length-1;i++){const p=pts[i],q=pts[i+1];if(!p||!q)continue;if(((i+Math.round(k/st))&3)===3)continue;ctx.strokeStyle=`rgba(225,232,245,${(p[2]+q[2])/2})`;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke()}
  }
}
function arcPts(a,b,n){const d=gd(a,b),out=[];for(let i=0;i<=n;i++){const t=i/n,l=Math.sin(Math.PI*t)*d*.18;out.push(proj(lerp(a.gx,b.gx,t),lerp(a.gy,b.gy,t),lerp(a.gz,b.gz,t)+l)?[_p[0],_p[1]]:null)}return out}
function labelAt(x,y,txt,col,size){ctx.strokeStyle=col;ctx.globalAlpha=.7;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+4,y);ctx.lineTo(x+13,y);ctx.stroke();ctx.globalAlpha=1;
  ctx.fillStyle=col;ctx.font=`${size||10}px ui-monospace,Menlo,monospace`;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(spaced(txt.toUpperCase()),x+17,y)}
const PET='#ff3b5c',AMB='rgba(224,170,70,.55)';
let shipHit=null;
function drawMap(now){
  camSetup();frameNo++;const R=cam.R,c=CP;ctx.letterSpacing='1.6px';
  drawSky();
  const hz=smooth(R,40,220);if(hz>0){if(needHaze())buildHaze();drawHaze(hz)}
  drawGrid(cam.fz,.22);drawGrid(cam.fz-R*.6,.09);
  const sa=1-smooth(R,140,240),fx=cam.fx,fy=cam.fy,fz=cam.fz,labels=[],P0=shipPos(),ship=shipStar();
  if(sa>0&&vis.length){
    const drop=R<90;let nDrop=0;
    ctx.globalCompositeOperation='lighter';
    for(const s of vis){
      const dx=s.gx-fx,dy=s.gy-fy,dz=s.gz-fz,df=Math.sqrt(dx*dx+dy*dy+dz*dz),fade=1-smooth(df,R*.95,R*1.35);if(fade<=0)continue;
      const x1=dx*c.cy-dy*c.sy,y1=dx*c.sy+dy*c.cy,Y=y1*c.cp-dz*c.sp,Z=y1*c.sp+dz*c.cp,d=Y+c.dist;if(d<c.dist*.04)continue;
      const k=c.F/d,x=c.cx+x1*k,y=c.cy0-Z*k;if(x<-20||y<-20||x>W+20||y>H+20)continue;s._x=x;s._y=y;s._f=frameNo;
      const lum=s.P.lum,r=clamp((.6+Math.log10(lum+1.15)*1.1)*clamp(c.dist/d,.6,1.5),.7,3.6),a=sa*fade*clamp(.45+Math.log10(lum+1)*.6,.45,1),inf=opt.pet&&infected(s);
      if(drop&&df<R*.85&&nDrop<220){nDrop++;const d2=y1*c.cp+c.dist;if(d2>c.dist*.04){const k2=c.F/d2,px=c.cx+x1*k2,py=c.cy0-(y1*c.sp)*k2;
        ctx.strokeStyle=`rgba(225,232,245,${.16*a})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(px,py);ctx.stroke();ctx.fillStyle=`rgba(225,232,245,${.3*a})`;ctx.fillRect(px-1.5,py-.5,3,1)}}
      ctx.globalAlpha=a;ctx.fillStyle=inf?PET:opt.color?s.P.col:'#f2f5fb';
      if(r<2.2)ctx.fillRect(x-r/2,y-r/2,r,r);else{ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.globalAlpha=a*.1;ctx.beginPath();ctx.arc(x,y,r*2.4,0,7);ctx.fill()}
      if(R<45&&!s.anchor&&df<R*.8){const sc=Math.log10(lum+.001)-df/R*2;if(labels.length<9||sc>labels[labels.length-1][0]){labels.push([sc,s,x,y,inf]);labels.sort((p,q)=>q[0]-p[0]);if(labels.length>9)labels.pop()}}
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    for(const [,s,x,y,inf] of labels)labelAt(x,y,starName(s),inf?'rgba(255,59,92,.85)':'rgba(220,228,240,.62)',9);
  }
  // líneas de navegación (visuales desde la nave)
  const sp=SPEC[D.ship.d],ml=legMax(D.ship.d),rng0=D.cr?ml:D.st.fuel/sp.burn;
  if(opt.nav&&proj(P0[0],P0[1],P0[2])){const sx=_p[0],sy=_p[1];ctx.strokeStyle=AMB;ctx.lineWidth=.8;
    for(const s of ANCHSTARS){if(sameStar(s,ship)||(R>150&&s.anchor.id!=='sol'))continue;if(!proj(s.gx,s.gy,s.gz))continue;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(_p[0],_p[1]);ctx.stroke()}}
  // anclas
  for(const s of ANCHSTARS){if(R>150&&s.anchor.id!=='sol')continue;if(!proj(s.gx,s.gy,s.gz))continue;const x=_p[0],y=_p[1],inf=opt.pet&&infected(s);s._x=x;s._y=y;s._f=frameNo;
    ctx.fillStyle=inf?PET:'#fff';ctx.beginPath();ctx.arc(x,y,2.6,0,7);ctx.fill();ctx.globalAlpha=.25;ctx.beginPath();ctx.arc(x,y,7,0,7);ctx.fill();ctx.globalAlpha=1;
    labelAt(x,y,s.anchor.name,inf?'rgba(255,59,92,.95)':'rgba(235,240,248,.9)',10)}
  // alcance de salto
  if(!travel){
    if(ml*c.F/c.dist>8){ctx.setLineDash([2,6]);ctx.strokeStyle='rgba(224,170,70,.22)';ctx.lineWidth=1;ringPath(P0[0],P0[1],P0[2],ml);ctx.stroke()}
    if(rng0*c.F/c.dist>8){ctx.setLineDash([7,5]);ctx.lineDashOffset=-now/60;ctx.strokeStyle='rgba(224,170,70,.7)';ringPath(P0[0],P0[1],P0[2],rng0);ctx.stroke();
      if(proj(P0[0]+rng0*c.cy,P0[1]-rng0*c.sy,P0[2])){ctx.fillStyle='rgba(224,170,70,.95)';ctx.font='9px ui-monospace,Menlo,monospace';ctx.textAlign='left';ctx.fillText(spaced('ALCANCE '+fmtLen(rng0).toUpperCase()),_p[0]+4,_p[1]-8)}}
    ctx.setLineDash([]);
  }
  // plan de viaje: paradas numeradas unidas por una línea discontinua
  {const P=getPlan();if(P.stops.length&&!travel){let prev=shipStar();ctx.setLineDash([2,5]);ctx.lineWidth=1.2;ctx.strokeStyle='rgba(224,170,70,.75)';ctx.fillStyle='rgba(224,170,70,.95)';ctx.font='10px ui-monospace,Menlo,monospace';ctx.textAlign='center';
    P.stops.forEach((s,k)=>{const st=stopStar(s);if(!st)return;if(proj(prev.gx,prev.gy,prev.gz)){const a=[_p[0],_p[1]];if(proj(st.gx,st.gy,st.gz)){ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(_p[0],_p[1]);ctx.stroke()}}
      if(proj(st.gx,st.gy,st.gz)){ctx.beginPath();ctx.arc(_p[0],_p[1],7,0,7);ctx.stroke();ctx.fillText(String(k+1),_p[0],_p[1]-12)}prev=st});ctx.setLineDash([])}}
  // trayectoria trazada: arcos con marcas, como en la carta original
  if(route&&route.legs&&!travel){
    for(const L of route.legs){const pts=arcPts(L.from,L.to,28),col=L.err||L.pend?'rgba(150,160,180,.6)':'#e9f2ff';ctx.strokeStyle=col;ctx.lineWidth=1.6;ctx.setLineDash(L.err||L.pend?[5,5]:[]);ctx.beginPath();let pen=false;
      for(const p of pts){if(!p){pen=false;continue}pen?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);pen=true}ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=col;pts.forEach((p,i)=>{if(p&&i%4===0&&i&&i<28){ctx.beginPath();ctx.arc(p[0],p[1],2,0,7);ctx.fill()}})}
    const last=route.legs[route.legs.length-1];if(proj(last.to.gx,last.to.gy,last.to.gz)){ctx.fillStyle='#e9f2ff';ctx.font='9px ui-monospace,Menlo,monospace';ctx.textAlign='left';ctx.fillText(spaced(`${route.legs.length} SALTO${route.legs.length>1?'S':''} · ${fmtLen(route.tot.d).toUpperCase()}`),_p[0]+17,_p[1]+13)}
  }
  if(travel&&travel.leg){const L=travel.leg,pts=arcPts(L.from,L.to,28);ctx.strokeStyle='rgba(120,220,255,.8)';ctx.lineWidth=1.6;ctx.beginPath();let pen=false;for(const p of pts){if(!p){pen=false;continue}pen?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);pen=true}ctx.stroke()}
  // retícula del foco: el centro de la carta es un punto al que se puede viajar
  if(!travel){const cx=W/2,cy=H/2;ctx.strokeStyle='rgba(225,232,245,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-9,cy);ctx.lineTo(cx-3,cy);ctx.moveTo(cx+3,cy);ctx.lineTo(cx+9,cy);ctx.moveTo(cx,cy-9);ctx.lineTo(cx,cy-3);ctx.moveTo(cx,cy+3);ctx.lineTo(cx,cy+9);ctx.stroke()}
  // selección y cursor
  if(selStar&&proj(selStar.gx,selStar.gy,selStar.gz)){const x=_p[0],y=_p[1],pl=1+.1*Math.sin(now/220);
    ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.beginPath();for(const [a,b] of[[-1,-1],[1,-1],[1,1],[-1,1]]){const s=11*pl;ctx.moveTo(x+a*s,y+b*(s-5));ctx.lineTo(x+a*s,y+b*s);ctx.lineTo(x+a*(s-5),y+b*s)}ctx.stroke();ctx.restore();
    if(!selStar.anchor&&!labels.some(l=>sameStar(l[1],selStar)))labelAt(x,y,starName(selStar),'#fff',10)}
  if(hoverStar&&!sameStar(hoverStar,selStar)&&proj(hoverStar.gx,hoverStar.gy,hoverStar.gz)){ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(_p[0],_p[1],8,0,7);ctx.stroke()}
  // nave (símbolo de navegación; a escala real sería 10⁻¹³ píxeles)
  shipHit=null;const lab=D.ship.n||SHIPS[D.ship.d].n;
  if(proj(P0[0],P0[1],P0[2])&&_p[0]>16&&_p[0]<W-16&&_p[1]>16&&_p[1]<H-16){
    const x=_p[0],y=_p[1],age=(now-ping)/1000;
    if(age<2.4)for(let k=0;k<2;k++){const a=age-k*.35;if(a<0||a>1.8)continue;ctx.strokeStyle=`rgba(120,220,255,${(1-a/1.8)*.8})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,8+a*60,0,7);ctx.stroke()}
    let ang=-Math.PI/2;if(pilot&&pilot.dir){if(proj(P0[0]+pilot.dir[0],P0[1]+pilot.dir[1],P0[2]+pilot.dir[2]))ang=Math.atan2(_p[1]-y,_p[0]-x)}else if(travel&&travel.leg){const L=travel.leg;if(proj(L.to.gx,L.to.gy,L.to.gz))ang=Math.atan2(_p[1]-y,_p[0]-x)}else if(selStar&&!sameStar(selStar,ship)&&proj(selStar.gx,selStar.gy,selStar.gz))ang=Math.atan2(_p[1]-y,_p[0]-x);
    ctx.save();ctx.translate(x,y);ctx.strokeStyle='rgba(120,220,255,.6)';ctx.setLineDash([2,3]);ctx.rotate(now/1500);ctx.beginPath();ctx.arc(0,0,11,0,7);ctx.stroke();ctx.restore();
    ctx.save();ctx.translate(x,y);ctx.rotate(ang+Math.PI/2);ctx.fillStyle='#78dcff';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(5.5,6);ctx.lineTo(0,3);ctx.lineTo(-5.5,6);ctx.closePath();ctx.fill();ctx.restore();
    ctx.fillStyle='rgba(120,220,255,.95)';ctx.font='9px ui-monospace,Menlo,monospace';ctx.textAlign='center';ctx.fillText(spaced(lab.toUpperCase()),x,y+22);shipHit={x,y,r:18};
  }else{
    const dx=P0[0]-fx,dy=P0[1]-fy,dz=P0[2]-fz,x1=dx*c.cy-dy*c.sy,y1=dx*c.sy+dy*c.cy,Z=y1*c.sp+dz*c.cp;let vx=x1,vy=-Z;const vl=Math.hypot(vx,vy)||1;vx/=vl;vy/=vl;
    const mx=W/2-50,my=H/2-90,k=Math.min(mx/Math.max(1e-6,Math.abs(vx)),my/Math.max(1e-6,Math.abs(vy))),ex=W/2+vx*k,ey=H/2+vy*k,pu=1+.1*Math.sin(now/260);
    ctx.save();ctx.translate(ex,ey);ctx.rotate(Math.atan2(vy,vx));ctx.fillStyle='rgba(120,220,255,.9)';ctx.beginPath();ctx.moveTo(14*pu,0);ctx.lineTo(-7,8);ctx.lineTo(-3,0);ctx.lineTo(-7,-8);ctx.closePath();ctx.fill();ctx.restore();
    ctx.fillStyle='rgba(120,220,255,.95)';ctx.font='9px ui-monospace,Menlo,monospace';ctx.textAlign=vx>.3?'right':vx<-.3?'left':'center';ctx.fillText(spaced(`${lab} · ${fmtLen(Math.hypot(dx,dy,dz))}`.toUpperCase()),ex-vx*22,ey-vy*22);shipHit={x:ex,y:ey,r:26};
  }
  if(travel)drawStreaks(travel.int*.8,now/1600);
  ctx.letterSpacing='0px';
}
