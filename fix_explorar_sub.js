const fs = require('fs');
let html = fs.readFileSync('explorar.html', 'utf8');

const startIdx = html.indexOf('<div class="filter-title">Ubicaci');
const endMarker = 'value="Rivas" > Rivas</label>';
const endIdx = html.indexOf(endMarker) + endMarker.length;

if (startIdx !== -1 && endIdx > startIdx) {
    const replacement = `<div class="filter-title">Ubicación</div>
                <label class="filter-label"><input type="checkbox" onchange="triggerSearch()" value="Boaco" > Boaco</label>
                <label class="filter-label"><input type="checkbox" onchange="triggerSearch()" value="Carazo" > Carazo</label>
                <label class="filter-label"><input type="checkbox" onchange="triggerSearch()" value="Chinandega" > Chinandega</label>
                <label class="filter-label"><input type="checkbox" onchange="triggerSearch()" value="Chontales" > Chontales</label>
                <label class="filter-label"><input type="checkbox" onchange="triggerSearch()" value="Estelí" > Estelí</label>
                <label class="filter-label"><input type="checkbox" onchange="triggerSearch()" value="Granada" > Granada</label>
                <label class="filter-label"><input type="checkbox" onchange="triggerSearch()" value="Jinotega" > Jinotega</label>
                <label class="filter-label"><input type="checkbox" onchange="triggerSearch()" value="León" > León</label>
                <label class="filter-label"><input type="checkbox" onchange="triggerSearch()" value="Madriz" > Madriz</label>
                <label class="filter-label"><input type="checkbox" onchange="triggerSearch()" value="Managua" > Managua</label>
                <label class="filter-label"><input type="checkbox" onchange="triggerSearch()" value="Masaya" > Masaya</label>
                <label class="filter-label"><input type="checkbox" onchange="triggerSearch()" value="Matagalpa" > Matagalpa</label>
                <label class="filter-label"><input type="checkbox" onchange="triggerSearch()" value="Nueva Segovia" > Nueva Segovia</label>
                <label class="filter-label"><input type="checkbox" onchange="triggerSearch()" value="Río San Juan" > Río San Juan</label>
                <label class="filter-label"><input type="checkbox" onchange="triggerSearch()" value="Rivas" > Rivas</label>`;
    
    html = html.substring(0, startIdx) + replacement + html.substring(endIdx);
    fs.writeFileSync('explorar.html', html);
    console.log('Fixed explorar.html filters via exact index match');
} else {
    console.log('Indexes not found', startIdx, endIdx);
}
