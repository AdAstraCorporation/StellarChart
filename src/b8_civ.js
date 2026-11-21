
/* ═════════ Civilizaciones y lore procedural (todo derivado de las semillas) ═════════ */
const CIVSP={temperate:['mamíferos de seis patas','aves sin alas','reptiles de sangre caliente','insectoides sociales','simbiontes vegetales'],ocean:['cefalópodos','cetáceos cantores','arrecifes pensantes','anfibios'],
  desert:['reptiles de escamas cristalinas','artrópodos nómadas','criaturas de sílice'],ice:['mamíferos de pelaje denso','criaturas de amoníaco'],frozen:['entes cristalinos'],lava:['seres de silicio fundido'],
  barren:['colonias subterráneas','máquinas autorreplicantes'],gas:['flotadores gaseosos'],icegiant:['enjambres de hielo']};
const TECH=['Extinta (sólo ruinas)','Tribal','Agrícola','Medieval','Industrial','Atómica','Espacial','Interestelar'];
const GOV=['un consejo de ancianos','una monarquía hereditaria','una teocracia solar','una república de ciudades','una tecnocracia','una mente colmena','una federación de clanes','una inteligencia colectiva'];
const DISP=[['pacífica',2],['curiosa',3],['recelosa',-1],['comerciante',1],['territorial',-2],['hostil',-4]];
const VALUES=['la música','el silencio','los números primos','la memoria de sus muertos','el comercio','la luz de su estrella','el agua','las estrellas fugaces','la geometría','los sueños','la hospitalidad','la caza'];
const EVENTS=['una guerra que duró siglos','una plaga que casi los extingue','una edad de oro de arte y ciencia','la caída de un asteroide','el contacto con viajeros de otra estrella','un cisma religioso','el agotamiento de sus recursos','una migración a los polos'];
const OMEN=['temen que su estrella se esté apagando','esperan el regreso de unos visitantes antiguos','creen que el universo es un sueño compartido','registran cada eclipse desde hace milenios','prohíben mirar hacia cierta constelación','tallan mapas estelares que nadie sabe leer'];
function civInfo(S,i){
  const p=S.planets[i],st=S.star,r=rng(hash(st.h,i,777)),id=st.anchor&&st.anchor.id;
  if(p.name==='Tierra')return{name:'Humanidad',sp:'humanos',tech:6,gov:'naciones federadas bajo la Corporación Ad Astra',disp:0,pop:8.2e9,val:'la curiosidad',hist:['Una especie joven que apenas empieza a viajar entre estrellas.','Su sol pierde brillo por el astrófago y todo su futuro depende de esta misión.'],key:sSeed(st)+':'+i,home:1};
  if(p.name==='Erid')return{name:'Erideanos',sp:'seres de roca que hablan con acordes',tech:6,gov:'una sociedad de ingenieros',disp:0,pop:3e8,val:'la ingeniería',hist:['Viven bajo una atmósfera densa y caliente, sin ver nunca las estrellas.','Su estrella también sufre el astrófago; buscan aliados.'],key:sSeed(st)+':'+i};
  if(id==='sol'||p.name==='Adrian')return null;
  if('OB'.includes(st.P.k)||st.P.k==='WD')return null;
  let pr=p.hz?.6:(p.kind==='temperate'||p.kind==='ocean')?.3:(p.kind==='gas'||p.kind==='icegiant')?.04:.08;if(st.P.k==='M')pr*=.7;if(p.g>2)pr*=.5;
  if(r()>pr)return null;
  const pool=CIVSP[p.kind]||CIVSP.barren,t0=r();let tech=t0<.18?0:1+Math.floor(Math.pow(r(),1.4)*7);if(!p.hz&&tech>5)tech=5;
  const d=Math.floor(r()*DISP.length),name=genName((r()*4e9)>>>0),era=Math.round(2+r()*40)*1000,neighbor=(()=>{let b=null,bd=1e9;starsNear(st.gx,st.gy,st.gz,9,(s,dd)=>{if(dd>.01&&dd<bd){bd=dd;b=s}});return b?starName(b):'una estrella vecina'})();
  const other=S.planets.filter((q,k)=>k!==i);
  const hist=tech===0?[`Hace unos ${fmtI(era)} años, los ${name} levantaron ciudades que hoy son polvo.`,`Sus últimos registros hablan de ${pick2(r,EVENTS)}.`,`Nadie sabe qué los extinguió, pero ${pick2(r,OMEN).replace('temen','temían').replace('esperan','esperaban').replace('creen','creían').replace('registran','registraban').replace('prohíben','prohibían').replace('tallan','tallaban')}.`]
   :[`Los ${name} son ${pick2(r,pool)} gobernados por ${pick2(r,GOV)}.`,`Hace unos ${fmtI(era)} años vivieron ${pick2(r,EVENTS)}.`,`Veneran ${pick2(r,VALUES)} y ${pick2(r,OMEN)}.`+(other.length&&tech>=5?` Han enviado sondas a ${other[Math.floor(r()*other.length)].name}.`:'')+(tech>=6?` Sus telescopios ya conocen ${neighbor}.`:'')];
  return{name,sp:pick2(r,pool),tech,gov:pick2(r,GOV),disp:d,pop:Math.pow(10,4+r()*6),val:pick2(r,VALUES),hist,key:sSeed(st)+':'+i};
}
function pick2(r,a){return a[Math.floor(r()*a.length)]}
function sysLore(S){
  const r=rng(hash(S.star.h,4242)),age=(S.P.k==='M'?8+r()*5:S.P.k==='K'?6+r()*5:S.P.k==='G'?3+r()*7:S.P.k==='F'?1+r()*3:.1+r())
  ,civs=S.planets.map((p,i)=>civInfo(S,i)).filter(Boolean),out=[`Estrella de unos ${age.toFixed(1)} mil millones de años.`];
  if(S.star.anchor)out.push(S.star.anchor.blurb);
  if(civs.length)out.push(civs.length===1?`Alberga a los ${civs[0].name} (${TECH[civs[0].tech].toLowerCase()}).`:`Alberga ${civs.length} civilizaciones: ${civs.map(c=>c.name).join(', ')}.`);
  const q=r();if(q<.15)out.push('En el cinturón flotan restos de una flota de origen desconocido.');else if(q<.25)out.push('Una baliza muy antigua orbita la estrella sin emitir nada.');else if(q<.3)out.push('Las órbitas de sus planetas están en resonancia perfecta, demasiado perfecta.');
  return out;
}
const repOf=c=>D.rep&&c.key in D.rep?D.rep[c.key]:(c.home?60:DISP[c.disp]?DISP[c.disp][1]*10:0);
const repLab=v=>v>=50?'aliados':v>=20?'amistosos':v>-10?'neutrales':v>-40?'desconfiados':'hostiles';
function doCiv(i,a){
  const st=shipStar();if(st.point)return'';const S=genSystem(st),c=civInfo(S,i);if(!c)return'No hay ninguna civilización en ese planeta.';
  D.rep=D.rep||{};let rep=repOf(c);const sp=SPEC[D.ship.d],s=D.st,dc=clamp(10-DISP[c.disp][1]+Math.abs(c.tech-6)*.5|0,6,16);
  if(c.tech===0)return'Sólo quedan ruinas: explóralas desde la superficie.';
  let out='';
  if(a==='contact'){if(D.ex[c.key+':contact'])return`Ya estableciste contacto con los ${c.name}.`;passDays(5);D.ex[c.key+':contact']=1;
    if(c.tech<5){const r=roll('soc',dc-1);rep+=r.ok?15:-10;out=r.ok?`Los ${c.name} os reciben como a seres del cielo. ${c.hist[2]||''}`:`Los ${c.name} huyen o atacan a la lanzadera.${hurt(pick(alive()),10)}`;out+=' '+r.line}
    else{const r=roll('soc',dc);rep+=r.ok?20:-15;out=r.ok?`Tras días de intercambiar señales, los ${c.name} responden. Valoran ${c.val}.`+gainXp(r.m,15):`Los ${c.name} interpretan vuestra llegada como una amenaza.`;
      if(!r.ok&&c.disp>=4){const dmg=8+(Math.random()*12|0);s.hull=Math.max(1,s.hull-dmg);out+=` Disparan: casco −${dmg}%.`}out+=' '+r.line}
    questEvent({type:'contact',civ:c.name})}
  else if(a==='trade'){if(rep<20)return`Los ${c.name} todavía no confían en vosotros.`;if(s.min<15)return'Necesitas al menos 15 t de minerales para comerciar.';passDays(4);s.min-=15;
    if(c.tech>=5&&s.fuel<ENC()){const v=+(ENC()*.15).toFixed(1);s.fuel=Math.min(ENC(),s.fuel+v);out=`Intercambias minerales por ${v} ${EN_U} de energía negativa.`}else{const v=Math.round(sp.prov*.2);s.prov=Math.min(sp.prov,s.prov+v);out=`Intercambias minerales por ${fmtI(v)} días-persona de comida.`}rep+=3}
  else if(a==='recruit'){if(rep<40)return`Hace falta más confianza (${repLab(rep)}).`;if(D.ex[c.key+':rec'])return'Ya se unió alguien de esta civilización.';if(crewCount()>=sp.crew[1])return'No hay sitio a bordo.';
    passDays(3);D.ex[c.key+':rec']=1;const m=genMember(rng(hash(c.key.length,rep,9)),null,c.name);m.bio=`Voluntario de los ${c.name}, ${c.sp}. Valora ${c.val}.`;out=addMember(m)}
  else if(a==='learn'){if(rep<20)return'No compartirán su saber con desconocidos.';if(D.ex[c.key+':learn'])return'Ya aprendiste lo que podían enseñarte.';passDays(10);D.ex[c.key+':learn']=1;
    let xp='';for(const m of alive())xp+=gainXp(m,10+c.tech*3);out=`Los ${c.name} comparten su historia: ${c.hist.join(' ')}${xp}`;rep+=5}
  D.rep[c.key]=clamp(rep,-100,100);saveD();return out;
}
