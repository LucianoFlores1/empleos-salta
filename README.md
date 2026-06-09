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
