# N8N Workflow - Actualización para Proxy

**Objetivo:** Actualizar el workflow N8N para usar el proxy SSH tunnel del Raspberry Pi

## 🔧 CAMBIOS NECESARIOS EN N8N

### 1. Acceder a N8N
```bash
# Desde navegador
http://157.230.185.25:5678

# Credenciales (si las configuraste)
Usuario: admin
Password: [tu-password]
```

### 2. Editar Workflow YouTube Transcript

#### Buscar el nodo "Execute Command" que tiene yt-dlp

**Comando ACTUAL (no funciona en VPS):**
```bash
yt-dlp -x --audio-format mp3 -o "/tmp/{{$json.video_id}}.mp3" "{{$json.youtube_url}}"
```

**Comando NUEVO (con proxy):**
```bash
HTTP_PROXY=http://127.0.0.1:8118 HTTPS_PROXY=http://127.0.0.1:8118 yt-dlp -x --audio-format mp3 -o "/tmp/{{$json.video_id}}.mp3" "{{$json.youtube_url}}"
```

### 3. Variables de Entorno Alternativa

Si prefieres configurar el proxy globalmente en Docker:

#### Editar docker-compose.yml en VPS
```yaml
services:
  n8n:
    environment:
      - HTTP_PROXY=http://127.0.0.1:8118
      - HTTPS_PROXY=http://127.0.0.1:8118
      - NO_PROXY=localhost,127.0.0.1
```

Luego reiniciar:
```bash
cd /opt/n8n
docker-compose down
docker-compose up -d
```

## 📋 TESTING

### 1. Test Manual desde VPS
```bash
# Verificar que el proxy funciona
HTTP_PROXY=http://127.0.0.1:8118 yt-dlp --get-title "https://www.youtube.com/watch?v=IXJEGjfZRBE"
```

### 2. Test Workflow N8N
```bash
# Llamar webhook con video de prueba
curl -X POST http://157.230.185.25:5678/webhook-test/youtube-transcript \
  -H "Content-Type: application/json" \
  -d '{
    "youtube_url": "https://www.youtube.com/watch?v=IXJEGjfZRBE",
    "video_id": "IXJEGjfZRBE",
    "memory_id": "test-123"
  }'
```

### 3. Verificar en N8N UI
- Ir a "Executions" 
- Ver si el workflow completó sin errores
- Revisar output del nodo yt-dlp

## 🎯 RESULTADO ESPERADO

### Antes (Error)
```
ERROR: Sign in to confirm you're not a bot...
```

### Después (Éxito)
```
[youtube] IXJEGjfZRBE: Downloading webpage
[info] IXJEGjfZRBE: Downloading 1 format(s): 251
[download] Destination: /tmp/IXJEGjfZRBE.mp3
[download] 100% of 4.85MiB...
```

## 🔍 TROUBLESHOOTING

### Si sigue fallando:

1. **Verificar túnel Pi**
```bash
ssh root@157.230.185.25 "curl --proxy http://localhost:8118 ifconfig.me"
# Debe mostrar: 143.105.21.56
```

2. **Verificar Pi está corriendo**
```bash
ssh admin@192.168.1.184 "sudo systemctl status foundit-tunnel"
```

3. **Reiniciar servicios**
```bash
# En Pi
sudo systemctl restart foundit-tunnel
sudo systemctl restart squid

# En VPS
docker-compose restart n8n
```

## 📊 ARQUITECTURA ACTUALIZADA

```
FoundIt.at → N8N Webhook → Execute Command (con proxy) → yt-dlp
                                    ↓
                          HTTP_PROXY=127.0.0.1:8118
                                    ↓
                           SSH Tunnel → Pi 4 → Starlink → YouTube
```

## ✅ CHECKLIST

- [ ] Acceder a N8N web UI
- [ ] Localizar workflow YouTube transcript
- [ ] Actualizar comando yt-dlp con proxy
- [ ] Guardar workflow
- [ ] Test con video real
- [ ] Verificar transcripción completa

---

**Una vez actualizado N8N, el sistema completo estará funcionando 24/7 con el Raspberry Pi!**