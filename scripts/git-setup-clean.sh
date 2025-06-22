#!/bin/bash

# Script para setup Git limpio - sin node_modules

echo "🚀 Setup Git LIMPIO para FoundIt VPS..."

cd /Users/bjc/Documents/projects/foundit-vps

# Verificar directorio
if [ ! -f "README.md" ]; then
    echo "❌ Error: No estamos en el directorio correcto"
    exit 1
fi

echo "📍 Directorio: $(pwd)"

# Asegurar que no hay archivos grandes
echo "🧹 Verificando que node_modules esté excluido..."
if [ -d "foundit-app/node_modules" ]; then
    echo "⚠️  Eliminando node_modules..."
    rm -rf foundit-app/node_modules
fi

# Inicializar Git
echo "📦 Inicializando Git..."
git init

# Agregar archivos (node_modules ya excluido por .gitignore)
echo "📁 Agregando archivos..."
git add .

# Verificar que no hay archivos grandes
echo "🔍 Verificando tamaño de archivos..."
large_files=$(git ls-files | xargs ls -l | awk '$5 > 50000000 {print $9, $5}')
if [ ! -z "$large_files" ]; then
    echo "⚠️  Archivos grandes detectados:"
    echo "$large_files"
    echo "❌ Cancelando para evitar problemas"
    exit 1
fi

# Commit inicial
echo "💾 Creando commit inicial limpio..."
git commit -m "Initial commit: FoundIt VPS - Clean version

✅ Complete Next.js application (without node_modules)
✅ N8N workflows adapted for VPS with proxy  
✅ SSH tunnel integration for YouTube bypass
✅ Deployment and setup scripts
✅ Comprehensive documentation

Key features:
- Native N8N instead of Docker
- yt-dlp with HTTP_PROXY for tunnel
- VPS-specific configuration  
- Production-ready architecture"

# Configurar rama
git branch -M main

# Agregar remote
echo "🔗 Agregando remote..."
git remote add origin https://github.com/piccoloemail/foundit-vps.git

# Push
echo "☁️  Subiendo a GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ¡Repositorio limpio creado exitosamente!"
    echo ""
    echo "🔗 Repositorio: https://github.com/piccoloemail/foundit-vps"
    echo ""
    echo "📊 Incluido:"
    echo "   ✅ Aplicación Next.js (sin node_modules)"
    echo "   ✅ Workflows N8N con proxy"
    echo "   ✅ Scripts de deployment"
    echo "   ✅ Documentación completa"
    echo ""
    echo "📋 Próximos pasos:"
    echo "   1. Verificar repo en GitHub"
    echo "   2. Ejecutar: ./scripts/deploy-to-vps.sh"
    echo "   3. En VPS: cd foundit-app && npm install"
else
    echo "❌ Error al subir a GitHub"
fi