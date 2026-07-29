/* ============================================
   ProVend — dashboard.js
   Dashboard tab switching, CRUD, stats
   ============================================ */

function initDashboard() {
  initSidebarNav();
  initDashboardStats();
  initProductManagement();
  initVerificationSection();
}

// ---- Sidebar Navigation ----
function initSidebarNav() {
  const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
  
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetSection = link.dataset.section;
      
      // Update active state
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Show target section
      document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
      });
      
      const target = document.getElementById(targetSection);
      if (target) {
        target.classList.add('active');
        target.style.display = 'block';
        target.style.animation = 'fadeIn 0.3s ease';
      }

      // Update page title
      const titleEl = document.querySelector('.dashboard-title');
      if (titleEl) {
        titleEl.textContent = link.querySelector('span')?.textContent || link.textContent.trim();
      }
    });
  });
}

// ---- Dashboard Stats Animation ----
function initDashboardStats() {
  const statValues = document.querySelectorAll('.stats-card-value[data-count]');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statValues.forEach(el => observer.observe(el));
}

// ---- Product Management ----
function initProductManagement() {
  // Add product button
  const addBtn = document.getElementById('add-product-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      openProductModal();
    });
  }

  // Edit product buttons
  document.querySelectorAll('.edit-product-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = btn.dataset.productId;
      openProductModal(productId);
    });
  });

  // Delete product buttons
  document.querySelectorAll('.delete-product-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.product-manage-card');
      if (card && confirm('¿Estás seguro de eliminar este producto?')) {
        card.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => {
          card.remove();
          showToast('Producto eliminado', 'success');
        }, 300);
      }
    });
  });
}

function openProductModal(productId = null) {
  const backdrop = document.getElementById('product-modal-backdrop');
  const modal = document.getElementById('product-modal');
  
  if (backdrop && modal) {
    backdrop.classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const title = modal.querySelector('.modal-title');
    if (title) {
      title.textContent = productId ? 'Editar Producto' : 'Nuevo Producto';
    }
  }
}

function closeProductModal() {
  const backdrop = document.getElementById('product-modal-backdrop');
  const modal = document.getElementById('product-modal');
  
  if (backdrop && modal) {
    backdrop.classList.remove('active');
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ---- Verification Section ----
function initVerificationSection() {
  const requestBtn = document.getElementById('request-verification-btn');
  if (requestBtn) {
    requestBtn.addEventListener('click', () => {
      requestBtn.disabled = true;
      requestBtn.textContent = 'Procesando...';
      
      setTimeout(() => {
        requestBtn.textContent = 'Solicitud Enviada';
        requestBtn.classList.remove('btn-primary');
        requestBtn.classList.add('btn-secondary');
        showToast('Solicitud de verificación enviada. Revisaremos tu información en 24-48 horas.', 'success');
        
        // Update status
        const statusEl = document.querySelector('.verification-status');
        if (statusEl) {
          statusEl.classList.remove('unverified');
          statusEl.classList.add('pending');
          const infoH3 = statusEl.querySelector('h3');
          const infoP = statusEl.querySelector('p');
          if (infoH3) infoH3.textContent = 'Verificación Pendiente';
          if (infoP) infoP.textContent = 'Tu solicitud está siendo revisada por nuestro equipo.';
        }
      }, 1500);
    });
  }
}

// ---- Profile Form ----
function initProfileForm() {
  const form = document.getElementById('profile-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Perfil actualizado correctamente', 'success');
    });
  }
}

// ---- Admin Functions ----
function initAdmin() {
  initAdminTabs();
  initAdminActions();
}

function initAdminTabs() {
  const tabLinks = document.querySelectorAll('.sidebar-link[data-section]');
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      
      tabLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      document.querySelectorAll('.dashboard-section').forEach(s => {
        s.style.display = 'none';
      });
      
      const target = document.getElementById(section);
      if (target) {
        target.style.display = 'block';
        target.style.animation = 'fadeIn 0.3s ease';
      }
    });
  });
}

function initAdminActions() {
  // Approve verification
  document.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      const statusCell = row?.querySelector('.table-status');
      if (statusCell) {
        statusCell.className = 'table-status active';
        statusCell.textContent = 'Verificado';
      }
      btn.remove();
      showToast('Proveedor verificado exitosamente', 'success');
    });
  });

  // Reject verification
  document.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      const statusCell = row?.querySelector('.table-status');
      if (statusCell) {
        statusCell.className = 'table-status inactive';
        statusCell.textContent = 'Rechazado';
      }
      showToast('Solicitud rechazada', 'warning');
    });
  });
}

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  initProfileForm();
  
  // Check if admin page
  if (document.getElementById('admin-dashboard')) {
    initAdmin();
  }
});
