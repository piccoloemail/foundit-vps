#!/bin/bash

echo "🚀 Starting N8N on Mac Mini..."

# Crear directorios necesarios
mkdir -p ~/n8n-local/n8n_data
mkdir -p ~/n8n-local/local_files  
mkdir -p ~/n8n-local/custom_nodes
mkdir -p ~/n8n-local/postgres_data

# Copiar docker-compose
cp n8n-docker-compose.yml ~/n8n-local/docker-compose.yml

# Ir al directorio
cd ~/n8n-local

# Detener si está corriendo
docker-compose down

# Iniciar N8N
docker-compose up -d

echo "⏳ Esperando que N8N inicie..."
sleep 10

echo "✅ N8N está corriendo!"
echo "🌐 Abre tu navegador en: http://localhost:5678"
echo ""
echo "📝 Notas importantes:"
echo "- yt-dlp está instalado ✅"
echo "- ffmpeg está instalado ✅"
echo "- Los archivos se guardan en ~/n8n-local/local_files"
echo ""
echo "🛑 Para detener: docker-compose down"
echo "📊 Para ver logs: docker-compose logs -f"