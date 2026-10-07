/* ============================================
   ProVend - smartPooling.js
   Lógica compartida de Compra Comunitaria (Smart Pooling)
   Usada por explorar.html y perfil-proveedor.html
   ============================================ */

window.renderSmartPooling = async function (materialId, refresh) {
    const box = document.getElementById('smart-pooling-container');
    if (!box) return;
    box.style.display = 'none';

    try {
        const res = await fetch(`${API_BASE}/api/smart-pooling`);
        if (!res.ok) return;
        const pools = await res.json();
        const pool = pools.find(p => p.material_id == materialId);
        if (!pool) return;

        const unidad = pool.unidad || 'kg';
        const completado = pool.estado === 'Completado';
        const pct = pool.porcentaje != null ? pool.porcentaje : 0;

        box.style.display = 'block';
        document.getElementById('sp-progress-text').textContent = `${pool.progreso} ${unidad} / ${parseFloat(pool.cantidad_objetivo)} ${unidad}`;
        document.getElementById('sp-progress-percent').textContent = `${pct}%`;
        const bar = document.getElementById('sp-progress-bar');
        bar.style.width = `${pct}%`;
        bar.style.background = completado ? '#15803D' : '#16A34A';

        // Línea de contexto: participantes, faltante y fecha límite
        let meta = document.getElementById('sp-meta');
        if (!meta) {
            meta = document.createElement('div');
            meta.id = 'sp-meta';
            meta.style.cssText = 'font-size:0.8rem; color:#15803D; margin-top:0.5rem; display:flex; flex-wrap:wrap; gap:0.75rem;';
            document.getElementById('btn-join-pool').before(meta);
        }
        const partes = [`${pool.participantes} empresa${pool.participantes === 1 ? '' : 's'} unidas`];
        if (!completado) partes.push(`Faltan ${pool.faltante} ${unidad}`);
        if (pool.fecha_limite) partes.push(`Cierra: ${new Date(pool.fecha_limite).toLocaleDateString()}`);
        meta.innerHTML = partes.map(t => `<span>• ${t}</span>`).join('');

        const badge = box.querySelector('span[style*="background:#16A34A"]');
        if (badge) badge.textContent = completado ? 'Meta alcanzada' : 'Activo';

        const btn = document.getElementById('btn-join-pool');
        if (completado) {
            btn.textContent = '¡Meta alcanzada! 🎉';
            btn.disabled = true;
            btn.style.opacity = '0.7';
            btn.style.cursor = 'default';
            btn.onclick = null;
            return;
        }
        btn.textContent = 'Unirme a esta compra conjunta';
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';

        btn.onclick = async function () {
            const amount = prompt(`¿Cuántos ${unidad} deseas aportar a esta compra conjunta? (faltan ${pool.faltante})`);
            if (amount === null) return;
            const cantidad = parseFloat(amount);
            if (!(cantidad > 0)) { alert('Ingresa una cantidad válida mayor a 0.'); return; }

            btn.disabled = true;
            btn.textContent = 'Uniéndote...';
            try {
                const r = await fetch(`${API_BASE}/api/smart-pooling/${pool.id}/join`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('ProVend_token')
                    },
                    body: JSON.stringify({ cantidad_aportada: cantidad })
                });
                const d = await r.json();
                if (d.success) {
                    alert(d.completado
                        ? '🎉 ¡Meta alcanzada! Tu aporte completó la compra conjunta.'
                        : '¡Te uniste a la compra conjunta! Ya llevamos ' + d.porcentaje + '% de la meta.');
                    if (typeof refresh === 'function') refresh(); else window.renderSmartPooling(materialId);
                } else {
                    alert(r.status === 401 || r.status === 403 && !d.error
                        ? 'Debes iniciar sesión como Empresa para unirte.'
                        : (d.error || 'No se pudo completar la acción.'));
                    window.renderSmartPooling(materialId, refresh);
                }
            } catch (e) {
                alert('Error de conexión. Intenta de nuevo.');
                window.renderSmartPooling(materialId, refresh);
            }
        };
    } catch (e) {
        console.error('Error cargando Smart Pooling:', e);
    }
};
