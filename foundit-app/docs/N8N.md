# 🤖 N8N Integration Guide

## 📋 Descripción General

N8N actúa como orquestador de workflows para automatizar la transcripción de videos de YouTube, optimizando costos y mejorando la experiencia del usuario.

## 🏗️ Arquitectura del Sistema

```
FoundIt.at Frontend
    ↓ (HTTP POST)
🌐 N8N Webhook 
    ↓
🎬 YouTube Video Processing
    ↓
🎙️ AssemblyAI Transcription 
    ↓
📝 Intelligent Segmentation
    ↓ (HTTP Response)
FoundIt.at Database ← 📊 Processed Transcript
```

## 🚀 Configuración N8N

### 1. Instalación con Docker

#### Docker Compose (Recomendado)
```yaml
# n8n-docker-compose.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: foundit-n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_secure_password
      - WEBHOOK_URL=https://your-n8n-domain.com
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
    volumes:
      - n8n_data:/home/node/.n8n
    restart: unless-stopped

volumes:
  n8n_data:
```

#### Comandos Docker
```bash
# Iniciar N8N
docker-compose -f n8n-docker-compose.yml up -d

# Ver logs
docker-compose -f n8n-docker-compose.yml logs -f

# Parar N8N
docker-compose -f n8n-docker-compose.yml down
```

### 2. Configuración de Variables de Entorno

```env
# N8N Configuration
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password_here

# API Keys
ASSEMBLYAI_API_KEY=your_assemblyai_key
OPENAI_API_KEY=your_openai_key

# Webhook URLs
WEBHOOK_URL=https://your-n8n-instance.com
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/foundit-transcript
```

## 🔧 Workflow Configuration

### Workflow Principal: YouTube → AssemblyAI → Supabase

#### Nodos del Workflow:

1. **🔗 Webhook Trigger**
   - Endpoint: `/webhook/foundit-transcript`
   - Método: POST
   - Datos esperados:
     ```json
     {
       "video_id": "djDZHAi75dk",
       "youtube_url": "https://youtube.com/watch?v=djDZHAi75dk",
       "memory_id": "uuid-here"
     }
     ```

2. **🎬 YouTube Audio Extraction**
   - Extrae audio del video usando yt-dlp
   - Formato: MP3, máxima calidad

3. **🎙️ AssemblyAI Transcription**
   - API Call a AssemblyAI
   - Configuración:
     - `speaker_labels`: true
     - `word_timestamps`: true
     - `punctuate`: true

4. **📝 Intelligent Segmentation** (Código del archivo `console-read.md`)
   - Segmenta transcript con timestamps
   - Configuración:
     - MIN_SEGMENT_LENGTH_CHARS: 80
     - MAX_SEGMENT_LENGTH_CHARS: 150
     - MIN_SEGMENT_DURATION_SECONDS: 8
     - MAX_SEGMENT_DURATION_SECONDS: 20

5. **📊 Supabase Update**
   - Actualiza registro en tabla `memories`
   - Campos: `transcript`, `transcript_with_timestamps`

### Código de Segmentación (Integrado en N8N)

```javascript
// Código del workflow N8N para formatear transcripts
const words = $json.words || [];
const fullTranscript = $json.text || '';

let transcriptWithTimestamps = '';
let currentSegmentWords = [];
let segmentStartTime = 0;

// Configuración optimizada
const MIN_SEGMENT_LENGTH_CHARS = 80;
const MAX_SEGMENT_LENGTH_CHARS = 150;
const MIN_SEGMENT_DURATION_SECONDS = 8;
const MAX_SEGMENT_DURATION_SECONDS = 20;

// [Lógica de segmentación del archivo console-read.md]

return {
  status: "completed",
  transcript: fullTranscript,
  transcriptWithTimestamps: transcriptWithTimestamps.trim(),
  video_id: $node["Code1"].json.video_id,
  youtube_url: $node["Code1"].json.youtube_url,
  memory_id: $node["Code1"].json.memory_id
};
```

## 🔒 Seguridad y VPN

### 🌐 Recomendaciones VPN para N8N

#### **¿Por qué necesitas VPN?**
- **Seguridad**: Protege tráfico entre FoundIt.at y N8N
- **Acceso remoto**: Conecta servicios desde diferentes ubicaciones
- **Estabilidad**: Conexiones más estables para workflows largos

#### **Opciones Recomendadas:**

### 1. **🏢 VPN Empresarial (Recomendado para Producción)**

#### **Tailscale** ⭐ (Más Recomendado)
```bash
# Instalación Ubuntu/Debian
curl -fsSL https://tailscale.com/install.sh | sh

# Configurar
sudo tailscale up

# Agregar N8N a la red
# Dashboard: https://login.tailscale.com/admin/machines
```

**Ventajas:**
- ✅ Zero-config VPN mesh
- ✅ Gratis hasta 20 dispositivos
- ✅ Ideal para desarrollo y producción
- ✅ Excelente para conectar servicios distribuidos

#### **Cloudflare Tunnel**
```bash
# Instalar cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Crear túnel
cloudflared tunnel create foundit-n8n
cloudflared tunnel route dns foundit-n8n n8n.yourdomain.com

# Configurar túnel
# ~/.cloudflared/config.yml
tunnel: your-tunnel-id
credentials-file: /home/user/.cloudflared/your-tunnel-id.json

ingress:
  - hostname: n8n.yourdomain.com
    service: http://localhost:5678
  - service: http_status:404
```

### 2. **☁️ VPN Cloud (Alternativas)**

#### **DigitalOcean VPC**
- Crear VPC privada
- Desplegar N8N en Droplet dentro de VPC
- Conectar FoundIt.at a través de VPC

#### **AWS/GCP Private Network**
- Usar VPC/VPN Gateway
- Más complejo pero muy seguro

### 3. **🏠 Auto-hospedado (Para desarrollo)**

#### **WireGuard**
```bash
# Servidor (donde está N8N)
sudo apt update && sudo apt install wireguard

# Generar llaves
wg genkey | tee privatekey | wg pubkey > publickey

# Configurar servidor
# /etc/wireguard/wg0.conf
[Interface]
PrivateKey = server_private_key
Address = 10.0.0.1/24
ListenPort = 51820

[Peer]
PublicKey = client_public_key
AllowedIPs = 10.0.0.2/32
```

#### **OpenVPN**
```bash
# Usar script automático
wget https://git.io/vpn -O openvpn-install.sh
sudo bash openvpn-install.sh
```

## 🚀 Deployment y Hosting

### Opciones de Hosting para N8N

#### 1. **🐳 Docker VPS (Recomendado)**
**Proveedores:** DigitalOcean, Linode, Vultr
```bash
# Crear VPS con Docker
# Tamaño mínimo: 1GB RAM, 1 vCPU

# Configurar firewall
ufw allow 22/tcp    # SSH
ufw allow 5678/tcp  # N8N (solo si no usas VPN)
ufw enable

# Deploy N8N
git clone https://your-repo.git
cd foundit-n8n-setup
docker-compose up -d
```

#### 2. **☁️ Cloud Platforms**

**Railway** (Más fácil)
```yaml
# railway.toml
[build]
nixpacksPath = "./nixpacks.toml"

[deploy]
startCommand = "npm start"
healthcheckPath = "/healthz"
```

**Heroku**
```bash
# Heroku deployment
heroku create foundit-n8n
heroku config:set N8N_BASIC_AUTH_ACTIVE=true
git push heroku main
```

#### 3. **🏢 N8N Cloud** (Comercial)
- Hosting oficial de N8N
- $20/mes por starter
- Ideal para producción sin mantenimiento

### Configuración de DNS y SSL

```bash
# Con Cloudflare (Recomendado)
# 1. Agregar A record: n8n.yourdomain.com → IP_VPS
# 2. Activar SSL/TLS (Full)
# 3. Configurar Page Rules para seguridad extra

# Con Let's Encrypt (Manual)
sudo apt install certbot
sudo certbot --nginx -d n8n.yourdomain.com
```

## 🔗 Integración con FoundIt.at

### Variables de Entorno en FoundIt.at

```env
# N8N Integration
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/foundit-transcript
N8N_API_KEY=your_n8n_api_key (si usas autenticación API)
N8N_ENABLED=true
```

### Código de Integración (ya implementado)

```typescript
// src/utils/n8nTranscript.ts
export async function processVideoWithN8N(
  videoId: string, 
  youtubeUrl: string, 
  memoryId: string
) {
  const response = await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_id: videoId,
      youtube_url: youtubeUrl,
      memory_id: memoryId
    })
  });
  
  return response.json();
}
```

## 🧪 Testing y Debugging

### Scripts de Testing

```bash
# Test N8N webhook local
node test-n8n-local.js

# Test N8N webhook production
node test-n8n-webhook.js

# Test workflow específico
node test-n8n-workflow-status.js
```

### Monitoring y Logs

```bash
# Ver logs N8N Docker
docker logs foundit-n8n -f

# Debugging workflow
# N8N UI → Executions → Ver detalles de ejecución

# Test endpoint salud
curl https://n8n.yourdomain.com/healthz
```

## 💰 Costos y Optimización

### Comparación de Costos

| Método | Costo/Hora | Ventajas | Desventajas |
|--------|------------|----------|-------------|
| **YouTube API** | $0.00 | Gratis, rápido | Limitado disponibilidad |
| **N8N + AssemblyAI** | $0.36 | Automático, segmentado | Requiere setup |
| **AssemblyAI Directo** | $0.90 | Simple | Más caro, sin segmentación |
| **Manual** | $0.00 | Control total | Tiempo manual |

### Optimización de Costos N8N

1. **🎯 Caché inteligente**: No reprocesar videos existentes
2. **⚡ Batch processing**: Procesar múltiples videos en lotes
3. **📊 Límites**: Configurar límites de uso diario/mensual
4. **🔄 Retry logic**: Reintentar solo fallos temporales

## 🚨 Troubleshooting

### Problemas Comunes

#### **N8N no responde**
```bash
# Verificar estado
docker ps | grep n8n

# Restart
docker restart foundit-n8n

# Ver logs
docker logs foundit-n8n --tail=50
```

#### **Webhook timeout**
```javascript
// Aumentar timeout en N8N workflow
{
  "timeout": 300000, // 5 minutos
  "retries": 3
}
```

#### **AssemblyAI errors**
- Verificar API key válida
- Comprobar límites de cuenta
- Validar formato de audio

#### **VPN issues**
```bash
# Tailscale troubleshooting
tailscale status
tailscale ping n8n-machine

# WireGuard debugging
sudo wg show
sudo systemctl status wg-quick@wg0
```

## 📈 Próximas Mejoras

### Roadmap N8N Integration

1. **🔄 Multi-workflow**: Diferentes workflows para diferentes tipos de content
2. **📊 Analytics**: Dashboard de uso y métricas
3. **🤖 AI Enhancement**: Mejores resúmenes con context específico
4. **🔗 API Gateway**: Centralizar todas las APIs a través de N8N
5. **📱 Mobile webhooks**: Soporte para aplicaciones móviles

---

**💡 Tip**: Empieza con Tailscale + Docker VPS para un setup rápido y seguro. Escala a soluciones más complejas según tus necesidades.