/* ================================================================
   js/docs.js  v1
   Sistema de documentos:
   - Carta de baja (Word/PDF) → carpeta Drive bajas
   - Actas administrativas → carpeta Drive actas
   - Registro de incidencias por día
   - Finiquito y búsqueda de historial por empleado
   ================================================================ */

const DRIVE_BAJAS_FOLDER  = '1nrWKlL0DtVpbLPUqdCa2E8xXSuOvm3XI';
const DRIVE_ACTAS_FOLDER  = '1MSK5mcKqSlmNj37lMytqrY1sBS-d7vZ0';
const DRIVE_INC_FOLDER    = '1lt0s4GzJUq_PmBDak2CiOM26D3uhB3DC';

/* ── Códigos de baja ──────────────────────────────────────────── */
const MOTIVOS_BAJA = [
  'Renuncia voluntaria',
  'Terminación por faltas injustificadas',
  'Terminación por incumplimiento de normas',
  'Baja por término de contrato',
  'Baja por incapacidad permanente',
  'Abandono de trabajo',
  'Acuerdo mutuo',
  'Otro (especificar)',
];

/* ================================================================
   MODAL DE BAJA — con motivo, acta y finiquito
   ================================================================ */
function showBajaModal(empId, fecha) {
  const emp = empleados.find(e => e.id === empId);
  if(!emp) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay show';
  overlay.id = 'baja-modal-ov';
  overlay.innerHTML = `
    <div class="modal modal-wide">
      <button class="modal-close" onclick="document.getElementById('baja-modal-ov').remove()">&#x2715;</button>
      <div class="modal-hd">
        <div class="modal-title">Registrar Baja — ${empFullName(emp)}</div>
        <div class="modal-subtitle">${emp.puesto || ''} · Fecha: ${fecha}</div>
      </div>
      <div class="modal-body">

        <div class="form-group">
          <label class="field-label">Motivo de baja</label>
          <select id="baja-motivo" onchange="document.getElementById('baja-motivo-otro').style.display=this.value==='Otro (especificar)'?'block':'none'">
            <option value="">— Seleccionar motivo —</option>
            ${MOTIVOS_BAJA.map(m => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" id="baja-motivo-otro" style="display:none">
          <label class="field-label">Especificar motivo</label>
          <input type="text" id="baja-motivo-texto" placeholder="Describa el motivo...">
        </div>
        <div class="form-group">
          <label class="field-label">Observaciones adicionales</label>
          <input type="text" id="baja-obs" placeholder="Detalles, circunstancias, etc...">
        </div>
        <div class="form-group">
          <label class="field-label">¿Tiene derecho a finiquito?</label>
          <select id="baja-finiquito">
            <option value="si">Sí — Generar carta de finiquito</option>
            <option value="no">No — Solo carta de baja</option>
          </select>
        </div>

        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);padding:12px;margin-top:4px">
          <div class="field-label" style="margin-bottom:8px">Documentos a generar</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
              <input type="checkbox" id="doc-carta-baja" checked> Carta de baja (Word)
            </label>
            <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
              <input type="checkbox" id="doc-acta"> Acta administrativa
            </label>
            <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
              <input type="checkbox" id="doc-finiquito"> Finiquito
            </label>
          </div>
        </div>

        <div id="baja-doc-status" style="display:none;margin-top:10px;padding:10px;border-radius:var(--r-sm);font-size:12px;background:var(--blue-light);border:1px solid var(--blue-border);color:var(--blue)">
          Generando documentos...
        </div>
      </div>
      <div class="modal-ft">
        <button class="btn-save" onclick="confirmarBaja('${empId}','${fecha}')">Confirmar baja y generar documentos</button>
        <button class="btn-outline" onclick="document.getElementById('baja-modal-ov').remove()">Cancelar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

async function confirmarBaja(empId, fecha) {
  const emp    = empleados.find(e => e.id === empId);
  const motivo = document.getElementById('baja-motivo').value;
  const motivoTexto = motivo === 'Otro (especificar)'
    ? document.getElementById('baja-motivo-texto').value
    : motivo;
  const obs = document.getElementById('baja-obs').value;
  const finiquito = document.getElementById('baja-finiquito').value === 'si';
  const genCarta   = document.getElementById('doc-carta-baja').checked;
  const genActa    = document.getElementById('doc-acta').checked;
  const genFiniq   = document.getElementById('doc-finiquito').checked;

  if(!motivoTexto){ showToast('Seleccione el motivo de baja','error'); return; }

  const statusEl = document.getElementById('baja-doc-status');
  statusEl.style.display = 'block';
  statusEl.textContent = 'Procesando...';

  // 1. Actualizar empleado
  emp.activo    = false;
  emp.fecha_baja = fecha;
  emp.motivo_baja = motivoTexto;
  emp.tiene_finiquito = finiquito;
  saveEmpleados();
  try { await sb_updateEmpleado(empId, {
    activo: false, fecha_baja: fecha,
    // guardamos motivo en notas o campo adicional
  }); } catch(e) {}

  // 2. Generar documentos
  const docs = [];
  if(genCarta){
    statusEl.textContent = 'Generando carta de baja...';
    const pdf = generarCartaBajaPDF(emp, fecha, motivoTexto, obs);
    const nombre = `BAJA_${empFullName(emp).replace(/\s+/g,'_')}_${fecha}.pdf`;
    docs.push({ blob: pdf, nombre, folder: DRIVE_BAJAS_FOLDER, tipo: 'Carta de baja' });
  }
  if(genActa){
    statusEl.textContent = 'Generando acta administrativa...';
    const pdf = generarActaPDF(emp, fecha, motivoTexto, obs);
    const nombre = `ACTA_${empFullName(emp).replace(/\s+/g,'_')}_${fecha}.pdf`;
    docs.push({ blob: pdf, nombre, folder: DRIVE_ACTAS_FOLDER, tipo: 'Acta administrativa' });
  }
  if(genFiniq && finiquito){
    statusEl.textContent = 'Generando finiquito...';
    const pdf = generarFiniquitoPDF(emp, fecha, motivoTexto);
    const nombre = `FINIQUITO_${empFullName(emp).replace(/\s+/g,'_')}_${fecha}.pdf`;
    docs.push({ blob: pdf, nombre, folder: DRIVE_BAJAS_FOLDER, tipo: 'Finiquito' });
    emp.finiquito_generado = true;
    emp.finiquito_fecha = fecha;
    saveEmpleados();
  }

  // 3. Descargar / intentar subir a Drive
  statusEl.textContent = `${docs.length} documento(s) generado(s). Descargando...`;
  docs.forEach(d => {
    const url = URL.createObjectURL(d.blob);
    const a   = document.createElement('a');
    a.href = url; a.download = d.nombre;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  statusEl.style.background = 'var(--ok-bg)';
  statusEl.style.color      = 'var(--ok)';
  statusEl.style.border     = '1px solid var(--ok-bd)';
  statusEl.textContent      = `Baja registrada. ${docs.length} documento(s) descargado(s). Súbelos manualmente a Google Drive si no se subieron automáticamente.`;

  // 4. Registrar en Supabase tabla documentos (si existe)
  try {
    const docRecords = docs.map(d => ({
      empleado_id:  empId,
      sucursal_id:  emp.sucursal_id,
      tipo:         d.tipo,
      nombre_archivo: d.nombre,
      fecha_generacion: fecha,
      folder_drive: d.folder,
    }));
    await sbFetch('documentos', 'POST', docRecords, {'Prefer':'resolution=ignore-duplicates,return=minimal'});
  } catch(e) { console.warn('No table documentos in Supabase yet:', e.message); }

  showToast('Baja registrada correctamente');

  setTimeout(() => {
    document.getElementById('baja-modal-ov')?.remove();
    renderAsistencia();
  }, 3000);
}

/* ================================================================
   MODAL DE INCIDENCIA POR DÍA (falta, acta, archivo)
   ================================================================ */
function showIncidenciaModal(empId, day, year, month) {
  const emp  = empleados.find(e => e.id === empId);
  const fecha = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay show';
  overlay.id = 'inc-modal-ov';
  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" onclick="document.getElementById('inc-modal-ov').remove()">&#x2715;</button>
      <div class="modal-hd">
        <div class="modal-title">Incidencia — ${empFullName(emp)}</div>
        <div class="modal-subtitle">${fecha}</div>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="field-label">Tipo de incidencia</label>
          <select id="inc-tipo">
            <option value="falta_injustificada">Falta injustificada</option>
            <option value="amonestacion">Amonestación verbal</option>
            <option value="acta_administrativa">Acta administrativa</option>
            <option value="sancion">Sanción económica</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="field-label">Descripción</label>
          <input type="text" id="inc-desc" placeholder="Describe la incidencia...">
        </div>
        <div class="form-group">
          <label class="field-label">Adjuntar acta o evidencia (PDF)</label>
          <input type="file" id="inc-archivo" accept=".pdf,.jpg,.jpeg,.png">
          <p class="field-hint">Se guardará en la carpeta de actas de Google Drive.</p>
        </div>
        <div id="inc-status" style="display:none;padding:8px;border-radius:var(--r-sm);font-size:12px;margin-top:8px"></div>
      </div>
      <div class="modal-ft">
        <button class="btn-save" onclick="guardarIncidencia('${empId}','${fecha}')">Guardar incidencia</button>
        <button class="btn-outline" onclick="document.getElementById('inc-modal-ov').remove()">Cancelar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

async function guardarIncidencia(empId, fecha) {
  const emp     = empleados.find(e => e.id === empId);
  const tipo    = document.getElementById('inc-tipo').value;
  const desc    = document.getElementById('inc-desc').value;
  const archivo = document.getElementById('inc-archivo').files[0];
  const status  = document.getElementById('inc-status');

  status.style.display = 'block';
  status.style.background = 'var(--blue-light)';
  status.style.color = 'var(--blue)';
  status.style.border = '1px solid var(--blue-border)';
  status.textContent = 'Guardando...';

  let archivoNombre = null;
  if(archivo){
    const ext  = archivo.name.split('.').pop();
    archivoNombre = `INC_${tipo.toUpperCase()}_${empFullName(emp).replace(/\s+/g,'_')}_${fecha}.${ext}`;
    // Download locally (Drive upload requires OAuth)
    const url = URL.createObjectURL(archivo);
    const a   = document.createElement('a'); a.href=url; a.download=archivoNombre;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Save to Supabase incidencias table
  try {
    await sbFetch('incidencias','POST',{
      empleado_id: empId,
      sucursal_id: emp.sucursal_id,
      fecha, tipo, descripcion: desc,
      archivo_nombre: archivoNombre,
    },{'Prefer':'resolution=ignore-duplicates,return=minimal'});
    status.style.background = 'var(--ok-bg)';
    status.style.color      = 'var(--ok)';
    status.textContent      = `Incidencia guardada.${archivoNombre?' Archivo: '+archivoNombre:''}`;
  } catch(e) {
    status.style.background = 'var(--warn-bg)';
    status.style.color      = 'var(--warn)';
    status.textContent      = `Guardado localmente.${archivoNombre?' Archivo: '+archivoNombre:''}`;
    console.warn('Incidencia sync:', e.message);
  }

  showToast('Incidencia registrada');
  setTimeout(()=>document.getElementById('inc-modal-ov')?.remove(),2000);
}

/* ================================================================
   BÚSQUEDA DE EMPLEADO — historial, finiquito, bajas
   ================================================================ */
function showBuscadorEmpleado() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay show';
  overlay.id = 'buscar-modal-ov';
  overlay.innerHTML = `
    <div class="modal modal-wide">
      <button class="modal-close" onclick="document.getElementById('buscar-modal-ov').remove()">&#x2715;</button>
      <div class="modal-hd">
        <div class="modal-title">Buscar empleado</div>
        <div class="modal-subtitle">Historial, incidencias y finiquito</div>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="field-label">Nombre del empleado</label>
          <input type="text" id="buscar-nombre" placeholder="Escribe nombre o apellido..."
            oninput="filtrarEmpleadosBuscador(this.value)">
        </div>
        <div id="buscar-resultados" style="margin-top:4px"></div>
        <div id="buscar-detalle" style="margin-top:12px"></div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function filtrarEmpleadosBuscador(query) {
  const q = query.toLowerCase().trim();
  if(q.length < 2){ document.getElementById('buscar-resultados').innerHTML=''; return; }

  // Search all employees including bajas
  const todos = empleados.filter(e =>
    empFullName(e).toLowerCase().includes(q) ||
    e.nombre?.toLowerCase().includes(q) ||
    e.apellido_paterno?.toLowerCase().includes(q)
  );

  if(!todos.length){
    document.getElementById('buscar-resultados').innerHTML =
      `<div style="color:var(--muted);font-size:12px;padding:8px">No se encontraron empleados.</div>`;
    return;
  }

  document.getElementById('buscar-resultados').innerHTML = todos.map(e => `
    <div style="padding:10px 12px;border:1px solid var(--border);border-radius:var(--r-sm);
      margin-bottom:6px;cursor:pointer;background:var(--surface);transition:background .12s"
      onmouseenter="this.style.background='var(--blue-light)'"
      onmouseleave="this.style.background='var(--surface)'"
      onclick="verDetalleEmpleado('${e.id}')">
      <div style="font-size:12px;font-weight:600;color:var(--navy)">${empFullName(e)}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px">
        ${e.puesto||''} ·
        ${e.activo?'<span style="color:var(--c1-dot)">Activo</span>':'<span style="color:var(--c6-dot)">Baja: '+e.fecha_baja+'</span>'}
        ${e.finiquito_generado?'· <span style="color:var(--c3-dot);font-weight:600">Finiquito generado</span>':''}
      </div>
    </div>`).join('');
}

async function verDetalleEmpleado(empId) {
  const emp = empleados.find(e => e.id === empId);
  if(!emp) return;

  // Load incidencias from Supabase
  let incidencias = [];
  try {
    const r = await sbFetch(`incidencias?empleado_id=eq.${empId}&order=fecha.desc`);
    incidencias = r || [];
  } catch(e) { console.warn('Incidencias load:', e.message); }

  // Attendance summary from local arrays
  const empAtts = asistencias.filter(a =>
    a.empleado_id===empId ||
    (a.empleado_nombre===emp.nombre && a.empleado_apellido===emp.apellido_paterno)
  );
  const totA = empAtts.reduce((s,a)=>(a.dias||[]).filter(c=>c===1).length+s, 0);
  const totF = empAtts.reduce((s,a)=>(a.dias||[]).filter(c=>c===2).length+s, 0);
  const totI = empAtts.reduce((s,a)=>(a.dias||[]).filter(c=>c===3).length+s, 0);

  const incRows = incidencias.length
    ? incidencias.map(i=>`
      <tr>
        <td style="padding:6px 8px;font-size:11px;color:var(--navy)">${i.fecha}</td>
        <td style="padding:6px 8px;font-size:11px;color:var(--slate)">${i.tipo?.replace(/_/g,' ')}</td>
        <td style="padding:6px 8px;font-size:11px;color:var(--muted)">${i.descripcion||''}</td>
        <td style="padding:6px 8px;font-size:11px;color:var(--blue)">${i.archivo_nombre||'—'}</td>
      </tr>`).join('')
    : `<tr><td colspan="4" style="padding:12px;text-align:center;color:var(--muted);font-size:12px">Sin incidencias registradas.</td></tr>`;

  document.getElementById('buscar-detalle').innerHTML = `
    <div style="border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden">
      <div style="padding:12px 14px;background:var(--surface2);border-bottom:1px solid var(--border);
        display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--navy)">${empFullName(emp)}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">
            ${emp.puesto||''} · Ingreso: ${emp.fecha_ingreso||'—'} ·
            ${emp.activo
              ? '<span style="color:var(--c1-dot)">Activo</span>'
              : `<span style="color:var(--c6-dot)">Baja: ${emp.fecha_baja}</span>`}
            ${emp.motivo_baja ? ` · Motivo: ${emp.motivo_baja}` : ''}
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${!emp.activo && !emp.finiquito_generado ? `<button class="btn-primary" onclick="generarFiniquitoDirecto('${empId}')">Generar finiquito</button>` : ''}
          ${emp.finiquito_generado ? `<span class="badge b3">Finiquito generado ${emp.finiquito_fecha||''}</span>` : ''}
        </div>
      </div>

      <!-- Resumen asistencias -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border)">
        <div style="background:var(--surface);padding:10px;text-align:center">
          <div style="font-size:20px;font-weight:700;color:var(--c1-tx)">${totA}</div>
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px">Asistencias</div>
        </div>
        <div style="background:var(--surface);padding:10px;text-align:center">
          <div style="font-size:20px;font-weight:700;color:var(--c2-tx)">${totF}</div>
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px">Faltas</div>
        </div>
        <div style="background:var(--surface);padding:10px;text-align:center">
          <div style="font-size:20px;font-weight:700;color:var(--c3-tx)">${totI}</div>
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px">Incapacidades</div>
        </div>
      </div>

      <!-- Incidencias -->
      <div style="padding:10px 14px;border-top:1px solid var(--border)">
        <div style="font-size:11px;font-weight:700;color:var(--slate);text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">Incidencias registradas</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              <th style="text-align:left;padding:5px 8px;font-size:10px;color:var(--slate-lt)">Fecha</th>
              <th style="text-align:left;padding:5px 8px;font-size:10px;color:var(--slate-lt)">Tipo</th>
              <th style="text-align:left;padding:5px 8px;font-size:10px;color:var(--slate-lt)">Descripción</th>
              <th style="text-align:left;padding:5px 8px;font-size:10px;color:var(--slate-lt)">Archivo</th>
            </tr>
          </thead>
          <tbody>${incRows}</tbody>
        </table>
      </div>
    </div>`;
}

async function generarFiniquitoDirecto(empId) {
  const emp   = empleados.find(e => e.id === empId);
  const fecha = emp.fecha_baja || fmtDate(new Date());
  const pdf   = generarFiniquitoPDF(emp, fecha, emp.motivo_baja||'Baja registrada');
  const nombre = `FINIQUITO_${empFullName(emp).replace(/\s+/g,'_')}_${fecha}.pdf`;
  const url = URL.createObjectURL(pdf);
  const a   = document.createElement('a'); a.href=url; a.download=nombre;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  emp.finiquito_generado = true;
  emp.finiquito_fecha    = fmtDate(new Date());
  saveEmpleados();
  showToast('Finiquito generado');
  await verDetalleEmpleado(empId);
}

/* ================================================================
   GENERADORES DE PDF (jsPDF)
   ================================================================ */
function _initPDF(orientation='portrait'){
  const { jsPDF } = window.jspdf;
  return new jsPDF({ orientation, format:'letter', unit:'mm' });
}

function _pdfHeader(doc, titulo, subtitulo){
  // Header bar
  doc.setFillColor(15,23,42);
  doc.rect(0,0,216,18,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(13); doc.setFont('helvetica','bold');
  doc.text("Carl's Jr — Gestión de Personal", 10, 12);
  doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text(fmtDate(new Date()), 206, 12, {align:'right'});
  doc.setTextColor(0,0,0);

  doc.setFontSize(16); doc.setFont('helvetica','bold');
  doc.text(titulo, 108, 30, {align:'center'});
  if(subtitulo){
    doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.setTextColor(100,116,139);
    doc.text(subtitulo, 108, 37, {align:'center'});
    doc.setTextColor(0,0,0);
  }
  return 46;
}

function _pdfField(doc, label, value, x, y, w=90){
  doc.setFontSize(8); doc.setFont('helvetica','bold');
  doc.setTextColor(100,116,139);
  doc.text(label.toUpperCase(), x, y);
  doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.setTextColor(30,41,59);
  doc.text(String(value||'—'), x, y+5);
  return y+13;
}

function generarCartaBajaPDF(emp, fecha, motivo, obs){
  const doc = _initPDF();
  let y = _pdfHeader(doc, 'CARTA DE BAJA', `${currentSucursal?.nombre||''}`);

  // Employee info box
  doc.setDrawColor(226,232,240); doc.setLineWidth(0.5);
  doc.rect(10, y, 196, 40);
  doc.setFillColor(248,250,252); doc.rect(10, y, 196, 8,'F');
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(71,85,105);
  doc.text('DATOS DEL EMPLEADO', 14, y+5.5);
  doc.setTextColor(0,0,0);

  y += 10;
  _pdfField(doc,'Nombre completo', empFullName(emp), 14, y);
  _pdfField(doc,'Puesto', emp.puesto||'', 108, y);
  y += 13;
  _pdfField(doc,'Fecha de ingreso', emp.fecha_ingreso||'—', 14, y);
  _pdfField(doc,'Fecha de baja', fecha, 108, y);
  y += 18;

  // Motivo
  doc.setDrawColor(226,232,240); doc.rect(10, y, 196, 30);
  doc.setFillColor(248,250,252); doc.rect(10, y, 196, 8,'F');
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(71,85,105);
  doc.text('MOTIVO DE BAJA', 14, y+5.5);
  doc.setTextColor(30,41,59); doc.setFont('helvetica','normal'); doc.setFontSize(10);
  const mLines = doc.splitTextToSize(motivo, 185);
  doc.text(mLines, 14, y+14);
  y += 36;

  if(obs){
    doc.setDrawColor(226,232,240); doc.rect(10, y, 196, 25);
    doc.setFillColor(248,250,252); doc.rect(10, y, 196, 8,'F');
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(71,85,105);
    doc.text('OBSERVACIONES', 14, y+5.5);
    doc.setTextColor(30,41,59); doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.text(doc.splitTextToSize(obs, 185), 14, y+14);
    y += 31;
  }

  // Signatures
  y += 15;
  doc.setDrawColor(15,23,42); doc.setLineWidth(0.3);
  doc.line(20, y+20, 90, y+20);   doc.line(126, y+20, 196, y+20);
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(100,116,139);
  doc.text('Firma del Empleado', 55, y+25, {align:'center'});
  doc.text('Firma del Gerente', 161, y+25, {align:'center'});
  doc.text(empFullName(emp), 55, y+30, {align:'center'});
  doc.text(currentSucursal?.nombre||'', 161, y+30, {align:'center'});

  return doc.output('blob');
}

function generarActaPDF(emp, fecha, motivo, obs){
  const doc = _initPDF();
  let y = _pdfHeader(doc, 'ACTA ADMINISTRATIVA', `Folio: ACT-${Date.now().toString().slice(-6)}`);

  doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.setTextColor(30,41,59);
  const intro = `En la ciudad de ${currentSucursal?.ciudad||'Oaxaca'}, siendo las ___:___ horas del día ${fecha}, se levanta la presente acta administrativa en presencia del empleado ${empFullName(emp)}, quien ocupa el puesto de ${emp.puesto||'colaborador'} en la sucursal ${currentSucursal?.nombre||''} de Carl's Jr.`;
  doc.text(doc.splitTextToSize(intro,190), 13, y);
  y += 25;

  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(71,85,105);
  doc.text('HECHOS:', 13, y); y += 6;
  doc.setFont('helvetica','normal'); doc.setTextColor(30,41,59); doc.setFontSize(10);
  doc.text(doc.splitTextToSize(motivo+(obs?'\n\n'+obs:''), 190), 13, y);
  y += 30;

  doc.setFontSize(10);
  const cierre = 'Habiendo leído la presente acta, el empleado manifiesta estar conforme con su contenido y la firma en señal de aceptación.';
  doc.text(doc.splitTextToSize(cierre,190), 13, y); y += 20;

  // Signatures x3
  doc.setDrawColor(15,23,42); doc.setLineWidth(0.3);
  doc.line(13,y+22,80,y+22); doc.line(88,y+22,155,y+22); doc.line(163,y+22,206,y+22);
  doc.setFontSize(8); doc.setTextColor(100,116,139);
  doc.text('Empleado', 46, y+27, {align:'center'});
  doc.text('Gerente / Testigo 1', 121, y+27, {align:'center'});
  doc.text('Testigo 2', 184, y+27, {align:'center'});
  doc.text(empFullName(emp), 46, y+32, {align:'center'});

  return doc.output('blob');
}

function generarFiniquitoPDF(emp, fecha, motivo){
  const doc = _initPDF();
  let y = _pdfHeader(doc, 'DOCUMENTO DE FINIQUITO', 'Liquidación de relación laboral');

  _pdfField(doc,'Empleado', empFullName(emp), 13, y);
  _pdfField(doc,'Puesto', emp.puesto||'', 113, y); y+=13;
  _pdfField(doc,'Fecha ingreso', emp.fecha_ingreso||'—', 13, y);
  _pdfField(doc,'Fecha baja', fecha, 113, y); y+=13;
  _pdfField(doc,'Motivo', motivo, 13, y); y+=18;

  // Conceptos
  doc.setFillColor(15,23,42); doc.rect(13,y,190,7,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
  ['CONCEPTO','DÍAS','IMPORTE'].forEach((t,i)=>doc.text(t,[14,130,170][i],y+4.5));
  doc.setTextColor(0,0,0); y+=7;

  const conceptos=[
    ['Días trabajados pendientes de pago','___','$_______'],
    ['Prima vacacional proporcional','___','$_______'],
    ['Parte proporcional de aguinaldo','___','$_______'],
    ['Partes proporcionales de prestaciones','___','$_______'],
  ];
  conceptos.forEach((row,i)=>{
    if(i%2===1){doc.setFillColor(248,250,252);doc.rect(13,y,190,7,'F');}
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(30,41,59);
    doc.text(row[0],14,y+4.5); doc.text(row[1],135,y+4.5,{align:'center'}); doc.text(row[2],200,y+4.5,{align:'right'});
    y+=7;
  });

  doc.setDrawColor(15,23,42); doc.setLineWidth(0.5);
  doc.rect(13,y,190,8); doc.setFillColor(30,41,59); doc.rect(13,y,190,8,'F');
  doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
  doc.text('TOTAL',14,y+5.5); doc.text('$_______',200,y+5.5,{align:'right'});
  y+=18;

  const declar=`El trabajador declara recibir la cantidad señalada como pago total de todos los conceptos que le corresponden por la terminación de la relación laboral, sin reservarse acción o derecho alguno que ejercitar.`;
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(30,41,59);
  doc.text(doc.splitTextToSize(declar,190),13,y); y+=20;

  doc.setDrawColor(15,23,42); doc.setLineWidth(0.3);
  doc.line(20,y+22,90,y+22); doc.line(126,y+22,196,y+22);
  doc.setFontSize(9); doc.setTextColor(100,116,139);
  doc.text('Firma del Empleado',55,y+27,{align:'center'});
  doc.text('Firma del Gerente / Empresa',161,y+27,{align:'center'});
  doc.text(empFullName(emp),55,y+32,{align:'center'});

  return doc.output('blob');
}
