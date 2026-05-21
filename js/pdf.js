/* js/pdf.js  v8 — PDF exports for horarios and asistencia */

function exportHorarioPDF(){
  if(!window.jspdf){showToast('jsPDF no disponible','error');return;}
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape',format:'a3'});
  const weekDates=getWeekDates(schedWeek);
  const activos=_activeEmps();
  const DOW=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const range=weekDates[0].toLocaleDateString('es-MX',{day:'numeric',month:'long'})+
    ' al '+weekDates[6].toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});

  // Header
  doc.setFillColor(15,23,42);doc.rect(0,0,420,16,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(12);doc.setFont('helvetica','bold');
  doc.text("Carl's Jr — Horario Semanal",10,11);
  doc.setFontSize(9);doc.setFont('helvetica','normal');
  const sucNom=currentSucursal?.nombre||'';
  doc.text(`${sucNom} · ${range}`,420-10,11,{align:'right'});
  doc.setTextColor(0,0,0);

  const head=[['Empleado','Puesto',...weekDates.map(d=>`${DOW[d.getDay()]} ${d.getDate()}`)]];
  const TYPE_ABBR={trabajo:'',descanso:'OFF',vacacion:'VAC',suspension:'SUSP',baja:'BAJA'};
  const TYPE_COLOR={
    trabajo:[220,252,231],descanso:[241,245,249],
    vacacion:[237,233,254],suspension:[254,249,195],baja:[255,237,213]
  };

  const body=activos.map(emp=>{
    const cells=weekDates.map(d=>{
      const ds=fmtDate(d);
      const det=horarioDetalle.find(h=>h.empleado_id===emp.id&&h.fecha===ds);
      if(!det) return '—';
      if(det.tipo==='descanso'||det.es_descanso) return 'OFF';
      if(det.tipo==='vacacion') return 'VAC';
      if(det.tipo==='suspension') return 'SUSP';
      if(det.tipo==='baja') return 'BAJA';
      if(det.hora_inicio) return `${det.hora_inicio}\n${det.hora_fin}`;
      return '—';
    });
    return[empFullName(emp),emp.puesto||'',...cells];
  });

  doc.autoTable({
    head,body,startY:22,
    styles:{fontSize:8,cellPadding:3,halign:'center'},
    headStyles:{fillColor:[15,23,42],textColor:[255,255,255],fontStyle:'bold',halign:'center'},
    columnStyles:{0:{halign:'left',cellWidth:42,fontStyle:'bold'},1:{halign:'left',cellWidth:28}},
    didParseCell(data){
      if(data.section==='body'&&data.column.index>=2){
        const v=data.cell.raw;
        if(v==='OFF') data.cell.styles.fillColor=TYPE_COLOR.descanso;
        else if(v==='VAC') data.cell.styles.fillColor=TYPE_COLOR.vacacion;
        else if(v==='SUSP') data.cell.styles.fillColor=TYPE_COLOR.suspension;
        else if(v==='BAJA') data.cell.styles.fillColor=TYPE_COLOR.baja;
        else if(v&&v!=='—') data.cell.styles.fillColor=TYPE_COLOR.trabajo;
      }
    }
  });

  const semana=getWeekNum(weekDates[0]);
  doc.save(`Horario_Semana${semana}_${sucNom.replace(/\s+/g,'_')}.pdf`);
  showToast('PDF exportado');
}

function exportPDF(){
  if(!window.jspdf){showToast('jsPDF no disponible','error');return;}
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape',format:'a3'});
  const nDays=daysInMonth(selYear,selMonth);
  const days=Array.from({length:nDays},(_,i)=>i+1);
  const mp=`${selYear}-${String(selMonth).padStart(2,'0')}`;
  const todayStr=fmtDate(new Date());
  const activeSet=buildActiveSet(selYear,selMonth);
  const visible=empleados.filter(e=>
    (!currentSucursal||!e.sucursal_id||e.sucursal_id===currentSucursal.id)&&
    empVisibleInMonth(e,selYear,selMonth,_getAttDias(e,selYear,selMonth),empInSet(e,activeSet))
  );

  doc.setFillColor(15,23,42);doc.rect(0,0,420,16,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(12);doc.setFont('helvetica','bold');
  doc.text("Carl's Jr — Lista de Asistencia",10,11);
  doc.setFontSize(9);doc.setFont('helvetica','normal');
  const lbl=`${currentSucursal?.nombre||''} · ${MONTHS_ES[selMonth]} ${selYear}`;
  doc.text(lbl,420-10,11,{align:'right'});
  doc.setTextColor(0,0,0);

  const DOW=['D','L','M','X','J','V','S'];
  const CODE_ABBR=['','A','F','I','D','V','B','P'];
  const CODE_COLOR={
    1:[220,252,231],2:[254,226,226],3:[219,234,254],
    4:[241,245,249],5:[237,233,254],6:[255,237,213],7:[254,249,195]
  };

  const head=[['Empleado','Puesto',...days.map(d=>{
    const dt=new Date(selYear,selMonth-1,d);
    return `${d}\n${DOW[dt.getDay()]}`;
  }),'A','F']];

  const body=visible.map(emp=>{
    const dias=_getAttDias(emp,selYear,selMonth)||Array(nDays).fill(0);
    const cells=days.map((_,i)=>CODE_ABBR[dias[i]||0]||'');
    const nA=cells.filter(c=>c==='A').length;
    const nF=cells.filter(c=>c==='F').length;
    return[empFullName(emp),emp.puesto||'',...cells,nA,nF];
  });

  doc.autoTable({
    head,body,startY:22,
    styles:{fontSize:6.5,cellPadding:1.5,halign:'center'},
    headStyles:{fillColor:[15,23,42],textColor:[255,255,255],fontStyle:'bold'},
    columnStyles:{0:{halign:'left',cellWidth:36,fontStyle:'bold'},1:{halign:'left',cellWidth:22}},
    didParseCell(data){
      if(data.section==='body'&&data.column.index>=2&&data.column.index<data.table.columns.length-2){
        const codeMap={'A':1,'F':2,'I':3,'D':4,'V':5,'B':6,'P':7};
        const c=codeMap[data.cell.raw];
        if(c&&CODE_COLOR[c]) data.cell.styles.fillColor=CODE_COLOR[c];
        if(data.cell.raw==='F'){data.cell.styles.textColor=[185,28,28];data.cell.styles.fontStyle='bold';}
        if(data.cell.raw==='A') data.cell.styles.textColor=[21,128,61];
      }
    }
  });

  doc.save(`Asistencia_${MONTHS_ES[selMonth]}_${selYear}_${(currentSucursal?.nombre||'').replace(/\s+/g,'_')}.pdf`);
  showToast('PDF exportado');
}

function exportMonthPDF(){ exportPDF(); }

// Needed by asistencia.js
function _getAttDias(emp,year,month){
  const rec=asistencias.find(a=>
    (a.empleado_id===emp.id||(a.empleado_nombre===emp.nombre&&a.empleado_apellido===emp.apellido_paterno&&(!a.sucursal_id||a.sucursal_id===emp.sucursal_id)))
    &&a.year===year&&a.month===month);
  return rec?.dias||null;
}
