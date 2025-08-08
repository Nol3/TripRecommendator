# TripRecommendator
TripRecommendator for Globant 42Málaga

## Configuración

### 1. Instalar dependencias
```bash
cd ex00
npm install
```

### 2. Configurar variables de entorno

#### Opción A: Usar el script de configuración automática
```bash
npm run setup
```

#### Opción B: Configuración manual
Copia el archivo de ejemplo y configura las variables necesarias:

```bash
cp env.example .env
```

Edita el archivo `.env` con tus credenciales:

#### GitHub OAuth2 (Opcional - para autenticación)
1. Ve a https://github.com/settings/developers
2. Crea una nueva aplicación OAuth
3. Configura la URL de callback: `http://localhost:3000/api/auth/github/callback`
4. Copia el Client ID y Client Secret

#### Gemini API (Requerido)
1. Ve a https://makersuite.google.com/app/apikey
2. Crea una nueva API key
3. Copia la API key

#### Unsplash API (Opcional - para imágenes)
1. Ve a https://unsplash.com/developers
2. Crea una nueva aplicación
3. Copia el Access Key

### 3. Ejecutar el proyecto

#### Opción A: Desarrollo local
```bash
npm run dev
```

#### Opción B: Con Docker
```bash
docker-compose up --build
```

### 4. Acceder a la aplicación
http://localhost:3000

## Despliegue en Vercel

### Configurar variables de entorno en Vercel

1. Ve a tu dashboard de Vercel
2. Selecciona tu proyecto `trip-recommendator-two`
3. Ve a Settings > Environment Variables
4. Agrega las siguientes variables:

```
GITHUB_CLIENT_ID=Ov23li3lclshVeQnyzho
GITHUB_CLIENT_SECRET=a50172b79771d5108132553a720dff43ff52e109
CALLBACK_URL=https://trip-recommendator-two.vercel.app/api/auth/github-callback
GEMINI_API_KEY=AIzaSyAL-fkTX_48826c5bp-lUdY_07cW7Kr_-4
UNSPLASH_ACCESS_KEY=rkpTC02QxlS6SQ1bDlx7TuRohlMsluqH4ewBMCHQ_Fg
NODE_ENV=production
```

### Desplegar cambios

```bash
vercel --prod
```

## Notas importantes

- Si no configuras GitHub OAuth2, la autenticación no funcionará pero la aplicación seguirá funcionando
- Si no configuras Unsplash, se usarán imágenes de placeholder
- La API key de Gemini es **requerida** para que funcione la recomendación de viajes
- Asegúrate de que la URL de callback en GitHub coincida con tu dominio de Vercel