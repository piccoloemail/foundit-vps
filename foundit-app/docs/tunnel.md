# SSH Tunnel - Guía de Operación Diaria

**Propósito:** Comandos esenciales para operar el SSH tunnel que permite a FoundIt.at usar IP de Starlink para bypass YouTube bot detection.

## 🚀 INICIO RÁPIDO (Orden de ejecución)

### 1. Verificar servicios en PC
```bash
# Desde Mac, conectar a PC
ssh robce@192.168.1.28

# Entrar a WSL
wsl

# Verificar si Squid está corriendo
sudo systemctl status squid

# Si no está corriendo, iniciarlo
sudo systemctl start squid

# Salir de WSL
exit
```

### 2. Establecer túnel SSH
```bash
# En PC (o desde Mac → PC)
ssh -i ~/.ssh/vps_tunnel -R 8118:localhost:8118 root@157.230.185.25

# Dejar esta terminal abierta (túnel activo)
```

### 3. Verificar funcionamiento
```bash
# En VPS (nueva terminal)
# Test 1: Verificar IP con proxy
curl --proxy http://localhost:8118 ifconfig.me
# Debe mostrar IP de Starlink (143.105.21.56)

# Test 2: Probar yt-dlp
HTTP_PROXY=http://127.0.0.1:8118 HTTPS_PROXY=http://127.0.0.1:8118 yt-dlp --get-title "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
# Debe mostrar: Rick Astley - Never Gonna Give You Up...
```

## 🔧 COMANDOS DE DIAGNÓSTICO

### Verificar estado del túnel
```bash
# En VPS: Ver puertos activos
ss -tulpn | grep :8118

# En PC WSL: Estado de Squid
sudo systemctl status squid

# En PC: Procesos SSH activos
tasklist | findstr ssh
```

### Verificar IPs
```bash
# IP del VPS directo (debe ser DigitalOcean)
curl ifconfig.me

# IP via proxy (debe ser Starlink)
curl --proxy http://localhost:8118 ifconfig.me

# IP de Starlink desde PC
# En PC: curl ifconfig.me
```

## 🔄 REINICIO COMPLETO

### Si algo no funciona, reinicio desde cero:
```bash
# 1. Parar todos los procesos
# En PC: Ctrl+C en túnel SSH
# En VPS: salir de sesiones

# 2. Reiniciar Squid en PC
ssh robce@192.168.1.28
wsl
sudo systemctl restart squid
sudo systemctl status squid
exit

# 3. Reestablecer túnel
ssh -i ~/.ssh/vps_tunnel -R 8118:localhost:8118 root@157.230.185.25

# 4. Verificar funcionamiento
curl --proxy http://localhost:8118 ifconfig.me
```

## 🛠️ ACTUALIZAR N8N WORKFLOW

### Variables de entorno para N8N
```bash
# En VPS, antes de iniciar N8N:
export HTTP_PROXY=http://127.0.0.1:8118
export HTTPS_PROXY=http://127.0.0.1:8118

# O en docker-compose.yml:
environment:
  - HTTP_PROXY=http://127.0.0.1:8118
  - HTTPS_PROXY=http://127.0.0.1:8118
```

### Comandos yt-dlp para N8N Execute Command node
```bash
# Comando anterior (falla en VPS)
yt-dlp -x --audio-format mp3 -o "/tmp/{{$json.video_id}}.mp3" "{{$json.youtube_url}}"

# Comando nuevo (funciona con proxy)
HTTP_PROXY=http://127.0.0.1:8118 HTTPS_PROXY=http://127.0.0.1:8118 yt-dlp -x --audio-format mp3 -o "/tmp/{{$json.video_id}}.mp3" "{{$json.youtube_url}}"
```

## 📋 CHECKLIST PRE-TRANSCRIPCIÓN

Antes de procesar videos, verificar:

- [ ] **PC encendida** y conectada a Starlink
- [ ] **SSH Server corriendo** en PC (Start-Service sshd)
- [ ] **WSL Squid activo** (systemctl status squid)
- [ ] **Túnel SSH establecido** (ssh -R 8118...)
- [ ] **IP Starlink verificada** (curl --proxy...)
- [ ] **yt-dlp funcional** (test video)
- [ ] **N8N variables proxy** configuradas

## ⚠️ TROUBLESHOOTING COMÚN

### "Connection refused" en puerto 8118
```bash
# Verificar Squid en PC WSL
sudo systemctl status squid
sudo systemctl restart squid
```

### "Permission denied" en SSH
```bash
# Verificar SSH key en PC
ls ~/.ssh/vps_tunnel*

# Si no existe, regenerar
ssh-keygen -t ed25519 -f ~/.ssh/vps_tunnel
# Agregar clave pública al VPS authorized_keys
```

### "Empty reply from server"
```bash
# Problema típico: Squid configuración incorrecta
sudo nano /etc/squid/squid.conf

# Debe contener solo:
http_port 8118
http_access allow all
```

### YouTube sigue bloqueando
```bash
# Verificar que estamos usando IP correcta
curl --proxy http://localhost:8118 ifconfig.me

# Debe mostrar IP de Starlink, no VPS
# Si muestra VPS IP, túnel no está funcionando
```

## 🔄 SCRIPTS DE AUTOMATIZACIÓN (Futuro)

### Auto-start tunnel (tunnel-start.sh)
```bash
#!/bin/bash
# Iniciar Squid
ssh robce@192.168.1.28 "wsl sudo systemctl start squid"

# Establecer túnel (en background)
ssh -i ~/.ssh/vps_tunnel -R 8118:localhost:8118 root@157.230.185.25 -N &

# Verificar funcionamiento
sleep 5
ssh root@157.230.185.25 "curl --proxy http://localhost:8118 ifconfig.me"
```

### Health check (tunnel-check.sh)
```bash
#!/bin/bash
# Verificar si túnel está activo
TUNNEL_IP=$(ssh root@157.230.185.25 "curl -s --proxy http://localhost:8118 ifconfig.me")
STARLINK_IP="143.105.21.56" # IP conocida de Starlink

if [ "$TUNNEL_IP" != "$STARLINK_IP" ]; then
    echo "Túnel caído, reiniciando..."
    # Restart logic aquí
fi
```

## 📊 MÉTRICAS DE RENDIMIENTO

### Tiempos esperados
- **Establecer túnel:** 5-10 segundos
- **Verificar IP:** 2-3 segundos  
- **yt-dlp test:** 10-15 segundos
- **Transcripción completa:** 30-60 segundos por video

### Bandwidth usage
- **Audio download:** ~3-10MB por video
- **Túnel overhead:** ~5-10% adicional
- **Concurrent videos:** Máximo 2-3 recomendado

## 🎯 OBJETIVOS DE UPTIME

- **Túnel availability:** >95%
- **Proxy response time:** <5 segundos
- **YouTube success rate:** >90%
- **N8N workflow success:** >85%

---

**Última actualización:** 21 Junio 2025  
**Estado:** ✅ Funcionando  
**Próxima revisión:** Después de integración N8N