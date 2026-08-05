const fs = require('fs');

function replaceFetches(file) {
    let content = fs.readFileSync(file, 'utf8');
    // We replace fetch(URL, { ... }) with ProVendAuth.apiFetch(URL, { ... }) for specific calls.
    // However, some gets are just fetch(`...`) without options.
    // `ProVendAuth.apiFetch` takes options as second param, but defaults to {}.
    
    // For dashboard-empresa.html:
    // fetch(`http://localhost:3000/api/dashboard/empresa/${user.id}`)
    content = content.replace(
        /fetch\(`http:\/\/localhost:3000\/api\/dashboard\/empresa\/\$\{user\.id\}`\)/g,
        "ProVendAuth.apiFetch(`http://localhost:3000/api/dashboard/empresa/${user.id}`)"
    );
    // fetch(`http://localhost:3000/api/dashboard/empresa/${user.id}/favoritos`)
    content = content.replace(
        /fetch\(`http:\/\/localhost:3000\/api\/dashboard\/empresa\/\$\{user\.id\}\/favoritos`\)/g,
        "ProVendAuth.apiFetch(`http://localhost:3000/api/dashboard/empresa/${user.id}/favoritos`)"
    );
    // fetch(`http://localhost:3000/api/dashboard/empresa/${user.id}/historial`)
    content = content.replace(
        /fetch\(`http:\/\/localhost:3000\/api\/dashboard\/empresa\/\$\{user\.id\}\/historial`\)/g,
        "ProVendAuth.apiFetch(`http://localhost:3000/api/dashboard/empresa/${user.id}/historial`)"
    );
    // fetch(`http://localhost:3000/api/usuarios/empresa/${user.id}`, { method: 'PUT'...
    content = content.replace(
        /fetch\(`http:\/\/localhost:3000\/api\/usuarios\/empresa\/\$\{user\.id\}`,\s*\{/g,
        "ProVendAuth.apiFetch(`http://localhost:3000/api/usuarios/empresa/${user.id}`, {"
    );

    // For dashboard-proveedor.html
    // fetch(`http://localhost:3000/api/dashboard/proveedor/${user.id}`) -> Not protected yet, but let's leave it public or protect it later.
    // fetch('http://localhost:3000/api/materiales', { method: 'POST'...
    content = content.replace(
        /fetch\('http:\/\/localhost:3000\/api\/materiales',\s*\{/g,
        "ProVendAuth.apiFetch('http://localhost:3000/api/materiales', {"
    );
    // fetch(`http://localhost:3000/api/materiales/${id}`, { method: 'DELETE'...
    content = content.replace(
        /fetch\(`http:\/\/localhost:3000\/api\/materiales\/\$\{id\}`,\s*\{/g,
        "ProVendAuth.apiFetch(`http://localhost:3000/api/materiales/${id}`, {"
    );
    // fetch('http://localhost:3000/api/upload', { method: 'POST'...
    content = content.replace(
        /fetch\('http:\/\/localhost:3000\/api\/upload',\s*\{/g,
        "ProVendAuth.apiFetch('http://localhost:3000/api/upload', {"
    );
    // fetch(`http://localhost:3000/api/perfiles_proveedor/${user.id}`, { method: 'PUT'...
    content = content.replace(
        /fetch\(`http:\/\/localhost:3000\/api\/perfiles_proveedor\/\$\{user\.id\}`,\s*\{/g,
        "ProVendAuth.apiFetch(`http://localhost:3000/api/perfiles_proveedor/${user.id}`, {"
    );

    // For perfil-proveedor.html
    // POST/DELETE favoritos
    content = content.replace(
        /fetch\('http:\/\/localhost:3000\/api\/favoritos',\s*\{/g,
        "ProVendAuth.apiFetch('http://localhost:3000/api/favoritos', {"
    );

    fs.writeFileSync(file, content, 'utf8');
}

['dashboard-empresa.html', 'dashboard-proveedor.html', 'perfil-proveedor.html'].forEach(f => {
    if(fs.existsSync(f)) {
        replaceFetches(f);
        console.log('Updated', f);
    }
});
