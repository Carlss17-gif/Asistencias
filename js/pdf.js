/* js/pdf.js — Exportación de PDFs */

function _pdfHeader(doc, title, sub) {
  doc.setFillColor(211, 47, 47);
  doc.rect(0, 0, 297, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text(title, 10, 14);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(sub, 297 - 10 - doc.getTextWidth(sub), 14);
  doc.setTextColor(30, 41, 59);
}

/* PDF 1 — Lista de asistencia del día */
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc       = new jsPDF({ orientation: 'landscape' });
  const dateStr   = fmtDate(selectedDate);
  const dayAtt    = asistencias.filter(a => a.fecha === dateStr);

  _pdfHeader(doc, "CARL'S JR — Lista de Asistencia",
    `${currentSucursal.nombre}  ·  ${formatDateLong(selectedDate)}`);

  const rows = empleados.map((emp, i) => {
    const att   = dayAtt.find(a => a.empleado_id === emp.id);
    const sched = horarioDetalle.find(h => h.empleado_id === emp.id && h.fecha === dateStr);
    const hor   = sched && !sched.es_descanso ? `${sched.hora_inicio||''}–${sched.hora_fin||''}` : sched ? 'OFF' : '—';
    return [
      emp.numero_empleado || i + 1,
      `${emp.nombre} ${emp.apellido_paterno} ${emp.apellido_materno||''}`.trim(),
      emp.puesto, hor,
      getStatusLabel(att?.estado),
      att?.dias_incapacidad ? `${att.dias_incapacidad} días` : '',
      att?.notas || '',
    ];
  });

  doc.autoTable({
    head: [['#', 'Nombre Completo', 'Puesto', 'Horario', 'Estado', 'Inc.', 'Notas']],
    body: rows, startY: 26,
    styles:             { fontSize: 9, cellPadding: 3, textColor: [30,41,59] },
    headStyles:         { fillColor: [211,47,47], textColor: [255,255,255], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248,250,252] },
    columnStyles:       { 0:{cellWidth:10}, 1:{cellWidth:62}, 2:{cellWidth:36}, 3:{cellWidth:28}, 4:{cellWidth:26} },
  });

  doc.save(`Asistencia_${currentSucursal.nombre}_${dateStr}.pdf`);
  showToast('PDF de asistencia generado ✓');
}

/* PDF 2 — Horario semanal */
function exportHorarioPDF() {
  const { jsPDF } = window.jspdf;
  const doc       = new jsPDF({ orientation: 'landscape' });
  const weekDates = getWeekDates(schedWeek);
  const semana    = getWeekNum(weekDates[0]);
  const activos   = empleados.filter(e => e.activo);

  _pdfHeader(doc, `CARL'S JR — Horario Semanal #${semana}`,
    `${currentSucursal.nombre}  ·  ${fmtDate(weekDates[0])} – ${fmtDate(weekDates[6])}`);

  const rows = activos.map(emp => {
    const days = weekDates.map(d => {
      const det = horarioDetalle.find(h => h.empleado_id === emp.id && h.fecha === fmtDate(d));
      if (!det)                                         return '—';
      if (det.es_descanso || det.tipo === 'descanso')  return 'OFF';
      if (det.tipo === 'vacacion')                     return 'VAC';
      if (det.tipo === 'baja')                         return 'BAJA';
      return `${det.hora_inicio||''}–${det.hora_fin||''}`;
    });
    return [`${emp.nombre} ${emp.apellido_paterno}`, emp.puesto, ...days];
  });

  doc.autoTable({
    head: [['Empleado', 'Puesto', ...weekDates.map(d => `${DAYS[d.getDay()]} ${d.getDate()}`)]],
    body: rows, startY: 26,
    styles:             { fontSize: 8, cellPadding: 2.5, textColor: [30,41,59] },
    headStyles:         { fillColor: [211,47,47], textColor: [255,255,255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248,250,252] },
    didParseCell(data) {
      if (data.section === 'body') {
        const v = data.cell.raw;
        if (v === 'OFF')  { data.cell.styles.fillColor = [241,245,249]; data.cell.styles.textColor = [100,116,139]; }
        if (v === 'VAC')  { data.cell.styles.fillColor = [237,233,254]; data.cell.styles.textColor = [124,58,237]; }
        if (v === 'BAJA') { data.cell.styles.fillColor = [255,237,213]; data.cell.styles.textColor = [234,88,12];  }
        if (v && v.includes('–')) { data.cell.styles.fillColor = [220,252,231]; data.cell.styles.textColor = [22,163,74]; }
      }
    },
  });

  doc.save(`Horario_Semana${semana}_${currentSucursal.nombre}.pdf`);
  showToast('Horario PDF generado ✓');
}

/* PDF 3 — Reporte mensual */
function exportMonthPDF() {
  const { jsPDF } = window.jspdf;
  const doc    = new jsPDF({ orientation: 'landscape' });
  const today  = new Date();
  const mStart = fmtDate(new Date(today.getFullYear(), today.getMonth(), 1));
  const mEnd   = fmtDate(new Date(today.getFullYear(), today.getMonth()+1, 0));
  const mName  = today.toLocaleDateString('es-MX', { month:'long', year:'numeric' }).toUpperCase();
  const mAtt   = asistencias.filter(a => a.fecha >= mStart && a.fecha <= mEnd);

  _pdfHeader(doc, "CARL'S JR — Reporte Mensual de Asistencia",
    `${currentSucursal.nombre}  ·  ${mName}`);

  const n = (empId, s) => mAtt.filter(a => a.empleado_id === empId && a.estado === s).length;

  const rows = empleados.map(emp => [
    `${emp.nombre} ${emp.apellido_paterno}`,
    emp.puesto,
    n(emp.id,'asistio'),
    n(emp.id,'falta'),
    n(emp.id,'incapacidad'),
    n(emp.id,'vacacion'),
    n(emp.id,'off'),
    n(emp.id,'permiso_sin_goce'),
    emp.activo ? 'ACTIVO' : `BAJA ${emp.fecha_baja||''}`,
  ]);

  doc.autoTable({
    head: [['Nombre', 'Puesto', 'Asistencias', 'Faltas', 'Incapacidad', 'Vacación', 'OFF', 'PSGS', 'Estado']],
    body: rows, startY: 26,
    styles:             { fontSize: 9, cellPadding: 3, textColor: [30,41,59] },
    headStyles:         { fillColor: [211,47,47], textColor: [255,255,255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248,250,252] },
    columnStyles:       { 2:{halign:'center'}, 3:{halign:'center'}, 4:{halign:'center'},
                          5:{halign:'center'}, 6:{halign:'center'}, 7:{halign:'center'} },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 8) {
        const v = String(data.cell.raw);
        if (v === 'ACTIVO') { data.cell.styles.textColor = [22,163,74]; data.cell.styles.fontStyle = 'bold'; }
        else                { data.cell.styles.textColor = [234,88,12]; data.cell.styles.fontStyle = 'bold'; }
      }
      if (data.section === 'body' && data.column.index === 3 && data.cell.raw > 0) {
        data.cell.styles.textColor = [211,47,47]; data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  doc.save(`Reporte_${currentSucursal.nombre}_${mName}.pdf`);
  showToast('Reporte mensual generado ✓');
}
