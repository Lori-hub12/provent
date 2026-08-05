/* ============================================
   ProVend — auth.js
   Mock authentication with localStorage
   ============================================ */

const AUTH_KEY = 'ProVend_user';

// ---- Mock Users ----
const mockUsers = [
  { id: 1, email: 'empresa@demo.com', password: 'demo123', name: 'María López', role: 'empresa', company: 'Distribuidora El Sol' },
  { id: 2, email: 'proveedor@demo.com', password: 'demo123', name: 'Carlos Mendoza', role: 'proveedor', company: 'TechNica Solutions' },
  { id: 3, email: 'admin@ProVend.ni', password: 'admin123', name: 'Admin ProVend', role: 'admin', company: 'ProVend' },
];

async function login(email, password) {
  try {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    localStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, error: err.message || 'Error de conexión' };
  }
}

async function register(data) {
  try {
    const res = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: data.name,
        email: data.email,
        password: data.password,
        rol: data.role
      })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    localStorage.setItem(AUTH_KEY, JSON.stringify(result.user));
    return { success: true, user: result.user };
  } catch (err) {
    return { success: false, error: err.message || 'Error de conexión' };
  }
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'index.html';
}

function getCurrentUser() {
  const data = localStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
}

function isLoggedIn() {
  return !!getCurrentUser();
}

function requireAuth(redirectTo = 'login.html') {
  if (!isLoggedIn()) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

// ---- Login Form Handler ----
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    // Clear errors
    clearFormErrors();

    if (!email) {
      showFieldError('login-email', 'El correo es requerido');
      return;
    }

    if (!password) {
      showFieldError('login-password', 'La contraseña es requerida');
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      const role = result.user.rol || result.user.role;
      const userName = result.user.nombre || result.user.name || result.user.company || 'Usuario';
      
      // Inject full screen loader
      const loaderHtml = `
        <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:white; z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; transition:opacity 0.5s ease" id="login-loader">
            <div style="width:50px; height:50px; border:4px solid var(--neutral-200); border-top-color:var(--primary-600); border-radius:50%; animation:spin 1s linear infinite; margin-bottom:1.5rem"></div>
            <h2 style="font-size:1.5rem; font-weight:700; color:var(--neutral-900); margin-bottom:0.5rem" id="loader-title">Cargando perfil...</h2>
            <p style="color:var(--neutral-500); font-weight:500" id="loader-subtitle">Preparando tu entorno B2B</p>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', loaderHtml);
      
      setTimeout(() => {
          document.getElementById('loader-title').textContent = `Bienvenido, ${userName}`;
          document.getElementById('loader-subtitle').textContent = role === 'proveedor' ? 'Entrando al Centro de Gestión...' : 'Entrando al Centro de Compras...';
          
          setTimeout(() => {
            if (role === 'admin') window.location.href = 'admin.html';
            else if (role === 'proveedor') window.location.href = 'dashboard-proveedor.html';
            else window.location.href = 'dashboard-empresa.html';
          }, 1200);
      }, 1500);
      
    } else {
      showFieldError('login-email', result.error);
      showToast(result.error, 'error');
    }
  });

  // Toggle password visibility
  const toggleBtn = document.getElementById('toggle-password');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const input = document.getElementById('login-password');
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      toggleBtn.innerHTML = isPassword ? icons.eyeOff : icons.eye;
    });
  }
}

// ---- Register Form Handler ----
function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  // Type selector
  const typeOptions = document.querySelectorAll('.auth-type-option');
  let selectedType = 'proveedor';
  const initialSelected = document.querySelector('.auth-type-option.selected');
  if (initialSelected) selectedType = initialSelected.dataset.type;

  const fieldsEmpresa = document.getElementById('fields-empresa');
  const fieldsProveedor = document.getElementById('fields-proveedor');

  function updateFieldsVisibility() {
      if (selectedType === 'empresa') {
          if (fieldsEmpresa) fieldsEmpresa.style.display = 'block';
          if (fieldsProveedor) fieldsProveedor.style.display = 'none';
      } else {
          if (fieldsEmpresa) fieldsEmpresa.style.display = 'none';
          if (fieldsProveedor) fieldsProveedor.style.display = 'block';
      }
  }
  
  updateFieldsVisibility();

  typeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      typeOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedType = opt.dataset.type;
      updateFieldsVisibility();
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    
    let company = '';
    if(selectedType === 'empresa') {
        const c = document.getElementById('register-company-empresa');
        if(c) company = c.value.trim();
    } else {
        const c = document.getElementById('register-company-proveedor');
        if(c) company = c.value.trim();
    }

    const password = document.getElementById('register-password').value;
    const terms = document.getElementById('register-terms');

    clearFormErrors();

    if (!name) { showFieldError('register-name', 'El nombre de contacto es requerido'); return; }
    if (!email) { showFieldError('register-email', 'El correo es requerido'); return; }
    
    if (!company) { 
        showFieldError(selectedType === 'empresa' ? 'register-company-empresa' : 'register-company-proveedor', 'El nombre es requerido'); 
        return; 
    }
    
    if(selectedType === 'proveedor') {
        const rucEl = document.getElementById('register-ruc');
        const catEl = document.getElementById('register-category');
        if(rucEl && !rucEl.value.trim()) { showFieldError('register-ruc', 'El RUC es requerido'); return; }
        if(catEl && !catEl.value.trim()) { showFieldError('register-category', 'Selecciona una categoría'); return; }
    }

    if (!password || password.length < 6) { showFieldError('register-password', 'Mínimo 6 caracteres'); return; }
    if (terms && !terms.checked) { showToast('Debes aceptar los términos de servicio', 'warning'); return; }

    const result = await register({ name, email, company, password, role: selectedType });

    if (result.success) {
      showToast('¡Cuenta creada exitosamente!', 'success');
      setTimeout(() => {
        if (selectedType === 'proveedor') {
          window.location.href = 'dashboard-proveedor.html';
        } else {
          window.location.href = 'dashboard-empresa.html';
        }
      }, 1000);
    } else {
      showToast(result.error, 'error');
    }
  });
}

// ---- Form Helpers ----
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('error');
  
  let errorEl = field.parentElement.querySelector('.form-error');
  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.className = 'form-error';
    field.parentElement.appendChild(errorEl);
  }
  errorEl.textContent = message;
}

function clearFormErrors() {
  document.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.form-error').forEach(el => el.remove());
}

// ---- Favorites (localStorage) ----
function toggleFavorite(providerId) {
  let favorites = getFavorites();
  const index = favorites.indexOf(providerId);
  
  if (index > -1) {
    favorites.splice(index, 1);
    showToast('Eliminado de favoritos', 'info');
  } else {
    favorites.push(providerId);
    showToast('Agregado a favoritos', 'success');
  }
  
  localStorage.setItem('ProVend_favorites', JSON.stringify(favorites));
  return favorites.includes(providerId);
}

function getFavorites() {
  const data = localStorage.getItem('ProVend_favorites');
  return data ? JSON.parse(data) : [];
}

function isFavorite(providerId) {
  return getFavorites().includes(providerId);
}

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initRegisterForm();
});

// Make functions globally available
window.ProVendAuth = {
  login, register, logout, getCurrentUser, isLoggedIn, requireAuth,
  toggleFavorite, getFavorites, isFavorite
};
