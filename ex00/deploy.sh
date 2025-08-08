#!/bin/bash

echo "🚀 Desplegando TripRecommendator a Vercel..."

# Verificar que estemos en el directorio correcto
if [ ! -f "server.js" ]; then
    echo "❌ Error: No se encontró server.js. Asegúrate de estar en el directorio ex00"
    exit 1
fi

# Instalar dependencias si es necesario
echo "📦 Instalando dependencias..."
npm install

# Desplegar a Vercel
echo "🌐 Desplegando a Vercel..."
vercel --prod

echo "✅ Despliegue completado!"
echo "🔗 Tu aplicación estará disponible en: https://trip-recommendator-two.vercel.app"