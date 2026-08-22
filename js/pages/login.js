// Cargar stats
    fetch(`${API_BASE}/api/stats`)
        .then(r => r.json())
        .then(d => {
            document.getElementById('stat-prov-left').textContent = d.proveedores || '0';
            document.getElementById('stat-emp-left').textContent = d.empresas || '0';
        }).catch(() => {});

    // Toggle password
    const pwInput = document.getElementById('login-password');
    const eyeBtn = document.getElementById('toggle-password');
    eyeBtn.addEventListener('click', () => {
        const show = pwInput.type === 'password';
        pwInput.type = show ? 'text' : 'password';
        eyeBtn.innerHTML = show
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    });

    // Demo fill
    function fillDemo(email, pw) {
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = pw;
        document.getElementById('login-email').dispatchEvent(new Event('input'));
    }

    // Real-time validation
    const emailInput = document.getElementById('login-email');
    emailInput.addEventListener('input', () => {
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
        emailInput.classList.toggle('error', emailInput.value && !valid);
        document.getElementById('err-email').classList.toggle('visible', emailInput.value && !valid);
    });

    // Form submit
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = pwInput.value;
        const errBox = document.getElementById('error-box');
        const errMsg = document.getElementById('error-msg');
        const btn = document.getElementById('submit-btn');

        // Validate
        errBox.classList.remove('visible');
        let valid = true;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById('err-email').classList.add('visible');
            emailInput.classList.add('error');
            valid = false;
        }
        if (!password) {
            document.getElementById('err-password').classList.add('visible');
            pwInput.classList.add('error');
            valid = false;
        }
        if (!valid) return;

        btn.classList.add('loading');
        btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                errMsg.textContent = data.error || 'Credenciales incorrectas';
                errBox.classList.add('visible');
                pwInput.classList.add('error');
            } else {
                ProVendAuth.setSession(data.token, data.user);
                let nextUrl = 'dashboard-proveedor.html';
                if (data.user.rol === 'empresa') nextUrl = 'dashboard-empresa.html';
                if (data.user.rol === 'admin') nextUrl = 'admin.html';
                window.location.href = nextUrl;
            }
        } catch (err) {
            errMsg.textContent = 'Error de conexión. Verifica que el servidor esté activo.';
            errBox.classList.add('visible');
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    });

    // Clear error on input
    pwInput.addEventListener('input', () => {
        pwInput.classList.remove('error');
        document.getElementById('err-password').classList.remove('visible');
        document.getElementById('error-box').classList.remove('visible');
    });