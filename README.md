# ProVend — Plataforma B2B

ProVend conecta empresas y proveedores en Nicaragua. El proyecto usa HTML/CSS/JavaScript vanilla en el frontend y una API Express con SQLite para autenticación, perfiles, inventario, favoritos, notificaciones y cotizaciones.

## Requisitos

- Node.js 18 o superior
- npm

## Ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. Para una ejecución normal usa `npm start`.

## Comandos

- `npm run dev`: servidor con reinicio automático.
- `npm start`: servidor de producción local.
- `npm run check`: valida la sintaxis de todos los archivos JavaScript.
- `npm test`: ejecuta la validación disponible.

## Configuración

Variables opcionales:

- `PORT`: puerto HTTP, por defecto `3000`.
- `HOST`: interfaz de escucha, por defecto `0.0.0.0`.
- `FRONTEND_ORIGIN`: origen permitido para CORS cuando el frontend está separado.
- `SESSION_SECRET`: secreto estable para firmar sesiones; debe configurarse en producción.

La base `database.sqlite` se crea automáticamente y está excluida del repositorio. No abras los HTML directamente con `file://`: las funciones de autenticación y dashboards requieren el servidor Express.

## Seguridad implementada

Las contraseñas se almacenan con bcrypt, la sesión usa una cookie HttpOnly firmada, las rutas privadas validan rol y propietario, las consultas usan parámetros y el cuerpo JSON tiene un límite de tamaño. Los datos mostrados en el explorador se escapan antes de insertarse en HTML.

## Estructura

- `server.js`: API, SQLite, autenticación y autorización.
- `*.html`: páginas públicas y dashboards.
- `js/`: autenticación, búsqueda, componentes y comportamiento de páginas.
- `css/`: tokens, layout y estilos por página.
- `assets/`: recursos visuales.
