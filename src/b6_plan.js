
/* ═════════ Plan de viaje: paradas en orden con tareas en cada una ═════════ */
const TASKS={fuel:'Recolectar astrófago',rest:'Descansar',rep:'Reparar casco',scanall:'Escanear todos los planetas',earth:'Reabastecer en la Tierra'};
function getPlan(){if(NET&&NET.role==='client'){NET.myPlan=NET.myPlan||{stops:[]};return NET.myPlan}D.plan=D.plan&&Array.isArray(D.plan.stops)?D.plan:{stops:[]};return D.plan}
const stopStar=s=>starFromSeed(s.s)||pointFromSeed(s.s);
function taskLabel(t,st){if(t.startsWith('explore:')){const i=+t.split(':')[1],S=st&&!st.point?genSystem(st):null;return'Aterrizar y explorar '+(S&&S.planets[i]?S.planets[i].name:'planeta '+i)}
  if(t.startsWith('civ:')){const i=+t.split(':')[1],S=st&&!st.point?genSystem(st):null,c=S&&civInfo(S,i);return'Contactar '+(c?'a los '+c.name:'civilización')}return TASKS[t]||t}
function taskOptions(st){
  if(!st||st.point)return[];const S=genSystem(st),o=[['rest',TASKS.rest],['rep',TASKS.rep],['scanall',TASKS.scanall]];
  if(infected(st))o.unshift(['fuel',TASKS.fuel]);if(st.anchor&&st.anchor.id==='sol')o.push(['earth',TASKS.earth]);
  S.planets.forEach((p,i)=>{if(p.kind!=='gas'&&p.kind!=='icegiant')o.push(['explore:'+i,'Aterrizar y explorar '+p.name]);const c=civInfo(S,i);if(c&&c.tech>0&&!c.home)o.push(['civ:'+i,'Contactar a los '+c.name])});
  return o;
}
function addToPlan(st,task){
  const P=getPlan(),seed=seedOf(st);let stop=P.stops.length&&P.stops[P.stops.length-1].s===seed?P.stops[P.stops.length-1]:null;
  if(!stop){stop={s:seed,a:[]};P.stops.push(stop)}if(task&&!stop.a.includes(task))stop.a.push(task);saveD();
  toast(`Añadido al plan: <b>${esc(starName(st))}</b>${task?' · '+esc(taskLabel(task,st)):''}`,'Ver plan',()=>{toggleDrawer(true);setTab('plan')});
}
/* Simulación del plan completo: rutas entre paradas + recursos estimados con las tareas */
function simulatePlan(){
  const P=getPlan(),sp=SPEC[D.ship.d],s={...D.st},out=[];let from=shipStar(),tot={d:0,tau:0,tE:0,jumps:0},bad='';
  for(const [k,stop] of P.stops.entries()){
    const st=stopStar(stop);if(!st){out.push({stop,err:'Semilla no válida'});bad=bad||'Semilla no válida';continue}
    let legs=[],err='';
    if(!sameStar(from,st)){const path=planRoute(from,st);if(!path)err=`No hay ruta (máx. ${fmtLen(legMax(D.ship.d))} por salto en 400 al)`;else for(let i=0;i<path.length-1;i++)legs.push(legCalc(path[i],path[i+1]))}
    for(const L of legs){if(err)break;tot.d+=L.d;tot.tau+=L.tau;tot.tE+=L.tE;tot.jumps++;const e=(()=>{if(L.d>legMax(D.ship.d)+1e-9&&!D.cr)return'salto demasiado largo';if(D.cr)return'';if(s.fuel+1e-9<L.fuel)return`faltará astrófago antes de ${starName(L.to)}`;if(sp.prov&&s.prov+1e-9<L.prov)return`faltarán provisiones antes de ${starName(L.to)}`;return''})();
      if(e){err=e;break}if(!D.cr){s.fuel-=L.fuel;s.prov-=L.prov}if(sp.solar)s.fuel=sp.tank}
    if(!err)for(const t of stop.a){const c=crewCount();
      if(t==='fuel'&&infected(st)){s.fuel=Math.min(sp.tank,s.fuel+sp.tank*.35);s.prov-=c*30}
      else if(t==='rest')s.prov-=c*10;else if(t==='rep')s.prov-=c*5;else if(t==='scanall')s.prov-=c*8;
      else if(t==='earth'){s.fuel=sp.tank;s.prov=sp.prov}else if(t.startsWith('explore:'))s.prov-=c*15;else if(t.startsWith('civ:'))s.prov-=c*5;
      if(sp.prov)s.prov=Math.max(0,s.prov)}
    out.push({stop,st,legs,err,fuel:s.fuel,prov:s.prov});if(err&&!bad)bad=`Parada ${k+1}: ${err}`;from=st;
  }
  return{rows:out,tot,bad};
}
/* Ejecución automática del plan */
let planRun=null;
function runPlan(){const P=getPlan();if(!P.stops.length){toast('El plan está vacío.');return}cmd({k:'plan',plan:P.stops},'Ejecutar el plan de viaje ('+P.stops.length+' paradas)')}
function startPlanNow(stops){if(travel)return;if(stops)D.plan={stops:stops.map(s=>({s:String(s.s),a:(s.a||[]).map(String)}))};if(!D.plan.stops.length)return;if(pilot)stopPilot();planRun={i:0,stage:'go'};saveD();refresh()}
function stopPlan(msg){planRun=null;if(msg)queueDialog({t:'Plan de viaje',who:null,tx:msg,res:''});refresh()}
function stepPlan(){
  if(!planRun||travel||modalOpen||dq.length)return;const P=D.plan,stop=P.stops[planRun.i];
  if(!stop){stopPlan('Plan completado. Todas las paradas fueron visitadas.');return}
  const st=stopStar(stop);if(!st){stopPlan('Una parada tiene una semilla no válida.');return}
  if(planRun.stage==='go'){
    if(sameStar(shipStar(),st)){planRun.stage='tasks';return}
    const path=planRun.tried?null:planRoute(shipStar(),st);planRun.tried=1;
    if(!path){stopPlan(`No se pudo llegar a ${starName(st)}: no hay ruta posible.`);return}
    route=buildLegs(path);if(route.legs[0].err){const e=route.legs[0].err;route=null;stopPlan(`Plan detenido antes de ${starName(st)}: ${e}.`);return}
    if(mode!=='map')exitToMap();startTravelNow();planRun.stage='wait';return}
  if(planRun.stage==='wait'){planRun.tried=0;if(sameStar(shipStar(),st)){planRun.stage='tasks'}else{stopPlan(`El viaje se detuvo antes de llegar a ${starName(st)}.`)}return}
  if(planRun.stage==='tasks'){
    const msgs=[];for(const t of stop.a)msgs.push('• '+taskLabel(t,st)+': '+execTask(t));
    queueDialog({t:`Parada ${planRun.i+1} de ${P.stops.length}: ${starName(st)}`,who:pick(alive())||null,tx:msgs.join('\n')||'Sin tareas en esta parada.',res:'',next:P.stops[planRun.i+1]?'Siguiente: '+starName(stopStar(P.stops[planRun.i+1])||{name:'?',point:1}):'Última parada.'});
    planRun.i++;planRun.stage='go';saveD();refresh()}
}
function execTask(t){
  if(t.startsWith('explore:'))return exploreAll(+t.split(':')[1]);
  if(t.startsWith('civ:')){const i=+t.split(':')[1],a=[doCiv(i,'contact')];const S=genSystem(shipStar()),c=civInfo(S,i);if(c&&repOf(c)>=20){a.push(doCiv(i,'learn'))}return a.filter(Boolean).join(' ')}
  return doOrbit(t);
}
function exploreAll(i){
  const st=shipStar();if(st.point)return'No hay planeta aquí.';const S=genSystem(st),info=planetInfo(S,i);if(info.gas)return'Es un gigante gaseoso.';
  D.scan[info.key]=1;passDays(SPEC[D.ship.d].land?1:2);const out=[];
  for(const n of info.pois){if(D.ex[info.key+':'+n])continue;const R=resolveExpedition(info,n,bestTeam(POI[n].k));if(R)out.push(`${n}: ${R.ok?'✓':'✗'} ${R.txt}`)}
  return out.length?out.join(' | '):'Nada nuevo por explorar.';
}
function renderPlan(){
  const el=$('#p-plan'),P=getPlan(),sim=simulatePlan(),client=NET&&NET.role==='client';ACTS=[];
  let h=`<div class="kick">PLAN DE VIAJE</div><h2>${P.stops.length?P.stops.length+' parada'+(P.stops.length>1?'s':''):'Sin paradas'}</h2>
  <p class="note">Selecciona una estrella en la carta y pulsa «+ Añadir al plan». En cada parada eliges qué hacer: recolectar astrófago, aterrizar y explorar un planeta, contactar una civilización, descansar… El plan calcula las rutas entre paradas y estima los recursos.</p>`;
  if(planRun)h+=`<p class="ok">▶ Ejecutando: parada ${planRun.i+1} de ${D.plan.stops.length}.</p><div class="row">${A('■ Detener el plan',()=>stopPlan('Plan detenido por la tripulación.'),0,'pri')}</div>`;
  if(P.stops.length){
    h+=`<div class="calc"><span>Distancia</span><span>${fmtLen(sim.tot.d)} · ${sim.tot.jumps} salto${sim.tot.jumps===1?'':'s'}</span><span>Tiempo a bordo</span><span>${fmtT(sim.tot.tau)}</span><span>Tiempo en la Tierra</span><span>${fmtT(sim.tot.tE)}</span><span>Viabilidad</span><span class="${sim.bad?'bad':'ok'}">${sim.bad?esc(sim.bad):'✓ Viable con las tareas previstas'}</span></div>`;
    h+=`<div class="lst">`;
    sim.rows.forEach((r,k)=>{const st=r.st,opts=taskOptions(st);
      h+=`<div class="item col ${r.err?'err':''}"><div class="rowi"><span class="dim">${k+1}</span><div class="m"><b>${st?esc(starName(st)):'?'}</b><i>${r.legs&&r.legs.length?r.legs.length+' salto'+(r.legs.length>1?'s':'')+' · '+fmtLen(r.legs.reduce((a,l)=>a+l.d,0)):'ya en el destino'}${!r.err&&st?` · llegas con ${r.fuel.toFixed(0)} t y ${fmtI(r.prov)} d-p`:''}${r.err?' · '+esc(r.err):''}</i></div>
        ${A('↑',()=>{if(k>0){[P.stops[k-1],P.stops[k]]=[P.stops[k],P.stops[k-1]];saveD();renderPlan()}},k===0)}${A('↓',()=>{if(k<P.stops.length-1){[P.stops[k+1],P.stops[k]]=[P.stops[k],P.stops[k+1]];saveD();renderPlan()}},k===P.stops.length-1)}${A('✕',()=>{P.stops.splice(k,1);saveD();renderPlan()})}</div>
        <div class="hzl">${r.stop.a.map((t,j)=>`<span class="tag">${esc(taskLabel(t,st))} ${A('✕',()=>{r.stop.a.splice(j,1);saveD();renderPlan()})}</span>`).join('')||'<span class="note">Sin tareas: sólo pasar por aquí.</span>'}</div>
        ${opts.length?`<div class="row"><select data-k="${k}"><option value="">+ Añadir tarea…</option>${opts.filter(o=>!r.stop.a.includes(o[0])).map(o=>`<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select></div>`:''}</div>`});
    h+=`</div><div class="row">${A(client?'🗳 Proponer este plan':'▶ Ejecutar plan',runPlan,!!planRun||!!travel,'pri')}${A('Ver en la carta',()=>{const r=sim.rows.find(r=>r.st);if(r)selectStar(r.st,true)})}${A('Vaciar plan',()=>{P.stops=[];saveD();renderPlan()})}</div>`;
  }
  el.innerHTML=h;bindActs(el);
  el.querySelectorAll('select[data-k]').forEach(s=>s.onchange=()=>{if(!s.value)return;P.stops[+s.dataset.k].a.push(s.value);saveD();renderPlan()});
}
