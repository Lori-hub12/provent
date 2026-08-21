async function sendForgot(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const btn = e.target.querySelector('button');
        btn.textContent = 'Enviando...';
        btn.disabled = true;
  
        try {
          const res = await fetch(`${API_BASE}/api/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          
          if (res.ok) {
            alert('Revisa la consola del servidor para el enlace (Ethereal Email).');
            window.location.href = 'login.html';
          } else {
            alert(data.error);
          }
        } catch (err) {
          alert('Error de conexión');
        } finally {
          btn.textContent = 'Enviar Enlace';
          btn.disabled = false;
        }
      }