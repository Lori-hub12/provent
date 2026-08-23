const fs = require('fs');

let html = fs.readFileSync('admin.html', 'utf8');

const sectionEmpresas = `            <!-- ===== EMPRESAS ===== -->
            <div id="section-empresas" style="display:none">
                <div class="section-header">
                    <div>
                        <h2>Empresas (Emprendedores) Registradas</h2>
                        <p style="color:var(--neutral-500); font-size:0.875rem">Gestiona las empresas que usan la plataforma</p>
                    </div>
                    <div id="admin-search">
                        <button class="btn btn-primary btn-sm" onclick="loadEmpresas()"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg> Actualizar</button>
                    </div>
                </div>
                
                <div class="card" style="padding:0">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Empresa / Emprendedor</th>
                                <th>Estado</th>
                                <th>Registro</th>
                                <th>Requerimientos</th>
                                <th style="text-align:right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="empresas-table-body">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
            </div>
`;

// Insert the section before <!-- ===== ACTIVIDAD ===== -->
html = html.replace('            <!-- ===== ACTIVIDAD ===== -->', sectionEmpresas + '\n            <!-- ===== ACTIVIDAD ===== -->');

fs.writeFileSync('admin.html', html);
console.log('Section injected!');
