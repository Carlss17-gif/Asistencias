/* js/asistencia.js  v7 */
let selYear  = new Date().getFullYear();
let selMonth = new Date().getMonth()+1;
let modalState = {};

function _getAttDias(emp, year, month){
  const rec = asistencias.find(a=>
    (a.empleado_id===emp.id || (a.empleado_nombre===emp.nombre && a.empleado_apellido===emp.apellido_paterno && (!a.sucursal_id||a.sucursal_id===emp.sucursal_id)))
    && a.year===year && a.month===month);
  return rec?.dias || null;
}

function renderAsistencia(){
  if(currentUser?.rol==='admin'){renderAdmin();return;}

  const nDays    = daysInMonth(selYear,selMonth);
  const todayStr = fmtDate(new Date());
  const isCurMon = new Date().getFullYear()===selYear && new Date().getMonth()+1===selMonth;
  const mp       = `${selYear}-${String(selMonth).padStart(2,'0')}`;

  const activeSet = buildActiveSet(selYear, selMonth);

  const visible = empleados.filter(e=>
    (!currentSucursal || !e.sucursal_id || e.sucursal_id===currentSucursal.id) &&
    empVisibleInMonth(e, selYear, selMonth, _getAttDias(e,selYear,selMonth), empInSet(e,activeSet))
  );

  const days = Array.from({length:nDays},(_,i)=>i+1);
  const DOW  = ['D','L','M','X','J','V','S'];
  const monthLabel = `${MONTHS_ES[selMonth]} ${selYear}`;

  let totA=0,totF=0,totI=0,totD=0;
  visible.forEach(emp=>{
    const dias=_getAttDias(emp,selYear,selMonth)||[];
    dias.forEach(c=>{if(c===1)totA++;else if(c===2)totF++;else if(c===3)totI++;else if(c===4)totD++;});
  });

  const dayHeaders = days.map(d=>{
    const dt=new Date(selYear,selMonth-1,d);
    const ds=`${mp}-${String(d).padStart(2,'0')}`;
    const isWknd=dt.getDay()===0||dt.getDay()===6;
    return `<th class="th-day${ds===todayStr?' is-today':''}${isWknd?' is-wknd':''}"
      title="${dt.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'})}">
      <div>${d}</div><div style="font-size:9px;font-weight:400">${DOW[dt.getDay()]}</div>
    </th>`;
  }).join('');

  const rows = visible.map(emp=>{
    const dias=_getAttDias(emp,selYear,selMonth)||Array(nDays).fill(0);
    const isBaja=isBajaMonth(emp,selYear,selMonth);
    let nA=0,nF=0,nI=0;
    const ingDay = emp.fecha_ingreso&&emp.fecha_ingreso.startsWith(mp)
      ? parseInt(emp.fecha_ingreso.split('-')[2]) : 0;

    const cells=days.map((d,i)=>{
      const code=dias[i]||0;
      const ds=`${mp}-${String(d).padStart(2,'0')}`;
      const dt=new Date(selYear,selMonth-1,d);
      const isWknd=dt.getDay()===0||dt.getDay()===6;
      const isFut=ds>todayStr, isToday=ds===todayStr;
      if(ingDay>0&&d<ingDay) return `<td class="td-day" style="${isWknd?'background:var(--border-lt)':''}"><div style="width:20px;height:20px;margin:0 auto"></div></td>`;
      if(code===1)nA++;else if(code===2)nF++;else if(code===3)nI++;
      const tip=`${dt.toLocaleDateString('es-MX',{weekday:'short',day:'numeric',month:'short'})} — ${CODE_LABEL[code]||'Sin registro'}`;
      return `<td class="td-day" style="${isWknd?'background:var(--border-lt)':''}">
        <div class="day-block ${CODE_CLASS[code]}${isFut?' is-future':''}${isToday?' is-today':''}"
          onclick="${isFut?'':` openStatusModal('${emp.id}',${d})`}" title="${tip}"></div>
      </td>`;
    }).join('');

    return `<tr>
      <td class="td-name">
        <div class="emp-full-name${isBaja?' emp-name-baja':''}">${empFullName(emp)}</div>
        ${isBaja?`<div class="emp-baja-note">Baja: ${emp.fecha_baja}</div>`:''}
      </td>
      <td class="td-role">${emp.puesto||''}</td>
      ${cells}
      <td class="td-summary">
        <span class="chip chip1">${nA}</span>
        ${nF?`<span class="chip chip2">${nF}</span>`:''}
        ${nI?`<span class="chip chip3">${nI}</span>`:''}
      </td>
    </tr>`;
  }).join('');

  document.getElementById('tab-asistencia-content').innerHTML=`
    <div class="page-header">
      <div>
        <div class="page-title">Lista de Asistencia</div>
        <div class="page-subtitle">${currentSucursal?.nombre||''} — ${visible.length} empleados</div>
      </div>
      <div class="actions-row">
        ${currentUser?.rol==='admin'?'<button class="btn-secondary" onclick="switchBranch()">Cambiar sucursal</button>':''}
        <button class="btn-secondary" onclick="exportPDF()">Exportar PDF</button>
      </div>
    </div>
    <div class="date-nav">
      <button class="date-nav-btn" onclick="changeMonth(-1)">&larr; Mes anterior</button>
      <div class="date-nav-label">${monthLabel}</div>
      <button class="date-nav-btn" onclick="changeMonth(1)">Mes siguiente &rarr;</button>
      ${!isCurMon?'<button class="date-today-btn" onclick="goNow()">Mes actual</button>':''}
    </div>
    <div class="stats-row">
      <div class="stat-card sc1"><div class="stat-num">${totA}</div><div class="stat-label">Asistencias</div></div>
      <div class="stat-card sc2"><div class="stat-num">${totF}</div><div class="stat-label">Faltas</div></div>
      <div class="stat-card sc3"><div class="stat-num">${totI}</div><div class="stat-label">Incapacidades</div></div>
      <div class="stat-card sc4"><div class="stat-num">${totD}</div><div class="stat-label">Descansos</div></div>
    </div>
    <div class="card">
      <div class="att-table-wrap">
        <table class="att-table">
          <thead><tr>
            <th>Nombre Completo</th><th>Puesto</th>
            ${dayHeaders}
            <th style="text-align:right;min-width:80px">Resumen</th>
          </tr></thead>
          <tbody>${rows||'<tr><td colspan="34" style="text-align:center;padding:40px;color:var(--muted)">Sin registros este mes.</td></tr>'}</tbody>
        </table>
      </div>
      <div class="legend-row">
        <div class="legend-item"><div class="legend-dot ld1"></div>Asistió</div>
        <div class="legend-item"><div class="legend-dot ld2"></div>Falta</div>
        <div class="legend-item"><div class="legend-dot ld3"></div>Incapacidad</div>
        <div class="legend-item"><div class="legend-dot ld4"></div>Descanso</div>
        <div class="legend-item"><div class="legend-dot ld5"></div>Vacación</div>
        <div class="legend-item"><div class="legend-dot ld6"></div>Baja</div>
        <div class="legend-item"><div class="legend-dot ld7"></div>Permiso</div>
        <div class="legend-item"><div class="legend-dot ld0"></div>Sin registro</div>
      </div>
    </div>`;
}

function changeMonth(d){
  selMonth+=d;
  if(selMonth>12){selMonth=1;selYear++;}
  if(selMonth<1){selMonth=12;selYear--;}
  _ensureMonthData(selYear,selMonth).then(()=>renderAsistencia());
}
function goNow(){const t=new Date();selYear=t.getFullYear();selMonth=t.getMonth()+1;renderAsistencia();}

async function _ensureMonthData(year,month){
  if(!currentSucursal) return;
  const has=asistencias.some(a=>a.year===year&&a.month===month);
  if(has) return;
  try{
    const atts=await sb_getAsistencias(currentSucursal.id,year,month);
    if(atts&&atts.length>0){
      atts.forEach(a=>{
        const idx=asistencias.findIndex(x=>
          (x.empleado_id&&x.empleado_id===a.empleado_id||x.empleado_nombre===a.empleado_nombre&&x.empleado_apellido===a.empleado_apellido&&x.sucursal_id===a.sucursal_id)
          &&x.year===a.year&&x.month===a.month);
        if(idx>=0)asistencias[idx]=a;else asistencias.push(a);
      });
    }
  }catch(e){console.warn('[Att] fetch:',e.message);}
}

function openStatusModal(empId,day){
  const emp=empleados.find(e=>e.id===empId);
  const rec=_getAttDias(emp,selYear,selMonth);
  const dias=rec?[...rec]:Array(daysInMonth(selYear,selMonth)).fill(0);
  const currentCode=dias[day-1]||0;
  modalState={empId,day,selYear,selMonth,dias};

  document.getElementById('modal-emp-name').textContent=empFullName(emp);
  document.getElementById('modal-date-label').textContent=formatDateLong(new Date(selYear,selMonth-1,day));
  document.getElementById('modal-notes').value='';
  document.getElementById('inc-days').value='';
  document.getElementById('inc-file').value='';
  document.getElementById('upload-prog').style.display='none';
  // Show "registrar incidencia" link if it's a falta
  const incBtn = document.getElementById('modal-incidencia-btn');
  if(incBtn) incBtn.style.display = currentCode===2?'block':'none';
  document.querySelectorAll('.status-option').forEach(el=>el.classList.remove('selected'));
  document.getElementById('so-'+currentCode)?.classList.add('selected');
  document.getElementById('inc-box').classList.toggle('show',currentCode===3);
  document.getElementById('status-modal').classList.add('show');
}

function selectStatus(code){
  document.querySelectorAll('.status-option').forEach(el=>el.classList.remove('selected'));
  document.getElementById('so-'+code)?.classList.add('selected');
  document.getElementById('inc-box').classList.toggle('show',code===3);
  modalState.selectedCode=code;
}

async function saveStatus(){
  const code=modalState.selectedCode;
  if(code===undefined){showToast('Seleccione un estado','error');return;}
  const{empId,day,selYear:yr,selMonth:mo,dias}=modalState;
  const emp=empleados.find(e=>e.id===empId);
  const newDias=[...dias]; newDias[day-1]=code;

  let driveUrl=null;
  const fi=document.getElementById('inc-file');
  if(code===3&&fi.files.length>0) driveUrl=await uploadToDrive(fi.files[0],emp,yr,mo,day);

  if(code===6){
    const fBaja=`${yr}-${String(mo).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if(!confirm(`¿Confirmar baja de ${empFullName(emp)}?`)) return;
    emp.activo=false;emp.fecha_baja=fBaja;
    for(let j=day;j<newDias.length;j++) newDias[j]=6;
    saveEmpleados();
    try{await sb_updateEmpleado(empId,{activo:false,fecha_baja:fBaja});}catch(e){}
  }

  // Auto-baja: 5 consecutive faltas (code=2)
  if(code===2){
    let consec=0,bajaAt=-1;
    for(let i=0;i<newDias.length;i++){
      if(newDias[i]===2) consec++;
      else consec=0;
      if(consec>=5){bajaAt=i;break;}
    }
    if(bajaAt>=0){
      const bd=bajaAt+1;
      const fBaja=`${yr}-${String(mo).padStart(2,'0')}-${String(bd).padStart(2,'0')}`;
      if(confirm(`${empFullName(emp)} lleva 5 faltas consecutivas.\n¿Registrar baja automática el día ${bd}?`)){
        emp.activo=false;emp.fecha_baja=fBaja;
        for(let j=bd-1;j<newDias.length;j++) newDias[j]=6;
        saveEmpleados();
        try{await sb_updateEmpleado(empId,{activo:false,fecha_baja:fBaja});}catch(e){}
      }
    }
  }

  const existingRec=asistencias.find(a=>
    (a.empleado_id===empId||(a.empleado_nombre===emp.nombre&&a.empleado_apellido===emp.apellido_paterno))
    &&a.year===yr&&a.month===mo);

  const record={
    id:existingRec?.id||genId('att'),
    sucursal_id:currentSucursal.id, empleado_id:empId,
    empleado_nombre:emp.nombre, empleado_apellido:emp.apellido_paterno,
    year:yr, month:mo, dias:newDias, notas:document.getElementById('modal-notes').value,
    archivos:existingRec?.archivos||[],
  };
  if(driveUrl) record.archivos=[...record.archivos,driveUrl];
  upsertMonthRecord(record);
  saveAsistencias();
  try{await sb_upsertAsistencia(record);}catch(e){console.warn('sync:',e.message);}
  closeModal('status-modal');
  showToast('Registro guardado');
  renderAsistencia();
}

async function uploadToDrive(file,emp,year,month,day){
  const prog=document.getElementById('upload-prog'),bar=document.getElementById('upload-bar'),txt=document.getElementById('upload-txt');
  prog.style.display='block';bar.style.width='50%';
  const name=empFullName(emp).replace(/\s+/g,'_');
  const fecha=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const newName=`INC_${name}_${fecha}.${file.name.split('.').pop()}`;
  bar.style.width='100%';txt.textContent=`Archivo: ${newName}`;
  showToast('Comprobante registrado','warning');
  return `pending:${newName}`;
}
