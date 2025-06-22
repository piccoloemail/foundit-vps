#!/bin/bash

# Script para instalar N8N localmente en el proyecto foundit-vps
# Evita problemas de permisos globales

echo "🚀 Instalando N8N localmente para proyecto foundit-vps..."

# Crear directorio para N8N local
mkdir -p /Users/bjc/Documents/projects/foundit-vps/n8n-local
cd /Users/bjc/Documents/projects/foundit-vps/n8n-local

# Inicializar npm project
npm init -y

# Instalar N8N localmente
npm install n8n

# Crear script de inicio
cat > start-n8n.sh << 'EOF'
#!/bin/bash
cd /Users/bjc/Documents/projects/foundit-vps/n8n-local
export N8N_USER_FOLDER=$(pwd)/.n8n
./node_modules/.bin/n8n start
EOF

chmod +x start-n8n.sh

echo "✅ N8N instalado localmente!"
echo "📋 Para iniciar N8N:"
echo "   cd /Users/bjc/Documents/projects/foundit-vps/n8n-local"
echo "   ./start-n8n.sh"
echo ""
echo "🌐 N8N estará disponible en: http://localhost:5678"