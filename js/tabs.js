/* js/tabs.js  v7 */
function showTab(tab){
  ['asistencia','horarios','empleados','reportes'].forEach(t=>{
    document.getElementById(`tab-${t}-content`).style.display=t===tab?'block':'none';
    document.getElementById(`tab-${t}`).classList.toggle('active',t===tab);
  });
  if(tab==='asistencia'){
    if(currentUser?.rol==='admin') renderAdmin();
    else renderAsistencia();
  }
  else if(tab==='horarios')  renderHorarios();
  else if(tab==='empleados') renderEmpleados();
  else if(tab==='reportes')  renderReportes();
}
