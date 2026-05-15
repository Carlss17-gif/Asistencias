/* js/modals.js — Manejo genérico de modales */

function closeModal(id) {
  document.getElementById(id).classList.remove('show');

  if (id === 'sched-day-modal') {
    document.getElementById('sched-tipo-group').style.display  = '';
    document.getElementById('sched-modal-actions').style.display = '';
    document.getElementById('sched-hours-group').innerHTML = `
      <div class="form-row-2">
        <div class="form-group">
          <label class="field-label">Hora Inicio</label>
          <select id="sched-inicio"></select>
        </div>
        <div class="form-group">
          <label class="field-label">Hora Fin</label>
          <select id="sched-fin"></select>
        </div>
      </div>`;
  }
}

/* Cerrar al hacer click en el overlay */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', e => { if (e.target === el) closeModal(el.id); });
  });
});
