/* js/data.js — Datos demo de sucursales, usuarios y empleados */

const DEMO_SUCURSALES = [
  { id: SUC_OAX_ID, nombre: 'Porfirio Díaz', ciudad: 'Oaxaca'   },
  { id: SUC_TEH_ID, nombre: 'Tehuacán',      ciudad: 'Tehuacán' },
];

const DEMO_USERS = [
  { id:'u1', nombre:'Admin General',    email:'admin@carlsjr.mx',            password_hash:'admin123',    rol:'admin',   sucursal_id: null       },
  { id:'u2', nombre:'Gerente Oaxaca',   email:'gerente.oaxaca@carlsjr.mx',   password_hash:'oaxaca123',   rol:'gerente', sucursal_id:SUC_OAX_ID  },
  { id:'u3', nombre:'Gerente Tehuacán', email:'gerente.tehuacan@carlsjr.mx', password_hash:'tehuacan123', rol:'gerente', sucursal_id:SUC_TEH_ID  },
];

/* ---- PORFIRIO DÍAZ — OAXACA ---- */
const DEMO_EMPLEADOS_OAX = [
  { id:'e1',  sucursal_id:SUC_OAX_ID, numero_empleado:1,  nombre:'Sergio',           apellido_paterno:'Aguilar',   apellido_materno:'Palacios',  puesto:'Gerente',           activo:true, es_porter:false, fecha_ingreso:'2024-06-07' },
  { id:'e2',  sucursal_id:SUC_OAX_ID, numero_empleado:2,  nombre:'Pedro Juan',       apellido_paterno:'Osorio',    apellido_materno:'Domínguez', puesto:'Supervisor',        activo:true, es_porter:false, fecha_ingreso:'2025-12-02' },
  { id:'e3',  sucursal_id:SUC_OAX_ID, numero_empleado:3,  nombre:'Melissa Donaji',   apellido_paterno:'Mariano',   apellido_materno:'Rojas',     puesto:'Supervisor',        activo:true, es_porter:false, fecha_ingreso:'2026-03-09' },
  { id:'e4',  sucursal_id:SUC_OAX_ID, numero_empleado:4,  nombre:'Daniela Michelle', apellido_paterno:'Salazar',   apellido_materno:'León',      puesto:'Crew Lider',        activo:true, es_porter:false, fecha_ingreso:'2025-12-02' },
  { id:'e5',  sucursal_id:SUC_OAX_ID, numero_empleado:5,  nombre:'Janet Quetzalli',  apellido_paterno:'Cuevas',    apellido_materno:'García',    puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2025-12-02' },
  { id:'e6',  sucursal_id:SUC_OAX_ID, numero_empleado:6,  nombre:'Luis Ángel',       apellido_paterno:'Hernández', apellido_materno:'Gutiérrez', puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2025-12-02' },
  { id:'e7',  sucursal_id:SUC_OAX_ID, numero_empleado:7,  nombre:'Juan Alberto',     apellido_paterno:'Ala vez',   apellido_materno:'Hernández', puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2025-12-02' },
  { id:'e8',  sucursal_id:SUC_OAX_ID, numero_empleado:8,  nombre:'Carlos Gael',      apellido_paterno:'Lopez',     apellido_materno:'Salazar',   puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-01-16' },
  { id:'e9',  sucursal_id:SUC_OAX_ID, numero_empleado:9,  nombre:'Flor Estrella',    apellido_paterno:'Leon',      apellido_materno:'Huerta',    puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-01-16' },
  { id:'e10', sucursal_id:SUC_OAX_ID, numero_empleado:10, nombre:'Emmanuel',          apellido_paterno:'Avendaño',  apellido_materno:'Ramos',     puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-01-16' },
  { id:'e11', sucursal_id:SUC_OAX_ID, numero_empleado:11, nombre:'Ximena Sarai',     apellido_paterno:'Sanchez',   apellido_materno:'Carrasco',  puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2025-12-05' },
  { id:'e12', sucursal_id:SUC_OAX_ID, numero_empleado:12, nombre:'Abraham',           apellido_paterno:'Mendoza',   apellido_materno:'Vargas',    puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2025-12-22' },
  { id:'e13', sucursal_id:SUC_OAX_ID, numero_empleado:13, nombre:'Brenda Lizeth',    apellido_paterno:'Ramirez',   apellido_materno:'Flores',    puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-01-06' },
  { id:'e14', sucursal_id:SUC_OAX_ID, numero_empleado:14, nombre:'Arturo',            apellido_paterno:'Gutierrez', apellido_materno:'Hernandez', puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-01-21' },
  { id:'e15', sucursal_id:SUC_OAX_ID, numero_empleado:15, nombre:'Ricardo',           apellido_paterno:'Lopez',     apellido_materno:'Sanchez',   puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-01-21' },
  { id:'e16', sucursal_id:SUC_OAX_ID, numero_empleado:16, nombre:'Javier',            apellido_paterno:'Miguel',    apellido_materno:'Martinez',  puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-01-02' },
  { id:'e17', sucursal_id:SUC_OAX_ID, numero_empleado:17, nombre:'Salem Ithaí',       apellido_paterno:'Hernandez', apellido_materno:'Campos',    puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-01-30' },
  { id:'e18', sucursal_id:SUC_OAX_ID, numero_empleado:18, nombre:'Christopher Gael', apellido_paterno:'Mendoza',   apellido_materno:'Mejía',     puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-02-23' },
  { id:'e19', sucursal_id:SUC_OAX_ID, numero_empleado:19, nombre:'Gustavo',           apellido_paterno:'Careño',    apellido_materno:'Velasquez', puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-03-04' },
  { id:'e20', sucursal_id:SUC_OAX_ID, numero_empleado:20, nombre:'Francisco Said',   apellido_paterno:'Robles',    apellido_materno:'Sumano',    puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-03-24' },
  { id:'e21', sucursal_id:SUC_OAX_ID, numero_empleado:21, nombre:'Catalina',          apellido_paterno:'Vasquez',   apellido_materno:'Reyes',     puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-03-24' },
  { id:'e22', sucursal_id:SUC_OAX_ID, numero_empleado:22, nombre:'Angel Francisco',  apellido_paterno:'Garcia',    apellido_materno:'Caballero', puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-02-05' },
  { id:'e23', sucursal_id:SUC_OAX_ID, numero_empleado:23, nombre:'Ángel Anselmo',    apellido_paterno:'Vásquez',   apellido_materno:'Martínez',  puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2025-12-02' },
  { id:'e24', sucursal_id:SUC_OAX_ID, numero_empleado:24, nombre:'Alina Julieta',    apellido_paterno:'Lopez',     apellido_materno:'Cervantes', puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2025-12-02' },
];

/* ---- TEHUACÁN ---- */
const DEMO_EMPLEADOS_TEH = [
  { id:'t1',  sucursal_id:SUC_TEH_ID, numero_empleado:1,  nombre:'Guadalupe',         apellido_paterno:'Camarena',  apellido_materno:'Alvarado',  puesto:'Gerente',           activo:true, es_porter:false, fecha_ingreso:'2022-05-08' },
  { id:'t2',  sucursal_id:SUC_TEH_ID, numero_empleado:2,  nombre:'Dulce Gabriela',   apellido_paterno:'Juarez',    apellido_materno:'Palafox',   puesto:'Supervisor',        activo:true, es_porter:false, fecha_ingreso:'2025-05-27' },
  { id:'t3',  sucursal_id:SUC_TEH_ID, numero_empleado:3,  nombre:'Sergio',            apellido_paterno:'Rodriguez', apellido_materno:'Gaspar',    puesto:'Supervisor',        activo:true, es_porter:false, fecha_ingreso:'2025-09-09' },
  { id:'t4',  sucursal_id:SUC_TEH_ID, numero_empleado:4,  nombre:'José Israel',       apellido_paterno:'Nen',       apellido_materno:'Cervantez', puesto:'Crew Lider',        activo:true, es_porter:false, fecha_ingreso:'2025-06-11' },
  { id:'t5',  sucursal_id:SUC_TEH_ID, numero_empleado:5,  nombre:'Geovanny',          apellido_paterno:'Delgado',   apellido_materno:'Martinez',  puesto:'Crew Lider',        activo:true, es_porter:false, fecha_ingreso:'2025-06-11' },
  { id:'t6',  sucursal_id:SUC_TEH_ID, numero_empleado:6,  nombre:'Christopher',       apellido_paterno:'Huerta',    apellido_materno:'Parra',     puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2025-06-11' },
  { id:'t7',  sucursal_id:SUC_TEH_ID, numero_empleado:7,  nombre:'Victor',            apellido_paterno:'Marquez',   apellido_materno:'Garcia',    puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2025-06-11' },
  { id:'t8',  sucursal_id:SUC_TEH_ID, numero_empleado:8,  nombre:'Jesús Antonio',    apellido_paterno:'Román',     apellido_materno:'Ortega',    puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2025-06-11' },
  { id:'t9',  sucursal_id:SUC_TEH_ID, numero_empleado:9,  nombre:'Alfredo',           apellido_paterno:'Martinez',  apellido_materno:'Ortiz',     puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2025-06-11' },
  { id:'t10', sucursal_id:SUC_TEH_ID, numero_empleado:10, nombre:'Ana',               apellido_paterno:'Gallardo',  apellido_materno:'García',    puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2025-06-11' },
  { id:'t11', sucursal_id:SUC_TEH_ID, numero_empleado:11, nombre:'Pamela Alessandra', apellido_paterno:'Torres',    apellido_materno:'Gonzalez',  puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2025-07-21' },
  { id:'t12', sucursal_id:SUC_TEH_ID, numero_empleado:12, nombre:'Minerba Elodia',   apellido_paterno:'Montiel',   apellido_materno:'Velazquez', puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2025-08-18' },
  { id:'t13', sucursal_id:SUC_TEH_ID, numero_empleado:13, nombre:'Susana',            apellido_paterno:'Flores',    apellido_materno:'Salazar',   puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2025-09-04' },
  { id:'t14', sucursal_id:SUC_TEH_ID, numero_empleado:14, nombre:'Cristian',          apellido_paterno:'Ramirez',   apellido_materno:'Cruz',      puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-01-05' },
  { id:'t15', sucursal_id:SUC_TEH_ID, numero_empleado:15, nombre:'Raul David',       apellido_paterno:'Franco',    apellido_materno:'Nehuas',    puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-01-05' },
  { id:'t16', sucursal_id:SUC_TEH_ID, numero_empleado:16, nombre:'Eduardo',           apellido_paterno:'Suriano',   apellido_materno:'Cansino',   puesto:'Colab. Gral.',      activo:true, es_porter:false, fecha_ingreso:'2026-04-28' },
  { id:'t17', sucursal_id:SUC_TEH_ID, numero_empleado:17, nombre:'Antonio de Jesus', apellido_paterno:'Contreras', apellido_materno:'Martinez',  puesto:'C. Gral. Cerrador', activo:true, es_porter:false, fecha_ingreso:'2026-03-10' },
  { id:'t18', sucursal_id:SUC_TEH_ID, numero_empleado:18, nombre:'Aldayir',           apellido_paterno:'Peña',      apellido_materno:'Ramon',     puesto:'C. Gral. Cerrador', activo:true, es_porter:false, fecha_ingreso:'2025-06-11' },
  { id:'t19', sucursal_id:SUC_TEH_ID, numero_empleado:19, nombre:'Arelly Michelle',  apellido_paterno:'Osorio',    apellido_materno:'Amayo',     puesto:'C. Gral. Cerrador', activo:true, es_porter:false, fecha_ingreso:'2025-06-11' },
  { id:'t20', sucursal_id:SUC_TEH_ID, numero_empleado:20, nombre:'Oscar Alexis',     apellido_paterno:'Jimenez',   apellido_materno:'Lara',      puesto:'C. Gral. Cerrador', activo:true, es_porter:false, fecha_ingreso:'2025-08-21' },
  { id:'t21', sucursal_id:SUC_TEH_ID, numero_empleado:21, nombre:'Aldo Omar',        apellido_paterno:'Diaz',      apellido_materno:'Aguilar',   puesto:'Porter',            activo:true, es_porter:true,  fecha_ingreso:'2025-09-09' },
];
