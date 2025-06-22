# FoundIt VPS Setup Guide

## 🎯 Objetivo
Migrar FoundIt.at a usar N8N nativo en VPS con SSH tunnel para bypass YouTube.

## 📁 Estructura del Proyecto

```
foundit-vps/
├── foundit-app/          # Aplicación Next.js (copia del local)
├── n8n-workflows/        # Workflows para VPS
│   ├── n8n-local-flow-FINISH-DONT-TOUCH.json    # Backup del local funcional
│   └── n8n-vps-flow-with-proxy.json             # Versión con proxy para VPS
├── n8n-local/            # Instalación local de N8N (para desarrollo)
├── docs/                 # Documentación
├── scripts/              # Scripts de deployment
└── backups/              # Backups
```

## 🚀 Setup N8N Local (Desarrollo)

```bash
# Instalar N8N localmente
cd /Users/bjc/Documents/projects/foundit-vps
./scripts/install-n8n.sh

# Iniciar N8N local
cd n8n-local
./start-n8n.sh
```

## 🌐 Setup VPS

### 1. SSH Tunnel (Ya configurado)
```bash
# Verificar tunnel funcionando
ssh root@157.230.185.25 "curl --proxy http://localhost:8118 ifconfig.me"
```

### 2. Instalar N8N en VPS
```bash
# SSH al VPS
ssh root@157.230.185.25

# Parar Docker N8N
docker compose down

# Instalar N8N nativo
npm install -g n8n

# Iniciar N8N
n8n start
```

### 3. Configurar Workflow
1. Acceder a N8N VPS: `http://157.230.185.25:5678`
2. Importar: `n8n-vps-flow-with-proxy.json`
3. Probar con video corto

## 🔧 Diferencias VPS vs Local

### Local (Desarrollo)
- N8N: `localhost:5678`
- yt-dlp: Sin proxy
- Supabase: Desarrollo

### VPS (Producción)
- N8N: `157.230.185.25:5678`
- yt-dlp: Con proxy `HTTP_PROXY=http://localhost:8118`
- Supabase: Producción

## 🧪 Testing

### 1. Test Proxy
```bash
# En VPS
HTTP_PROXY=http://localhost:8118 yt-dlp --get-title "https://youtube.com/watch?v=dQw4w9WgXcQ"
```

### 2. Test Workflow
- Probar con video corto
- Verificar timestamps
- Comparar con resultado local

## 📋 Checklist Migración

- ✅ Estructura de carpetas creada
- ✅ Proyecto copiado
- ✅ Workflows copiados con proxy
- ✅ Script de instalación N8N creado
- ⏳ Instalar N8N en VPS
- ⏳ Migrar workflows
- ⏳ Probar end-to-end
- ⏳ Actualizar FoundIt.at para usar VPS N8N

## 🚨 Importante

- ✅ Sistema local INTACTO como backup
- ✅ Workflow funcional preservado
- ✅ Proxy configurado en comandos yt-dlp
- ✅ SSH tunnel debe estar activo

---
**Estado:** En desarrollo  
**Última actualización:** 2025-06-22