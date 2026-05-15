/* js/auth.js  v7 */
let currentUser     = null;
let currentSucursal = null;
let empleados       = [];
let asistencias     = [];   // array-month records: [{sucursal_id,empleado_id,empleado_nombre,empleado_apellido,year,month,dias[]}]
let horarioDetalle  = [];

async function doLogin(){
  const email=document.getElementById('login-email').value.trim();
  const pass =document.getElementById('login-pass').value.trim();
  let user=null;
  try{user=await sb_login(email,pass);}catch(e){console.warn('SB login:',e.message);}
  if(!user){
    user=DEMO_USERS.find(u=>u.email===email&&(u.password_hash===pass||u.password_txt===pass));
    if(!user){showToast('Credenciales incorrectas','error');return;}
  }
  currentUser=user;
  if(user.rol==='admin'){currentSucursal=null;}
  else{
    currentSucursal=DEMO_SUCURSALES.find(s=>s.id===user.sucursal_id)||DEMO_SUCURSALES[0];
    await loadBranchData();
  }
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('branch-name').textContent=currentSucursal
    ?`${currentSucursal.nombre} — ${currentSucursal.ciudad}`
    :'Administrador — Todas las Sucursales';
  document.getElementById('user-name').textContent=user.nombre;
  showTab('asistencia');
}

function doLogout(){
  currentUser=null;currentSucursal=null;
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('app').style.display='none';
}

async function switchBranch(){
  currentSucursal=DEMO_SUCURSALES.find(s=>s.id!==currentSucursal?.id);
  await loadBranchData();
  document.getElementById('branch-name').textContent=`${currentSucursal.nombre} — ${currentSucursal.ciudad}`;
  showToast('Sucursal: '+currentSucursal.nombre);
  showTab('asistencia');
}

async function loadBranchData(){
  if(!currentSucursal) return;
  // Clear previous branch data
  horarioDetalle=[];
  const sid=currentSucursal.id;
  try{
    const r=await sb_loadBranch(sid);
    if(r.empleados.length>0){
      empleados=r.empleados;
      asistencias=r.asistencias;
      // Load disponibilidad from Supabase and attach to employees
      try{
        const disp = await sbFetch(`disponibilidad?empleado_id=in.(${empleados.map(e=>`"${e.id}"`).slice(0,50).join(',')})&select=*`);
        if(disp && disp.length){
          const byEmp = {};
          disp.forEach(d=>{ if(!byEmp[d.empleado_id]) byEmp[d.empleado_id]=[]; byEmp[d.empleado_id].push(d); });
          empleados.forEach(e=>{ if(byEmp[e.id]) e.disponibilidad=byEmp[e.id]; });
        }
      }catch(e){console.warn('Disp load:',e.message);}
      // Also merge any newer asistencias from localStorage
      const k=sid===SUC_OAX_ID?'oax':'teh';
      const localAtts=getLS('att_'+k)||[];
      localAtts.forEach(la=>{
        const idx=asistencias.findIndex(a=>
          (a.empleado_id&&a.empleado_id===la.empleado_id||
           a.empleado_nombre===la.empleado_nombre&&a.empleado_apellido===la.empleado_apellido&&a.sucursal_id===la.sucursal_id)
          &&a.year===la.year&&a.month===la.month);
        if(idx<0) asistencias.push(la); // add local-only records
      });
      // Load horarioDetalle from localStorage (not stored in Supabase)
      horarioDetalle=getLS('hd_'+k)||[];
      console.log(`[Auth] Loaded: ${empleados.length} emps, ${asistencias.length} atts, ${horarioDetalle.length} sched`);
      _saveLocal();return;
    }
    console.warn('[Auth] Supabase returned 0 employees — using local fallback');
  }catch(e){console.warn('[Auth] SB load error:',e.message);}
  const k=sid===SUC_OAX_ID?'oax':'teh';
  const def=sid===SUC_OAX_ID?[...DEMO_EMPLEADOS_OAX]:[...DEMO_EMPLEADOS_TEH];
  empleados  =getLS('emp_'+k)||def;
  asistencias=getLS('att_'+k)||[];
  horarioDetalle=getLS('hd_'+k)||[];
}

function _k(){
  if(!currentSucursal) return 'all';
  return currentSucursal.id===SUC_OAX_ID?'oax':'teh';
}
function _saveLocal(){
  setLS('emp_'+_k(),empleados);
  setLS('att_'+_k(),asistencias);
}
function saveEmpleados(){
  setLS('emp_'+_k(),empleados);
  // Sync baja/activo changes to Supabase in background
  empleados.forEach(emp=>{
    if(emp.id && !emp.id.startsWith('emp_') && !emp.activo){
      sb_updateEmpleado(emp.id,{activo:emp.activo,fecha_baja:emp.fecha_baja||null}).catch(()=>{});
    }
  });
}
function saveHorarioDetalle(){
  setLS('hd_'+_k(),horarioDetalle);
  sb_syncHorarios(horarioDetalle).catch(()=>{});
}

/* saveAsistencias — persists array-based records */
function saveAsistencias(){
  setLS('att_'+_k(),asistencias);
  // Sync ALL local asistencias records to Supabase (background)
  if(asistencias.length){
    sb_bulkUpsertAsistencias(asistencias).catch(e=>console.warn('att sync:',e.message));
  }
}

/* Get or create month record for an employee */
function getMonthRecord(empId,year,month){
  return asistencias.find(a=>a.empleado_id===empId&&a.year===year&&a.month===month)||
         asistencias.find(a=>a.empleado_nombre&&empleados.find(e=>e.id===empId&&e.nombre===a.empleado_nombre)&&a.year===year&&a.month===month)||
         null;
}

function upsertMonthRecord(record){
  const idx=asistencias.findIndex(a=>
    (a.empleado_id&&a.empleado_id===record.empleado_id||
     a.empleado_nombre===record.empleado_nombre&&a.empleado_apellido===record.empleado_apellido&&
     a.sucursal_id===record.sucursal_id)
    &&a.year===record.year&&a.month===record.month);
  if(idx>=0) asistencias[idx]=record; else asistencias.push(record);
}
