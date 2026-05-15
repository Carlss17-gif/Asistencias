/* js/config.js */
const SB_URL_CFG = 'https://qlhiuyprdxvioksbheqb.supabase.co';
const SB_KEY_CFG = 'sb_publishable_JVgKaqhtZeL2sXGviv2QGg_HgnmacPO';
const SUC_OAX_ID = '00000000-0001-0001-0001-000000000001';
const SUC_TEH_ID = '00000000-0002-0002-0002-000000000002';
const DRIVE_FOLDER_ID = '1lt0s4GzJUq_PmBDak2CiOM26D3uhB3DC';

const DAYS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00',
               '15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00',
               '23:00','00:00','01:00','02:00','03:00','04:00'];
const SHIFT_OPTIONS = [
  {hi:'07:00',hf:'15:00'},{hi:'08:00',hf:'16:00'},{hi:'09:00',hf:'17:00'},
  {hi:'10:00',hf:'18:00'},{hi:'11:00',hf:'19:00'},{hi:'12:00',hf:'20:00'},
  {hi:'13:00',hf:'21:00'},{hi:'14:00',hf:'22:00'},{hi:'16:00',hf:'00:00'},
  {hi:'04:00',hf:'12:00'},
];
const PUESTOS_CERRADOR = ['C. Gral. Cerrador','C.Gral. Cerrador','C. Gral. Cerrador.'];

/* Attendance codes */
const CODE = { NONE:0, ASISTIO:1, FALTA:2, INC:3, OFF:4, VAC:5, BAJA:6, PSGS:7 };
const CODE_CLASS = ['c0','c1','c2','c3','c4','c5','c6','c7'];
const CODE_LABEL = ['Sin registro','Asistió','Falta','Incapacidad','Descanso','Vacación','Baja','Permiso'];

const MONTHS_ES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
