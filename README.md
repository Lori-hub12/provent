# ProVend - Plataforma B2B (Frontend Prototype) 🚀

ProVend es un prototipo interactivo y moderno (Front-end) de una plataforma B2B diseñada para conectar empresas y proveedores en Nicaragua de manera eficiente, rápida y transparente.

Este proyecto fue construido priorizando un alto rendimiento y control total del código, prescindiendo de frameworks pesados y utilizando tecnologías nativas.

## 🛠️ Tecnologías Utilizadas

* **HTML5:** Semántica moderna y accesibilidad.
* **CSS3 Vanilla:** Arquitectura modular basada en variables globales (Design Tokens) y diseño **Glassmorphism** (efecto de cristal y desenfoque).
* **JavaScript (ES6):** Interacciones del DOM, manipulación asíncrona de estilos e inyección dinámica de componentes.

## ✨ Funcionalidades Principales

1. **Diseño Premium (Glassmorphism):** Toda la interfaz gráfica utiliza un sistema de tarjetas de cristal (`backdrop-filter`) combinadas con un sistema de esferas de luces flotantes en el fondo (Background Mesh).
2. **Modo Oscuro Inteligente (Dark Mode):** Alternador de temas integrado que guarda la preferencia del usuario utilizando la API de `localStorage` del navegador.
3. **Motor de Animaciones (Scroll Reveal):** Las tarjetas y elementos entran flotando de forma progresiva a medida que el usuario hace scroll, gracias a la implementación nativa del `IntersectionObserver` de JS (sin librerías externas que ralenticen el sitio).
4. **Formularios Dinámicos:** La página de autenticación se adapta en tiempo real (ocultando y mostrando campos y validaciones) dependiendo de si el usuario intenta registrarse como "Empresa" o como "Proveedor".
5. **Micro-Interacciones Avanzadas (Cursor Mágico):** Implementación de una "linterna" o cursor luminoso de luz turquesa que sigue las coordenadas del ratón e interactúa con el cristal de las tarjetas a través de `mix-blend-mode`.
6. **Sistema de Componentes Globales:** El Navbar y el Footer se construyen de forma dinámica e inteligente a través del script central `components.js` para evitar repetición de código y asegurar la escalabilidad.

## 📁 Estructura del Proyecto

El código está estructurado modularmente dentro de la carpeta `proconnect`:
* `/css/`: CSS separado por lógica (variables, base, layout, components, pages).
* `/js/`: Scripts modulares (`app.js` y `components.js`).
* `/assets/`: Imágenes, iconos (SVG) y audio.
* Archivos `.html` en la raíz (Index, Explorar, Registro, Nosotros, 404 interactivo).

## 🚀 Cómo ejecutar el proyecto

Al ser un proyecto Front-end puro y nativo, no requiere la instalación de dependencias, compiladores o servidores complejos como Node.js en esta fase.

1. Clona este repositorio o descarga el ZIP.
2. Extrae los archivos en tu computadora.
3. Abre el archivo `proconnect/index.html` en tu navegador moderno favorito (Google Chrome, Firefox, Edge o Safari).
4. ¡Disfruta de la experiencia!

---
*Desarrollado con pasión como prototipo de arquitectura frontend y diseño de experiencia de usuario B2B.*
