# ProVend (ProConnect) - Plataforma B2B de Economía Circular ♻️

ProVend es un mercado B2B diseñado para conectar empresas y proveedores en Nicaragua de manera eficiente, rápida y transparente, impulsando la economía circular mediante la comercialización y trazabilidad de materiales reciclados.

## 🚀 Funcionalidades Principales

1. **Marketplace B2B (Oportunidades Inversas):** Las empresas publican sus requerimientos (demandas) y los proveedores pueden ofertar directamente para satisfacer esa necesidad.
2. **Pasaportes Digitales QR:** Sistema de trazabilidad que permite a las empresas generar un certificado digital para sus productos finales. El consumidor puede escanear el QR para ver el origen del material, porcentaje reciclado y el impacto ambiental (CO2 evitado).
3. **Smart Pooling (Compras Conjuntas):** Agrupación inteligente que permite a varias empresas pequeñas y medianas unir fuerzas para alcanzar el volumen mínimo de compra exigido por los grandes proveedores de materiales.
4. **Diseño Premium (Glassmorphism):** Interfaz fluida y reactiva con un sistema de tarjetas de cristal y animaciones suaves usando Vanilla JS y CSS3.
5. **Autenticación Segura (JWT):** Inicio de sesión encriptado con roles separados (Empresa, Proveedor y Administrador).

## 🛠️ Stack Tecnológico

Este proyecto utiliza una arquitectura **MVC (Modelo-Vista-Controlador)** optimizada para alto rendimiento:

* **Frontend (La Vistas):** HTML5, CSS3 (Custom Properties) y Vanilla JavaScript. Carga ultrarrápida sin la sobrecarga de frameworks externos pesados.
* **Backend (El Motor):** Node.js utilizando el framework **Express.js**.
* **Base de Datos:** **PostgreSQL** alojado en la nube vía **Supabase**. *(Incluye un modo fallback local usando SQLite para desarrollo offline).*
* **Seguridad:** Encriptación de contraseñas con **Bcrypt** y manejo de sesiones con **JSON Web Tokens (JWT)**.
* **Infraestructura (Cloud Hosting):** Despliegue continuo gestionado a través de **Render** vinculado directamente al repositorio de GitHub.

## 📁 Estructura del Proyecto (MVC)

El código está estructurado de manera lógica y modular:
* `/backend/config/`: Conexión dual (PostgreSQL/SQLite) a la base de datos.
* `/backend/controllers/`: Cerebro de la aplicación (Lógica de autenticación, Pasaportes QR, Smart Pooling, etc).
* `/backend/middlewares/`: Filtros de seguridad (ej. validación de tokens).
* `/backend/routes/`: Endpoints de la API.
* `/css/`: CSS separado por lógica (variables globales, layout, componentes).
* `/js/`: Scripts modulares para el cliente (animaciones, autenticación en frontend, peticiones AJAX).
* Archivos `.html` en la raíz (Index, Explorar, Dashboards dedicados por rol).

## 🔧 Cómo ejecutar el proyecto localmente

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Lori-hub12/provent.git
   ```
2. Instala las dependencias del servidor:
   ```bash
   npm install
   ```
3. Configura las variables de entorno creando un archivo `.env` en la raíz con:
   ```env
   JWT_SECRET=tu_secreto_super_seguro
   DATABASE_URL=postgres://tu_url_de_supabase (Opcional, si no se pone usa SQLite local)
   ```
4. Inicia el servidor:
   ```bash
   npm start
   ```
5. Abre `http://localhost:3000` en tu navegador.

---
*Desarrollado para transformar la gestión de residuos y el abastecimiento B2B mediante la tecnología.*
