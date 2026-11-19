(()=>{'use strict';
/* ═════════ Constantes y utilidades ═════════ */
const SEC=240,HALF=120,SC=8,NC=30,MAXD=18,MAXHEAD=10,LY_AU=63241.077,AU_KM=149597870.7;
const DETAIL='0123456789ABCDEFGHIJKLMNOPQ'; // 27 símbolos = 3×3×3 celdas por nivel
const LS_KEY='adastra.explorer.v3';
const $=s=>document.querySelector(s)||(typeof POP!=='undefined'&&POP&&!POP.closed?POP.document.querySelector(s):null);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const cap=s=>s[0].toUpperCase()+s.slice(1);
function mix(h){h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;return h>>>0}
function hash(...v){let h=0x12345678;for(const n of v){h=mix(h^(n|0));h=(h+0x9e3779b9)|0}return h>>>0}
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function vn3(x,y,z,salt){const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),fx=x-xi,fy=y-yi,fz=z-zi,
  u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz),r=(i,j,k)=>hash(i,j,k,salt)/4294967296;
  return lerp(lerp(lerp(r(xi,yi,zi),r(xi+1,yi,zi),u),lerp(r(xi,yi+1,zi),r(xi+1,yi+1,zi),u),v),
              lerp(lerp(r(xi,yi,zi+1),r(xi+1,yi,zi+1),u),lerp(r(xi,yi+1,zi+1),r(xi+1,yi+1,zi+1),u),v),w)}
function eq2ecl(raD,decD,d){const a=raD*Math.PI/180,de=decD*Math.PI/180,e=23.4393*Math.PI/180,x=d*Math.cos(de)*Math.cos(a),y=d*Math.cos(de)*Math.sin(a),z=d*Math.sin(de);
  return[x,y*Math.cos(e)+z*Math.sin(e),-y*Math.sin(e)+z*Math.cos(e)]}
const NGP=eq2ecl(192.8595,27.1283,1); // polo norte galáctico en eclíptica J2000
function density(gx,gy,gz){const h=gx*NGP[0]+gy*NGP[1]+gz*NGP[2],f=Math.exp(-Math.abs(h)/350)+.015,
  n=.6*vn3(gx/150,gy/150,gz/150,11)+.4*vn3(gx/45,gy/45,gz/45,23);return clamp(f*(.4+n),0,1)}
const lambda=d=>1.6*d*d;
function fmtLen(ly){
  if(ly>=1000)return (ly/1000).toFixed(2)+' kal';
  if(ly>=1)return ly.toFixed(ly>=100?0:2)+' al';
  const au=ly*LY_AU; if(au>=.1)return au.toFixed(au>=100?0:2)+' UA';
  const km=au*AU_KM; return km>=1e4?(km/1e6).toFixed(2)+' M km':km.toFixed(0)+' km';
}
const fmtNum=n=>n>=1e9?(n/1e9).toFixed(1)+' mil M':n>=1e6?(n/1e6).toFixed(1)+' M':n>=1e3?(n/1e3).toFixed(1)+' mil':Math.round(n).toString();
const DEPTH_NAMES=['Sector','Cubo','Bloque','Zona','Vecindad','Bolsillo','Pozo','Celda','Parcela','Punto','Mota','Grano','Átomo','Quark'];

/* ═════════ Semillas ═════════
   Semilla = CABECERA-DETALLE.  Cabecera: letras A-Z estilo columnas de hoja de cálculo (A…Z, AA, AB, AC…, AAA…): numera
   sectores cúbicos de 240 al en capas concéntricas alrededor del Sol (A = sector del Sol) → el mapa es infinito y la
   cabecera crece con la distancia.  Detalle: cada carácter (0-9, A-Q) elige 1 de 3×3×3 subceldas. */
const cube=n=>n*n*n;
function sToXYZ(s){
  if(s===0)return[0,0,0];
  let k=Math.max(1,Math.floor((Math.cbrt(s)-1)/2));while(cube(2*k+1)<=s)k++;while(k>1&&cube(2*k-1)>s)k--;
  let t=s-cube(2*k-1);const n1=(2*k+1)**2,m=(2*k-1)*(2*k+1),m3=(2*k-1)**2,o=2*k-1,w=2*k+1;
  if(t<n1)return[k,t%w-k,Math.floor(t/w)-k];t-=n1;
  if(t<n1)return[-k,t%w-k,Math.floor(t/w)-k];t-=n1;
  if(t<m)return[t%o-(k-1),k,Math.floor(t/o)-k];t-=m;
  if(t<m)return[t%o-(k-1),-k,Math.floor(t/o)-k];t-=m;
  if(t<m3)return[t%o-(k-1),Math.floor(t/o)-(k-1),k];t-=m3;
  return[t%o-(k-1),Math.floor(t/o)-(k-1),-k];
}
function xyzToS(x,y,z){
  const k=Math.max(Math.abs(x),Math.abs(y),Math.abs(z));if(!k)return 0;
  const base=cube(2*k-1),n1=(2*k+1)**2,m=(2*k-1)*(2*k+1),m3=(2*k-1)**2,o=2*k-1,w=2*k+1;
  if(x===k)return base+(z+k)*w+(y+k);if(x===-k)return base+n1+(z+k)*w+(y+k);
  if(y===k)return base+2*n1+(z+k)*o+(x+k-1);if(y===-k)return base+2*n1+m+(z+k)*o+(x+k-1);
  if(z===k)return base+2*n1+2*m+(y+k-1)*o+(x+k-1);return base+2*n1+2*m+m3+(y+k-1)*o+(x+k-1);
}
function sToHead(s){let n=s+1,h='';while(n>0){n--;h=String.fromCharCode(65+n%26)+h;n=Math.floor(n/26)}return h}
function headToS(h){let n=0;for(const c of h)n=n*26+(c.charCodeAt(0)-64);return n-1}
function mkLoc(head,path){const[sx,sy,sz]=sToXYZ(headToS(head));return{head,path,sx,sy,sz}}
function mkLocXYZ(sx,sy,sz,path){return{head:sToHead(xyzToS(sx,sy,sz)),path,sx,sy,sz}}
const seedStr=l=>l.head+(l.path?'-'+l.path:'');
function parseSeed(s){
  s=(s||'').trim().toUpperCase().replace(/[\s_.·]/g,'');
  let head,path;
  if(s.includes('-')){const i=s.indexOf('-');head=s.slice(0,i);path=s.slice(i+1).replace(/-/g,'')}
  else{const m=s.match(/^([A-Z]*)(.*)$/);head=m[1];path=m[2];if(!head){head='A'}}
  if(!/^[A-Z]{1,10}$/.test(head))return{err:'La cabecera son 1-10 letras A-Z (A, B… Z, AA, AB…).'};
  if(!/^[0-9A-Q]*$/.test(path))return{err:'El detalle solo admite 0-9 y A-Q (27 celdas por nivel). Separa cabecera y detalle con «-».'};
  let trunc=false;if(path.length>MAXD){path=path.slice(0,MAXD);trunc=true}
  return{loc:mkLoc(head,path),trunc};
}
function cellOf(l){
  let s=SEC,x=-HALF,y=-HALF,z=-HALF;
  for(const ch of l.path){const i=DETAIL.indexOf(ch);s/=3;x+=(i%3)*s;y+=(Math.floor(i/3)%3)*s;z+=Math.floor(i/9)*s}
  return{sx:l.sx,sy:l.sy,sz:l.sz,head:l.head,x0:x,y0:y,z0:z,size:s,depth:l.path.length,path:l.path};
}
function posToLoc(sx,sy,sz,lx,ly,lz,depth){
  const w=(v,n)=>{while(v>=HALF){v-=SEC;n++}while(v<-HALF){v+=SEC;n--}return[v,n]};
  [lx,sx]=w(lx,sx);[ly,sy]=w(ly,sy);[lz,sz]=w(lz,sz);
  let u=(lx+HALF)/SEC,v=(ly+HALF)/SEC,q=(lz+HALF)/SEC,p='';
  for(let i=0;i<depth;i++){u*=3;v*=3;q*=3;const a=clamp(Math.floor(u),0,2),b=clamp(Math.floor(v),0,2),c=clamp(Math.floor(q),0,2);u-=a;v-=b;q-=c;p+=DETAIL[a+3*b+9*c]}
  return mkLocXYZ(sx,sy,sz,p);
}
function globalToLoc(gx,gy,gz,depth){const sx=Math.floor((gx+HALF)/SEC),sy=Math.floor((gy+HALF)/SEC),sz=Math.floor((gz+HALF)/SEC);return posToLoc(sx,sy,sz,gx-sx*SEC,gy-sy*SEC,gz-sz*SEC,depth)}
const cellCenter=c=>[c.x0+c.size/2,c.y0+c.size/2,c.z0+c.size/2];
const cellCenterG=c=>{const m=cellCenter(c);return[c.sx*SEC+m[0],c.sy*SEC+m[1],c.sz*SEC+m[2]]};

/* ═════════ Nombres ═════════ */
const SYL=['ka','ve','lo','mi','ra','tu','an','el','or','sha','zen','dor','nix','pha','lum','tor','vi','cae','ur','as','be','yn','th','qui'];
function genName(h){const r=rng(h^0x77aa);const n=2+(r()*2|0);let s='';for(let i=0;i<n;i++)s+=SYL[r()*SYL.length|0];return cap(s)}
const regionName=l=>genName(hash(l.sx,l.sy,l.sz,...[...l.path].map(c=>DETAIL.indexOf(c)+1)));

/* ═════════ Estrellas ═════════ */
const CLS=[
 {k:'M',w:.46,lab:'Enana roja',T:[2400,3700],m:[.1,.5],L:[.0005,.07],R:[.15,.6],col:'#ff8a5c'},
 {k:'K',w:.20,lab:'Enana naranja',T:[3900,5200],m:[.55,.85],L:[.1,.5],R:[.7,.9],col:'#ffb067'},
 {k:'G',w:.12,lab:'Enana amarilla',T:[5300,6000],m:[.85,1.1],L:[.6,1.5],R:[.9,1.1],col:'#ffe28a'},
 {k:'F',w:.08,lab:'Estrella blanco-amarilla',T:[6100,7400],m:[1.1,1.5],L:[2,6],R:[1.2,1.6],col:'#fff6d5'},
 {k:'WD',w:.05,lab:'Enana blanca',T:[8000,20000],m:[.5,.9],L:[.001,.05],R:[.011,.015],col:'#cfe0ff'},
 {k:'A',w:.04,lab:'Estrella blanca',T:[7600,10000],m:[1.6,2.4],L:[8,40],R:[1.7,2.5],col:'#dfe8ff'},
 {k:'RG',w:.03,lab:'Gigante roja',T:[3500,4800],m:[1,2],L:[100,1000],R:[20,60],col:'#ff9560'},
 {k:'B',w:.015,lab:'Estrella azul',T:[11000,25000],m:[3,10],L:[100,10000],R:[3,7],col:'#a9c4ff'},
 {k:'O',w:.005,lab:'Supergigante azul',T:[30000,45000],m:[16,40],L:[3e4,1e5],R:[7,12],col:'#8fb2ff'}];
function genProps(h){
  const r=rng(h^0xabcdef);let u=r(),c=CLS[0],ci=0;for(let i=0;i<CLS.length;i++){if(u<CLS[i].w){c=CLS[i];ci=i;break}u-=CLS[i].w}
  const f=a=>lerp(a[0],a[1],r());
  return{k:c.k,ci,lab:c.lab,T:Math.round(f(c.T)),mass:f(c.m),lum:c.L[0]*Math.pow(c.L[1]/c.L[0],r()),rad:f(c.R),col:c.col};
}
const MONO='#cdd7ea';
/* Anclas: estrellas del vecindario del mapa de la película, en eclíptica J2000 centrada en el Sol (RA/Dec/distancia reales, al) */
const ANCH=[
 {id:'sol',name:'Sol',pos:[0,0,0],props:{k:'G',ci:2,lab:'Enana amarilla (G2V)',T:5772,mass:1,lum:1,rad:1,col:'#ffe28a'},blurb:'Nuestro sistema. En la historia, el Astrófago lo está apagando.',
  planets:[
   {name:'Mercurio',a:.387,r:.38,kind:'barren',moons:0},{name:'Venus',a:.723,r:.95,kind:'desert',moons:0},
   {name:'Tierra',a:1,r:1,kind:'ocean',moons:1,hz:1},{name:'Marte',a:1.524,r:.53,kind:'barren',moons:2},
   {name:'Júpiter',a:5.2,r:11.2,kind:'gas',moons:95},{name:'Saturno',a:9.58,r:9.45,kind:'gas',moons:146,ring:1},
   {name:'Urano',a:19.2,r:4,kind:'icegiant',moons:28},{name:'Neptuno',a:30.07,r:3.88,kind:'icegiant',moons:16}],
  belts:[[2.2,3.2],[40,50]]},
 {id:'acen',name:'Alfa Centauri A',pos:eq2ecl(219.90,-60.834,4.37),props:{k:'G',ci:2,lab:'Enana amarilla (G2V)',T:5790,mass:1.1,lum:1.52,rad:1.22,col:'#ffe28a'},blurb:'El vecino más cercano (4,4 al). Planetas generados proceduralmente.',proc:1},
 {id:'barnard',name:'Estrella de Barnard',pos:eq2ecl(269.45,4.693,5.96),props:{k:'M',ci:0,lab:'Enana roja (M4V)',T:3270,mass:.16,lum:.0034,rad:.19,col:'#ff8a5c'},blurb:'Enana roja con gran movimiento propio.',proc:1},
 {id:'sirius',name:'Sirius A',pos:eq2ecl(101.287,-16.716,8.6),props:{k:'A',ci:5,lab:'Estrella blanca (A1V)',T:9940,mass:2.06,lum:25.4,rad:1.71,col:'#dfe8ff'},blurb:'La más brillante del cielo nocturno, con una enana blanca compañera.',proc:1},
 {id:'eeri',name:'Epsilon Eridani',pos:eq2ecl(53.233,-9.458,10.5),props:{k:'K',ci:1,lab:'Enana naranja (K2V)',T:5084,mass:.82,lum:.34,rad:.74,col:'#ffb067'},blurb:'Joven, con dos cinturones de escombros. En la historia, el Astrófago pasó por aquí rumbo al Sol.',
  planets:[{name:'Epsilon Eridani b',a:3.4,r:11,kind:'gas',moons:0,note:'Candidato real, aún en disputa.'}],belts:[[2.5,3.5],[20,25]]},
 {id:'procyon',name:'Procyon A',pos:eq2ecl(114.825,5.225,11.46),props:{k:'F',ci:3,lab:'Estrella blanco-amarilla (F5IV)',T:6530,mass:1.5,lum:6.9,rad:2.05,col:'#fff6d5'},blurb:'Brillante vecina con una enana blanca compañera.',proc:1},
 {id:'tceti',name:'Tau Ceti',pos:eq2ecl(26.017,-15.937,11.91),props:{k:'G',ci:2,lab:'Enana amarilla (G8.5V)',T:5344,mass:.78,lum:.52,rad:.79,col:'#ffe28a'},blurb:'Inmune al Astrófago: destino de la misión Hail Mary.',proc:1,
  planets:[{name:'Adrian',a:.78,r:1.1,kind:'temperate',moons:0,hz:1,fiction:1,note:'Planeta de la historia donde llega la Hail Mary (ficción).'}]},
 {id:'40eri',name:'40 Eridani A',pos:eq2ecl(63.817,-7.653,16.26),props:{k:'K',ci:1,lab:'Enana naranja (K1V)',T:5100,mass:.84,lum:.44,rad:.81,col:'#ffb067'},blurb:'Sistema triple; hogar de Rocky y los erideanos en la historia.',proc:1,
  planets:[{name:'Erid',a:.7,r:1.15,kind:'temperate',moons:0,hz:1,fiction:1,note:'Mundo natal de Rocky (ficción).'}]},
 {id:'vega',name:'Vega',pos:eq2ecl(279.234,38.784,25.04),props:{k:'A',ci:5,lab:'Estrella blanca (A0V)',T:9602,mass:2.1,lum:40,rad:2.36,col:'#dfe8ff'},blurb:'Una de las estrellas más brillantes del cielo del norte.',proc:1}];
const ANCHSTARS=ANCH.map(a=>({anchor:a,sx:0,sy:0,sz:0,lx:a.pos[0],ly:a.pos[1],lz:a.pos[2],h:hash(a.id.length,a.id.charCodeAt(0),a.id.charCodeAt(1)),P:a.props}));
const A_BY=id=>ANCHSTARS.find(s=>s.anchor.id===id);
const same=(a,b)=>!!(a&&b&&a.lx===b.lx&&a.ly===b.ly&&a.lz===b.lz&&a.sx===b.sx&&a.sy===b.sy&&a.sz===b.sz);
const starName=st=>st.anchor?st.anchor.name:st.point?st.name:genName(st.h);
const starLoc=(st,d=14)=>posToLoc(st.sx,st.sy,st.sz,st.lx,st.ly,st.lz,d);
const starG=st=>[st.sx*SEC+st.lx,st.sy*SEC+st.ly,st.sz*SEC+st.lz];

function cellStars(sx,sy,sz,i,j,k,out){
  const h=hash(sx,sy,sz,i|(j<<5)|(k<<10),77),r=rng(h);
  const gx=sx*SEC+(i+.5)*SC-HALF,gy=sy*SEC+(j+.5)*SC-HALF,gz=sz*SEC+(k+.5)*SC-HALF;
  let n=Math.floor(lambda(density(gx,gy,gz))+r());if(n>4)n=4;
  for(let q=0;q<n;q++){
    const lx=-HALF+(i+r())*SC,ly=-HALF+(j+r())*SC,lz=-HALF+(k+r())*SC;
    if(sx===0&&sy===0&&sz===0&&Math.abs(lx)<40&&Math.abs(ly)<40&&Math.abs(lz)<40){let bad=false;for(const a of ANCH)if(Math.hypot(a.pos[0]-lx,a.pos[1]-ly,a.pos[2]-lz)<.8){bad=true;break}if(bad)continue}
    const sh=hash(h,q+1);out.push({sx,sy,sz,lx,ly,lz,gx:sx*SEC+lx,gy:sy*SEC+ly,gz:sz*SEC+lz,h:sh,P:genProps(sh)});
  }
}
/* estrellas dentro de la celda (más un margen) */
function starsIn(c,pad=0,limit=45000){
  const lo=[c.x0-pad,c.y0-pad,c.z0-pad].map(v=>Math.max(-HALF,v)),hi=[c.x0+c.size+pad,c.y0+c.size+pad,c.z0+c.size+pad].map(v=>Math.min(HALF-1e-9,v));
  const ir=lo.map((v,a)=>[clamp(Math.floor((v+HALF)/SC),0,NC-1),clamp(Math.floor((hi[a]+HALF)/SC),0,NC-1)]);
  if((ir[0][1]-ir[0][0]+1)*(ir[1][1]-ir[1][0]+1)*(ir[2][1]-ir[2][0]+1)>limit)return[];
  const raw=[],out=[];
  for(let k=ir[2][0];k<=ir[2][1];k++)for(let j=ir[1][0];j<=ir[1][1];j++)for(let i=ir[0][0];i<=ir[0][1];i++)cellStars(c.sx,c.sy,c.sz,i,j,k,raw);
  if(c.sx===0&&c.sy===0&&c.sz===0)for(const a of ANCHSTARS)raw.push(a);
  for(const s of raw){
    if(s.lx<lo[0]||s.lx>hi[0]||s.ly<lo[1]||s.ly>hi[1]||s.lz<lo[2]||s.lz>hi[2])continue;
    s.out=!(s.lx>=c.x0&&s.lx<=c.x0+c.size&&s.ly>=c.y0&&s.ly<=c.y0+c.size&&s.lz>=c.z0&&s.lz<=c.z0+c.size);
    out.push(s);
  }
  return out;
}
function starInCell(c){const e=c.size*.02;return starsIn({...c,x0:c.x0-e,y0:c.y0-e,z0:c.z0-e,size:c.size+2*e},0,500)[0]||null}
function nearestStar(c){
  const m=cellCenter(c);let best=null,bd=1e18;
  for(const R of[2,6,12]){
    const ci=[0,1,2].map(a=>clamp(Math.floor((m[a]+HALF)/SC),0,NC-1)),raw=[];
    for(let k=Math.max(0,ci[2]-R);k<=Math.min(NC-1,ci[2]+R);k++)for(let j=Math.max(0,ci[1]-R);j<=Math.min(NC-1,ci[1]+R);j++)for(let i=Math.max(0,ci[0]-R);i<=Math.min(NC-1,ci[0]+R);i++)cellStars(c.sx,c.sy,c.sz,i,j,k,raw);
    if(c.sx===0&&c.sy===0&&c.sz===0)raw.push(...ANCHSTARS);
    for(const s of raw){const d=Math.hypot(s.lx-m[0],s.ly-m[1],s.lz-m[2]);if(d<bd){bd=d;best=s}}
    if(best&&bd<R*SC*.9)break;
  }
  return best?{st:best,d:bd}:null;
}
const listCache=new Map();
function cellList(c){
  const key=seedStr({head:c.head,path:c.path});if(listCache.has(key))return listCache.get(key);
  const L=starsIn(c,c.size<128?c.size*.5:0);
  listCache.set(key,L);if(listCache.size>10)listCache.delete(listCache.keys().next().value);return L;
}

/* ═════════ Sistemas planetarios ═════════ */
const KIND={lava:['Mundo de lava','#ff6a3d'],desert:['Mundo desértico','#d9a35b'],ocean:['Mundo oceánico','#3f8fe0'],temperate:['Rocoso templado','#58a96a'],
  ice:['Mundo helado','#a9d6e8'],frozen:['Mundo congelado','#c8d4e0'],barren:['Rocoso estéril','#9b9186'],gas:['Gigante gaseoso','#d8b48a'],icegiant:['Gigante helado','#6fb6d8']};
const ROMAN='bcdefghijk';
function genSystem(st){
  const P=st.P,a0=st.anchor,name=starName(st),r=rng(st.h^0x5eed),sq=Math.sqrt(P.lum);
  const frost=2.7*sq,hz=[.95*sq,1.4*sq];let planets=[],belts=[];
  if(a0&&!a0.proc){planets=a0.planets.map(p=>({...p}));belts=(a0.belts||[]).slice()}
  else{
    let n=P.k==='O'?0:P.k==='B'?(r()<.6?0:1+(r()*2|0)):P.k==='WD'||P.k==='RG'?(r()*4|0):(r()*9|0);
    let a=Math.max(.03,.13*sq)*(.5+r());
    for(let i=0;i<n&&a<90*Math.max(1,sq);i++){
      a*=1.35+r()*.75;const T=255*Math.pow(P.lum,.25)/Math.sqrt(a);let kind,rad;const hotg=a<frost*.5&&r()<.06;
      if(hotg||a>=frost*.9&&r()<.6){if(!hotg&&r()<.4){kind='icegiant';rad=2.5+r()*2.5}else{kind='gas';rad=6+r()*7}}
      else{rad=.3+Math.pow(r(),1.6)*1.7;
        if(T>700)kind='lava';else if(T>340)kind='desert';else if(T>=245){kind=(rad>.75&&rad<1.7&&r()<.5)?'ocean':(r()<.5?'temperate':'barren')}
        else if(T>170)kind=r()<.5?'ice':'barren';else kind='frozen'}
      planets.push({name:'',a,r:rad,kind,moons:kind==='gas'?(r()*7|0):kind==='icegiant'?(r()*4|0):(r()<.3?(r()*2|0)+1:0),ring:kind==='gas'&&r()<.25?1:0});
    }
    if(a0&&a0.planets)for(const c of a0.planets){planets=planets.filter(p=>Math.abs(p.a-c.a)/c.a>.3);planets.push({...c})}
    if(r()<.5&&P.k!=='O')belts.push([frost*(.55+.5*r()),frost*(.55+.5*r())+.4*sq+.2]);
  }
  planets.sort((x,y)=>x.a-y.a);
  planets.forEach((p,i)=>{
    p.name=p.name||`${name} ${ROMAN[i]||i}`;p.T=Math.round(255*Math.pow(P.lum,.25)/Math.sqrt(p.a));p.period=365.25*Math.sqrt(p.a**3/P.mass);
    const gas=p.kind==='gas'||p.kind==='icegiant';p.mass=gas?Math.pow(p.r,2.1)*(p.kind==='gas'?1.2:.9):Math.pow(p.r,3.2);p.g=p.mass/(p.r*p.r);
    if(p.hz==null)p.hz=(!gas&&p.a>=hz[0]&&p.a<=hz[1]&&p.r>=.7&&p.r<=1.7&&p.T>=240&&p.T<=320)?1:0;
    p.phase=hash(st.h,i)/4294967296*6.283;
  });
  return{star:st,name,P,planets,belts,hz,frost};
}

/* ═════════ Nave 3D (malla de caras con sombreado plano; proa = +Y, arriba = +Z) ═════════ */
function nrm(vs){let x=0,y=0,z=0;for(let i=0;i<vs.length;i++){const a=vs[i],b=vs[(i+1)%vs.length];x+=(a[1]-b[1])*(a[2]+b[2]);y+=(a[2]-b[2])*(a[0]+b[0]);z+=(a[0]-b[0])*(a[1]+b[1])}const l=Math.hypot(x,y,z)||1;return[x/l,y/l,z/l]}
function mk(v,k,c){const n=nrm(v),g=[0,0,0];for(const p of v){g[0]+=p[0]/v.length;g[1]+=p[1]/v.length;g[2]+=p[2]/v.length}
  if(n[0]*(g[0]-c[0])+n[1]*(g[1]-c[1])+n[2]*(g[2]-c[2])<0){n[0]*=-1;n[1]*=-1;n[2]*=-1}return{v,k,n,g}}
function cylF(ax,c,len,rb,rf,seg,k){
  const F=[],M=(u,v,w)=>ax==='y'?[c[0]+u,c[1]+w,c[2]+v]:ax==='z'?[c[0]+u,c[1]+v,c[2]+w]:[c[0]+w,c[1]+u,c[2]+v],w0=-len/2,w1=len/2;
  const P=(a,w,r)=>M(Math.cos(a)*r,Math.sin(a)*r,w);
  for(let i=0;i<seg;i++){const a=i/seg*6.2832,b=(i+1)/seg*6.2832;
    F.push(mk([P(a,w0,rb),P(b,w0,rb),P(b,w1,rf),P(a,w1,rf)],k,M(0,0,0)));}
  const cap=(w,r)=>{const pts=[];for(let i=0;i<seg;i++)pts.push(P(i/seg*6.2832,w,r));return mk(pts,k,c)};
  if(rb>0)F.push(cap(w0,rb));if(rf>0)F.push(cap(w1,rf));
  // la normal de los lados se orienta respecto al eje (centro del cilindro)
  return F;
}
function prismF(pts,plane,t0,t1,k){
  const M=(a,b,t)=>plane==='xy'?[a,b,t]:plane==='yz'?[t,a,b]:[a,t,b],n=pts.length;let ca=0,cb=0;pts.forEach(p=>{ca+=p[0]/n;cb+=p[1]/n});
  const cen=M(ca,cb,(t0+t1)/2),F=[mk(pts.map(p=>M(p[0],p[1],t1)),k,cen),mk(pts.map(p=>M(p[0],p[1],t0)),k,cen)];
  for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n];F.push(mk([M(a[0],a[1],t0),M(b[0],b[1],t0),M(b[0],b[1],t1),M(a[0],a[1],t1)],k,cen))}
  return F;
}
const boxF=(cx,cy,cz,sx,sy,sz,k)=>prismF([[cx-sx/2,cy-sy/2],[cx+sx/2,cy-sy/2],[cx+sx/2,cy+sy/2],[cx-sx/2,cy+sy/2]],'xy',cz-sz/2,cz+sz/2,k);
function mirX(F){return F.map(f=>{const v=f.v.map(p=>[-p[0],p[1],p[2]]);return{v,k:f.k,n:[-f.n[0],f.n[1],f.n[2]],g:[-f.g[0],f.g[1],f.g[2]]}})}
function ringF(R,r,hh,seg,cy,k){const F=[];
  for(let i=0;i<seg;i++){const a=i/seg*6.2832,b=(i+1)/seg*6.2832,m=(a+b)/2,Ri=R-r/2,Ro=R+r/2,y0=cy-hh/2,y1=cy+hh/2,cs=[R*Math.cos(m),cy,R*Math.sin(m)];
    const q=(rr,aa,y)=>[rr*Math.cos(aa),y,rr*Math.sin(aa)];
    F.push(mk([q(Ro,a,y0),q(Ro,b,y0),q(Ro,b,y1),q(Ro,a,y1)],k,cs),mk([q(Ri,a,y0),q(Ri,b,y0),q(Ri,b,y1),q(Ri,a,y1)],k,cs),
           mk([q(Ri,a,y1),q(Ro,a,y1),q(Ro,b,y1),q(Ri,b,y1)],k,cs),mk([q(Ri,a,y0),q(Ro,a,y0),q(Ro,b,y0),q(Ri,b,y0)],k,cs))}
  return F}
const both=F=>F.concat(mirX(F));
const SHIPS={
 corbeta:{n:'Corbeta',d:'Ágil y versátil, para explorar sin compromisos.',vel:7,alc:6,car:3,tri:6,
  m:()=>({faces:[...cylF('y',[0,-.1,0],1.3,.24,.24,8,1),...cylF('y',[0,.85,0],.6,.24,0,8,1),...cylF('y',[0,-.82,0],.16,.2,.17,8,'w'),
    ...both(prismF([[.2,.25],[.95,-.55],[.95,-.75],[.2,-.5]],'xy',-.035,.035,2)),...both(prismF([[-.4,.2],[-.8,.65],[-.92,.65],[-.78,.2]],'yz',.19,.22,2)).slice(0,0),
    ...prismF([[-.45,.22],[-.8,.68],[-.92,.68],[-.78,.22]],'yz',-.02,.02,2)],fl:[[0,-.95,0,.2]]})},
 carguero:{n:'Carguero',d:'Gran bodega para misiones de suministro.',vel:3,alc:6,car:10,tri:12,
  m:()=>({faces:[...boxF(0,0,0,.6,1.5,.5,1),...boxF(.5,-.1,0,.36,1.0,.4,2),...boxF(-.5,-.1,0,.36,1.0,.4,2),...boxF(0,.88,.05,.42,.3,.34,2),
    ...cylF('y',[.18,-.85,0],.24,.13,.11,8,'w'),...cylF('y',[-.18,-.85,0],.24,.13,.11,8,'w')],fl:[[.18,-.98,0,.16],[-.18,-.98,0,.16]]})},
 sonda:{n:'Sonda',d:'Autónoma y ligera; ideal para cartografiar.',vel:5,alc:9,car:1,tri:0,
  m:()=>({faces:[...cylF('y',[0,0,0],1.0,.2,.2,8,1),...cylF('y',[0,.62,0],.22,.07,.58,12,2),...cylF('y',[0,-.9,0],.6,.03,.03,5,'w'),
    ...boxF(.65,-.1,0,.8,.3,.04,2),...boxF(-.65,-.1,0,.8,.3,.04,2)],fl:[[0,-.55,0,.12]]})},
 velero:{n:'Velero solar',d:'Velas de luz: lento pero casi sin combustible.',vel:2,alc:10,car:2,tri:2,
  m:()=>({faces:[...cylF('y',[0,0,0],1.5,.04,.04,6,'w'),...prismF([[-.95,0],[0,.95],[.95,0],[0,-.95]],'xz',.3,.33,2),
    ...prismF([[-.6,0],[0,.6],[.6,0],[0,-.6]],'xz',-.2,-.17,1),...cylF('y',[0,-.8,0],.3,.14,.1,8,'w')],fl:[[0,-.98,0,.1]]})},
 generacional:{n:'Generacional',d:'Una ciudad en órbita propia para viajes larguísimos.',vel:2,alc:10,car:8,tri:200,
  m:()=>({faces:[...cylF('y',[0,0,0],1.7,.13,.13,8,1),...cylF('y',[0,1.05,0],.4,.13,0,8,1),...ringF(.78,.26,.2,20,.12,2),
    ...boxF(.4,.12,0,.8,.05,.05,1),...boxF(-.4,.12,0,.8,.05,.05,1),...boxF(0,.12,.4,.05,.05,.8,1),...boxF(0,.12,-.4,.05,.05,.8,1),
    ...cylF('y',[0,-.95,0],.2,.2,.16,8,'w')],fl:[[0,-1.06,0,.24]]})},
 caza:{n:'Caza',d:'Rápido y compacto; poca autonomía.',vel:10,alc:3,car:1,tri:1,
  m:()=>({faces:[...cylF('y',[0,-.1,0],1.3,.16,.16,6,1),...cylF('y',[0,.9,0],.7,.16,0,6,1),...both(prismF([[.1,.6],[1,-.7],[1,-.85],[.1,-.55]],'xy',-.03,.03,1)),
    ...boxF(0,.35,.15,.18,.4,.1,2),...prismF([[-.5,.15],[-.85,.6],[-.95,.6],[-.8,.15]],'yz',.2,.23,2),...prismF([[-.5,.15],[-.85,.6],[-.95,.6],[-.8,.15]],'yz',-.23,-.2,2),
    ...cylF('y',[.1,-.8,0],.2,.1,.12,8,'w'),...cylF('y',[-.1,-.8,0],.2,.1,.12,8,'w')],fl:[[.1,-.92,0,.14],[-.1,-.92,0,.14]]})},
 carguero2:{n:'Expedición',d:'Nave de investigación con cúpula y cuatro motores.',vel:5,alc:7,car:5,tri:8,
  m:()=>({faces:[...cylF('y',[0,0,0],1.3,.38,.38,10,1),...cylF('y',[0,.85,0],.4,.38,.1,10,2),...boxF(.62,-.15,0,.3,.8,.3,2),...boxF(-.62,-.15,0,.3,.8,.3,2),
    ...cylF('y',[.2,-.8,.2],.25,.1,.12,8,'w'),...cylF('y',[-.2,-.8,.2],.25,.1,.12,8,'w'),...cylF('y',[.2,-.8,-.2],.25,.1,.12,8,'w'),...cylF('y',[-.2,-.8,-.2],.25,.1,.12,8,'w')],
    fl:[[.2,-.94,.2,.12],[-.2,-.94,.2,.12],[.2,-.94,-.2,.12],[-.2,-.94,-.2,.12]]})},
 plataforma:{n:'Plataforma',d:'Base móvil con paneles y torre de comunicaciones.',vel:1,alc:8,car:9,tri:30,
  m:()=>({faces:[...boxF(0,0,0,.8,.8,.5,1),...boxF(.95,0,0,.9,.4,.04,2),...boxF(-.95,0,0,.9,.4,.04,2),...cylF('z',[0,0,.55],.6,.04,.04,6,'w'),...cylF('z',[0,0,.92],.12,.02,.32,12,2),
    ...boxF(0,-.5,0,.3,.2,.3,'w')],fl:[[0,-.65,0,.2]]})}};
const DEF_SHIP={d:'corbeta',n:'',c1:'#58d0ff',c2:'#ffb454'};
const colCache={};
function rgbOf(hex){return colCache[hex]||(colCache[hex]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)))}
const LIGHT=(()=>{const l=[-.45,-.7,.55],m=Math.hypot(...l);return l.map(v=>v/m)})();
function drawShip3D(ctx,x,y,size,yaw,pitch,sh,t,flame=true,ctxAlpha=1){
  const S=SHIPS[sh.d]||SHIPS.corbeta,M=S.mesh||(S.mesh=S.m()),cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),D=4.2,F=size*.44*D;
  const rot=p=>{const x1=p[0]*cy-p[1]*sy,y1=p[0]*sy+p[1]*cy;return[x1,y1*cp-p[2]*sp,y1*sp+p[2]*cp]};
  const items=[];
  for(const f of M.faces){const g=rot(f.g),n=rot(f.n);if(n[0]*(0-g[0])+n[1]*(-D-g[1])+n[2]*(0-g[2])<=0)continue;
    const sh0=.32+.68*Math.max(0,n[0]*LIGHT[0]+n[1]*LIGHT[1]+n[2]*LIGHT[2]);items.push({f,d:g[1],s:sh0})}
  if(flame)for(const fl of M.fl||[]){const p=rot(fl);items.push({fl,p,d:p[1]})}
  items.sort((a,b)=>b.d-a.d);ctx.save();ctx.globalAlpha=ctxAlpha;ctx.lineJoin='round';
  for(const it of items){
    if(it.fl){const k=F/(it.p[1]+D),px=x+it.p[0]*k,py=y-it.p[2]*k,r=it.fl[3]*k*(1.5+.35*Math.sin(t*30+it.fl[0]*9));
      const g=ctx.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.3,'rgba(120,210,255,.7)');g.addColorStop(1,'rgba(40,120,255,0)');
      ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py,r,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';continue}
    const k0=it.f.k,hex=k0===1?sh.c1:k0===2?sh.c2:'#8793a8',c=rgbOf(hex),s=it.s;
    ctx.fillStyle=`rgb(${c[0]*s|0},${c[1]*s|0},${c[2]*s|0})`;ctx.strokeStyle=`rgba(4,6,12,.55)`;ctx.lineWidth=.6;ctx.beginPath();
    it.f.v.forEach((p,i)=>{const q=rot(p),k=F/(q[1]+D),px=x+q[0]*k,py=y-q[2]*k;i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.closePath();ctx.fill();ctx.stroke();
  }
  ctx.restore();
}
const thumbCache=new Map();
function shipThumb(d,c1,c2,px){
  const key=d+c1+c2+px;if(thumbCache.has(key))return thumbCache.get(key);
  const c=document.createElement('canvas');c.width=c.height=px*2;const g=c.getContext('2d');drawShip3D(g,px,px*1.02,px*2*.95,.75,.55,{d,c1,c2},0,false);
  const u=c.toDataURL();thumbCache.set(key,u);return u;
}
const shipImg=(d,c1,c2,px)=>`<img src="${shipThumb(d,c1,c2,px)}" width="${px}" height="${px}" alt="">`;

