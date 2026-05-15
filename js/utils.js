/* js/utils.js  v7 */
function getLS(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}}
function setLS(k,v){localStorage.setItem(k,JSON.stringify(v))}
function genId(p='x'){return `${p}_${Date.now()}_${Math.random().toString(36).substr(2,6)}`}
function fmtDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function formatDateLong(d){return d.toLocaleDateString('es-MX',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
function getWeekNum(d){const j=new Date(d.getFullYear(),0,1);return Math.ceil((((d-j)/86400000)+j.getDay()+1)/7)}
function getWeekDates(ref){
  const d=new Date(ref),dow=d.getDay(),mon=new Date(d);
  mon.setDate(d.getDate()-(dow===0?6:dow-1));
  return Array.from({length:7},(_,i)=>{const x=new Date(mon);x.setDate(mon.getDate()+i);return x});
}
function daysInMonth(year,month){return new Date(year,month,0).getDate()}
function showToast(msg,type='success'){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.className='toast show'+(type==='error'?' error':type==='warning'?' warning':'');
  clearTimeout(t._t);t._t=setTimeout(()=>t.className='toast',3200);
}
function empFullName(e){return [e.nombre,e.apellido_paterno,e.apellido_materno].filter(Boolean).join(' ')}

function daysInMonth(year,month){return new Date(year,month,0).getDate()}

/**
 * Returns the most recent {year,month} that has actual attendance data in `asistencias`.
 * Falls back to current month if nothing found.
 */
function getMostRecentDataMonth(){
  const now=new Date();
  const curY=now.getFullYear(), curM=now.getMonth()+1;
  if(!asistencias||!asistencias.length) return {year:curY,month:curM};
  // Find all months with data
  const months=new Set();
  asistencias.forEach(a=>{if(a.dias&&a.dias.some(c=>c>0)) months.add(`${a.year}-${a.month}`);});
  if(!months.size) return {year:curY,month:curM};
  // Find most recent
  let bestY=0,bestM=0;
  months.forEach(k=>{
    const[y,m]=k.split('-').map(Number);
    if(y>bestY||(y===bestY&&m>bestM)){bestY=y;bestM=m;}
  });
  return {year:bestY,month:bestM};
}

/**
 * Build a Set of employee identifiers that have activity in a given year+month.
 * If that month has no data, falls back to the most recent month with data.
 */
function buildActiveSet(year, month){
  const set=new Set();
  let hasData=false;
  asistencias.forEach(a=>{
    if(a.year===year&&a.month===month&&a.dias&&a.dias.some(c=>c>0)){
      if(a.empleado_id)     set.add(a.empleado_id);
      if(a.empleado_nombre) set.add(`${a.empleado_nombre}|${a.empleado_apellido}`);
      hasData=true;
    }
  });
  // Fallback: if current month has no data, use most recent available month
  if(!hasData){
    const recent=getMostRecentDataMonth();
    if(recent.year!==year||recent.month!==month){
      asistencias.forEach(a=>{
        if(a.year===recent.year&&a.month===recent.month&&a.dias&&a.dias.some(c=>c>0)){
          if(a.empleado_id)     set.add(a.empleado_id);
          if(a.empleado_nombre) set.add(`${a.empleado_nombre}|${a.empleado_apellido}`);
        }
      });
    }
  }
  return set;
}

function empInSet(emp,set){
  return set.has(emp.id)||set.has(`${emp.nombre}|${emp.apellido_paterno}`);
}

function empVisibleInMonth(emp,year,month,attDias,inActiveSet){
  const mp   =`${year}-${String(month).padStart(2,'0')}`;
  const first=`${mp}-01`;
  const last =`${mp}-${String(daysInMonth(year,month)).padStart(2,'0')}`;
  if(emp.fecha_ingreso&&emp.fecha_ingreso>last)  return false;
  if(!emp.activo&&emp.fecha_baja&&emp.fecha_baja<first) return false;
  if(attDias&&attDias.some(c=>c>0)) return true;
  if(!emp.activo&&emp.fecha_baja&&emp.fecha_baja>=first&&emp.fecha_baja<=last) return true;
  if(emp.activo&&emp.fecha_ingreso&&emp.fecha_ingreso>=first) return true;
  if(inActiveSet) return true;
  return false;
}

function isBajaMonth(emp,year,month){
  if(emp.activo) return false;
  const mp=`${year}-${String(month).padStart(2,'0')}`;
  return emp.fecha_baja&&emp.fecha_baja.startsWith(mp);
}
