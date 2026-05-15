/* js/empleados.js  v4 — Sin emojis */

function renderEmpleados() {
  // Use buildActiveSet from utils (falls back to most recent month with data)
  const now_r=new Date();
  const activeSet=buildActiveSet(now_r.getFullYear(), now_r.getMonth()+1);
  const tieneActividad=e=>empInSet(e,activeSet);

  // Solo activos con actividad y de esta sucursal
  // New employees (ingreso this month) always show even without activity
  const now_m = new Date();
  const curMp  = `${now_m.getFullYear()}-${String(now_m.getMonth()+1).padStart(2,'0')}`;
  const isNewThisMonth = e => e.fecha_ingreso && e.fecha_ingreso.startsWith(curMp);

  const activos = empleados.filter(e =>
    e.activo &&
    (tieneActividad(e) || isNewThisMonth(e)) &&
    (!currentSucursal || !e.sucursal_id || e.sucursal_id === currentSucursal.id)
  );

  document.getElementById('tab-empleados-content').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Empleados</div>
        <div class="page-subtitle">${activos.length} empleados activos &middot; ${currentSucursal?.nombre||''}</div>
      </div>
      <div class="actions-row">
        <button class="btn-secondary" onclick="showBuscadorEmpleado()">Buscar empleado</button>
        <button class="btn-primary" onclick="openEmpModal()">Registrar empleado</button>
      </div>
    </div>

    <div class="card" style="padding:0;margin-bottom:16px">
      <div style="padding:18px 20px;border-bottom:1px solid var(--border)">
        <div class="card-title" style="margin-bottom:0">Personal activo &mdash; ${activos.length}</div>
      </div>
      <div class="emp-list">
        ${activos.length
          ? activos.map(e => empItem(e, true)).join('')
          : `<div style="padding:32px;text-align:center;color:var(--muted);font-size:13px">Sin empleados activos.</div>`}
      </div>
    </div>

`;
}

function empItem(emp, activo) {
  const initials = `${emp.nombre[0]}${emp.apellido_paterno[0]}`.toUpperCase();
  const meta     = `${emp.puesto} &middot; Ingreso: ${emp.fecha_ingreso || '—'}${emp.es_porter ? ' &middot; Porter' : ''}`;
  const actions  = activo
    ? `<div class="row-actions">
         <button class="btn-secondary" style="font-size:12px;height:32px" onclick="openAvailModal('${emp.id}')">Disponibilidad</button>
         <button class="btn-secondary" style="font-size:12px;height:32px;color:var(--danger);border-color:var(--danger-border)" onclick="confirmBaja('${emp.id}')">Dar de baja</button>
       </div>`
    : `<button class="btn-secondary" style="font-size:12px;height:32px" onclick="reactivarEmp('${emp.id}')">Reactivar</button>`;

  return `<div class="emp-item ${activo ? '' : 'emp-baja'}">
    <div class="emp-avatar">${initials}</div>
    <div class="emp-info">
      <div class="emp-item-name">${emp.nombre} ${emp.apellido_paterno} ${emp.apellido_materno || ''}</div>
      <div class="emp-item-meta">${meta}</div>
    </div>
    ${actions}
  </div>`;
}

function openEmpModal() {
  document.getElementById('new-nombre').value  = '';
  document.getElementById('new-apPat').value   = '';
  document.getElementById('new-apMat').value   = '';
  document.getElementById('new-ingreso').value = fmtDate(new Date());
  document.getElementById('new-puesto').value  = 'Colab. Gral.';
  document.getElementById('new-porter').value  = 'false';

  document.getElementById('avail-grid').innerHTML = DAYS.map((d, i) => `
    <div class="avail-day active" id="avday-${i}" onclick="toggleAvDay(${i})">
      <div class="ad-name">${d}</div>
      <div class="ad-hours">
        <input type="time" id="avh-s-${i}" value="08:00"
          style="background:none;border:none;color:inherit;font-size:9px;width:100%;text-align:center;font-family:monospace"
          onclick="event.stopPropagation()">
        <input type="time" id="avh-e-${i}" value="16:00"
          style="background:none;border:none;color:inherit;font-size:9px;width:100%;text-align:center;font-family:monospace"
          onclick="event.stopPropagation()">
      </div>
    </div>`).join('');

  document.getElementById('emp-modal').classList.add('show');
}

function toggleAvDay(i) {
  document.getElementById('avday-' + i).classList.toggle('active');
}

async function saveNewEmployee() {
  const nombre = document.getElementById('new-nombre').value.trim();
  const apPat  = document.getElementById('new-apPat').value.trim();
  if (!nombre || !apPat) { showToast('El nombre y apellido paterno son obligatorios.', 'error'); return; }

  const emp = {
    id:              genId('emp'),
    sucursal_id:     currentSucursal.id,
    numero_empleado: empleados.length + 1,
    nombre, apellido_paterno: apPat,
    apellido_materno: document.getElementById('new-apMat').value.trim(),
    puesto:           document.getElementById('new-puesto').value,
    fecha_ingreso:    document.getElementById('new-ingreso').value,
    activo: true,
    es_porter: document.getElementById('new-porter').value === 'true',
    disponibilidad: DAYS.map((_, i) => ({
      dia_semana:  i,
      hora_inicio: document.getElementById('avh-s-' + i)?.value || '08:00',
      hora_fin:    document.getElementById('avh-e-' + i)?.value || '16:00',
      disponible:  !!document.getElementById('avday-' + i)?.classList.contains('active'),
    })),
  };

  empleados.push(emp);
  saveEmpleados();
  // Insert into Supabase and get real UUID, then sync disponibilidad
  try{
    const created = await sb_insertEmpleado({
      sucursal_id:      emp.sucursal_id,
      nombre:           emp.nombre,
      apellido_paterno: emp.apellido_paterno,
      apellido_materno: emp.apellido_materno,
      puesto:           emp.puesto,
      fecha_ingreso:    emp.fecha_ingreso,
      activo:           true,
      es_porter:        emp.es_porter,
      disponibilidad:   emp.disponibilidad,  // JSONB column — one shot
    });
    if(created?.id) emp.id = created.id;
  }catch(e){console.warn('New emp sync:', e.message);}
  closeModal('emp-modal');
  showToast(`${nombre} ${apPat} registrado correctamente.`);
  renderEmpleados();
}

function confirmBaja(empId) {
  const emp = empleados.find(e => e.id === empId);
  if (!confirm(`¿Confirmar baja de ${emp.nombre} ${emp.apellido_paterno}?\n\nEl empleado continuará apareciendo en los reportes hasta fin de mes.`)) return;
  emp.activo = false;
  emp.fecha_baja = fmtDate(new Date());
  saveEmpleados();
  renderEmpleados();
  showToast('Empleado dado de baja.');
}

function reactivarEmp(empId) {
  const emp = empleados.find(e => e.id === empId);
  emp.activo = true; emp.fecha_baja = null;
  saveEmpleados(); renderEmpleados();
  showToast(`${emp.nombre} ${emp.apellido_paterno} reactivado.`);
}

function openAvailModal(empId) {
  const emp   = empleados.find(e => e.id === empId);
  const avail = emp.disponibilidad || [];

  document.getElementById('sched-day-title').textContent =
    `Disponibilidad — ${emp.nombre} ${emp.apellido_paterno}`;
  document.getElementById('sched-tipo-group').style.display    = 'none';
  document.getElementById('sched-modal-actions').style.display = 'none';

  document.getElementById('sched-hours-group').innerHTML =
    DAYS.map((d, i) => {
      const a = avail.find(x => x.dia_semana === i) || {};
      return `<div class="avail-row">
        <span class="fw-600 text-sm">${d}</span>
        <input type="time" id="avmod-s-${i}" value="${a.hora_inicio || '08:00'}"
          style="height:34px;border:1px solid var(--border);border-radius:var(--radius-sm);padding:0 8px;font-size:12px;font-family:monospace">
        <input type="time" id="avmod-e-${i}" value="${a.hora_fin || '16:00'}"
          style="height:34px;border:1px solid var(--border);border-radius:var(--radius-sm);padding:0 8px;font-size:12px;font-family:monospace">
      </div>`;
    }).join('') +
    `<div style="display:flex;gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
       <button class="btn-save" onclick="saveAvail('${empId}')">Guardar</button>
       <button class="btn-outline" onclick="closeModal('sched-day-modal')">Cancelar</button>
     </div>`;

  document.getElementById('sched-day-modal').classList.add('show');
}

async function saveAvail(empId) {
  const emp = empleados.find(e => e.id === empId);
  emp.disponibilidad = DAYS.map((_, i) => ({
    dia_semana:  i,
    hora_inicio: document.getElementById('avmod-s-' + i)?.value || '08:00',
    hora_fin:    document.getElementById('avmod-e-' + i)?.value || '16:00',
    disponible:  true,
  }));
  saveEmpleados();
  // Sync disponibilidad to Supabase
  if(emp.id && !emp.id.startsWith('emp_')){
    try{
      await sb_syncDisponibilidad(emp.id, emp.disponibilidad);
      showToast('Disponibilidad guardada en Supabase');
    }catch(e){
      console.warn('Disponibilidad sync error:', e.message);
      showToast('Disponibilidad guardada localmente', 'warning');
    }
  } else {
    showToast('Disponibilidad guardada localmente', 'warning');
  }
  closeModal('sched-day-modal');
}
