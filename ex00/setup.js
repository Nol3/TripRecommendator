#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 Configuración inicial de TripRecommendator\n');

// Verificar si ya existe el archivo .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('⚠️  El archivo .env ya existe. ¿Quieres sobrescribirlo? (y/n)');
    rl.question('', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            createEnvFile();
        } else {
            console.log('✅ Configuración cancelada. El archivo .env se mantiene sin cambios.');
            rl.close();
        }
    });
} else {
    createEnvFile();
}

function createEnvFile() {
    console.log('\n📝 Configurando variables de entorno...\n');

    const envContent = `# GitHub OAuth2 Configuration (Opcional)
# Obtén estas credenciales en: https://github.com/settings/developers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Gemini API Configuration (Requerido)
# Obtén tu API key en: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=

# Unsplash API Configuration (Opcional)
# Obtén tu API key en: https://unsplash.com/developers
UNSPLASH_ACCESS_KEY=

# Server Configuration
PORT=3000
NODE_ENV=development
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env creado exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Edita el archivo .env con tus credenciales');
    console.log('2. Para Gemini API (requerido): https://makersuite.google.com/app/apikey');
    console.log('3. Para GitHub OAuth2 (opcional): https://github.com/settings/developers');
    console.log('4. Para Unsplash API (opcional): https://unsplash.com/developers');
    console.log('\n🚀 Ejecuta "npm run dev" para iniciar el servidor');

    rl.close();
}