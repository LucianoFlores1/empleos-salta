# Portal de Empleos Salta

Plataforma rápida y moderna de visualización y gestión de ofertas de empleo enfocada en la provincia de Salta. Permite a los usuarios consultar vacantes disponibles y a los administradores gestionar las publicaciones mediante un panel seguro.

## 🚀 Tecnologías Principales

- **Frontend**: React 19, TypeScript, Vite
- **Estilos**: Tailwind CSS, Lucide React (Íconos)
- **Backend & BD**: Express, Firebase (Auth, Firestore, Admin)
- **Deployment**: Optimizado para entornos serverless (Vercel) o servidores Node.js
- **SEO**: Prerenderizado en Edge API routes, sitemaps y Schema.org con metadata.

## ✨ Características

- Interfaz moderna y orientada a la rápida visualización de ofertas laborales (modo lista/grilla).
- Panel de administración seguro para crear, editar, destacar y eliminar vacantes o generar propuestas en borrador.
- Autenticación controlada y libre de fricción mediante Google Auth (Firebase).
- Optimización SEO "AI-First" (Perplexity, ChatGPT) y para motores de búsqueda tradicionales con Schema.org y OpenGraph.
- Diseño fluido y "mobile-first" usando las utilidades de Tailwind v4.

## 🛠️ Instalación y Uso Local

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/TU-USUARIO/TU-REPOSITORIO.git
   cd TU-REPOSITORIO
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar las Variables de Entorno**:
   Crea un archivo `.env` en la raíz del proyecto (este archivo se encuentra ignorado en `.gitignore` por seguridad). Utiliza el siguiente formato rellenando con los datos de tu consola web de Firebase:
   
   ```env
   VITE_FIREBASE_API_KEY="AIzaSy..."
   VITE_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="tu-proyecto"
   VITE_FIREBASE_STORAGE_BUCKET="tu-proyecto.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
   VITE_FIREBASE_APP_ID="1:123456789:web:abcdefghij"
   VITE_FIREBASE_DATABASE_ID="(default)"
   
   # Opcional (para funciones Serverless)
   FIREBASE_PROJECT_ID="tu-proyecto"
   FIREBASE_DATABASE_ID="(default)"
   ```

4. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

5. **Compilación para Producción**:
   ```bash
   npm run build
   npm start
   ```

## 🔒 Privacidad y Seguridad

Las operaciones de administración de la plataforma están protegidas mediante un esquema de backend sólido:
- **Frontend / Acceso Visual**: Requiere autenticación de Google válida, verificando que el usuario pertenezca a la colección `admins`.
- **Backend (Reglas de Firestore)**: `firestore.rules` rechaza cualquier operación de escritura (create, update, delete) sobre las colecciones si la petición proviene de un usuario sin la acreditación correspondiente de administración en la base de datos de Firebase.

## ⚖️ Aviso Legal

Este portal es **exclusivamente un espacio de recopilación y difusión de ofertas de empleo públicas o de terceros**. La plataforma no representa a las empresas contratantes ni participa en los procesos de selección, entrevistas o contratación. 

Toda la información proporcionada es a título informativo y los usuarios son responsables de **verificar la autenticidad de las propuestas y las empresas** antes de compartir información personal, enviar currículums o presentarse a entrevistas.

## 📊 Importación de Base de Datos y Formato JSON

El panel de administración permite cargar múltiples ofertas de empleo en lote utilizando un archivo `.json`. Si quieres enviarle a un compañero datos de ejemplo o armar tu propia base de datos, el archivo JSON debe contener un **array de objetos** con el siguiente formato:

### 📝 Estructura de cada Empleo (Campos)

| Campo | Tipo | Requerido | Descripción / Notas |
| :--- | :--- | :---: | :--- |
| **`title`** | `string` | **Sí** | Título del puesto (ej: *"Administrativo Contable"*). |
| **`source`** | `string` | **Sí** | URL o link a la postulación original (ej: *"https://linkedin.com/... "* o correo mailto). |
| **`driveId`** | `string` | No | ID de la imagen/flyer en Google Drive (ej: el ID que aparece en el enlace de compartir). |
| **`company`** | `string` | No | Nombre de la empresa o consultora (ej: *"Consultora Salta"*). |
| **`category`** | `string` | No | Categoría del empleo. Si no lo pones, el sistema lo inferirá automáticamente basándose en el título. |
| **`location`** | `string` | No | Ubicación (ej: *"Salta Capital"*, *"Metán"*, etc.). Por defecto se asume Salta. |
| **`description`** | `string` | No | Detalles o requisitos adicionales de la oferta. |
| **`date`** | `string` | No | Fecha de publicación (ej: *"2026-06-24"*). Si se omite, se asigna la fecha y hora actual. |
| **`id`** | `string` | No | ID único. Si no se provee, la aplicación generará uno aleatorio de 8 caracteres automáticamente. |

### 📂 Ejemplo de Archivo `empleos_ejemplo.json`

Puedes copiar este bloque, guardarlo en un archivo con extensión `.json` y usarlo para probar la importación en el panel de control:

```json
[
  {
    "title": "Vendedor de Salón",
    "company": "Comercio Céntrico",
    "category": "Comercio y Ventas",
    "location": "Salta Capital",
    "driveId": "17Z3rS2s01rg5k7XimtX4zXBCDibReSIL",
    "source": "https://www.linkedin.com/jobs/view/...",
    "description": "Búsqueda activa para personal de atención al público con experiencia en ventas.",
    "date": "2026-06-24"
  },
  {
    "title": "Desarrollador React Frontend",
    "company": "Estudio Tecnológico",
    "location": "Salta (Híbrido)",
    "source": "mailto:rrhh@estudiotecno.com",
    "description": "Se busca desarrollador con experiencia en React y TypeScript.",
    "date": "2026-06-23"
  }
]
```

### 📥 Cómo realizar la importación
1. Inicia sesión en el panel de **Admin**.
2. Haz clic en el botón **"Importar (Combinar)"**.
3. Selecciona tu archivo `.json`.
4. En la ventana de previsualización que aparece, podrás revisar los registros, corregir campos (como títulos o empresas) y descartar ofertas de forma individual.
5. Haz clic en **"Confirmar Importación"** para guardarlos en la base de datos de Firebase.

