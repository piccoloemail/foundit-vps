#!/bin/bash

# Script para inicializar Git y push a GitHub
# Ejecutar desde: /Users/bjc/Documents/projects/foundit-vps

echo "🚀 Inicializando repositorio Git para FoundIt VPS..."

# Ir al directorio del proyecto
cd /Users/bjc/Documents/projects/foundit-vps

# Verificar que estamos en el directorio correcto
if [ ! -f "README.md" ]; then
    echo "❌ Error: No estamos en el directorio correcto"
    echo "   Ejecuta este script desde: /Users/bjc/Documents/projects/foundit-vps"
    exit 1
fi

echo "📍 Directorio: $(pwd)"

# Inicializar Git
echo "📦 Inicializando Git..."
git init

# Agregar todos los archivos
echo "📁 Agregando archivos..."
git add .

# Commit inicial
echo "💾 Creando commit inicial..."
git commit -m "Initial commit: FoundIt VPS with native N8N and SSH tunnel proxy

Features:
- Complete Next.js application copy
- N8N workflows adapted for VPS with proxy
- SSH tunnel integration for YouTube bypass
- Deployment and setup scripts
- Comprehensive documentation

Differences from local version:
- yt-dlp commands use HTTP_PROXY for tunnel
- VPS-specific configuration
- Native N8N instead of Docker
- Production-ready architecture"

# Configurar rama principal
echo "🌿 Configurando rama main..."
git branch -M main

# Agregar remote origin
echo "🔗 Agregando remote origin..."
git remote add origin https://github.com/piccoloemail/foundit-vps.git

# Push a GitHub
echo "☁️  Subiendo a GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ¡Repositorio creado exitosamente!"
    echo ""
    echo "🔗 Repositorio: https://github.com/piccoloemail/foundit-vps"
    echo "📋 Archivos incluidos:"
    echo "   - ✅ Aplicación Next.js completa"
    echo "   - ✅ Workflows N8N con proxy"
    echo "   - ✅ Scripts de deployment"
    echo "   - ✅ Documentación VPS"
    echo ""
    echo "📁 Próximos pasos:"
    echo "   1. Verificar repo en GitHub"
    echo "   2. Ejecutar: ./scripts/deploy-to-vps.sh"
    echo "   3. Probar workflows en VPS"
else
    echo "❌ Error al subir a GitHub"
    echo "   Verifica la conexión y permisos"
fi