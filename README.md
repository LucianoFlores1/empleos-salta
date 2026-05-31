# Portal de Empleos Salta

Plataforma de visualización y gestión de ofertas de empleo para la provincia de Salta, con base de datos en Firebase (Firestore).

## Tecnologías Principales

- React 19 + TypeScript
- Vite + Express
- Tailwind CSS
- Firebase (Auth, Firestore)

## Subida del Repositorio a GitHub (Público)

Para subir este proyecto de manera segura a un repositorio público, es fundamental NO incluir las credenciales de la base de datos ni los datos locales en el control de versiones. Esto ya está contemplado en este proyecto mediante el archivo `.gitignore` configurado.

### ¿Qué se sube?
- Todo el código fuente en `/src`
- La configuración pública como `vite.config.ts`, `package.json`, `tailwind` y los archivos estáticos en `/public`.
- Archivos de declaración general e infraestructura (`server.ts`, `.gitignore`, `tsconfig.json`).
- Documentación como este `README.md`.

### ¿Qué NO se sube? (Seguridad)
El archivo `.gitignore` ya está configurado para omitir los siguientes elementos críticos:
1. `firebase-applet-config.json` (Contiene todos los IDs de la configuración de tu entorno de Firebase en uso actual).
2. `data.json` (Base de datos local en caso de usar el motor fallback).
3. `.env` (Variables de entorno con secretos).
4. `node_modules/` y `/dist/` (Archivos autogenerados al compilar o instalar dependencias).

**Tutorial de subida con git:**
```bash
# Inicializa el repositorio si no lo has hecho
git init

# Agrega todos los archivos seguros (git respetará tu .gitignore)
git add .

# Haz el commit
git commit -m "Initial commit del Portal de Empleos Salta"

# Vincula a tu repositorio público (cambia el link por tu repo real)
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git

# Empuja los cambios
git push -u origin main
```

## Configuración de Entorno (Base de datos Firebase)

Ya que usamos Firebase, la configuración NO se sube a tu repositorio, por lo tanto si luego clonas el proyecto o tu equipo lo descarga, arrojará un error sobre la falta del archivo `firebase-applet-config.json`.

Existen dos maneras de solucionar en otro equipo para clonar y levantar localmente:

### Opción 1: Crear el archivo manualmente (Desarrollo local)
Si tú u otra persona de tu equipo quiere levantar el entorno, deben crear el archivo `firebase-applet-config.json` en la raíz del proyecto. El archivo tiene este formato:

```json
{
  "apiKey": "AIzaSy...",
  "authDomain": "tu-proyecto.firebaseapp.com",
  "projectId": "tu-proyecto",
  "storageBucket": "tu-proyecto.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcdefghijk",
  "firestoreDatabaseId": "(default)"
}
```
*Los valores los consigues en la Configuración de Proyecto (Engranaje) de tu consola de Firebase.*

### Opción 2: Usar Variables de Entorno (.env)
Si deseas desplegar la aplicación a producción (como Heroku, Vercel o Cloud Run), lo ideal consiste en crear un `.env` local (o en tu nube):

1. Crea un archivo `.env` en la raíz (ignorado por Git).
2. Agrega las claves tipo `VITE_FIREBASE_API_KEY=AIzaSy...`
3. Ajustar el archivo `src/lib/firebase.ts` para que si no existe el JSON, use las variables `import.meta.env.*`.

## Seguridad Reforzada
Hemos realizado en el código local una limpieza de las rutas REST en `server.ts` que antes contenían un administrador local "hardcodeado", con lo cual la aplicación depende ahora 100% de la lógica de autenticación segura de Firebase y Google Auth. ¡Tu sistema está preparado para publicarse!
