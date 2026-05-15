/* getEmpDisp: returns internal [{dia_semana,hora_inicio,hora_fin,disponible}] format
   regardless of whether emp.disponibilidad is TEXT[] or object array */
function getEmpDisp(emp){
  const d = emp.disponibilidad;
  if(!d||!d.length) return null;
  // If already object array
  if(typeof d[0]==='object') return d;
  // TEXT[] format: ['08:00-16:00', null, ...] — Mon=index0
  if(typeof arrayToDisp === 'function') return arrayToDisp(d);
  return null;
}

/* js/horarios.js  v7 */

let schedWeek        = new Date();
let editingSchedCell = null;

function _activeEmps() {
  const now = new Date();
  const activeSet = buildActiveSet(now.getFullYear(), now.getMonth()+1);
  const ROLE_ORDER = {
    'Gerente':0,'Supervisor':1,'Crew Lider':2,'Crew Líder':2,
    'C. Gral. Cerrador':4,'C.Gral. Cerrador':4,'Porter':5
  };
  const roleRank = e => {
    // Abraham Mendoza Vargas is Crew Lider regardless of stored puesto
    const fullName = empFullName(e).toLowerCase();
    if(fullName.includes('abraham') && fullName.includes('mendoza')) return 2;
    const p = (e.puesto||'').trim();
    if(p in ROLE_ORDER) return ROLE_ORDER[p];
    return 3; // Colab. Gral and others
  };
  return empleados
    .filter(e =>
      e.activo !== false &&
      (!currentSucursal || !e.sucursal_id || e.sucursal_id === currentSucursal.id) &&
      empInSet(e, activeSet)
    )
    .sort((a,b) => roleRank(a) - roleRank(b));
}

function renderHorarios() {
  const weekDates = getWeekDates(schedWeek);
  const semana    = getWeekNum(weekDates[0]);
  const today     = fmtDate(new Date());
  const activos   = _activeEmps();

  const range = weekDates[0].toLocaleDateString('es-MX',{day:'numeric',month:'long'}) +
    ' al ' + weekDates[6].toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});

  const DOW = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

  const thDays = weekDates.map(d => {
    const ds=fmtDate(d), isToday=ds===today, isWknd=d.getDay()===0||d.getDay()===6;
    return `<th style="text-align:center;min-width:80px;padding:8px 4px;font-size:11px;font-weight:700;
      text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;
      color:${isToday?'var(--blue)':isWknd?'var(--muted)':'var(--slate-lt)'};
      background:${isToday?'var(--blue-light)':'var(--surface2)'}">
      ${DOW[d.getDay()]} <span style="font-family:monospace;font-size:12px">${d.getDate()}</span>
    </th>`;
  }).join('');

  const rows = activos.map(emp => {
    const nameFull = empFullName(emp);
    const cells = weekDates.map(d => {
      const ds=fmtDate(d), isWknd=d.getDay()===0||d.getDay()===6;
      const det=horarioDetalle.find(h=>h.empleado_id===emp.id&&h.fecha===ds);
      const isRest=det?.es_descanso||det?.tipo==='descanso';
      let bg='#fff', content=`<span style="color:var(--muted);font-size:11px">—</span>`;
      if(isWknd) bg='var(--surface2)';
      if(det){
        if(isRest){bg='var(--c4-bg)';content=`<div style="font-size:11px;font-weight:600;color:var(--c4-tx)">OFF</div>`;}
        else if(det.tipo==='trabajo'&&det.hora_inicio){
          bg='var(--c1-bg)';
          content=`<div style="font-family:monospace;font-size:10px;font-weight:700;color:var(--c1-tx);line-height:1.3">${det.hora_inicio}<br>${det.hora_fin}</div>`;
        } else if(det.tipo==='vacacion'){bg='var(--c5-bg)';content=`<div style="font-size:11px;font-weight:600;color:var(--c5-tx)">Vac.</div>`;}
        else if(det.tipo==='baja'){bg='var(--c6-bg)';content=`<div style="font-size:11px;font-weight:600;color:var(--c6-tx)">Baja</div>`;}
      }
      return `<td style="text-align:center;padding:4px 3px;background:${bg};cursor:pointer;transition:background .12s"
        onclick="openSchedDayModal('${emp.id}','${ds}')"
        onmouseenter="this.style.background='var(--blue-light)'"
        onmouseleave="this.style.background='${bg}'">${content}</td>`;
    }).join('');
    return `<tr style="border-bottom:1px solid var(--border-lt)">
      <td style="padding:10px 14px;min-width:200px;border-right:1px solid var(--border)">
        <div style="font-size:12px;font-weight:600;color:var(--navy)">${nameFull}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:1px">${emp.puesto||''}${emp.es_porter?' · Porter':''}</div>
      </td>${cells}</tr>`;
  }).join('');

  document.getElementById('tab-horarios-content').innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Horario Semanal — Semana ${semana}</div>
        <div class="page-subtitle">${range} · ${currentSucursal?.nombre||''}</div>
      </div>
      <div class="actions-row">
        <button class="btn-secondary" onclick="exportHorarioPDF()">Exportar PDF</button>
        <button class="btn-primary" onclick="generateWeekSchedule()">Generar automático</button>
      </div>
    </div>
    <div class="date-nav">
      <button class="date-nav-btn" onclick="schedWeek.setDate(schedWeek.getDate()-7);renderHorarios()">&larr; Semana anterior</button>
      <div class="date-nav-label">${range}</div>
      <button class="date-nav-btn" onclick="schedWeek.setDate(schedWeek.getDate()+7);renderHorarios()">Semana siguiente &rarr;</button>
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="border-bottom:2px solid var(--border)">
            <th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:700;
              text-transform:uppercase;letter-spacing:.6px;color:var(--slate-lt);
              background:var(--surface2);min-width:200px;border-right:1px solid var(--border)">Empleado</th>
            ${thDays}
          </tr></thead>
          <tbody>${rows||`<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--muted)">Sin empleados con actividad este mes.</td></tr>`}</tbody>
        </table>
      </div>
      <div class="legend-row">
        <div class="legend-item"><div class="legend-dot ld1"></div>Trabajo</div>
        <div class="legend-item"><div class="legend-dot ld4"></div>Descanso</div>
        <div class="legend-item"><div class="legend-dot ld5"></div>Vacación</div>
        <div class="legend-item"><div class="legend-dot ld6"></div>Baja</div>
      </div>
    </div>`;
}

function openSchedDayModal(empId,fecha){
  _restoreSchedModal();
  editingSchedCell={empId,fecha};
  const emp=empleados.find(e=>e.id===empId);
  const det=horarioDetalle.find(h=>h.empleado_id===empId&&h.fecha===fecha);
  document.getElementById('sched-day-title').textContent=`${empFullName(emp)} — ${formatDateLong(new Date(fecha+'T12:00:00'))}`;
  document.getElementById('sched-tipo').value=det?.tipo||(det?.es_descanso?'descanso':'trabajo');
  const si=document.getElementById('sched-inicio');
  const sf=document.getElementById('sched-fin');
  si.innerHTML=HOURS.map(h=>`<option value="${h}"${det?.hora_inicio===h?' selected':''}>${h}</option>`).join('');
  sf.innerHTML=HOURS.map(h=>`<option value="${h}"${det?.hora_fin===h?' selected':''}>${h}</option>`).join('');
  if(!det){si.value='08:00';sf.value='16:00';}
  document.getElementById('sched-day-modal').classList.add('show');
}

function saveSchedDay(){
  const{empId,fecha}=editingSchedCell;
  const tipo=document.getElementById('sched-tipo').value;
  const hi=document.getElementById('sched-inicio')?.value;
  const hf=document.getElementById('sched-fin')?.value;
  const rec={id:genId('hd'),empleado_id:empId,fecha,hora_inicio:tipo==='trabajo'?hi:null,
    hora_fin:tipo==='trabajo'?hf:null,es_descanso:tipo==='descanso',tipo,sucursal_id:currentSucursal?.id};
  const idx=horarioDetalle.findIndex(h=>h.empleado_id===empId&&h.fecha===fecha);
  if(idx>=0)horarioDetalle[idx]=rec;else horarioDetalle.push(rec);
  saveHorarioDetalle();
  closeModal('sched-day-modal');
  showToast('Turno actualizado');
  renderHorarios();
}

function generateWeekSchedule(){
  const weekDates=getWeekDates(schedWeek);
  const activos=_activeEmps();
  const wStart=fmtDate(weekDates[0]),wEnd=fmtDate(weekDates[6]);
  if(!confirm(
    `Generar horario automático\n${wStart} al ${wEnd}\n\n` +
    `Reglas:\n` +
    `• 1 descanso por empleado, SOLO Lun-Vie (sin excepción)\n` +
    `• Porter: también descansa 1 día Lun-Vie\n` +
    `• Cerradores: turno 04:00-12:00, no descansan si descansa el porter\n` +
    `• Nadie descansa Sáb ni Dom`
  )) return;

  horarioDetalle=horarioDetalle.filter(h=>h.fecha<wStart||h.fecha>wEnd);

  // SOLO días Lun-Vie para descansos (todos, incluyendo porter)
  const weekdayDates=weekDates.filter(d=>d.getDay()>=1&&d.getDay()<=5);

  // PASO 1: Porter — descansa 1 día Lun-Vie
  const porterRestDates=new Set();
  activos.filter(e=>e.es_porter).forEach(emp=>{
    const restDate=_pickRest(weekdayDates,emp);
    weekDates.forEach(d=>{
      const ds=fmtDate(d);
      const isRest=ds===restDate;
      horarioDetalle.push({id:genId('hd'),empleado_id:emp.id,fecha:ds,sucursal_id:currentSucursal?.id,
        hora_inicio:isRest?null:'08:00',hora_fin:isRest?null:'16:00',es_descanso:isRest,tipo:isRest?'descanso':'trabajo'});
      if(isRest) porterRestDates.add(ds);
    });
  });

  // PASO 2: Cerradores — turno 16:00-00:00, descanso Lun-Vie pero NO en día del porter
  activos.filter(e=>!e.es_porter&&PUESTOS_CERRADOR.includes(e.puesto)).forEach(emp=>{
    const allowed=weekdayDates.filter(d=>!porterRestDates.has(fmtDate(d)));
    const restDate=_pickRest(allowed.length?allowed:weekdayDates,emp);
    weekDates.forEach(d=>{
      const ds=fmtDate(d);
      const isRest=ds===restDate;
      horarioDetalle.push({id:genId('hd'),empleado_id:emp.id,fecha:ds,sucursal_id:currentSucursal?.id,
        hora_inicio:isRest?null:'04:00',hora_fin:isRest?null:'12:00',es_descanso:isRest,tipo:isRest?'descanso':'trabajo'});
    });
  });

  // PASO 3: Resto — descanso 1 día Lun-Vie
  activos.filter(e=>!e.es_porter&&!PUESTOS_CERRADOR.includes(e.puesto)).forEach(emp=>{
    const restDate=_pickRest(weekdayDates,emp);
    _assignWeek(emp,weekDates,restDate);
  });

  saveHorarioDetalle();
  showToast(`Horario generado — ${activos.length} empleados`);
  renderHorarios();
}

function _pickRest(candidates,emp){
  if(!candidates||!candidates.length)return null;
  const _disp = getEmpDisp(emp);
  const unavail=candidates.filter(d=>{const a=_disp?.find(av=>av.dia_semana===d.getDay());return a&&a.disponible===false;});
  const pool=unavail.length>0?unavail:candidates;
  return fmtDate(pool[Math.floor(Math.random()*pool.length)]);
}
function _assignWeek(emp,weekDates,restDateStr){
  weekDates.forEach(d=>{
    const ds=fmtDate(d),avail=getEmpDisp(emp)?.find(a=>a.dia_semana===d.getDay()),isOff=ds===restDateStr||(avail&&avail.disponible===false);
    if(isOff)horarioDetalle.push({id:genId('hd'),empleado_id:emp.id,fecha:ds,sucursal_id:currentSucursal?.id,hora_inicio:null,hora_fin:null,es_descanso:true,tipo:'descanso'});
    else{const s=avail?.hora_inicio&&avail?.hora_fin?{hi:avail.hora_inicio,hf:avail.hora_fin}:SHIFT_OPTIONS[Math.floor(Math.random()*SHIFT_OPTIONS.length)];
      horarioDetalle.push({id:genId('hd'),empleado_id:emp.id,fecha:ds,sucursal_id:currentSucursal?.id,hora_inicio:s.hi,hora_fin:s.hf,es_descanso:false,tipo:'trabajo'});}
  });
}
function _restoreSchedModal(){
  document.getElementById('sched-tipo-group').style.display='';
  document.getElementById('sched-modal-actions').style.display='';
  document.getElementById('sched-hours-group').innerHTML=`<div class="form-row-2"><div class="form-group"><label class="field-label">Entrada</label><select id="sched-inicio"></select></div><div class="form-group"><label class="field-label">Salida</label><select id="sched-fin"></select></div></div>`;
}
