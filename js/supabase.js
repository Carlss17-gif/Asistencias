/* js/supabase.js  v7 — Array-based attendance */
const SB_URL = SB_URL_CFG;
const SB_KEY = SB_KEY_CFG;

async function sbFetch(path,method='GET',body=null,xtra={}){
  const h={
    'apikey':SB_KEY,'Authorization':`Bearer ${SB_KEY}`,
    'Content-Type':'application/json',...xtra
  };
  if((method==='POST'||method==='PATCH')&&!h['Prefer']) h['Prefer']='return=representation';
  const r=await fetch(`${SB_URL}/rest/v1/${path}`,{method,headers:h,body:body?JSON.stringify(body):undefined});
  if(r.status===204) return null;
  const txt=await r.text();
  if(!txt||!txt.trim()) return null;
  let d;
  try{d=JSON.parse(txt)}catch{if(r.ok) return null; throw new Error(`HTTP ${r.status}: ${txt.slice(0,120)}`)}
  if(!r.ok) throw new Error(d?.message||d?.hint||JSON.stringify(d).slice(0,200));
  return d;
}

/* LOGIN */
async function sb_login(email,pass){
  const r=await sbFetch(`usuarios?email=eq.${encodeURIComponent(email)}&password_txt=eq.${encodeURIComponent(pass)}&select=*`);
  return r?.length?r[0]:null;
}

/* EMPLEADOS */
async function sb_getEmpleados(sucursal_id){
  return sbFetch(`empleados?sucursal_id=eq.${sucursal_id}&order=numero_empleado`);
}
async function sb_updateEmpleado(id,data){
  return sbFetch(`empleados?id=eq.${id}`,'PATCH',data);
}
async function sb_insertEmpleado(emp){
  // Convert disponibilidad to clean array format before insert
  const payload = {...emp};
  if(payload.disponibilidad && Array.isArray(payload.disponibilidad) && payload.disponibilidad[0]?.dia_semana !== undefined){
    payload.disponibilidad = dispToArray(payload.disponibilidad);
  }
  const r=await sbFetch('empleados','POST',payload);
  return Array.isArray(r)?r[0]:r;
}

/* DISPONIBILIDAD — array de 7 strings en columna empleados.disponibilidad
   Posicion 0=Lun, 1=Mar, 2=Mie, 3=Jue, 4=Vie, 5=Sab, 6=Dom
   Valor: "HH:MM-HH:MM" si trabaja ese dia, null si no trabaja
   Ejemplo: ["08:00-16:00","08:00-16:00",null,"09:00-17:00","08:00-16:00",null,null]
*/
function dispToArray(disponibilidad) {
  // Days order: 0=Lun,1=Mar,2=Mie,3=Jue,4=Vie,5=Sab,6=Dom
  // Note: JS getDay() = 0=Dom,1=Lun...6=Sab — we remap to Mon-first
  const MON_FIRST = [1,2,3,4,5,6,0]; // dia_semana values for Mon..Sun
  return MON_FIRST.map(diaSemana => {
    const d = disponibilidad.find(x => x.dia_semana === diaSemana);
    if(!d || d.disponible === false) return null;
    return `${d.hora_inicio||'08:00'}-${d.hora_fin||'16:00'}`;
  });
}

function arrayToDisp(arr) {
  // Convert back from array to internal format
  const MON_FIRST = [1,2,3,4,5,6,0];
  return (arr||[]).map((val, i) => ({
    dia_semana:  MON_FIRST[i],
    hora_inicio: val ? val.split('-')[0] : '08:00',
    hora_fin:    val ? val.split('-')[1] : '16:00',
    disponible:  val !== null,
  }));
}

async function sb_syncDisponibilidad(empleado_id, disponibilidad){
  if(!empleado_id || !disponibilidad) return;
  const arr = dispToArray(disponibilidad);
  return sbFetch(`empleados?id=eq.${empleado_id}`, 'PATCH',
    { disponibilidad: arr },
    { 'Prefer': 'return=minimal' }
  );
}
async function sb_bulkUpsertEmpleados(records){
  const CHUNK=25;const all=[];
  for(let i=0;i<records.length;i+=CHUNK){
    const chunk=records.slice(i,i+CHUNK).map(({id,...rest})=>rest);
    const r=await sbFetch('empleados','POST',chunk,{'Prefer':'resolution=ignore-duplicates,return=representation'});
    if(r) all.push(...r);
    await _sleep(80);
  }
  // fetch all to get real IDs
  const sucId=records[0]?.sucursal_id;
  if(!sucId) return all;
  return await sb_getEmpleados(sucId)||[];
}

/* ASISTENCIAS — array-based */
async function sb_getAsistencias(sucursal_id,year,month){
  return sbFetch(`asistencias?sucursal_id=eq.${sucursal_id}&year=eq.${year}&month=eq.${month}&select=*`);
}
async function sb_getAsistenciasRange(sucursal_id,year_start,month_start,year_end,month_end){
  // Fetch multiple months
  const results=[];
  let y=year_start,m=month_start;
  while(y<year_end||(y===year_end&&m<=month_end)){
    const r=await sbFetch(`asistencias?sucursal_id=eq.${sucursal_id}&year=eq.${y}&month=eq.${m}&select=*`);
    if(r) results.push(...r);
    m++;if(m>12){m=1;y++;}
  }
  return results;
}
async function sb_upsertAsistencia(record){
  // Strip local string id — Supabase uses its own UUID
  const {id, ...clean} = record;
  // Ensure dias is an array of integers
  if(clean.dias) clean.dias = clean.dias.map(Number);
  return sbFetch('asistencias','POST',clean,{'Prefer':'resolution=merge-duplicates,return=representation'});
}
async function sb_bulkUpsertAsistencias(records){
  const CHUNK=50;let done=0;
  for(let i=0;i<records.length;i+=CHUNK){
    await sbFetch('asistencias','POST',records.slice(i,i+CHUNK),{'Prefer':'resolution=ignore-duplicates,return=minimal'});
    done+=Math.min(CHUNK,records.length-i);
    if(i%(CHUNK*10)===0) await _sleep(200);
  }
  return done;
}

/* HORARIO */
async function sb_getHorarioDetalle(sucursal_id,f1,f2){
  return sbFetch(`horario_detalle?sucursal_id=eq.${sucursal_id}&fecha=gte.${f1}&fecha=lte.${f2}&select=*`);
}
async function sb_bulkUpsertHorarioDetalle(records){
  const CHUNK=50;
  // Strip local string IDs — Supabase generates real UUIDs
  const clean=records.map(({id,...rest})=>rest);
  for(let i=0;i<clean.length;i+=CHUNK){
    await sbFetch('horario_detalle','POST',clean.slice(i,i+CHUNK),{'Prefer':'resolution=ignore-duplicates,return=minimal'});
    await _sleep(50);
  }
}
async function sb_syncHorarios(records){
  try{await sb_bulkUpsertHorarioDetalle(records);return true;}catch(e){console.warn('hd:',e.message);return false;}
}

/* LOAD BRANCH */
async function sb_loadBranch(sucursal_id){
  const now=new Date();
  const [emps,atts]=await Promise.all([
    sb_getEmpleados(sucursal_id),
    // Load last 14 months
    sb_getAsistenciasRange(sucursal_id,2024,6,now.getFullYear(),now.getMonth()+1),
  ]);
  return{empleados:emps||[],asistencias:atts||[]};
}

/* ── IMPORT HISTÓRICO ─────────────────────────────────────────── */
window.sb_importHistorico=async function(){
  if(!window.HISTORICAL_DATA){alert('historical_data.js no cargado');return;}
  const _log=msg=>{
    console.log('[Import]',msg);
    const el=document.getElementById('import-log');
    if(el){el.style.display='block';el.innerHTML+=`<div>${msg}</div>`;el.scrollTop=el.scrollHeight;}
  };
  const _st=(msg,type='info')=>{
    const el=document.getElementById('import-status');if(!el)return;
    el.textContent=msg;
    const c={info:['var(--blue-light)','var(--blue)','var(--blue-border)'],
             success:['var(--ok-bg)','var(--ok)','var(--ok-bd)'],
             error:['var(--err-bg)','var(--err)','var(--err-bd)'],
             warning:['var(--warn-bg)','var(--warn)','var(--warn-bd)']}[type]||[];
    if(c.length){el.style.background=c[0];el.style.color=c[1];el.style.border=`1px solid ${c[2]}`;}
  };
  const{teh_emps,oax_emps,teh_atts,oax_atts}=window.HISTORICAL_DATA;
  try{
    _log(`Paso 1/2 — ${oax_emps.length+teh_emps.length} empleados...`);_st('Insertando empleados...','info');
    const allOax=await sb_bulkUpsertEmpleados(oax_emps);
    _log(`  Oaxaca: ${allOax.length} empleados en BD`);
    const allTeh=await sb_bulkUpsertEmpleados(teh_emps);
    _log(`  Tehuacan: ${allTeh.length} empleados en BD`);

    // Map nombre|apellido|suc → real UUID
    const empMap={};
    [...allOax,...allTeh].forEach(e=>{empMap[`${e.nombre}|${e.apellido_paterno}|${e.sucursal_id}`]=e.id;});
    _log(`  Mapa: ${Object.keys(empMap).length} entradas`);

    const allAtts=[...oax_atts,...teh_atts].map(a=>({
      sucursal_id:a.sucursal_id,
      empleado_id:empMap[`${a.empleado_nombre}|${a.empleado_apellido}|${a.sucursal_id}`]||null,
      empleado_nombre:a.empleado_nombre,
      empleado_apellido:a.empleado_apellido,
      year:a.year,month:a.month,
      dias:a.dias,notas:a.notas||'',archivos:a.archivos||[],
    }));

    _log(`Paso 2/2 — ${allAtts.length} registros de asistencia...`);_st('Insertando asistencias...','info');
    const CHUNK=50;let done=0;
    for(let i=0;i<allAtts.length;i+=CHUNK){
      await sbFetch('asistencias','POST',allAtts.slice(i,i+CHUNK),{'Prefer':'resolution=ignore-duplicates,return=minimal'});
      done+=Math.min(CHUNK,allAtts.length-i);
      const pct=Math.round(done/allAtts.length*100);
      if(done%100===0||done===allAtts.length) _log(`  ${done}/${allAtts.length} (${pct}%)`);
      _st(`Asistencias: ${pct}%`,'info');
      if(i%(CHUNK*20)===0) await _sleep(300);
    }
    _log('✓ Importacion completada.');_st(`Completado: ${allAtts.length} registros`,'success');
  }catch(e){_log(`ERROR: ${e.message}`);_st(`Error: ${e.message}`,'error');console.error(e);}
};

function _sleep(ms){return new Promise(r=>setTimeout(r,ms));}
