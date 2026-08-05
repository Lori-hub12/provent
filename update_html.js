const fs = require('fs');

let dp = fs.readFileSync('dashboard-proveedor.html', 'utf8');

const oldFormInputs = `        <div class="form-group">
          <label>Descripcin</label>
          <textarea id="mat-descripcion" rows="3" placeholder="Descripcin del material, calidad, proceso..."></textarea>
        </div>`;
const newFormInputs = `        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem">
          <div class="form-group" style="margin-bottom:0">
            <label>Precio Estimado</label>
            <input type="text" id="mat-precio" placeholder="Ej. $120 / Ton">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label>Volumen Mnimo</label>
            <input type="text" id="mat-volumen" placeholder="Ej. 1 Tonelada">
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem">
          <div class="form-group" style="margin-bottom:0">
            <label>Frecuencia de Disponibilidad</label>
            <select id="mat-frecuencia">
              <option value="Mensual">Mensual</option>
              <option value="Semanal">Semanal</option>
              <option value="nica vez">nica vez</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label>Calidad / Pureza</label>
            <input type="text" id="mat-calidad" placeholder="Ej. Lavado 99%">
          </div>
        </div>
        <div class="form-group">
          <label>Descripcin</label>
          <textarea id="mat-descripcion" rows="3" placeholder="Descripcin del material, calidad, proceso..."></textarea>
        </div>`;
// NOTE: I'm using standard chars just in case encoding gets tricky, let me just match the textarea part.
const oldFormInputRegex = /<div class="form-group">\s*<label>Descripci.n<\/label>\s*<textarea id="mat-descripcion"/g;
dp = dp.replace(oldFormInputRegex, `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem">
          <div class="form-group" style="margin-bottom:0">
            <label>Precio Estimado</label>
            <input type="text" id="mat-precio" placeholder="Ej. $120 / Ton">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label>Volumen Minimo</label>
            <input type="text" id="mat-volumen" placeholder="Ej. 1 Tonelada">
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem">
          <div class="form-group" style="margin-bottom:0">
            <label>Frecuencia</label>
            <select id="mat-frecuencia">
              <option value="Mensual">Mensual</option>
              <option value="Semanal">Semanal</option>
              <option value="Unica vez">Unica vez</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label>Calidad / Pureza</label>
            <input type="text" id="mat-calidad" placeholder="Ej. Lavado 99%">
          </div>
        </div>
        <div class="form-group">
          <label>Descripcion</label>
          <textarea id="mat-descripcion"`);

// Update submit logic to include new fields
const oldSubmitLogic = `        formData.append('proveedor_id', user.id);
        formData.append('nombre', document.getElementById('mat-nombre').value);
        formData.append('cantidad', document.getElementById('mat-cantidad').value);
        formData.append('unidad', document.getElementById('mat-unidad').value);
        formData.append('descripcion', document.getElementById('mat-descripcion').value);`;

const newSubmitLogic = `        formData.append('proveedor_id', user.id);
        formData.append('nombre', document.getElementById('mat-nombre').value);
        formData.append('cantidad', document.getElementById('mat-cantidad').value);
        formData.append('unidad', document.getElementById('mat-unidad').value);
        formData.append('descripcion', document.getElementById('mat-descripcion').value);
        formData.append('precio_estimado', document.getElementById('mat-precio').value);
        formData.append('volumen_minimo', document.getElementById('mat-volumen').value);
        formData.append('frecuencia_disponibilidad', document.getElementById('mat-frecuencia').value);
        formData.append('calidad_pureza', document.getElementById('mat-calidad').value);`;

dp = dp.replace(oldSubmitLogic, newSubmitLogic);

fs.writeFileSync('dashboard-proveedor.html', dp, 'utf8');
console.log('dashboard-proveedor.html updated');
