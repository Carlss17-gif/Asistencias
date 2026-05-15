/* js/reportes.js  v7 — Array-based, filters by activity */

function renderReportes() {
  const now    = new Date();
  const year   = now.getFullYear();
  const month  = now.getMonth() + 1;
  const mName  = now.toLocaleDateString('es-MX', { month:'long', year:'numeric' });

  // Get current month arrays
  const mAtts = asistencias.filter(a => a.year===year && a.month===month);

  // Use buildActiveSet from utils (falls back to most recent month with data)
  const now_r=new Date();
  const activeSet=buildActiveSet(now_r.getFullYear(), now_r.getMonth()+1);
  const tieneActividad=e=>empInSet(e,activeSet);

  const visibles = empleados.filter(e =>
    e.activo &&
    tieneActividad(e) &&
    (!currentSucursal || !e.sucursal_id || e.sucursal_id === currentSucursal.id)
  );

  // Count codes across visible employees for current month
  const countCode = code => mAtts.reduce((sum, a) => {
    const emp = visibles.find(e =>
      e.id === a.empleado_id ||
      (e.nombre === a.empleado_nombre && e.apellido_paterno === a.empleado_apellido));
    if(!emp) return sum;
    return sum + (a.dias||[]).filter(c => c === code).length;
  }, 0);

  const totA = countCode(1), totF = countCode(2),
        totI = countCode(3), totD = countCode(4);

  const rows = visibles.map(emp => {
    const rec  = mAtts.find(a =>
      a.empleado_id === emp.id ||
      (a.empleado_nombre === emp.nombre && a.empleado_apellido === emp.apellido_paterno));
    const dias = rec?.dias || [];
    const n    = code => dias.filter(c => c === code).length;
    return `<tr>
      <td>
        <div style="font-size:12px;font-weight:600;color:var(--navy)">${emp.nombre} ${emp.apellido_paterno}</div>
      </td>
      <td class="text-muted text-sm">${emp.puesto||''}</td>
      <td class="report-num" style="color:var(--c1-tx)">${n(1)}</td>
      <td class="report-num" style="color:var(--c2-tx)">${n(2)}</td>
      <td class="report-num" style="color:var(--c3-tx)">${n(3)}</td>
      <td class="report-num" style="color:var(--c5-tx)">${n(5)}</td>
      <td class="report-num" style="color:var(--c4-tx)">${n(4)}</td>
      <td class="report-num" style="color:var(--c7-tx)">${n(7)}</td>
      <td><span class="badge b1">Activo</span></td>
    </tr>`;
  }).join('');

  document.getElementById('tab-reportes-content').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Reportes</div>
        <div class="page-subtitle">${currentSucursal?.nombre||''} — ${mName}</div>
      </div>
      <button class="btn-secondary" onclick="exportMonthPDF()">Exportar PDF mensual</button>
    </div>

    <div class="stats-row" style="margin-bottom:20px">
      <div class="stat-card sc1"><div class="stat-num">${totA}</div><div class="stat-label">Asistencias</div></div>
      <div class="stat-card sc2"><div class="stat-num">${totF}</div><div class="stat-label">Faltas</div></div>
      <div class="stat-card sc3"><div class="stat-num">${totI}</div><div class="stat-label">Incapacidades</div></div>
      <div class="stat-card sc4"><div class="stat-num">${totD}</div><div class="stat-label">Descansos</div></div>
    </div>

    <div class="card" style="padding:0">
      <div class="card-header">
        <div class="card-title mb-0">Detalle por empleado — ${mName}</div>
      </div>
      <div class="table-wrap">
        <table class="report-table">
          <thead>
            <tr>
              <th>Empleado</th><th>Puesto</th>
              <th style="text-align:center">Asistencias</th>
              <th style="text-align:center">Faltas</th>
              <th style="text-align:center">Incapacidad</th>
              <th style="text-align:center">Vacación</th>
              <th style="text-align:center">Descanso</th>
              <th style="text-align:center">PSGS</th>
              <th>Estatus</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--muted)">
              Sin datos para este mes. Importa los registros de asistencia primero.
            </td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
}
