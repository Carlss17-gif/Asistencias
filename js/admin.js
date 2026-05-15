/* js/admin.js  v7 */
let adminState={year:new Date().getFullYear(),month:new Date().getMonth()+1,
  sucFilt:'all',empsOax:[],empsTeh:[],attsOax:[],attsTeh:[]};

function renderAdmin(){
  document.getElementById('tab-asistencia-content').innerHTML=`
    <div class="page-header">
      <div><div class="page-title">Panel de Administrador</div>
        <div class="page-subtitle">Vista consolidada por mes — todas las sucursales</div>
      </div>
      <div class="actions-row">
        <button class="btn-secondary" onclick="showImportModal()">Importar datos históricos</button>
        <button class="btn-primary" onclick="exportAdminPDF()">Exportar PDF</button>
      </div>
    </div>
    <div class="admin-filters">
      <div class="form-group" style="margin-bottom:0">
        <label class="field-label">Sucursal</label>
        <select id="a-suc" onchange="adminState.sucFilt=this.value">
          <option value="all">Todas</option>
          <option value="oax">Porfirio Díaz — Oaxaca</option>
          <option value="teh">Tehuacán</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="field-label">Año</label>
        <select id="a-year">
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026" selected>2026</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="field-label">Mes</label>
        <select id="a-month">
          ${MONTHS_ES.slice(1).map((m,i)=>`<option value="${i+1}"${i+1===adminState.month?' selected':''}>${m}</option>`).join('')}
        </select>
      </div>
      <button class="btn-primary" onclick="adminLoad()">Consultar</button>
    </div>
    <div class="month-pills">
      ${[['Jun 25',2025,6],['Jul 25',2025,7],['Ago 25',2025,8],['Sep 25',2025,9],['Oct 25',2025,10],
         ['Dic 25',2025,12],['Ene 26',2026,1],['Feb 26',2026,2],['Mar 26',2026,3],['Abr 26',2026,4],['May 26',2026,5]]
        .map(([l,y,m])=>`<div class="mpill${adminState.year===y&&adminState.month===m?' active':''}" onclick="adminSetMonth(${y},${m})">${l}</div>`).join('')}
    </div>
    <div id="admin-results">
      <div style="text-align:center;padding:48px;color:var(--muted);font-size:13px">Seleccione mes y haga clic en Consultar.</div>
    </div>`;
}

function adminSetMonth(y,m){
  adminState.year=y;adminState.month=m;
  document.getElementById('a-year').value=y;
  document.getElementById('a-month').value=m;
  adminLoad();
}

async function adminLoad(){
  adminState.year=+document.getElementById('a-year').value;
  adminState.month=+document.getElementById('a-month').value;
  adminState.sucFilt=document.getElementById('a-suc').value;
  document.getElementById('admin-results').innerHTML=
    '<div style="text-align:center;padding:40px;color:var(--muted)">Cargando...</div>';
  try{
    const[eO,eT,aO,aT]=await Promise.all([
      sb_getEmpleados(SUC_OAX_ID),sb_getEmpleados(SUC_TEH_ID),
      sb_getAsistencias(SUC_OAX_ID,adminState.year,adminState.month),
      sb_getAsistencias(SUC_TEH_ID,adminState.year,adminState.month),
    ]);
    adminState.empsOax=eO||[];adminState.empsTeh=eT||[];
    adminState.attsOax=aO||[];adminState.attsTeh=aT||[];
  }catch(e){
    console.warn('admin fallback:',e.message);
    adminState.empsOax=getLS('emp_oax')||DEMO_EMPLEADOS_OAX;
    adminState.empsTeh=getLS('emp_teh')||DEMO_EMPLEADOS_TEH;
    adminState.attsOax=(getLS('att_oax')||[]).filter(a=>a.year===adminState.year&&a.month===adminState.month);
    adminState.attsTeh=(getLS('att_teh')||[]).filter(a=>a.year===adminState.year&&a.month===adminState.month);
    showToast('Offline — datos locales','warning');
  }
  renderAdminResults();
}

function renderAdminResults(){
  const{year,month,sucFilt}=adminState;
  const nDays=daysInMonth(year,month);
  const todayStr=fmtDate(new Date());
  let html='';
  if(sucFilt==='all'||sucFilt==='oax')
    html+=_adminBranch('Porfirio Díaz — Oaxaca',adminState.empsOax,adminState.attsOax,year,month,nDays,todayStr,SUC_OAX_ID);
  if(sucFilt==='all'||sucFilt==='teh')
    html+=_adminBranch('Tehuacán',adminState.empsTeh,adminState.attsTeh,year,month,nDays,todayStr,SUC_TEH_ID);
  document.getElementById('admin-results').innerHTML=html||
    '<div style="text-align:center;padding:40px;color:var(--muted)">Sin datos.</div>';
}

function _adminBranch(nombre,emps,atts,year,month,nDays,todayStr,sucId){
  const mp=`${year}-${String(month).padStart(2,'0')}`;
  // att map: empId|empNombre|empApellido → dias[]
  const attMap={};
  atts.forEach(a=>{
    if(a.empleado_id) attMap[a.empleado_id]=a.dias;
    if(a.empleado_nombre){
      attMap[`${a.empleado_nombre}|${a.empleado_apellido}`]=a.dias;
      attMap[`${(a.empleado_nombre||'').toLowerCase()}|${(a.empleado_apellido||'').toLowerCase()}`]=a.dias;
    }
  });

  // Build att lookup (attMap must be defined first)
  const _empDias = e =>
    attMap[e.id] ||
    attMap[`${e.nombre}|${e.apellido_paterno}`] ||
    attMap[`${(e.nombre||'').toLowerCase()}|${(e.apellido_paterno||'').toLowerCase()}`] || null;

  const visible=emps.filter(e=>
    empVisibleInMonth(e,year,month,_empDias(e),false) &&
    e.sucursal_id===sucId
  );
  if(!visible.length) return '';

  let totA=0,totF=0,totI=0,totD=0;
  visible.forEach(e=>{
    const d=attMap[e.id]||attMap[`${e.nombre}|${e.apellido_paterno}`]||[];
    d.forEach(c=>{if(c===1)totA++;else if(c===2)totF++;else if(c===3)totI++;else if(c===4)totD++;});
  });

  const DOW=['D','L','M','X','J','V','S'];
  const days=Array.from({length:nDays},(_,i)=>i+1);

  const ths=days.map(d=>{
    const dt=new Date(year,month-1,d);
    const ds=`${mp}-${String(d).padStart(2,'0')}`;
    const isW=dt.getDay()===0||dt.getDay()===6;
    const isT=ds===todayStr;
    return `<th class="th-day${isT?' is-today':''}${isW?' is-wknd':''}" title="${dt.toLocaleDateString('es-MX',{weekday:'long',day:'numeric'})}">
      <div>${d}</div><div style="font-size:8px;font-weight:400">${DOW[dt.getDay()]}</div></th>`;
  }).join('');

  const rows=visible.map(emp=>{
    const dias=attMap[emp.id]||attMap[`${emp.nombre}|${emp.apellido_paterno}`]||Array(nDays).fill(0);
    const isBaja=isBajaMonth(emp,year,month);
    let nA=0,nF=0;
    const cells=days.map((d,i)=>{
      const code=dias[i]||0;
      const dt=new Date(year,month-1,d);
      const ds=`${mp}-${String(d).padStart(2,'0')}`;
      const isW=dt.getDay()===0||dt.getDay()===6;
      const isFut=ds>todayStr;
      if(code===1)nA++;else if(code===2)nF++;
      return `<td class="td-day" style="${isW?'background:var(--border-lt)':''}">
        <div class="day-block ${CODE_CLASS[code]}${isFut?' is-future':''}" title="${CODE_LABEL[code]||''}"></div>
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
      </td>
    </tr>`;
  }).join('');

  return `<div class="branch-section">
    <div class="branch-hd">
      <div class="branch-hd-name">${nombre}</div>
      <div class="branch-stats">
        <span><strong style="color:var(--c1-dot)">${totA}</strong> asistencias</span>
        <span><strong style="color:var(--c2-dot)">${totF}</strong> faltas</span>
        ${totI?`<span><strong style="color:var(--c3-dot)">${totI}</strong> incapacidades</span>`:''}
        <span><strong style="color:var(--muted)">${totD}</strong> descansos</span>
      </div>
    </div>
    <div class="branch-body">
      <div class="att-table-wrap">
        <table class="att-table">
          <thead><tr><th>Nombre Completo</th><th>Puesto</th>${ths}<th style="text-align:right">Resumen</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="legend-row">
        <div class="legend-item"><div class="legend-dot ld1"></div>Asistió</div>
        <div class="legend-item"><div class="legend-dot ld2"></div>Falta</div>
        <div class="legend-item"><div class="legend-dot ld3"></div>Incapacidad</div>
        <div class="legend-item"><div class="legend-dot ld4"></div>Descanso</div>
        <div class="legend-item"><div class="legend-dot ld5"></div>Vacación</div>
        <div class="legend-item"><div class="legend-dot ld6"></div>Baja</div>
        <div class="legend-item"><div class="legend-dot ld0"></div>Sin registro</div>
      </div>
    </div>
  </div>`;
}

/* PDF */
function exportAdminPDF(){
  const{jsPDF}=window.jspdf;const doc=new jsPDF({orientation:'landscape',format:'a3'});
  const{year,month}=adminState;const nDays=daysInMonth(year,month);
  const days=Array.from({length:nDays},(_,i)=>i+1);
  const mp=`${year}-${String(month).padStart(2,'0')}`;
  const todayStr=fmtDate(new Date());
  doc.setFillColor(15,23,42);doc.rect(0,0,420,15,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(11);doc.setFont('helvetica','bold');
  doc.text(`Carl's Jr — Asistencia ${MONTHS_ES[month]} ${year}`,10,10);
  doc.setTextColor(0,0,0);let y=18;
  const ABR={0:'',1:'A',2:'F',3:'I',4:'D',5:'V',6:'B',7:'P'};
  const COL={1:[220,252,231],2:[254,226,226],3:[219,234,254],4:[241,245,249],5:[237,233,254],6:[255,237,213]};
  [[adminState.empsOax,adminState.attsOax,'Porfirio Díaz — Oaxaca',SUC_OAX_ID],
   [adminState.empsTeh,adminState.attsTeh,'Tehuacán',SUC_TEH_ID]].forEach(([emps,atts,nom])=>{
    if(adminState.sucFilt!=='all'&&((adminState.sucFilt==='oax'&&nom.includes('Tehuacán'))||(adminState.sucFilt==='teh'&&nom.includes('Díaz')))) return;
    const amPdf={};atts.forEach(a=>{if(a.empleado_id)amPdf[a.empleado_id]=a.dias;amPdf[`${a.empleado_nombre}|${a.empleado_apellido}`]=a.dias;});
    const vis=emps.filter(e=>empVisibleInMonth(e,year,month,amPdf[e.id]||amPdf[`${e.nombre}|${e.apellido_paterno}`],false)&&e.sucursal_id===sucId);if(!vis.length)return;
    const am={};atts.forEach(a=>{if(a.empleado_id)am[a.empleado_id]=a.dias;am[`${a.empleado_nombre}|${a.empleado_apellido}`]=a.dias;});
    doc.setFontSize(9);doc.setFont('helvetica','bold');doc.text(nom,10,y);y+=4;
    const head=[['Empleado','Puesto',...days.map(d=>String(d)),'A','F']];
    const rows=vis.map(e=>{
      const d=am[e.id]||am[`${e.nombre}|${e.apellido_paterno}`]||Array(nDays).fill(0);
      const cells=days.map((_,i)=>ABR[d[i]||0]||'');
      const nA=cells.filter(c=>c==='A').length,nF=cells.filter(c=>c==='F').length;
      return[`${e.nombre} ${e.apellido_paterno}`,e.puesto||'',...cells,nA,nF];
    });
    doc.autoTable({head,body:rows,startY:y,
      styles:{fontSize:6.5,cellPadding:1.2},
      headStyles:{fillColor:[15,23,42],textColor:[255,255,255],fontStyle:'bold'},
      columnStyles:{0:{cellWidth:32},1:{cellWidth:20}},
      didParseCell(data){
        if(data.section==='body'&&data.column.index>=2){
          const c={'A':1,'F':2,'I':3,'D':4,'V':5,'B':6}[data.cell.raw];
          if(c&&COL[c])data.cell.styles.fillColor=COL[c];
        }
      }});
    y=doc.lastAutoTable.finalY+10;
  });
  doc.save(`Asistencia_${MONTHS_ES[month]}_${year}.pdf`);showToast('PDF exportado');
}

/* Import modal */
function showImportModal(){
  const n=(window.HISTORICAL_DATA?.teh_emps?.length||0)+(window.HISTORICAL_DATA?.oax_emps?.length||0);
  const a=(window.HISTORICAL_DATA?.teh_atts?.length||0)+(window.HISTORICAL_DATA?.oax_atts?.length||0);
  const o=document.createElement('div');o.className='modal-overlay show';o.id='imp-ov';
  o.innerHTML=`<div class="modal">
    <button class="modal-close" onclick="document.getElementById('imp-ov').remove()">&#x2715;</button>
    <div class="modal-hd"><div class="modal-title">Importar datos históricos</div>
      <div class="modal-subtitle">Ejecutar una sola vez.</div></div>
    <div class="modal-body">
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);padding:12px;font-size:12px;color:var(--slate);line-height:1.8;margin-bottom:12px">
        &bull; <strong>${n}</strong> empleados<br>
        &bull; <strong>${a}</strong> registros de asistencia (arrays por mes)
      </div>
      <div id="import-status" style="padding:9px;border-radius:var(--r-sm);font-size:12px;background:var(--surface2);border:1px solid var(--border);color:var(--muted)">Listo.</div>
      <div id="import-log" style="display:none;margin-top:7px;max-height:150px;overflow-y:auto;font-size:11px;font-family:monospace;color:var(--slate);background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);padding:7px"></div>
    </div>
    <div class="modal-ft">
      <button class="btn-save" onclick="window.sb_importHistorico()">Iniciar importación</button>
      <button class="btn-outline" onclick="document.getElementById('imp-ov').remove()">Cancelar</button>
    </div>
  </div>`;
  document.body.appendChild(o);
}
