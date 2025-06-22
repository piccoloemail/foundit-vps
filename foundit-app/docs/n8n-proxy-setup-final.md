# 🎯 N8N - Configuración Final del Proxy

**Objetivo:** Actualizar N8N workflow para usar el túnel SSH + proxy del Raspberry Pi

## 🌐 ACCESO A N8N

### **Crear túnel SSH local (IMPORTANTE):**
```bash
# Desde Mac - Abrir túnel SSH
ssh -L 5678:localhost:5678 root@157.230.185.25
# Mantener esta terminal abierta
```

### **URL:** http://localhost:5678
### **Credenciales:** 
- Usuario: admin
- Password: [tu-password-n8n]

### **Workflow específico:**
- ID: `Ezd68R7DFAKwH07E`
- URL directa: http://localhost:5678/workflow/Ezd68R7DFAKwH07E

## 🔧 MÉTODO 1: Variables de Entorno por Nodo (Recomendado)

### **1. Localizar nodos yt-dlp en workflow**
- Buscar nodos tipo "Execute Command" 
- Que contengan comandos `yt-dlp`

### **2. Actualizar comando en cada nodo**

**ANTES:**
```bash
yt-dlp -x --audio-format mp3 -o "/tmp/{{$json.video_id}}.mp3" "{{$json.youtube_url}}"
```

**DESPUÉS:**
```bash
HTTP_PROXY=http://127.0.0.1:8118 HTTPS_PROXY=http://127.0.0.1:8118 yt-dlp -x --audio-format mp3 -o "/tmp/{{$json.video_id}}.mp3" "{{$json.youtube_url}}"
```

### **3. Nodos comunes a actualizar:**
- **YouTube Download** - Execute Command
- **YouTube Transcript** - Execute Command
- **Video Processing** - Execute Command

### **4. Ejemplo completo de comando actualizado:**
```bash
HTTP_PROXY=http://127.0.0.1:8118 HTTPS_PROXY=http://127.0.0.1:8118 yt-dlp \
  --write-auto-sub \
  --write-sub \
  --sub-lang en \
  --convert-subs srt \
  --output "/tmp/%(title)s.%(ext)s" \
  "{{$json.youtube_url}}"
```

## 🐳 MÉTODO 2: Docker Environment Variables (Alternativo)

### **1. Localizar docker-compose.yml en VPS**
```bash
# Conectar al VPS
ssh root@157.230.185.25

# Buscar N8N
find /opt -name "docker-compose.yml" -type f 2>/dev/null | grep n8n
find /home -name "docker-compose.yml" -type f 2>/dev/null | grep n8n
docker ps | grep n8n
```

### **2. Editar docker-compose.yml**
```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - HTTP_PROXY=http://127.0.0.1:8118
      - HTTPS_PROXY=http://127.0.0.1:8118
      - NO_PROXY=localhost,127.0.0.1,postgres,redis
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your-password
    volumes:
      - n8n_data:/home/node/.n8n
```

### **3. Reiniciar N8N**
```bash
# En el directorio de N8N
docker-compose down
docker-compose up -d

# Verificar logs
docker-compose logs -f n8n
```

## 🧪 TESTING

### **1. Test manual en VPS**
```bash
# Conectar al VPS
ssh root@157.230.185.25

# Test directo de yt-dlp con proxy
HTTP_PROXY=http://127.0.0.1:8118 HTTPS_PROXY=http://127.0.0.1:8118 yt-dlp --get-title "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Resultado esperado: Rick Astley - Never Gonna Give You Up...
```

### **2. Test workflow N8N**

**Webhook de prueba:**
```bash
curl -X POST http://157.230.185.25:5678/webhook-test/youtube-transcript \
  -H "Content-Type: application/json" \
  -d '{
    "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "video_id": "dQw4w9WgXcQ",
    "memory_id": "test-proxy-123"
  }'
```

### **3. Verificar en N8N UI**
- Ir a "Executions" en N8N
- Ver última ejecución
- Verificar que yt-dlp completó sin errores
- Revisar output del nodo

## 🔍 TROUBLESHOOTING

### **Verificar túnel funciona:**
```bash
# Test proxy desde VPS
curl --proxy http://127.0.0.1:8118 ifconfig.me
# Debe mostrar: 143.105.21.56
```

### **Verificar Pi está corriendo:**
```bash
# Desde Mac
ssh admin@100.78.110.90 "sudo systemctl status foundit-tunnel"
```

### **Si sigue fallando:**
```bash
# Reiniciar servicios
# En Pi:
sudo systemctl restart foundit-tunnel
sudo systemctl restart squid

# En VPS:
docker-compose restart n8n
```

### **Logs para debugging:**
```bash
# Pi logs
sudo journalctl -u foundit-tunnel -f
tail -f /home/admin/tunnel-health.log

# VPS logs
docker-compose logs -f n8n
tail -f /var/log/ssh-tunnel-cleanup.log
```

## 📊 VERIFICACIÓN DE ÉXITO

### **Antes del proxy (error esperado):**
```
ERROR: Sign in to confirm you're not a bot. This action will open a web browser.
```

### **Después del proxy (éxito esperado):**
```
[youtube] dQw4w9WgXcQ: Downloading webpage
[info] dQw4w9WgXcQ: Downloading 1 format(s): 251
[download] Destination: /tmp/Rick Astley - Never Gonna Give You Up.mp3
[download] 100% of 4.85MiB in 00:02
```

## 🎯 RESULTADO FINAL

**Con proxy configurado:**
- ✅ N8N puede descargar videos de YouTube sin restricciones
- ✅ Transcripciones automáticas funcionan
- ✅ FoundIt.at puede procesar cualquier video público
- ✅ Sistema completamente automatizado

## 📋 CHECKLIST

- [ ] Acceder a N8N web UI (http://157.230.185.25:5678)
- [ ] Localizar workflow(s) con yt-dlp
- [ ] Actualizar comandos Execute Command con variables proxy
- [ ] Guardar workflow(s)
- [ ] Test con video real usando webhook
- [ ] Verificar ejecución exitosa en "Executions"
- [ ] Confirmar descarga/transcripción completa

## 🔄 WORKFLOWS COMUNES A ACTUALIZAR

### **1. YouTube Transcript Workflow**
- Nodo: "Download Video" (Execute Command)
- Nodo: "Extract Audio" (Execute Command)  
- Nodo: "Get Transcript" (Execute Command)

### **2. Video Processing Workflow**
- Nodo: "YouTube Download" (Execute Command)
- Nodo: "Convert Format" (Execute Command)

### **3. Bulk Processing Workflow**
- Nodo: "Process Video List" (Execute Command loop)

---

**Una vez configurado N8N, el sistema FoundIt.at estará 100% operativo con bypass de YouTube!** 🚀