# Diagrama de Base de Datos - ProVend (Modelo Entidad-Relación)

Este documento detalla la estructura lógica de la base de datos relacional (SQL) diseñada para la plataforma B2B ProVend. La arquitectura está normalizada para asegurar integridad de datos, escalabilidad y un manejo eficiente de las interacciones entre empresas compradoras y proveedores.

## 📊 Diagrama ERD (Entity-Relationship Diagram)

El siguiente diagrama ilustra cómo se relacionan las entidades principales de la plataforma. (GitHub renderiza este diagrama automáticamente).

```mermaid
erDiagram
    USUARIOS {
        int id PK "Identificador único"
        string email "Correo de acceso"
        string password_hash "Contraseña encriptada (bcrypt)"
        string rol "Enum: 'empresa' | 'proveedor'"
        datetime fecha_registro "Timestamp"
    }
    
    EMPRESAS {
        int id PK "Identificador de la entidad"
        int usuario_id FK "Relación 1 a 1 con USUARIOS"
        string nombre_comercial "Nombre público de la empresa compradora"
        string ruc "Registro Único de Contribuyente"
        string telefono "Teléfono de contacto principal"
        string direccion "Ubicación física"
    }
    
    PROVEEDORES {
        int id PK "Identificador de la entidad"
        int usuario_id FK "Relación 1 a 1 con USUARIOS"
        string razon_social "Nombre de la empresa proveedora"
        string ruc "Registro Único de Contribuyente"
        string descripcion "Descripción del perfil público"
        boolean verificado "Indica si ProVend validó los documentos"
        string nivel_suscripcion "Enum: 'Gratis' | 'Premium' | 'Empresarial'"
    }

    PRODUCTOS {
        int id PK "Identificador único del producto"
        int proveedor_id FK "Relación 1 a N con PROVEEDORES"
        string nombre "Nombre del producto/servicio"
        string categoria "Industria a la que pertenece"
        text descripcion "Detalles técnicos"
        boolean activo "Visibilidad en el catálogo público"
    }

    COTIZACIONES {
        int id PK "Identificador único del ticket"
        int empresa_id FK "Empresa que solicita la cotización"
        int proveedor_id FK "Proveedor que recibe la cotización"
        text detalles_solicitud "Cantidades y requerimientos"
        string estado "Enum: 'Pendiente' | 'Respondida' | 'Rechazada'"
        datetime fecha_creacion "Timestamp de solicitud"
    }

    %% Relaciones Lógicas
    USUARIOS ||--o| EMPRESAS : "puede ser"
    USUARIOS ||--o| PROVEEDORES : "puede ser"
    PROVEEDORES ||--o{ PRODUCTOS : "publica y ofrece"
    EMPRESAS ||--o{ COTIZACIONES : "solicita"
    PROVEEDORES ||--o{ COTIZACIONES : "recibe y responde"
```

---

## 📝 Diccionario de Datos (Explicación de Entidades)

### 1. Entidad `USUARIOS`
Es la tabla núcleo para la **Autenticación (Login)**. Contiene las credenciales de acceso de cualquier individuo que se registre en la plataforma. Posee un atributo vital llamado `rol` que define si la persona interactuará en el sistema como una Empresa (Comprador) o como un Proveedor. Esto asegura que la autenticación esté centralizada.

### 2. Entidad `EMPRESAS`
Maneja el perfil de las compañías compradoras. Su llave foránea (`usuario_id`) la enlaza directamente a las credenciales de un usuario. Aquí se guardan los datos fiscales y de facturación.

### 3. Entidad `PROVEEDORES`
Controla el perfil público de los ofertantes B2B. A diferencia de las empresas normales, los proveedores cuentan con atributos extra de negocio, como el `nivel_suscripcion` (para los planes de monetización de la plataforma) y una insignia de `verificado` para generar confianza a los compradores.

### 4. Entidad `PRODUCTOS`
Constituye el **Catálogo Virtual**. Un proveedor puede tener múltiples productos (Relación 1 a Muchos). Contiene la información técnica que las empresas utilizarán al buscar en la pestaña "Explorar".

### 5. Entidad `COTIZACIONES`
Es la tabla **Transaccional (El corazón del negocio B2B)**. Es una tabla de rompimiento o de vinculación que conecta a una Empresa con un Proveedor específico. Registra el estado de la negociación (`Pendiente`, `Respondida`) y el mensaje detallado de lo que requiere el comprador. 

---
*Diseño Arquitectónico de Base de Datos para despliegue en entornos SQL (PostgreSQL / MySQL).*
