
/* ═════════ Mundo continuo: sistema estelar 3D → órbita → superficie, sin cortes ═════════
   Un solo zoom (MW.L) recorre todo:  0 = vista del sistema · 1 = el planeta llena la pantalla ·
   >1,5 = la superficie vista desde arriba (escáner de terreno, nunca se ven los bordes) · 6,5 = a pocos km.
   Los planetas son esferas con textura procedural (relieve, mares, hielo, nubes, atmósfera) y la superficie es
   la MISMA función de relieve, así que al bajar no hay cambio de escena: sólo se acerca la cámara.
   Órbitas reales: excentricidad (Kipping 2013, Beta(0,867; 3,03), exoplanetas con velocidad radial), inclinaciones
   mutuas (Fabrycky et al. 2014, Kepler: Rayleigh σ≈1,5°), lunas, cinturones con dispersión de inclinación
   (cinturón principal σ≈7°, Kuiper σ≈12°), tipos de asteroides C/S/M (75/17/8 %) y cometas. El Sistema Solar usa
   los elementos orbitales reales (J2000).                                                                         */
const RAD=Math.PI/180;
/* ── Ruido de gradiente 3D (Perlin mejorado) ── */
const N3P=(()=>{const p=new Uint8Array(512),r=rng(9157),a=[...Array(256).keys()];for(let i=255;i>0;i--){const j=r()*(i+1)|0,t=a[i];a[i]=a[j];a[j]=t}for(let i=0;i<512;i++)p[i]=a[i&255];return p})();
function n3g(h,x,y,z){h&=15;const u=h<8?x:y,v=h<4?y:h===12||h===14?x:z;return((h&1)?-u:u)+((h&2)?-v:v)}
function n3(x,y,z){let X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z);x-=X;y-=Y;z-=Z;X&=255;Y&=255;Z&=255;
  const u=x*x*x*(x*(x*6-15)+10),v=y*y*y*(y*(y*6-15)+10),w=z*z*z*(z*(z*6-15)+10),P=N3P;
  const A=P[X]+Y,AA=P[A]+Z,AB=P[A+1]+Z,B=P[X+1]+Y,BA=P[B]+Z,BB=P[B+1]+Z;
  const l1=n3g(P[AA],x,y,z),l2=n3g(P[BA],x-1,y,z),l3=n3g(P[AB],x,y-1,z),l4=n3g(P[BB],x-1,y-1,z),l5=n3g(P[AA+1],x,y,z-1),l6=n3g(P[BA+1],x-1,y,z-1),l7=n3g(P[AB+1],x,y-1,z-1),l8=n3g(P[BB+1],x-1,y-1,z-1);
  const a1=l1+u*(l2-l1),a2=l3+u*(l4-l3),a3=l5+u*(l6-l5),a4=l7+u*(l8-l7),b1=a1+v*(a2-a1),b2=a3+v*(a4-a3);return b1+w*(b2-b1)}
const ih=(a,b,c,d)=>{let h=Math.imul(a^0x9e3779b9,0x85ebca6b)^Math.imul(b+0x7f4a7c15,0xc2b2ae35)^Math.imul(c+0x165667b1,0x27d4eb2f)^d;h=Math.imul(h^h>>>15,0x2c1b3c6d);h=Math.imul(h^h>>>12,0x297a2d39);return(h^h>>>15)>>>0};

/* ── Muestreo de distribuciones (para las órbitas) ── */
function gauss(r){let u=0,v=0;while(!u)u=r();while(!v)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(6.2832*v)}
function gammaS(r,a){if(a<1)return gammaS(r,a+1)*Math.pow(r(),1/a);const d=a-1/3,c=1/Math.sqrt(9*d);for(;;){let x,v;do{x=gauss(r);v=1+c*x}while(v<=0);v=v*v*v;const u=r();if(u<1-.0331*x*x*x*x||Math.log(u)<.5*x*x+d*(1-v+Math.log(v)))return d*v}}
const betaS=(r,a,b)=>{const x=gammaS(r,a),y=gammaS(r,b);return x/(x+y)};
const rayleigh=(r,s)=>s*Math.sqrt(-2*Math.log(1-r()*.9999));
/* Elementos reales del Sistema Solar (J2000): e, i (°), Ω (°), ω (°), M0 (°) */
const SOL_EL={Mercurio:[.2056,7.00,48.3,29.1,174.8],Venus:[.0068,3.39,76.7,54.9,50.1],Tierra:[.0167,0,-11.3,114.2,358.6],Marte:[.0934,1.85,49.6,286.5,19.4],
  'Júpiter':[.0484,1.30,100.5,273.9,20.0],Saturno:[.0539,2.49,113.7,339.4,317.0],Urano:[.0473,.77,74.0,96.9,142.2],Neptuno:[.0086,1.77,131.8,273.2,256.2]};
const SOL_LUNAS={Tierra:[['Luna',.0026,.055,5.1,.27]],Marte:[['Fobos',.00006,.015,1.1,.011],['Deimos',.00016,.0003,.9,.006]],
  'Júpiter':[['Ío',.0028,.004,.05,.29],['Europa',.0045,.009,.47,.25],['Ganímedes',.0072,.0013,.2,.41],['Calisto',.0126,.0074,.2,.38]],
  Saturno:[['Rea',.0035,.001,.35,.12],['Titán',.0082,.0288,.35,.4],['Jápeto',.0238,.0286,15.5,.11]],Urano:[['Titania',.0029,.0011,.34,.12],['Oberón',.0039,.0014,.06,.12]],Neptuno:[['Tritón',.0024,0,157,.21]]};
/* Elementos orbitales de un sistema (se añaden sin tocar la generación original: los índices de planeta no cambian) */
const _orb=new Map();
function orbitas(S){const k=sSeed(S.star);let O=_orb.get(k);if(O)return O;const r=rng(hash(S.star.h,7171)),sol=S.star.anchor&&S.star.anchor.id==='sol';
  const tiltSys=rayleigh(r,1.5*RAD);
  const pl=S.planets.map((p,i)=>{const s=sol&&SOL_EL[p.name];if(s)return{e:s[0],i:s[1]*RAD,O:s[2]*RAD,w:s[3]*RAD,M0:s[4]*RAD};
    const e=Math.min(.6,betaS(r,.867,3.03)*(i===0&&p.a<.1?.3:1));return{e,i:tiltSys+rayleigh(r,1.5*RAD),O:r()*6.2832,w:r()*6.2832,M0:r()*6.2832}});
  const lunas=S.planets.map((p,i)=>{const s=sol&&SOL_LUNAS[p.name];if(s)return s.map(([n,a,e,inc,rad])=>({n,a,e,i:inc*RAD,O:r()*6.28,M0:r()*6.28,rad,c:['#b9b4aa','#9c8f7c','#d7c9a8','#c9b79a'][r()*4|0]}));
    const n=Math.min(p.moons|0,4);return Array.from({length:n},(_,j)=>({n:`${p.name.split(' ').pop()}-${'abcd'[j]}`,a:(p.r*.00012)*(3+j*2.4+r()*1.5),e:betaS(r,.867,3.03)*.3,i:rayleigh(r,(j>2?20:2)*RAD),O:r()*6.28,M0:r()*6.28,rad:.05+r()*.25,c:['#b9b4aa','#9c8f7c','#d7c9a8','#8d8f93'][r()*4|0]}))});
  const belts=S.belts.map(([a,b],j)=>{const n=a>S.frost*1.5?520:420,sig=(a>S.frost*1.5?12:7)*RAD,pts=[];
    for(let q=0;q<n;q++){const t=r(),ty=t<.75?0:t<.92?1:2;pts.push({a:lerp(a,b,r()),e:r()*.15,i:rayleigh(r,sig),O:r()*6.28,w:r()*6.28,M0:r()*6.28,ty,s:r()})}return pts});
  const nc=sol?4:2+(r()*4|0),com=[];
  if(sol)com.push({n:'Halley',a:17.8,e:.967,i:162.3*RAD,O:58.4*RAD,w:111.3*RAD,M0:2.4});
  for(let q=com.length;q<nc;q++){const lp=r()<.4;com.push({n:'Cometa '+String.fromCharCode(65+q),a:lp?S.frost*(6+r()*14):S.frost*(1.2+r()*2.5),e:lp?.9+r()*.08:.5+r()*.3,i:lp?Math.acos(1-2*r()):rayleigh(r,12*RAD),O:r()*6.28,w:r()*6.28,M0:r()*6.28})}
  O={pl,lunas,belts,com,tilt:tiltSys};_orb.set(k,O);if(_orb.size>20)_orb.delete(_orb.keys().next().value);return O}
/* Posición kepleriana: devuelve [x,y,z] (z hacia el polo de la eclíptica) en las unidades de a */
function kep(el,a,M){let E=M;for(let k=0;k<6;k++)E=E-(E-el.e*Math.sin(E)-M)/(1-el.e*Math.cos(E));
  const xv=a*(Math.cos(E)-el.e),yv=a*Math.sqrt(1-el.e*el.e)*Math.sin(E),w=el.w||0,cO=Math.cos(el.O),sO=Math.sin(el.O),ci=Math.cos(el.i),si=Math.sin(el.i),cw=Math.cos(w),sw=Math.sin(w);
  const xo=xv*cw-yv*sw,yo=xv*sw+yv*cw;return[xo*cO-yo*ci*sO,xo*sO+yo*ci*cO,yo*si]}
const anomalia=(el,a,t)=>el.M0+t*.35/Math.pow(Math.max(a,.02),1.5);

/* ── Biosfera: qué vive en cada planeta, según sus condiciones ── */
const PLANTA={M:[70,24,40],K:[112,86,30],G:[46,98,42],F:[38,92,96],A:[40,84,110],B:[50,80,120],O:[50,80,120]};
function biosfera(S,i){const p=S.planets[i],info=planetInfo(S,i),r=rng(hash(S.star.h,i,999)),k=p.kind;
  let vida=0;if(k==='temperate'||k==='ocean')vida=info.breath||p.hz?2:1;else if((k==='desert'&&p.T<330)||(k==='ice'&&p.T>180))vida=r()<.6?1:0;else if(k==='lava'&&r()<.25)vida=.5;
  if(S.star.anchor&&S.star.anchor.id==='sol')vida=p.name==='Tierra'?2:0;
  const pc=PLANTA[S.P.k]||PLANTA.G,col=`rgb(${pc})`,pick=a=>a[r()*a.length|0];
  const tono={M:'negro rojizo',K:'ocre',G:'verde',F:'verde azulado',A:'azul',B:'azul',O:'azul'}[S.P.k]||'verde';
  const flora=[],fauna=[];
  if(vida>=2){flora.push(`Bosques de copa ${tono} (la fotosíntesis se adapta a la luz de una estrella ${S.P.k})`,pick(['Praderas de hierba fibrosa','Matorrales de hojas cerosas','Campos de líquenes gigantes']),k==='ocean'?'Bosques de algas y arrecifes vivos':'Manglares en las costas');
    fauna.push(pick(['Rebaños de herbívoros de seis patas','Manadas de pacedores de cuello largo','Grandes ramoneadores acorazados']),pick(['Acechadores nocturnos','Depredadores de emboscada con camuflaje','Cazadores en jauría']),pick(['Bandadas de planeadores membranosos','Voladores de cuatro alas','Enjambres de insectoides luminosos']),k==='ocean'?pick(['Bancos de nadadores bioluminiscentes','Filtradores del tamaño de una ballena']):pick(['Excavadores de túneles','Anfibios de las ciénagas']))}
  else if(vida>=1){flora.push(k==='desert'?pick(['Suculentas columnares dispersas','Costras biológicas en las rocas']):k==='ice'?'Líquenes y algas bajo el hielo':'Matas de musgo resistentes');
    fauna.push(k==='desert'?pick(['Pequeños excavadores nocturnos','Reptantes de caparazón reflectante']):k==='ice'?'Nadadores bajo la capa de hielo':'Invertebrados de las grietas')}
  else if(vida>0){flora.push('Tapetes microbianos junto a las fumarolas');fauna.push('Extremófilos microscópicos')}
  return{vida,flora,fauna,pc,col}}

/* ── Modelo de un planeta: relieve, color y nubes (una sola función para la esfera y la superficie) ── */
const _mund=new Map();
function mundo(S,i){const key=sSeed(S.star)+':'+i;let M=_mund.get(key);if(M)return M;const p=S.planets[i],r=rng(hash(S.star.h,i,4242)),k=p.kind,gas=k==='gas'||k==='icegiant';
  const bio=biosfera(S,i),info=planetInfo(S,i);
  M={key,S,i,p,k,gas,info,bio,o:[r()*200,r()*200,r()*200],o2:[r()*200,r()*200,r()*200],o3:[r()*200,r()*200,r()*200],
    sea:{ocean:.6,temperate:.47,ice:.44,frozen:.36,lava:.5,desert:-9,barren:-9}[k]??-9,cr:{barren:1,desert:.35,frozen:.45,ice:.2}[k]??0,
    nubes:info.breath||k==='ocean'||k==='temperate'?.62:k==='lava'?.4:k==='desert'?.18:k==='ice'?.2:0,Rk:6371*p.r,
    atm:info.breath?[120,180,255]:k==='lava'?[255,150,70]:k==='desert'?[230,170,120]:k==='ice'?[180,220,255]:k==='gas'?[230,200,160]:k==='icegiant'?[150,210,235]:null,
    pal:r(),tex:null,texHi:null,spr:null};
  /* temperatura de superficie: la de equilibrio más el efecto invernadero de su atmósfera */
  M.Ts=p.T+(info.breath?33:k==='ocean'||k==='temperate'?25:k==='lava'?60:k==='desert'?8:0);
  if(S.star.anchor&&S.star.anchor.id==='sol'&&p.name==='Marte'){M.k='desert';M.marte=1}
  colorDe(M,.62,.3,.5,.5);M.roca=[BC[0]*.75|0,BC[1]*.72|0,BC[2]*.7|0];
  _mund.set(key,M);if(_mund.size>24)_mund.delete(_mund.keys().next().value);return M}
function crateres(M,x,y,z,s){const X=x*s,Y=y*s,Z=z*s,xi=Math.floor(X),yi=Math.floor(Y),zi=Math.floor(Z);let d=0;
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++){const h=ih(xi+a,yi+b,zi+c,s|0);if((h&7)>2)continue;
    const cx=xi+a+((h>>>3)&255)/255,cy=yi+b+((h>>>11)&255)/255,cz=zi+c+((h>>>19)&255)/255,rr=.12+((h>>>27)&15)/15*.33,q=Math.hypot(X-cx,Y-cy,Z-cz)/rr;
    if(q<1)d+=-.9*(1-q*q)+.35*q*q*q*q;else if(q<1.6){const u=1-(q-1)/.6;d+=.35*u*u}}return d}
/* Relieve en el punto (x,y,z) de la esfera unidad, con n octavas; craterS = escalas de cráter a usar */
function relieve(M,x,y,z,n,craterS){const o=M.o;let h=0,a=.5,f=1.15;
  for(let q=0;q<4;q++){h+=a*n3(x*f+o[0]+q*7.1,y*f+o[1],z*f+o[2]);a*=.5;f*=2.07}
  let m=0,wt=1;a=.5;f=3.3;const nm=Math.min(n-1,6);for(let q=0;q<nm;q++){let s=1-Math.abs(n3(x*f+o[1],y*f+o[2]+q*3.3,z*f+o[0]));s*=s*wt;wt=s*2>1?1:s*2;m+=s*a;a*=.5;f*=2.13}
  a=.06;f=44;for(let q=7;q<n;q++){h+=a*n3(x*f+o[2]+q*1.7,y*f+o[0],z*f+o[1]+q);a*=.52;f*=2.04}
  let H=.5+h*.62+m*.34*(h>0?Math.min(1,h*4):0)*(M.k==='ocean'?.6:1);
  if(M.k==='desert'&&n>=9)H+=.018*Math.pow(1-Math.abs(n3(x*520+o[0],y*130,z*520)),2)*(n>=11?1:.5);
  if(M.cr&&craterS)for(const s of craterS)H+=M.cr*crateres(M,x,y,z,s)*Math.min(.22,26/s);
  return H}
const humedad=(M,x,y,z)=>.5+.55*(n3(x*2.2+M.o2[0],y*2.2+M.o2[1],z*2.2+M.o2[2])*.7+n3(x*9+M.o2[1],y*9,z*9)*.3);
/* Color y bioma. Escribe en BC (r,g,b) y devuelve el código de bioma:
   0 mar profundo · 1 mar somero · 2 playa · 3 desierto · 4 pradera · 5 bosque · 6 tundra · 7 hielo · 8 roca · 9 lava ·
   10 regolito · 11 dunas · 12 salar · 13 lago de metano · 14 hielo de nitrógeno · 15 hielo marino            */
const BC=[0,0,0];const setC=(r,g,b)=>{BC[0]=r;BC[1]=g;BC[2]=b};
const mezC=(c1,c2,t)=>setC(c1[0]+(c2[0]-c1[0])*t,c1[1]+(c2[1]-c1[1])*t,c1[2]+(c2[2]-c1[2])*t);
function colorDe(M,H,lat,mo,fine){const k=M.k,e=H-M.sea,al=Math.abs(lat),T=M.Ts-al*al*70-(e>0?e*110:0),pc=M.bio.pc;
  if(k==='temperate'||k==='ocean'){
    if(e<0){if(T<258&&al>.9){setC(205,225,240);return 15}const d=Math.min(1,-e*5);mezC([60,160,190],[8,30,72],d);return d>.25?0:1}
    if(T<255||e>.36){setC(235,240,246);return 7}
    if(e<.012){setC(214,196,150);return 2}
    if(e>.24){const t=(e-.24)/.12;mezC([110,100,88],[150,145,140],t);return 8}
    if(T<268){mezC([120,118,90],[150,150,130],fine);return 6}
    if(mo<.32&&T>285){mezC([206,176,120],[186,150,96],fine);return 3}
    if(mo<.52){setC(pc[0]*1.35+30+fine*20,pc[1]*1.3+30+fine*15,pc[2]*1.1+20);return 4}
    setC(pc[0]*.7+fine*12,pc[1]*.72+fine*12,pc[2]*.7);return 5}
  if(k==='desert'){if(M.marte){mezC([150,72,40],[205,120,72],clamp(H*1.3-.2+fine*.15,0,1));if(al>1.35){setC(240,236,230);return 7}return H<.38?10:3}
    if(H<.3&&mo>.6){setC(225,222,212);return 12}const t=clamp(H*1.2-.15+fine*.15,0,1);mezC([196,150,92],[234,200,140],t);return H>.72?8:11}
  if(k==='lava'){if(e<0){const g=.6+.4*Math.sin(fine*6.28);setC(255,90+g*80,20);return 9}if(e<.025){mezC([150,40,12],[60,30,24],e/.025);return 8}const t=clamp((H-.45)*2.2+fine*.25,0,1);mezC([58,48,44],[124,108,98],t);return 8}
  if(k==='ice'){if(e<0){setC(150,190,215);return 15}const t=clamp(e*3+fine*.12,0,1);mezC([200,222,238],[245,248,252],t);if(e>.28){setC(120,118,122);return 8}return 7}
  if(k==='frozen'){if(e<0){setC(40,34,30);return 13}if(mo<.38){mezC([128,76,52],[170,110,80],fine);return 10}mezC([222,206,190],[244,236,226],fine);return 14}
  /* estéril */const gris=M.pal<.5;const t=clamp(H*1.4-.2+fine*.15,0,1);if(gris)mezC([82,80,78],[168,164,158],t);else mezC([96,78,66],[176,150,128],t);return 10}
function colorGas(M,lat,x,y,z){const ice=M.k==='icegiant',w=n3(x*2+M.o[0],y*2,z*2+M.o[1])*1.4,b=Math.sin(lat*(ice?7:13)+w*2.2),st=n3(x*6+M.o[2],y*6,z*6);
  if(ice){mezC([90,160,200],[150,210,230],.5+.5*b);return}
  const P=[[196,150,100],[232,206,170],[170,110,72],[240,228,210]],j=((b+1)*1.5)|0,t=(b+1)*1.5-j;mezC(P[j],P[Math.min(3,j+1)],t);if(st>.45&&Math.abs(lat)<.5){mezC([BC[0],BC[1],BC[2]],[200,90,60],(st-.45)*3)}}
const nube=(M,x,y,z,t)=>{if(!M.nubes)return 0;const o=M.o3,d=n3(x*2.6+o[0]+t,y*2.6+o[1],z*2.6+o[2])*.65+n3(x*7+o[1],y*7+t*.7,z*7)*.25+n3(x*19,y*19+o[2],z*19+t)*.1;return clamp((d+.12-(1-M.nubes)*.35)*2.6,0,1)};

/* ── Texturas equirectangulares (esferas) ── */
function texPlaneta(M,w,h){return{w,h,rgb:new Uint8ClampedArray(w*h*3),cl:new Uint8ClampedArray(w*h),row:0,done:false}}
function pasoTex(M,T,budget){const t0=performance.now(),n=T.w>200?8:6;
  while(T.row<T.h&&performance.now()-t0<budget){const j=T.row++,lat=(.5-(j+.5)/T.h)*Math.PI,cl=Math.cos(lat),sz=Math.sin(lat);
    for(let i=0;i<T.w;i++){const lon=(i+.5)/T.w*6.2832-Math.PI,x=cl*Math.cos(lon),y=cl*Math.sin(lon),z=sz,o=(j*T.w+i);
      if(M.gas)colorGas(M,lat,x,y,z);else{const H=relieve(M,x,y,z,n,M.cr?[6,18]:null);colorDe(M,H,lat,humedad(M,x,y,z),(n3(x*40,y*40,z*40)+1)/2)}
      T.rgb[o*3]=BC[0];T.rgb[o*3+1]=BC[1];T.rgb[o*3+2]=BC[2];T.cl[o]=M.gas?0:nube(M,x,y,z,0)*255}}
  T.done=T.row>=T.h;return T.done}
const JOBS=[];function trabajos(budget){const t0=performance.now();while(JOBS.length&&performance.now()-t0<budget){const j=JOBS[0];if(j.paso(budget-(performance.now()-t0)))JOBS.shift()}}
function texDe(M,hi){const k=hi?'texHi':'tex';if(!M[k]){M[k]=texPlaneta(M,hi?512:128,hi?256:64);const T=M[k];JOBS[hi?'unshift':'push']({paso:b=>pasoTex(M,T,b)})}return M[k]}
/* Base ortonormal de una orientación: c = punto del planeta que mira a la cámara, e2 ≈ norte */
function baseDe(c){{const l=Math.hypot(c[0],c[1],c[2])||1;c=[c[0]/l,c[1]/l,c[2]/l]}let up=[0,0,1];if(Math.abs(c[2])>.98)up=[0,1,0];const d=up[0]*c[0]+up[1]*c[1]+up[2]*c[2];let e2=[up[0]-c[0]*d,up[1]-c[1]*d,up[2]-c[2]*d];const l=Math.hypot(...e2);e2=e2.map(v=>v/l);
  const e1=[e2[1]*c[2]-e2[2]*c[1],e2[2]*c[0]-e2[0]*c[2],e2[0]*c[1]-e2[1]*c[0]];return{c,e1,e2}}
/* Dibuja una esfera texturizada: B = orientación, L = luz en el espacio de la vista [x derecha, y arriba, z hacia la cámara] */
const _esf=document.createElement('canvas'),_esg=_esf.getContext('2d');
function esfera(M,x,y,R,B,L,t,hi){if(R<.8)return;const T=texDe(M,false),Th=hi?texDe(M,true):null,U=Th&&Th.done?Th:T;if(!U.row)return;
  const d=Math.max(4,Math.min(hi?300:72,Math.ceil(R*2)));_esf.width=_esf.height=d;const im=_esg.createImageData(d,d),px=im.data,r=d/2,cr=t*.004;
  const {c,e1,e2}=B,tw=U.w,th=U.h,rows=Math.max(1,U.row);
  for(let j=0;j<d;j++){const ny=-(j+.5-r)/r;for(let i=0;i<d;i++){const nx=(i+.5-r)/r,q=nx*nx+ny*ny;if(q>1)continue;const nz=Math.sqrt(1-q);
    const wx=nx*e1[0]+ny*e2[0]+nz*c[0],wy=nx*e1[1]+ny*e2[1]+nz*c[1],wz=nx*e1[2]+ny*e2[2]+nz*c[2],lat=Math.asin(clamp(wz,-1,1)),lon=Math.atan2(wy,wx);
    const fy=Math.min(rows-1.001,(.5-lat/Math.PI)*th-.5),fx=(lon+Math.PI)/6.2832*tw-.5,ty=Math.max(0,fy|0),tx=((fx|0)%tw+tw)%tw,ax=fx-Math.floor(fx),ay=Math.max(0,fy-ty),tx2=(tx+1)%tw,ty2=Math.min(rows-1,ty+1),o=(ty*tw+tx)*3,o2=(ty*tw+tx2)*3,o3=(ty2*tw+tx)*3,o4=(ty2*tw+tx2)*3,cx_=((((lon+cr+Math.PI)/6.2832*tw)|0)%tw+tw)%tw,cl=U.cl[ty*tw+cx_]/255;
    let s=nx*L[0]+ny*L[1]+nz*L[2];s=s>0?s:0;const sh=.06+.94*s,rim=Math.pow(1-nz,3);
    const bl=(c)=>(U.rgb[o+c]*(1-ax)+U.rgb[o2+c]*ax)*(1-ay)+(U.rgb[o3+c]*(1-ax)+U.rgb[o4+c]*ax)*ay;
    let R_=bl(0)*(1-cl)+245*cl,G_=bl(1)*(1-cl)+245*cl,B_=bl(2)*(1-cl)+248*cl;R_*=sh;G_*=sh;B_*=sh;
    if(M.atm){const a=rim*(.25+s*.75)*.9;R_+=M.atm[0]*a;G_+=M.atm[1]*a;B_+=M.atm[2]*a}
    const k=(j*d+i)*4;px[k]=R_;px[k+1]=G_;px[k+2]=B_;px[k+3]=q>.985?255*(1-q)/.015:255}}
  _esg.putImageData(im,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(_esf,x-R,y-R,R*2,R*2);
  if(M.atm&&R>3){const g=ctx.createRadialGradient(x,y,R*.96,x,y,R*1.12);g.addColorStop(0,`rgba(${M.atm},.35)`);g.addColorStop(1,`rgba(${M.atm},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,R*1.12,0,7);ctx.fill()}}

/* ── Estado de la cámara del mundo ── */
const V3={yaw:.5,pitch:.42,z:1};
function p3(x,y,z,cx,cy,f){const cy_=Math.cos(V3.yaw),sy=Math.sin(V3.yaw),cp=Math.cos(V3.pitch),sp=Math.sin(V3.pitch);
  const x1=x*cy_-z*sy,z1=x*sy+z*cy_,y1=y*cp-z1*sp,z2=y*sp+z1*cp,k=f/(f+z2);return[cx+x1*k,cy-y1*k,k,z2]}
const MW={L:0,LT:0,pi:-1,B:null,anc:null,buf:null,job:null,aviso:0,tLand:0};
const MWLMAX=7.6;
function mwReset(){MW.L=0;MW.LT=0;MW.pi=-1;MW.B=null;MW.anc=null;MW.buf=null;MW.job=null;V3.z=.55}
function mwFoco(i){if(i!==MW.pi){MW.pi=i;MW.B=null;MW.anc=null;MW.buf=null;MW.job=null}}
const radioFoco=L=>Math.min(W,H)*.42*Math.pow(2,(L-1)*2.5);
const spanDe=L=>W/radioFoco(L);
/* ── Vista del sistema (L ≤ 1,4) ── */
let _sysPos=[];
function dibujaSistema(now,f){
  const S=SYS,P=S.P,O=orbitas(S),t=now/1000,here=sameStar(S.star,shipStar()),ent=RM?1:ease(clamp((now-sysT0)/1400,0,1));
  if(!drag&&MW.L<.05)V3.yaw+=.00035;if(ent<1)V3.z+=(1-V3.z)*.03;
  const cx=W/2,cy=H/2+10,fo=Math.max(W,H)*1.25,Rmax=(Math.min(W,H)/2-20)*V3.z*(.4+.6*ent);
  const all=S.planets.map(p=>p.a).concat(S.belts.flat());const amax=Math.max(...all,S.hz[1],.5)*1.25,a0=Math.max(.02,Math.min(...all,S.hz[0])*.5),star=clamp(6+Math.log10(P.rad+1)*14,7,34);
  const rp=a=>star+12+(Rmax-star-12)*Math.log(1+Math.max(a,0)/a0)/Math.log(1+amax/a0);
  const pos3=v=>{const r=Math.hypot(v[0],v[1],v[2])||1e-9,k=rp(r)/r;return p3(v[0]*k,v[2]*k,v[1]*k,cx,cy,fo)};
  /* foco: transformación que lleva el planeta elegido al centro y lo agranda */
  let tf=q=>q,qF=null,rF=1;const fi=MW.pi;
  const plan=S.planets.map((p,i)=>{const el=O.pl[i],M=anomalia(el,p.a,t*(fi===i&&MW.L>.2?0:1)),v=kep(el,p.a,M),q=pos3(v);return{p,i,v,q,el}});
  if(fi>=0&&plan[fi]){qF=plan[fi].q;rF=Math.max(2,clamp((2.5+Math.log2(plan[fi].p.r+.5)*2.6)*qF[2],2,16));const s=Math.exp(Math.log(radioFoco(Math.max(1,MW.L))/rF)*f);
    tf=q=>[cx+(q[0]-qF[0])*s+(qF[0]-cx)*(1-f),(H/2)+(q[1]-qF[1])*s+(qF[1]-H/2)*(1-f),q[2]*s,q[3]]}
  const sc=q=>tf(q);drawSky(now);ctx.globalAlpha=.2+.8*ent;
  /* plano de referencia y zona habitable */
  const ring=(fn,col,lw,n=96,dash)=>{ctx.strokeStyle=col;ctx.lineWidth=lw;if(dash)ctx.setLineDash(dash);ctx.beginPath();for(let k=0;k<=n;k++){const q=sc(fn(k/n*6.2832));k?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])}ctx.stroke();ctx.setLineDash([])};
  if(f<.9){const fa=1-f;for(let k=1;k<=4;k++)ring(a=>p3(Math.cos(a)*Rmax*k/4,0,Math.sin(a)*Rmax*k/4,cx,cy,fo),`rgba(120,220,255,${.05*fa})`,1,72);
    const hr=(rp(S.hz[0])+rp(S.hz[1]))/2;ring(a=>p3(Math.cos(a)*hr,0,Math.sin(a)*hr,cx,cy,fo),`rgba(126,231,135,${.12*fa})`,Math.max(2,(rp(S.hz[1])-rp(S.hz[0]))*.55),96)}
  /* cinturones: miles de cuerpos con inclinación y composición distintas */
  const ACOL=['rgba(120,112,104,','rgba(196,150,110,','rgba(200,205,215,'];
  if(f<.95)O.belts.forEach(pts=>{for(const b of pts){const v=kep(b,b.a,anomalia(b,b.a,t)),q=sc(pos3(v));if(q[0]<-5||q[1]<-5||q[0]>W+5||q[1]>H+5)continue;ctx.fillStyle=ACOL[b.ty]+(.4+b.s*.5)*(1-f)+')';const s=(.8+b.s*1.2)*Math.min(3,q[2]);ctx.fillRect(q[0],q[1],s,s)}});
  /* órbitas inclinadas y excéntricas */
  if(f<.95)plan.forEach(({p,i,el})=>ring(a=>pos3(kep(el,p.a,a)),i===fi?`rgba(88,208,255,${.6*(1-f)})`:`rgba(190,205,235,${.16*(1-f)})`,1,120));
  /* cometas con cola opuesta a la estrella */
  if(f<.9)for(const c of O.com){const v=kep(c,c.a,anomalia(c,c.a,t*.4)),q=sc(pos3(v)),r=Math.hypot(...v);ring(a=>pos3(kep(c,c.a,a)),`rgba(160,200,255,${.05*(1-f)})`,1,90);
    const tail=clamp(3/(r+.3),0,1)*40,s0=sc(pos3([0,0,0])),dx=q[0]-s0[0],dy=q[1]-s0[1],dl=Math.hypot(dx,dy)||1;if(tail>1){const g=ctx.createLinearGradient(q[0],q[1],q[0]+dx/dl*tail,q[1]+dy/dl*tail);g.addColorStop(0,'rgba(200,230,255,.7)');g.addColorStop(1,'rgba(200,230,255,0)');ctx.strokeStyle=g;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(q[0]+dx/dl*tail,q[1]+dy/dl*tail);ctx.stroke()}
    ctx.fillStyle='rgba(230,245,255,.9)';ctx.fillRect(q[0]-1,q[1]-1,2,2)}
  /* estrella (o remanente) */
  const fate=destino(S.star),c0=sc(p3(0,0,0,cx,cy,fo)),sr=star*(1+f*0);
  if(fate==='bh'){ctx.fillStyle='#000';ctx.beginPath();ctx.arc(c0[0],c0[1],sr*.9,0,7);ctx.fill();for(let k=0;k<3;k++)ring(a=>{const R=sr*(1.7+k*.5);return p3(Math.cos(a+t*(1-k*.2))*R,0,Math.sin(a+t*(1-k*.2))*R,cx,cy,fo)},`rgba(255,${150+k*30},80,${.6-k*.15})`,3-k,60)}
  else{const col=fate?'#bcd4ff':P.col,g=ctx.createRadialGradient(c0[0],c0[1],0,c0[0],c0[1],sr*4);g.addColorStop(0,'#fff');g.addColorStop(.12,col);g.addColorStop(.4,col+'55');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(c0[0],c0[1],sr*4,0,7);ctx.fill()}
  if(infected(S.star))ring(a=>p3(Math.cos(a)*star*2.4,0,Math.sin(a)*star*2.4,cx,cy,fo),'rgba(255,59,92,.55)',1.2,60,[4,4]);
  /* planetas (de atrás hacia delante), con lunas */
  sysHits=[];_sysPos=[];const items=plan.map(o=>({...o,s:sc(o.q)})).sort((a,b)=>b.q[3]-a.q[3]);
  for(const it of items){const {p,i,s}=it,M=mundo(S,i),foc=i===fi;let R=clamp((2.5+Math.log2(p.r+.5)*2.6)*it.q[2],1.6,16);if(foc)R=rF*Math.exp(Math.log(radioFoco(Math.max(1,MW.L))/rF)*f);else R*=s[2]/it.q[2];
    if(s[0]<-R*2||s[1]<-R*2||s[0]>W+R*2||s[1]>H+R*2)continue;
    /* luz: desde la estrella en la vista; con el foco, luz frontal para ver la cara */
    let lx=c0[0]-s[0],ly=-(c0[1]-s[1]);const ll=Math.hypot(lx,ly)||1;let L=[lx/ll*.9,ly/ll*.9,.42];if(foc){L=[lerp(L[0],-.45,f),lerp(L[1],.55,f),lerp(L[2],.72,f)]}const Ln=Math.hypot(...L);L=L.map(v=>v/Ln);
    let B;if(foc&&MW.B)B=MW.B;else{const sp=t*.05*(1+i*.13)+i;B=baseDe([Math.cos(sp),Math.sin(sp),.18]);if(foc&&MW.L>.15)MW.B=B}
    if(p.ring&&R>2){ctx.strokeStyle='rgba(230,210,170,.55)';ctx.lineWidth=Math.max(1,R*.12);ctx.beginPath();ctx.ellipse(s[0],s[1],R*2.1,R*.55,-.3,Math.PI,6.2832);ctx.stroke()}
    esfera(M,s[0],s[1],R,B,L,now/1000,foc&&R>30);
    if(p.ring&&R>2){ctx.beginPath();ctx.ellipse(s[0],s[1],R*2.1,R*.55,-.3,0,Math.PI);ctx.stroke()}
    /* lunas */
    O.lunas[i].forEach(m=>{const mv=kep({...m,w:0},1,m.M0+t*(.6/Math.sqrt(m.a/.003))),k=R*(2.4+m.a/.0026*1.1),mx=s[0]+mv[0]*k,my=s[1]-mv[2]*k*.6+mv[1]*k*.35,mr=Math.max(1,R*m.rad*.5);
      if(foc&&f>.6)return;ctx.fillStyle=m.c;ctx.beginPath();ctx.arc(mx,my,mr,0,7);ctx.fill();if(foc&&mr>2.5){ctx.font='9px ui-monospace,Menlo,monospace';ctx.fillStyle='rgba(205,215,235,.6)';ctx.fillText(m.n.toUpperCase(),mx+mr+3,my)}});
    if(f<.6){ctx.font='10px ui-monospace,Menlo,monospace';ctx.fillStyle=p===selPlanet?'#58d0ff':'rgba(205,215,235,.75)';ctx.textAlign='left';ctx.textBaseline='middle';ctx.globalAlpha=(1-f/.6)*(.2+.8*ent);ctx.fillText(spaced(p.name.replace(S.name+' ','').toUpperCase()),s[0]+R+6,s[1]);ctx.globalAlpha=.2+.8*ent}
    if(p===selPlanet&&f<.5){ctx.strokeStyle='#58d0ff';ctx.lineWidth=1.3;ctx.setLineDash([3,3]);ctx.lineDashOffset=-now/50;ctx.beginPath();ctx.arc(s[0],s[1],R+6,0,7);ctx.stroke();ctx.setLineDash([])}
    sysHits.push({x:s[0],y:s[1],r:Math.max(12,R+6),planet:p});_sysPos[i]={x:s[0],y:s[1],R}}
  ctx.globalAlpha=1;
  if(here&&f<.7){const q=fi>=0&&_sysPos[fi]?[_sysPos[fi].x+_sysPos[fi].R+16,_sysPos[fi].y-_sysPos[fi].R-8]:sc(pos3([star*.0+0.0001,0,0])).map((v,k)=>k===0?v+star+26:k===1?v-14:v);drawShip3D(ctx,q[0],q[1],26,t*.9,.5,D.ship,t)}
  return{c0}}

/* ── Superficie: escáner de terreno visto desde arriba, buffer progresivo que cubre siempre la pantalla ── */
const _tb=()=>({cv:document.createElement('canvas'),cl:document.createElement('canvas')});
function nuevoTrabajo(M,B,span,coarse){const RES=Math.max(2,Math.round(W/420))*(coarse?3:1),ext=1.55,gw=Math.ceil(W*ext/RES),gh=Math.ceil(H*ext/RES),pxr=span/W*RES;
  const n=clamp(Math.ceil(Math.log2(1/(pxr*1.1)))+1,5,17),crs=[6,18,55,170,520,1600,5000,15000,45000].filter(s=>{const rad=.3/s;return rad>pxr*5&&rad<span*.7}).slice(0,3);
  return{M,B,span,RES,coarse,gw,gh,pxr,n,crs,row:0,h:new Float32Array(gw*gh),mo:new Float32Array(gw*gh),fn:new Float32Array(gw*gh),bio:new Uint8Array(gw*gh),cld:new Uint8Array(gw*gh),done:false}}
function pasoTerreno(J,budget){const t0=performance.now(),{M,B,gw,gh,pxr,n,crs}=J,{c,e1,e2}=B;
  while(J.row<gh&&performance.now()-t0<budget){const j=J.row++,v=-(j-gh/2)*pxr;
    for(let i=0;i<gw;i++){const u=(i-gw/2)*pxr;let x=c[0]+e1[0]*u+e2[0]*v,y=c[1]+e1[1]*u+e2[1]*v,z=c[2]+e1[2]*u+e2[2]*v;const l=1/Math.sqrt(x*x+y*y+z*z);x*=l;y*=l;z*=l;const o=j*gw+i;
      J.h[o]=relieve(M,x,y,z,n,crs);J.mo[o]=humedad(M,x,y,z);J.fn[o]=(n3(x*900+M.o[0],y*900,z*900)+n3(x*7000,y*7000+M.o[1],z*7000)*.5+1.5)/3;J.cld[o]=nube(M,x,y,z,0)*255}}
  if(J.row<gh)return false;
  /* color con sombreado de relieve (luz del noroeste, convención cartográfica) */
  const {cv,cl}=_tb();cv.width=cl.width=gw;cv.height=cl.height=gh;const g=cv.getContext('2d'),im=g.createImageData(gw,gh),px=im.data,gc=cl.getContext('2d'),ic=gc.createImageData(gw,gh),pc=ic.data;
  const K=3*12/(2*pxr*M.Rk); // relieve: 1 unidad ≈ 12 km, exageración vertical ×3
  for(let j=0;j<gh;j++){const lat=Math.asin(clamp(c[2]+e2[2]*(-(j-gh/2)*pxr),-1,1));for(let i=0;i<gw;i++){const o=j*gw+i,H_=J.h[o];
    const bio=colorDe(M,H_,lat,J.mo[o],J.fn[o]);J.bio[o]=bio;let s=1;
    if(!(bio<=1||bio===13||bio===15)){const sx=(J.h[o+(i<gw-1?1:0)]-J.h[o-(i>0?1:0)])*K,sn=-(J.h[o+(j<gh-1?gw:0)]-J.h[o-(j>0?gw:0)])*K;s=clamp((.5*sx-.5*sn+.707)/Math.sqrt(sx*sx+sn*sn+1)/.707,.28,1.4)}
    else if(bio<=1){s=.92+J.fn[o]*.16}
    if(bio===5)s*=.8+J.fn[o]*.4;else if(bio>=2&&bio<=6||bio===10||bio===11)s*=.9+J.fn[o]*.2;if(bio===9)s=1;
    const k=o*4;px[k]=BC[0]*s;px[k+1]=BC[1]*s;px[k+2]=BC[2]*s;px[k+3]=255;const a=J.cld[o];pc[k]=pc[k+1]=pc[k+2]=250;pc[k+3]=a}}
  g.putImageData(im,0,0);gc.putImageData(ic,0,0);J.cv=cv;J.cl=cl;J.done=true;return true}
/* coordenadas de un punto del mundo en el plano tangente de una base */
const enPlano=(B,w)=>{const d=w[0]*B.c[0]+w[1]*B.c[1]+w[2]*B.c[2];return[(w[0]*B.e1[0]+w[1]*B.e1[1]+w[2]*B.e1[2])/d,(w[0]*B.e2[0]+w[1]*B.e2[1]+w[2]*B.e2[2])/d]};
const delPlano=(B,u,v)=>{const x=B.c[0]+B.e1[0]*u+B.e2[0]*v,y=B.c[1]+B.e1[1]*u+B.e2[1]*v,z=B.c[2]+B.e1[2]*u+B.e2[2]*v,l=Math.hypot(x,y,z);return[x/l,y/l,z/l]};
const NBIO=['Mar profundo','Mar somero','Playa','Desierto','Pradera','Bosque','Tundra','Hielo','Roca y montaña','Lava','Regolito','Dunas','Salar','Lago de metano','Hielo de nitrógeno','Mar helado'];
function bufEn(J,sx,sy,span){if(!J||!J.done)return null;const [uc,vc]=enPlano(J.B,MW.B.c),u=uc+(sx-W/2)*span/W,v=vc-(sy-H/2)*span/W,i=Math.round(u/J.pxr+J.gw/2),j=Math.round(-v/J.pxr+J.gh/2);
  if(i<0||j<0||i>=J.gw||j>=J.gh)return null;return J.gw*j+i}
function dibujaTerreno(now,alpha,span){const M=mundo(SYS,MW.pi),B=MW.B,t=now/1000;
  /* el trabajo apunta al zoom de destino, para que al llegar ya esté listo */
  const spanT=spanDe(Math.max(1.4,MW.LT)),J=MW.buf;
  const vale=(X,sp)=>{if(!X)return false;const [uc,vc]=enPlano(X.B,B.c),k=X.pxr*W/sp/X.RES,half=X.gw/2*X.pxr*W/sp;return k>.7&&k<1.45&&half-Math.abs(uc*W/sp)>W/2*1.01&&X.gh/2*X.pxr*W/sp-Math.abs(vc*W/sp)>H/2*1.01};
  if(!vale(MW.job,spanT)&&!(J&&vale(J,spanT)&&!J.coarse))MW.job=nuevoTrabajo(M,{c:B.c.slice(),e1:B.e1.slice(),e2:B.e2.slice()},spanT,!(J&&vale(J,spanT)));
  if(MW.job&&!MW.job.done){pasoTerreno(MW.job,12);if(MW.job.done){const jj=MW.job;MW.buf=jj;MW.job=jj.coarse?nuevoTrabajo(M,jj.B,jj.span,false):null}}
  ctx.save();ctx.globalAlpha=alpha;
  const X=MW.buf;if(X&&X.cv){const [uc,vc]=enPlano(X.B,B.c),k=X.pxr*W/span,ox=W/2-uc*W/span-X.gw/2*k,oy=H/2+vc*W/span-X.gh/2*k;ctx.imageSmoothingEnabled=true;ctx.drawImage(X.cv,ox,oy,X.gw*k,X.gh*k);
    /* nubes: se atraviesan al bajar */
    const ca=clamp((3.3-MW.L)/1.4,0,1)*(M.nubes?1:0);if(ca>0){ctx.globalAlpha=alpha*ca*.85;const dr=(t*.8)%1e6*W/span*.00002;ctx.drawImage(X.cl,ox+dr,oy,X.gw*k,X.gh*k);ctx.globalAlpha=alpha}
    if(alpha>.6)vidaYsuperficie(M,X,now,span,alpha)}
  ctx.restore();
  /* barrido del escáner y escala */
  if(alpha>.3){const y=(t*.12%1)*H;ctx.fillStyle='rgba(120,230,255,.05)';ctx.fillRect(0,y-30,W,30);ctx.strokeStyle='rgba(150,240,255,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
    const km=span*M.Rk,nice=[.01,.02,.05,.1,.2,.5,1,2,5,10,20,50,100,200,500,1000,2000,5000].find(v=>v/km*W>90)||5000,bl=nice/km*W;
    ctx.font='10px ui-monospace,Menlo,monospace';ctx.textAlign='left';ctx.fillStyle='rgba(200,240,255,.85)';ctx.fillRect(70,H-86,bl,2);ctx.fillText(nice<1?Math.round(nice*1000)+' m':nice+' km',70,H-96);
    const alt=km*.55,lat=Math.asin(B.c[2])/RAD,lon=Math.atan2(B.c[1],B.c[0])/RAD,i0=bufEn(MW.buf,W/2,H/2,span);
    ctx.fillText(spaced(`ESCÁNER DE TERRENO · ALTITUD ${alt<10?alt.toFixed(1):fmtI(alt)} KM · ${Math.abs(lat).toFixed(2)}°${lat<0?'S':'N'} ${Math.abs(lon).toFixed(2)}°${lon<0?'O':'E'}${i0!=null?' · '+NBIO[MW.buf.bio[i0]].toUpperCase():''}`),70,H-60)}}
/* Flora, fauna, rocas, puntos de interés y la nave, anclados al mundo (no se mueven al desplazarte) */
function vidaYsuperficie(M,X,now,span,alpha){const t=now/1000,A=MW.anc||(MW.anc={...baseDe(MW.B.c.slice())}),[ac,bc]=enPlano(A,MW.B.c),mpx=span*M.Rk*1000/W,vida=M.bio.vida,pc=M.bio.pc,lifeless=vida===0;
  const toS=(u,v)=>[W/2+(u-ac)*W/span,H/2-(v-bc)*W/span];
  const celdas=(sizeM,fn,maxN)=>{const cs=sizeM/1000/M.Rk,cpx=cs*W/span;if(cpx<4)return;const i0=Math.floor((ac-span/2)/cs)-1,i1=Math.ceil((ac+span/2)/cs)+1,hs=span*H/W,j0=Math.floor((bc-hs/2)/cs)-1,j1=Math.ceil((bc+hs/2)/cs)+1;
    if((i1-i0)*(j1-j0)>maxN)return;for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const h=ih(i,j,sizeM|0,M.o[0]*1000|0),[x,y]=toS((i+(h&255)/255)*cs,(j+((h>>>8)&255)/255)*cs);if(x<-30||y<-30||x>W+30||y>H+30)continue;const o=bufEn(X,x,y,span);if(o==null)continue;fn(x,y,X.bio[o],h,cpx)}};
  /* árboles y arbustos (copas vistas desde arriba) */
  const tc=Math.max(22,span*M.Rk*1000/150),tk=Math.sqrt(tc/22);
  if(!lifeless&&tc<=300)celdas(tc,(x,y,b,h,cpx)=>{const p=(h>>>16&255)/255;let prob=b===5?.75:b===4?.07:b===3?.025:b===6?.05:b===2?.04:b===1?.15:0;if(vida<2)prob*=.35;if(p>prob)return;
    const r=Math.max(1.4,(b===5?7:b===1?3:3.5)*tk/mpx*(.7+((h>>>24)&255)/400));if(b===1){ctx.fillStyle=`rgba(${pc[0]+90},${pc[1]+60},${pc[2]+40},.55)`;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();return}
    ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.arc(x+r*.35,y+r*.35,r,0,7);ctx.fill();const k=b===3?1.3:1;ctx.fillStyle=`rgb(${pc[0]*.6*k|0},${pc[1]*.65*k|0},${pc[2]*.6*k|0})`;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();
    if(r>3){ctx.fillStyle=`rgba(${pc[0]+70},${pc[1]+70},${pc[2]+50},.5)`;ctx.beginPath();ctx.arc(x-r*.3,y-r*.3,r*.45,0,7);ctx.fill()}},16000);
  /* rocas y cantos (en todos los mundos sólidos) */
  celdas(14,(x,y,b,h)=>{if(!(b===8||b===10||b===3||b===11||b===6||b===14)||(h>>>16&255)>(b===8?60:22))return;const r=Math.max(1,(1.5+((h>>>24)&255)/60)/mpx);ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.arc(x+r*.4,y+r*.4,r,0,7);ctx.fill();ctx.fillStyle=`rgb(${M.roca})`;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();if(r>3){ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.arc(x-r*.3,y-r*.3,r*.5,0,7);ctx.fill()}},9000);
  /* respiraderos de lava que laten */
  if(M.k==='lava')celdas(400,(x,y,b,h)=>{if((h>>>16&255)>50)return;const g=.5+.5*Math.sin(t*2+(h&63)),r=Math.max(2,30/mpx)*(1+g*.4);const gr=ctx.createRadialGradient(x,y,0,x,y,r*3);gr.addColorStop(0,`rgba(255,200,80,${.8*g})`);gr.addColorStop(1,'rgba(255,60,0,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,r*3,0,7);ctx.fill()},4000);
  /* fauna: manadas que pastan y se desplazan, bancos de peces y bandadas */
  if(vida>=1&&mpx<25)celdas(700,(x,y,b,h,cpx)=>{const land=b>=2&&b<=6,sea=b<=1;if(!(land||sea&&M.k!=='desert'))return;if((h>>>16&255)>(vida>=2?110:40))return;
    const n=3+(h&7)+(vida>=2?4:0),sz=Math.max(1.3,(sea?.6:2.2)/mpx),dir=(h>>>20)/4096*6.28+Math.sin(t*.05+(h&31))*.8,mx=Math.cos(dir)*t*1.2/mpx%(cpx*.6),my=Math.sin(dir)*t*1.2/mpx%(cpx*.6);
    for(let a=0;a<n;a++){const ha=ih(h,a,1,2),ox=((ha&255)/255-.5)*cpx*.25+Math.sin(t*.4+a)*sz*1.5,oy=(((ha>>>8)&255)/255-.5)*cpx*.25+Math.cos(t*.3+a*1.7)*sz*1.5,X_=x+ox+mx,Y_=y+oy+my;
      ctx.save();ctx.translate(X_,Y_);ctx.rotate(dir+Math.sin(t+a)*.3);if(sea){ctx.fillStyle='rgba(220,240,255,.7)';ctx.beginPath();ctx.ellipse(0,0,sz*1.6,sz*.5,0,0,7);ctx.fill()}
      else{ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(sz*.4,sz*.4,sz*1.4,sz*.7,0,0,7);ctx.fill();ctx.fillStyle=`rgb(${120+(h&40)},${90+(h>>>8&30)},${60})`;ctx.beginPath();ctx.ellipse(0,0,sz*1.4,sz*.7,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(sz*1.5,0,sz*.45,0,7);ctx.fill()}ctx.restore()}},2500);
  if(vida>=2&&M.info.breath&&mpx<80){for(let k=0;k<3;k++){const ph=t*.03*(1+k*.3)+k*2,bx=((ph*W*.4)%(W*1.4))-W*.2,by=H*(.2+.25*k)+Math.sin(ph*3)*30;for(let a=0;a<7;a++){const x=bx-Math.abs(a-3)*10,y=by+(a-3)*8,w=Math.sin(t*8+a)*3;ctx.strokeStyle='rgba(20,20,20,.55)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-5,y-w);ctx.lineTo(x,y);ctx.lineTo(x+5,y-w);ctx.stroke()}}}
  /* puntos de interés y nave (si se aterrizó aquí) */
  if(surf&&surf.i===MW.pi&&surf.c){const pois=mpx<90?surf.pois||[]:[];for(const q of pois){const [u,v]=enPlano(A,delPlano(surf.c,q.u,q.v)),[x,y]=toS(u,v),done=D.ex[M.info.key+':'+q.n];if(x<-40||y<-40||x>W+40||y>H+40)continue;
      ctx.strokeStyle=done?'rgba(126,231,135,.95)':'rgba(255,180,84,.95)';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y,8,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x+5,y-7);ctx.lineTo(x,y-2);ctx.lineTo(x-5,y-7);ctx.closePath();ctx.fill();
      ctx.font='9px ui-monospace,Menlo,monospace';ctx.textAlign='center';ctx.fillText(spaced(q.n.toUpperCase()),x,y-18);q.sx=x;q.sy=y}
    const [u,v]=enPlano(A,surf.c.c),[x,y]=toS(u,v),len=SPEC[D.ship.d].len,sz=Math.max(14,len/mpx);if(x>-60&&y>-60&&x<W+60&&y<H+60){ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(x+sz*.15,y+sz*.2,sz*.5,sz*.3,0,0,7);ctx.fill();drawShip3D(ctx,x,y,sz,-.6,1.25,D.ship,t,false);
      if(sz<=14){ctx.strokeStyle='#58d0ff';ctx.beginPath();ctx.arc(x,y,11,0,7);ctx.stroke()}ctx.font='9px ui-monospace,Menlo,monospace';ctx.fillStyle='#9fe6ff';ctx.textAlign='center';ctx.fillText(spaced((D.ship.n||SHIPS[D.ship.d].n).toUpperCase()),x,y+sz*.5+14)}}}

/* ── Bucle de la vista: decide qué se ve según el zoom y aterriza o despega solo ── */
function drawMundo(now){if(!SYS)return;ctx.letterSpacing='1.6px';trabajos(4);
  if(selPlanet){const i=SYS.planets.indexOf(selPlanet);if(i>=0&&i!==MW.pi)mwFoco(i)}else if(MW.pi>=0&&MW.LT<.02&&MW.L<.02)MW.pi=-1;
  const M=MW.pi>=0?mundo(SYS,MW.pi):null,here=sameStar(SYS.star,shipStar());if(M&&MW.LT>.1)texDe(M,true);
  /* límites: gigantes gaseosos sin superficie; vista remota sólo hasta la órbita */
  let max=MWLMAX;if(!M)max=0;else if(M.gas)max=1.25;else if(!here&&mode!=='surface')max=1.9;
  if(MW.LT>max){MW.LT=max;if(M&&performance.now()-MW.aviso>4000){MW.aviso=performance.now();toast(M.gas?'Un gigante gaseoso no tiene superficie.':'Vista de sondeo: viaja hasta este sistema para descender.')}}
  MW.L+=(MW.LT-MW.L)*(RM?1:.075);if(Math.abs(MW.LT-MW.L)<.002)MW.L=MW.LT;
  /* aterrizaje y despegue automáticos al cruzar la capa de nubes */
  if(M&&!M.gas&&here){if(mode==='system'&&MW.L>2.2&&MW.LT>2.2&&now-MW.tLand>800){MW.tLand=now;land(MW.pi,true)}
    else if(mode==='surface'&&MW.L<1.9&&MW.LT<1.9&&now-MW.tLand>800){MW.tLand=now;mode='system';surf=null;refresh()}}
  const f=M?smooth(MW.L,0,1):0,ta=M&&!M.gas?smooth(MW.L,1.45,2.05):0;
  if(ta<1)dibujaSistema(now,f);
  if(M&&MW.L>1&&MW.B&&ta<1){const R=radioFoco(MW.L);ctx.fillStyle='#000';if(R>Math.hypot(W,H)){}esfera(M,W/2,H/2,R,MW.B,[-.45,.55,.72].map(v=>v/1.02),now/1000,true)}
  if(ta>0&&MW.B)dibujaTerreno(now,ta,spanDe(MW.L));
  ctx.globalAlpha=1;ctx.font='10px ui-monospace,Menlo,monospace';ctx.textAlign='left';ctx.textBaseline='middle';
  if(ta<.5){ctx.fillStyle='rgba(126,231,135,.7)';ctx.fillText(spaced(M?(M.gas?'GIGANTE GASEOSO · ARRASTRA PARA GIRARLO':MW.L<1?'RUEDA / PELLIZCO: DESCENDER · ARRASTRA PARA GIRAR':'SIGUE BAJANDO PARA ENTRAR EN LA ATMÓSFERA'):'▮ ZONA HABITABLE · ELIGE UN PLANETA Y USA LA RUEDA PARA DESCENDER'),70,H-60);
    if(!here){ctx.fillStyle='rgba(255,180,84,.8)';ctx.fillText(spaced('VISTA REMOTA · DATOS DE SONDEO'),70,H-44)}
    const fate=destino(SYS.star);if(fate&&MW.L<.5){ctx.fillStyle='rgba(255,190,120,.85)';ctx.fillText(spaced(FATE[fate].ic+' '+FATE[fate].n.toUpperCase()+' · FUENTE DE ENERGÍA NEGATIVA'),70,H-92)}
    if(estacion(SYS.star)&&MW.L<.5){ctx.fillStyle='rgba(120,220,255,.8)';ctx.fillText(spaced('🛰 '+estacion(SYS.star).n.toUpperCase()),70,H-76)}}
  ctx.letterSpacing='0px'}
function drawSystem(now){drawMundo(now)}
function drawSurface(now){drawMundo(now)}
/* Entrada del usuario en las vistas de sistema y superficie */
function mwZoom(d){if(MW.pi<0&&!selPlanet){V3.z=clamp(V3.z*Math.exp(d*.9),.45,2.8);return}if(MW.LT<=0&&d<0){V3.z=clamp(V3.z*Math.exp(d*.9),.45,2.8);MW.LT=0;return}MW.LT=clamp(MW.LT+d*1.15,0,MWLMAX)}
function mwArrastre(dx,dy,st){if(MW.pi<0||MW.L<.25||!MW.B){V3.yaw=st.v3y-dx*.008;V3.pitch=clamp(st.v3p+dy*.006,.08,1.45);return}
  const sp=MW.L<1?2/ Math.max(1,radioFoco(Math.max(.5,MW.L))/(W/2)) :spanDe(MW.L);const B0=st.B0||(st.B0={c:MW.B.c.slice(),e1:MW.B.e1.slice(),e2:MW.B.e2.slice()});
  const k=MW.L<1?1/radioFoco(1):sp/W,c=delPlano(B0,-dx*k,dy*k);let e2=B0.e2,d=e2[0]*c[0]+e2[1]*c[1]+e2[2]*c[2];e2=[e2[0]-c[0]*d,e2[1]-c[1]*d,e2[2]-c[2]*d];const l=Math.hypot(...e2);e2=e2.map(v=>v/l);
  MW.B={c,e2,e1:[e2[1]*c[2]-e2[2]*c[1],e2[2]*c[0]-e2[0]*c[2],e2[0]*c[1]-e2[1]*c[0]]}}
function mwClic(mx,my){if(mode==='surface'&&surf&&surf.pois){for(const q of surf.pois)if(q.sx!=null&&Math.hypot(q.sx-mx,q.sy-my)<14&&!D.ex[surf.info.key+':'+q.n]){openExpedition(surf.info,q.n);return true}}return false}
/* POIs y nave en el mundo: se fijan al aterrizar, alrededor del punto de aterrizaje */
function mwAterriza(info){const M=mundo(SYS,info.i),r=rng(hash(info.key.length,info.i,31));let B=MW.B?{c:MW.B.c.slice(),e1:MW.B.e1.slice(),e2:MW.B.e2.slice()}:baseDe([1,0,0]);
  /* zona de aterrizaje: el suelo firme más cercano al centro de la vista (en espiral) */
  if(M.sea>-1){const ok=w=>relieve(M,w[0],w[1],w[2],7,null)>M.sea+.03;if(!ok(B.c)){let best=null;for(let k=1;k<500&&!best;k++){const a=k*2.4,d=.004*k,w=delPlano(B,Math.cos(a)*d,Math.sin(a)*d);if(ok(w))best=w}if(best){B=baseDe(best);MW.B={c:best.slice(),e1:B.e1.slice(),e2:B.e2.slice()};MW.anc=null;toast('Buscáis suelo firme: la nave se posa en el más cercano.')}}}
  return{c:B,pois:info.pois.map((n,j)=>{const a=j/info.pois.length*6.283+r(),km=1.2+r()*4.5;return{n,u:Math.cos(a)*km/M.Rk,v:Math.sin(a)*km/M.Rk}})}}
/* Ficha orbital y biosfera para los paneles */
function orbitaHtml(S,i){const O=orbitas(S),el=O.pl[i],lu=O.lunas[i];return`<span>Excentricidad</span><span>${el.e.toFixed(3)}</span><span>Inclinación</span><span>${(el.i/RAD).toFixed(2)}°</span>${lu.length?`<span>Lunas mayores</span><span>${lu.map(m=>esc(m.n)).join(', ')}</span>`:''}`}
function bioHtml(S,i){const b=biosfera(S,i);if(!b.vida)return'<p class="note">Biosfera: sin vida detectada.</p>';return`<h3>Biosfera</h3><p class="note"><b>Flora:</b> ${b.flora.map(esc).join(' · ')}<br><b>Fauna:</b> ${b.fauna.map(esc).join(' · ')}</p>`}
