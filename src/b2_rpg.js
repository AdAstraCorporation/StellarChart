
/* ═════════ Rol: tripulación ═════════ */
const SPECIES=['Zorro','Lobo','Felino','Dragón','Conejo','Mapache','Nutria','Ciervo','Oso','Hiena','Cuervo','Lagarto','Tigre','Murciélago'];
const SPEMO={Zorro:'🦊',Lobo:'🐺',Felino:'🐱',Dragón:'🐉',Conejo:'🐰',Mapache:'🦝',Nutria:'🦦',Ciervo:'🦌',Oso:'🐻',Hiena:'🐾',Cuervo:'🐦',Lagarto:'🦎',Tigre:'🐯',Murciélago:'🦇',Erideano:'🪨',IA:'🤖'};
const STATS=[['pil','Pilotaje'],['ing','Ingeniería'],['cie','Ciencia'],['med','Medicina'],['seg','Seguridad'],['soc','Diplomacia']];
const STATN=Object.fromEntries(STATS);
const ROLES={pil:'Piloto',ing:'Ingeniería',cie:'Ciencia',med:'Medicina',seg:'Seguridad',soc:'Comunicaciones'};
const TRAITS={
 Valiente:{d:'+1 Seguridad. No pierde moral ante el peligro.',m:{seg:1}},
 Curioso:{d:'+1 Ciencia. Gana moral extra al descubrir algo.',m:{cie:1}},
 Cauteloso:{d:'Recibe la mitad de daño en expediciones.',m:{}},
 Optimista:{d:'Su moral baja la mitad durante los viajes.',m:{}},
 'Gruñón':{d:'+1 Ingeniería, pero empeora las discusiones.',m:{ing:1}},
 'Carismático':{d:'+1 Diplomacia.',m:{soc:1}},
 'Manos firmes':{d:'+1 Pilotaje y +1 Medicina.',m:{pil:1,med:1}},
 Insomne:{d:'Mayor riesgo durante la hibernación.',m:{}},
 Veterano:{d:'+1 a Pilotaje, Seguridad e Ingeniería.',m:{pil:1,seg:1,ing:1}}};
const FIRST=['Kael','Nira','Tavo','Mira','Rook','Sela','Bram','Ivy','Oren','Lys','Dax','Tamsin','Ezra','Vela','Juno','Pax','Rin','Nox','Ada','Kiri','Mako','Zev','Lumi','Ori','Tess','Bao','Inés','Mateo','Lucía','Kenji','Amara','Odín','Saya','Tobías'];
const ORIG=['Criado en los anillos de Marte','Hijo de mineros de Ceres','Ex piloto de carreras orbitales','Investigador de la Universidad Lunar','Veterano de la Guardia de Europa','Nacido en una estación de Titán','Antiguo contrabandista redimido','Médico de campaña en Venus Alta'];
const MOTV=['busca un hogar para su familia','quiere ver otro sol antes de morir','persigue una vieja leyenda','firmó con Ad Astra para saldar una deuda','cree que Tau Ceti guarda la respuesta','huye de algo que no cuenta','sueña con nombrar un planeta'];
let crewId=1;
function genMember(r,role,sp){
  role=role||Object.keys(ROLES)[r()*6|0];const s={};for(const [k] of STATS)s[k]=2+(r()*4|0);s[role]=Math.min(9,s[role]+3+(r()*2|0));
  const tr=Object.keys(TRAITS)[r()*9|0];
  return{id:Date.now().toString(36)+(crewId++),nm:FIRST[r()*FIRST.length|0]+' '+genName((r()*1e9)>>>0),sp:sp||SPECIES[r()*SPECIES.length|0],role,s,tr,hp:100,mor:75+(r()*20|0),xp:0,lv:tr==='Veterano'?2:1,st:'ok',bio:`${ORIG[r()*ORIG.length|0]}; ${MOTV[r()*MOTV.length|0]}.`};
}
function newCrew(d){const sp=SPEC[d],r=rng((Math.random()*4e9)>>>0),n=Math.min(6,sp.c0),order=['pil','ing','cie','med','seg','soc'];
  const c=[];for(let i=0;i<n;i++)c.push(genMember(r,order[i]));return{c,extra:Math.max(0,sp.c0-n)}}
if(!D.st)D.st=freshState(D.ship.d);
if(!Array.isArray(D.crew)){const n=newCrew(D.ship.d);D.crew=n.c;D.st.extra=n.extra}
/* Estados: ok · susp (animación suspendida: fuera de la ronda, a bordo) · perdido */
const alive=()=>D.crew.filter(m=>m.st!=='perdido'&&m.st!=='susp');
const aboard=()=>D.crew.filter(m=>m.st!=='perdido');
const suspended=()=>D.crew.filter(m=>m.st==='susp'&&!m.bz); // en criosueño a bordo
const enBase=()=>D.crew.filter(m=>m.st==='susp'&&m.bz); // destinados en una base o colonia: fuera de la nave y de la ronda
const crewCount=()=>alive().length+(D.st.extra|0);
const eaters=()=>crewCount()+suspended().length*.15; // en criosueño comen un 15 %
const eff=(m,k)=>m.s[k]+((TRAITS[m.tr]||{m:{}}).m[k]||0)+Math.floor((m.lv-1)/2)+(m.hp<50?-2:0)+(m.mor<30?-1:0)+(typeof gearB==='function'?gearB(m,k):0);
const okImg=s=>typeof s==='string'&&/^(data:image\/(webp|jpeg);base64,[A-Za-z0-9+/=]+|https:\/\/[^\s"'<>]+)$/.test(s);
const portrait=m=>m?(okImg(m.ph)?`<span class="pt"><img src="${esc(m.ph)}" alt="${esc(m.nm)}"></span>`:`<span class="pt" title="${esc(m.sp)}">${SPEMO[m.sp]||'🐾'}</span>`):'<span class="pt">🤖</span>';
const AI={nm:'IA de a bordo',sp:'IA',s:{pil:5,ing:5,cie:5,med:3,seg:3,soc:3},tr:'',lv:1,hp:100,mor:100};
function best(k,team){const c=(team&&team.length?team:alive().filter(m=>m.hp>0));if(!c.length)return{m:AI,v:AI.s[k]};let b=c[0],v=eff(b,k);for(const m of c){const e=eff(m,k);if(e>v){v=e;b=m}}return{m:b,v}}
const chance=(k,dc,team,luck)=>{const b=best(k,team).v+((team&&team.length>1)?team.length-1:0)+(luck|0);return clamp((11-(dc-b))/10,0,1)};
function roll(k,dc,team,luck){
  luck=luck|0;const b=best(k,team),bonus=(team&&team.length>1)?team.length-1:0,d=1+(Math.random()*10|0),tot=b.v+d+bonus+luck,ok=tot>=dc;
  return{ok,crit:d===10,fumble:d===1,m:b.m,line:`🎲 ${d} + ${b.v} (${esc(b.m.nm)}, ${STATN[k]})${bonus?` + ${bonus} equipo`:''}${luck?` ${luck>0?'+':'−'} ${Math.abs(luck)} fortuna`:''} = ${tot} vs ${dc} ${ok?'✓':'✗'}`};
}
function gainXp(m,n){if(!m||m===AI||m.st==='perdido'||m.st==='susp')return'';m.xp+=n;let out='';while(m.xp>=30*m.lv){m.xp-=30*m.lv;m.lv++;m.s[m.role]=Math.min(12,m.s[m.role]+1);out+=` ${m.nm} sube a nivel ${m.lv}.`}return out}
function hurt(m,n){if(!m||m===AI)return'';if(m.tr==='Cauteloso')n=Math.round(n/2);m.hp=Math.max(5,m.hp-n);return` ${m.nm} resulta herido (−${n} salud).`}
function morAll(n){for(const m of alive()){let v=n;if(n<0&&m.tr==='Optimista')v=Math.round(n/2);if(n<0&&m.tr==='Valiente'&&n>-8)v=0;m.mor=clamp(m.mor+v,0,100)}}
const pick=a=>a[Math.random()*a.length|0];
function addMember(src){if(alive().length>=8){D.st.extra++;return'Se une a la tripulación general.'}const m=src||genMember(rng((Math.random()*4e9)>>>0));D.crew.push(m);return`${m.nm} (${m.sp}, ${ROLES[m.role]}) se une a la tripulación.`}
/* Un PNJ quiere unirse: la tripulación decide (o vota, en sala) si lo acepta */
function offerMember(src,why){const m=src||genMember(rng((Math.random()*4e9)>>>0));
  queueDialog({ev:{t:'¿Se une a la tripulación?',tx:`${why?why+': ':''}${m.nm} (${m.sp}, ${ROLES[m.role]}, ${m.tr}) pide subir a bordo.`,
    op:[{l:'Aceptarle a bordo',run:()=>addMember(m)},{l:'Rechazarle',run:()=>`${m.nm} se queda atrás.`}]},ctx:{}});return` ${m.nm} pide unirse: decidid si sube.`}
function loseRandom(){const a=alive();if(D.st.extra>0&&Math.random()<D.st.extra/(D.st.extra+a.length)){D.st.extra--;return'Un miembro de la tripulación general'}if(!a.length)return'';const m=pick(a);m.st='perdido';m.hp=0;return m.nm}
const LINES={
 Valiente:['Si algo sale mal, yo voy primero.','Esto se pone interesante.'],Curioso:['¡Mira esa corona! Quiero muestras de todo.','¿Te das cuenta de que nadie ha visto esto antes?'],
 Cauteloso:['Revisemos los sensores dos veces.','No me gusta ese silencio en la radio.'],Optimista:['¡Otro sol nuevo! Cada vez estamos más cerca.','Vamos bien, de verdad.'],
 'Gruñón':['El reactor hace un ruido raro. Otra vez.','Nadie limpia la cocina en esta nave.'],'Carismático':['Si hay alguien ahí fuera, déjenme hablar a mí.','Brindemos por la tripulación.'],
 'Manos firmes':['Trayectoria estable. Sin sobresaltos.','Todo en orden en la enfermería.'],Insomne:['No he dormido desde el último salto…','Las estrellas no se apagan nunca aquí.'],Veterano:['He visto cosas peores.','Mantengan la calma y la disciplina.']};
function crewChatter(){const a=alive();if(!a.length||Math.random()>.4)return;const m=pick(a);const l=LINES[m.tr];if(l)toast(`${SPEMO[m.sp]||''} <b>${esc(m.nm)}</b>: «${esc(pick(l))}»`)}

/* ═════════ Planetas: atmósfera, condiciones anómalas y puntos de interés ═════════ */
const ATM={lava:['Azufre y CO₂',0],desert:['CO₂ tenue',0],ocean:['N₂/O₂ húmeda',1],temperate:['N₂/O₂',1],ice:['N₂ muy fina',0],frozen:['Ninguna',0],barren:['Ninguna',0],gas:['H₂/He',0],icegiant:['H₂/He/CH₄',0]};
const ANOM=[['Tormenta de iones','ing','Los sistemas electrónicos fallan a ratos.'],['Anomalía electromagnética','cie','Las brújulas giran sin control.'],['Niebla de esporas','med','Las esporas causan alucinaciones leves.'],
  ['Ecos temporales','cie','Los relojes del equipo no coinciden.'],['Cristales cantores','soc','Un zumbido constante altera los nervios.'],['Sismos periódicos','pil','El suelo se mueve cada pocas horas.'],['Fauna territorial','seg','Algo vigila desde las sombras.']];
const POI={
 'Depósito mineral':{k:'ing',dc:9,days:4,lo:{min:[20,45]},tx:'Vetas metálicas a cielo abierto.'},
 'Cueva profunda':{k:'seg',dc:11,days:5,lo:{min:[10,25],prov:[.03,.06]},tx:'Un sistema de túneles que baja hacia el calor.'},
 'Ruinas antiguas':{k:'cie',dc:13,days:6,lo:{xp:25,lore:1,min:[5,15]},tx:'Estructuras geométricas imposibles de datar.'},
 'Flora comestible':{k:'med',dc:10,days:4,lo:{prov:[.08,.15]},tx:'Plantas con azúcares compatibles con nuestra biología.'},
 'Restos de una nave':{k:'ing',dc:12,days:5,lo:{fuel:[.05,.12],min:[10,30]},tx:'Un casco desconocido semienterrado.'},
 'Fuente termal':{k:'cie',dc:10,days:3,lo:{xp:15,mor:10},tx:'Agua caliente y vapor: un buen lugar para descansar.'},
 'Señal enterrada':{k:'soc',dc:12,days:4,lo:{xp:20,lore:1},tx:'Una baliza todavía emite un patrón regular.'},
 'Nido de fauna':{k:'seg',dc:14,days:5,lo:{prov:[.1,.2],xp:20},tx:'Criaturas grandes y nerviosas.'},
 'Hielo puro':{k:'ing',dc:8,days:3,lo:{prov:[.04,.08]},tx:'Glaciares de agua casi pura.'},
 'Cristales de astrófago':{k:'cie',dc:13,days:5,lo:{fuel:[.1,.25]},tx:'Depósitos oscuros que absorben la luz: astrófago latente.'},
 'Asentamiento':{k:'soc',dc:9,days:3,lo:{crew:1,mor:12,prov:[.05,.1]},tx:'Una colonia pequeña que recibe visitas con recelo.'},
 'Géiser de lava':{k:'pil',dc:12,days:3,lo:{min:[25,50]},tx:'Hay que volar entre columnas de roca fundida.'}};
const KPOI={lava:['Géiser de lava','Depósito mineral','Restos de una nave','Ruinas antiguas'],desert:['Ruinas antiguas','Depósito mineral','Restos de una nave','Señal enterrada','Cueva profunda'],
 ocean:['Flora comestible','Nido de fauna','Fuente termal','Ruinas antiguas'],temperate:['Flora comestible','Nido de fauna','Ruinas antiguas','Cueva profunda','Fuente termal','Señal enterrada'],
 ice:['Hielo puro','Cueva profunda','Restos de una nave','Señal enterrada'],frozen:['Hielo puro','Cristales de astrófago','Restos de una nave'],barren:['Depósito mineral','Cristales de astrófago','Restos de una nave','Cueva profunda']};
const LORE=['Los grabados muestran una estrella que se oscurece y una flota que parte hacia otra.','La baliza repite coordenadas que apuntan a Tau Ceti, una y otra vez.',
 'Encuentran un mapa estelar tallado: el Sol aparece marcado con un círculo roto.','Los restos hablan de una especie que cosechaba la luz de su estrella.',
 'Un diario en un idioma desconocido termina con un dibujo de dos manos, de especies distintas, unidas.','La estructura canta cuando la atraviesa el viento: alguien la diseñó así.',
 'Bajo la arena aparece un jardín fosilizado, ordenado en anillos perfectos.','Una cápsula sellada contiene semillas que todavía están vivas.'];
function isColony(S,i,p){return p.name==='Tierra'||!!p.fiction||(p.hz&&hash(S.star.h,i,99)%3===0)}
function planetInfo(S,i){
  const p=S.planets[i],r=rng(hash(S.star.h,i,555)),atm=ATM[p.kind]||['?',0],hz=[];
  if(p.T>400)hz.push(['Calor extremo','med',3,'Los trajes apenas aguantan.']);
  if(p.T<200)hz.push(['Frío extremo','ing',2,'Las baterías se agotan rápido.']);
  if(p.g>1.5)hz.push(['Gravedad alta','pil',2,'Cada paso cuesta el doble.']);
  if(!atm[1])hz.push(['Sin aire respirable','ing',1,'Soporte vital obligatorio.']);
  if('OBA'.includes(S.P.k)||p.a<.15)hz.push(['Radiación','med',2,'Dosis alta en superficie.']);
  if(r()<.25){const a=ANOM[r()*ANOM.length|0];hz.push([a[0],a[1],2,a[2],1])}
  const gas=p.kind==='gas'||p.kind==='icegiant',pois=[];
  if(!gas){const pool=(KPOI[p.kind]||KPOI.barren).slice(),n=2+(r()*3|0);for(let k=0;k<n&&pool.length;k++)pois.push(pool.splice(r()*pool.length|0,1)[0]);if(isColony(S,i,p))pois.push('Asentamiento')}
  return{p,i,atm:atm[0],breath:!!atm[1],hz,pois,gas,colony:isColony(S,i,p),key:sSeed(S.star)+':'+i};
}

/* ═════════ Eventos aleatorios (con decisiones y tiradas) ═════════ */
const EV=[
 {id:'socorro',w:3,at:'leg',t:'Señal de socorro',tx:'Una baliza débil pide ayuda desde una cápsula a la deriva. Podría ser una trampa.',
  op:[{l:'Acercarse a rescatar',k:'seg',dc:11,ok:()=>'Encuentran a una superviviente congelada.'+offerMember(null,'Superviviente rescatada'),ko:()=>'Era chatarra con una carga inestable.'+hurt(pick(alive()),20)+(()=>{D.st.hull=Math.max(1,D.st.hull-8);return' Casco −8%.'})()},
      {l:'Ignorarla',run:()=>{morAll(-6);return'La tripulación guarda silencio durante días. Moral −6.'}}]},
 {id:'meteoros',w:4,at:'leg',t:'Lluvia de micrometeoroides',tx:'El radar detecta una nube de polvo de alta velocidad justo en la trayectoria.',
  op:[{l:'Maniobrar a mano',k:'pil',dc:12,ok:()=>'Un pilotaje impecable. Ni un rasguño.',ko:()=>{const d=10+(Math.random()*12|0);D.st.hull=Math.max(1,D.st.hull-d);return`Impactos en el casco: −${d}%.`}},
      {l:'Reforzar blindaje (10 t minerales)',need:()=>D.st.min>=10,run:()=>{D.st.min-=10;return'Las placas extra absorben los impactos.'}}]},
 {id:'reactor',w:3,at:'leg',t:'Fluctuación en el motor de astrófago',tx:'La temperatura de los tanques sube. Si el astrófago se calienta demasiado, se pierde.',
  op:[{l:'Reparar en caliente',k:'ing',dc:13,ok:()=>'Reparado. El motor suena mejor que nunca.',ko:()=>{const f=Math.round(D.st.fuel*.12);D.st.fuel-=f;return`Se ventean ${f} t de astrófago.`+hurt(pick(alive()),15)}},
      {l:'Dejar que la IA estabilice',run:()=>{const f=Math.round(D.st.fuel*.06);D.st.fuel-=f;return`La IA purga ${f} t para enfriar los tanques.`}}]},
 {id:'enfermedad',w:2,at:'arr',cond:()=>alive().length>=2,t:'Brote a bordo',tx:'Varios tripulantes tienen fiebre. Puede venir de las muestras recogidas.',
  op:[{l:'Tratarlo en la enfermería',k:'med',dc:12,ok:()=>{morAll(4);return'Diagnóstico rápido y tratamiento eficaz. Moral +4.'},ko:()=>{let s='';for(const m of alive())if(Math.random()<.5)s+=hurt(m,15);return'El tratamiento tarda.'+s}},
      {l:'Cuarentena (15 días)',run:()=>{passDays(15);return'Quince días de aislamiento. Nadie más enferma.'}}]},
 {id:'discusion',w:3,at:'any',cond:()=>alive().length>=2,t:'Discusión en la tripulación',tx:()=>{const a=alive();return`${a[0].nm} y ${a[a.length-1].nm} discuten a gritos por el reparto de raciones.`},
  op:[{l:'Mediar',k:'soc',dc:11,ok:()=>{morAll(8);return'Se dan la mano. Moral +8.'},ko:()=>{morAll(alive().some(m=>m.tr==='Gruñón')?-12:-8);return'La tensión empeora.'}},
      {l:'Imponer disciplina',k:'seg',dc:9,ok:()=>{morAll(-2);return'Vuelve el orden, a regañadientes.'},ko:()=>{morAll(-10);return'Nadie acepta la orden. Moral −10.'}}]},
 {id:'anomalia',w:2,at:'arr',t:'Anomalía gravitacional',tx:'Los sensores registran una lente gravitacional donde no hay ninguna masa visible.',
  op:[{l:'Estudiarla',k:'cie',dc:13,ok:(c,r)=>{D.st.min=Math.min(SPEC[D.ship.d].cargo,D.st.min+20);morAll(5);return'Datos únicos y fragmentos exóticos: +20 t de minerales.'+gainXp(r.m,20)},ko:()=>{D.st.hull=Math.max(1,D.st.hull-10);return'La marea gravitacional tuerce el casco: −10%.'}},
      {l:'Rodearla',run:()=>'Prudencia ante todo.'}]},
 {id:'contenedor',w:3,at:'leg',t:'Contenedor a la deriva',tx:'Un módulo de carga sin marcas gira lentamente frente a la nave.',
  op:[{l:'Abrirlo',k:'ing',dc:9,ok:()=>{const sp=SPEC[D.ship.d];D.st.min=Math.min(sp.cargo,D.st.min+15);D.st.prov=Math.min(sp.prov,D.st.prov+sp.prov*.06);return'Suministros y repuestos útiles.'+(Math.random()<.5?' Entre ellos hay algo con dueño.'+giveItem(pick(FK)+'.'+pick(['contra','tec','uniforme','reliquia'])):'')},ko:()=>{D.st.hull=Math.max(1,D.st.hull-6);return'Un mecanismo de seguridad explota: casco −6%.'}},
      {l:'Dejarlo',run:()=>'Sigue girando a su suerte.'}]},
 {id:'transmision',w:2,at:'arr',t:'Transmisión desconocida',tx:'Un patrón de pulsos repetido, demasiado regular para ser natural.',
  op:[{l:'Descifrarla',k:'soc',dc:12,ok:(c,r)=>{morAll(6);return'«'+pick(LORE)+'»'+gainXp(r.m,20)},ko:()=>'Ruido. Sólo ruido. ¿O no?'},{l:'Grabarla y seguir',run:()=>'Queda archivada en la bitácora.'}]},
 {id:'fulgor',w:2,at:'arr',cond:c=>c.star&&c.star.P.k==='M',t:'Fulguración estelar',tx:'La enana roja lanza una llamarada justo cuando llegan.',
  op:[{l:'Desviar energía a los escudos',k:'ing',dc:11,ok:()=>'Los escudos aguantan.',ko:()=>{let s='';for(const m of alive())s+=hurt(m,10);return'La radiación atraviesa el casco.'+s}},{l:'Refugiarse en el núcleo',run:()=>{passDays(3);return'Tres días encerrados, pero a salvo.'}}]},
 {id:'polizon',w:1,at:'any',t:'Polizón',tx:'Aparece alguien escondido en la bodega. Dice que sólo quería ver las estrellas.',
  op:[{l:'Aceptarle en la tripulación',run:()=>addMember()},{l:'Ponerle en hibernación hasta volver',run:()=>'Duerme en una cápsula de repuesto.'}]},
 {id:'mercader',w:2,at:'arr',t:'Mercader errante',tx:'Una nave comercial independiente propone un trueque.',
  op:[{l:'20 t minerales → provisiones',need:()=>D.st.min>=20,run:()=>{const sp=SPEC[D.ship.d];D.st.min-=20;D.st.prov=Math.min(sp.prov,D.st.prov+sp.prov*.2);return'Trato hecho.'}},
      {l:'20 t minerales → astrófago',need:()=>D.st.min>=20,run:()=>{const sp=SPEC[D.ship.d];D.st.min-=20;D.st.fuel=Math.min(sp.tank,D.st.fuel+sp.tank*.15);return'Trato hecho.'}},
      {l:'Regatear',k:'soc',dc:12,ok:()=>{const sp=SPEC[D.ship.d];D.st.fuel=Math.min(sp.tank,D.st.fuel+sp.tank*.1);return'Te regala astrófago por la conversación.'},ko:()=>'Se ofende y se marcha.'}]},
 {id:'fiesta',w:2,at:'leg',cond:()=>alive().length>=2&&!D.hib,t:'Aniversario de la misión',tx:'Alguien recuerda que hoy se cumple otro año desde el despegue.',
  op:[{l:'Celebrar (gasta provisiones)',run:()=>{D.st.prov=Math.max(0,D.st.prov-crewCount()*5);morAll(15);return'Música, comida y anécdotas. Moral +15.'}},{l:'Seguir trabajando',run:()=>{morAll(-3);return'Un día más.'}}]},
 {id:'criogenia',w:3,at:'leg',cond:()=>D.hib&&SPEC[D.ship.d].hib&&alive().length>0,t:'Fallo de criogenia',tx:'Una cápsula de coma marca una caída de constantes vitales.',
  op:[{l:'Despertar a la médica de guardia',k:'med',dc:13,ok:()=>'Estabilizado a tiempo.',ko:()=>{const m=pick(alive());return hurt(m,40)}},{l:'Confiar en la IA',k:'med',dc:15,ok:()=>'La IA lo logra.',ko:()=>{const who=loseRandom();return who?`${who} no despertó del coma.`:''}}]},
 {id:'mascota',w:1,at:'leg',t:'Algo se mueve en la bodega',tx:'Ruidos en los conductos. Las muestras de un planeta parecen haberse… escapado.',
  op:[{l:'Atraparlo',k:'seg',dc:10,ok:()=>{morAll(10);return'Es pequeño, peludo y ronronea. Ahora es la mascota de la nave. Moral +10.'},ko:()=>hurt(pick(alive()),8)+' Muerde.'},{l:'Sellar la bodega',run:()=>'Silencio… por ahora.'}]},
 {id:'lluvia',w:1,at:'arr',cond:c=>c.star&&PETROVA.has(c.star.P.k),t:'Nube de astrófago',tx:'La nave atraviesa una corriente de astrófago migrando hacia la estrella.',
  op:[{l:'Abrir los colectores',k:'pil',dc:10,ok:()=>{const sp=SPEC[D.ship.d];D.st.fuel=Math.min(sp.tank,D.st.fuel+sp.tank*.2);return'Tanques +20%.'},ko:()=>'Demasiado rápida. Se escapa.'}]}];
function pickEvent(at,c){if(typeof facEvent==='function'&&Math.random()<.38){const fe=facEvent(at,c);if(fe&&fe.op.length)return fe}const pool=EV.filter(e=>(e.at===at||e.at==='any')&&(!e.cond||e.cond(c)));let w=pool.reduce((a,e)=>a+e.w,0)*Math.random();for(const e of pool){w-=e.w;if(w<=0)return e}return null}

/* ═════════ Misiones e historia ═════════ */
const QUESTS=[
 {t:'Primer salto',d:'Sal del Sistema Solar y llega a otra estrella.',chk:()=>HF('salto'),
  rw:()=>{D.st.min+=20;return'+20 t de minerales'},story:'Por primera vez, el Sol es sólo una estrella más en la ventanilla. La tripulación se queda mirando un buen rato sin decir nada.'},
 {t:'La línea Petrova',d:'Recolecta astrófago en la corona de una estrella.',chk:()=>HF('harv'),
  rw:()=>{morAll(8);return'Moral +8'},story:'Los colectores brillan con un resplandor infrarrojo. Si el astrófago puede cultivarse aquí, podemos seguir avanzando.'},
 {t:'Destino: Tau Ceti',d:'Llega al sistema de Tau Ceti (11,9 al).',chk:()=>HF('tceti'),
  rw:()=>{const sp=SPEC[D.ship.d];D.st.prov=Math.min(sp.prov,D.st.prov+sp.prov*.2);return'+20% provisiones'},story:'Tau Ceti no se está apagando. Alrededor de la estrella, algo mantiene a raya al astrófago. La respuesta está en Adrian.'},
 {t:'Superficie de Adrian',d:'Explora con éxito un punto de interés en Adrian.',chk:()=>HF('adrian'),
  rw:()=>{for(const m of alive())gainXp(m,15);return'+15 XP a toda la tripulación'},story:'Las muestras de la atmósfera de Adrian contienen algo vivo que se alimenta del astrófago. Un depredador natural. Esperanza.'},
 {t:'El eco de 40 Eridani',d:'Viaja a 40 Eridani A y entra en su sistema.',chk:()=>HF('eri'),
  rw:()=>offerMember({...genMember(rng(4040),'ing','Erideano'),nm:'Eko de Erid',tr:'Veterano'},'El eco de 40 Eridani').trim(),story:'Una nave de diseño imposible se acerca. Su tripulante se comunica con acordes musicales. Tras días de intercambiar números y notas, pide unirse a la misión.'},
 {t:'Cartógrafo',d:'Registra 10 sistemas.',chk:()=>Object.keys(D.disc).length>=10,rw:()=>{D.st.min+=40;return'+40 t de minerales'},story:'La carta de Ad Astra crece. Cada punto nuevo es un lugar que nadie había nombrado.'},
 {t:'Explorador de Ad Astra',d:'Registra 30 sistemas y recorre 100 al.',chk:()=>Object.keys(D.disc).length>=30&&D.st.ly>=100,rw:()=>{morAll(20);return'Moral +20'},story:'La Corporación Ad Astra te nombra Explorador de Primera Clase. Pero el universo sigue sin tener bordes.'}];
/* Logros de la historia: se recuerdan aunque su misión todavía no toque (p. ej. llegar a Tau Ceti antes de tiempo).
   Así la misión se cumple en cuanto le llega el turno y la historia nunca se bloquea. */
const HF=k=>!!(D.hf&&D.hf[k]);
function questMark(e){const h=D.hf||(D.hf={}),a=e.star&&e.star.anchor&&e.star.anchor.id;
  if(e.type==='arrive'&&!(a==='sol'))h.salto=1;if((e.type==='arrive'||e.type==='enter')&&a==='tceti')h.tceti=1;if(e.type==='enter'&&a==='40eri')h.eri=1;
  if(e.type==='poi'&&e.planet==='Adrian')h.adrian=1;if(e.type==='harvest'&&e.what==='fuel')h.harv=1;
  if(e.type==='tick'&&typeof shipStar==='function'){const s=shipStar(),b=s&&s.anchor&&s.anchor.id;if(b==='tceti')h.tceti=1;if(b&&b!=='sol')h.salto=1;if(b==='40eri'&&mode==='system')h.eri=1}}
function questEvent(e){
  if(typeof NET!=='undefined'&&NET.role==='client')return; /* en la sala manda el anfitrión: sus avisos llegan por la red */
  questMark(e);let q=QUESTS[D.q];if(!q||!q.chk(e))return;const rw=q.rw();D.q++;saveD();
  queueDialog({t:'Misión cumplida: '+q.t,who:pick(alive())||null,tx:q.story,res:'Recompensa: '+rw,next:QUESTS[D.q]?'Nueva misión: '+QUESTS[D.q].t:''});
  questEvent({type:'tick'});
}
