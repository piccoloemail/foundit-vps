# FoundIt VPS Project

Sistema paralelo de FoundIt.at adaptado para usar N8N nativo en VPS con SSH tunnel para bypass de YouTube.

## 🎯 Objetivo

Migrar de N8N Docker (con problemas de proxy) a N8N nativo para usar SSH tunnel y procesar videos sin restricciones de YouTube.

## 📁 Estructura

```
foundit-vps/
├── 📱 foundit-app/          # Aplicación Next.js (copia del local funcional)
├── 🔧 n8n-workflows/        # Workflows N8N
│   ├── n8n-local-flow-FINISH-DONT-TOUCH.json    # ✅ Backup del workflow local
│   └── n8n-vps-flow-with-proxy.json             # 🚀 Versión con proxy para VPS
├── 📚 docs/                 # Documentación específica VPS
├── 🛠️  scripts/              # Scripts de deployment y setup
└── 💾 backups/              # Backups de seguridad
```

## 🚀 Quick Start

### 1. Instalar N8N Local (Desarrollo)
```bash
cd /Users/bjc/Documents/projects/foundit-vps
./scripts/install-n8n.sh
```

### 2. Deploy a VPS
```bash
./scripts/deploy-to-vps.sh
```

### 3. Configurar Workflow
1. Acceder a VPS N8N: `http://157.230.185.25:5678`
2. Importar workflow: `n8n-vps-flow-with-proxy.json`
3. Probar con video corto

## 🔄 Workflow Changes

### Local (Original)
```bash
yt-dlp -x --audio-format mp3 -o "/tmp/{{$json.video_id}}.mp3" "{{$json.youtube_url}}"
```

### VPS (Con Proxy)
```bash
HTTP_PROXY=http://localhost:8118 HTTPS_PROXY=http://localhost:8118 yt-dlp -x --audio-format mp3 -o "/tmp/{{$json.video_id}}.mp3" "{{$json.youtube_url}}"
```

## ✅ Status

- ✅ **Estructura creada**
- ✅ **Proyecto copiado**
- ✅ **Workflows adaptados**
- ✅ **Scripts de deployment**
- ✅ **Documentación completa**
- ⏳ **Instalar N8N en VPS**
- ⏳ **Testing end-to-end**

## 🔗 Enlaces

- **VPS N8N:** http://157.230.185.25:5678
- **Local N8N:** http://localhost:5678
- **SSH Tunnel:** Raspberry Pi → VPS (puerto 8118)

## 📋 Workflows Disponibles

| Workflow | Descripción | Estado |
|----------|-------------|--------|
| `n8n-local-flow-FINISH-DONT-TOUCH.json` | Backup del local funcional | ✅ Backup |
| `n8n-vps-flow-with-proxy.json` | Versión con proxy para VPS | 🚀 Ready |

## 🛡️ Seguridad

- ✅ Sistema local **INTACTO** como backup
- ✅ Workflow funcional **preservado**
- ✅ Proyecto **completamente independiente**

## 📚 Documentación

- [`docs/vps-setup-guide.md`](./docs/vps-setup-guide.md) - Guía completa de setup
- [`docs/production-architecture.md`](./docs/production-architecture.md) - Arquitectura del sistema
- [`docs/n8nflows.md`](./docs/n8nflows.md) - Comandos específicos de N8N

---

**Estado:** ✅ Ready for deployment  
**Última actualización:** 2025-06-22  
**Sistema original:** INTACTO en `/Users/bjc/Documents/projects/foundit-at/`