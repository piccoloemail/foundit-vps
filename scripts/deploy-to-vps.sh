#!/bin/bash

# Script para deployar FoundIt a VPS con N8N nativo

VPS_IP="157.230.185.25"
VPS_USER="root"

echo "🚀 Deploying FoundIt to VPS..."

# Verificar conexión SSH
echo "📡 Verificando conexión VPS..."
if ! ssh $VPS_USER@$VPS_IP "echo 'VPS conectado'" 2>/dev/null; then
    echo "❌ Error: No se puede conectar al VPS"
    exit 1
fi

# Verificar tunnel SSH
echo "🔗 Verificando SSH tunnel..."
TUNNEL_TEST=$(ssh $VPS_USER@$VPS_IP "curl --proxy http://localhost:8118 -s --connect-timeout 5 ifconfig.me" 2>/dev/null)
if [ -z "$TUNNEL_TEST" ]; then
    echo "⚠️  Advertencia: SSH tunnel no parece estar funcionando"
    echo "   Verifica que el tunnel esté activo desde Raspberry Pi"
else
    echo "✅ SSH tunnel funcionando - IP: $TUNNEL_TEST"
fi

# Parar Docker N8N si está corriendo
echo "🛑 Parando Docker N8N..."
ssh $VPS_USER@$VPS_IP "cd /root && docker compose down" 2>/dev/null

# Verificar si N8N está instalado globalmente
echo "🔍 Verificando instalación N8N..."
N8N_INSTALLED=$(ssh $VPS_USER@$VPS_IP "which n8n" 2>/dev/null)
if [ -z "$N8N_INSTALLED" ]; then
    echo "📦 Instalando N8N globalmente en VPS..."
    ssh $VPS_USER@$VPS_IP "npm install -g n8n"
    if [ $? -ne 0 ]; then
        echo "❌ Error instalando N8N"
        exit 1
    fi
else
    echo "✅ N8N ya está instalado: $N8N_INSTALLED"
fi

# Crear directorio de workflows en VPS
echo "📁 Creando directorio de workflows..."
ssh $VPS_USER@$VPS_IP "mkdir -p /root/n8n-workflows"

# Copiar workflow con proxy
echo "📤 Copiando workflow con proxy..."
scp ./n8n-workflows/n8n-vps-flow-with-proxy.json $VPS_USER@$VPS_IP:/root/n8n-workflows/

# Crear script de inicio para N8N
echo "📝 Creando script de inicio N8N..."
ssh $VPS_USER@$VPS_IP "cat > /root/start-n8n.sh << 'EOF'
#!/bin/bash
export N8N_HOST=0.0.0.0
export N8N_PORT=5678
export N8N_PROTOCOL=http
n8n start
EOF"

ssh $VPS_USER@$VPS_IP "chmod +x /root/start-n8n.sh"

# Test básico yt-dlp con proxy
echo "🧪 Probando yt-dlp con proxy..."
YTDLP_TEST=$(ssh $VPS_USER@$VPS_IP "HTTP_PROXY=http://localhost:8118 yt-dlp --get-title 'https://youtube.com/watch?v=dQw4w9WgXcQ'" 2>/dev/null)
if [ -z "$YTDLP_TEST" ]; then
    echo "⚠️  Advertencia: yt-dlp con proxy no funcionó"
else
    echo "✅ yt-dlp con proxy funcionando: $YTDLP_TEST"
fi

echo ""
echo "🎉 Deploy completado!"
echo ""
echo "📋 Próximos pasos:"
echo "1. SSH al VPS: ssh $VPS_USER@$VPS_IP"
echo "2. Iniciar N8N: ./start-n8n.sh"
echo "3. Acceder a: http://$VPS_IP:5678"
echo "4. Importar workflow: n8n-vps-flow-with-proxy.json"
echo "5. Probar con video corto"
echo ""
echo "🔗 Recursos:"
echo "   - VPS N8N: http://$VPS_IP:5678"
echo "   - Local N8N: http://localhost:5678"
echo "   - Workflow: /root/n8n-workflows/n8n-vps-flow-with-proxy.json"