# SSH Reverse Tunnel - VPS → PC/Mac (Starlink)

**Objetivo:** Permitir que el VPS use la IP residencial de Starlink para descargar de YouTube

## 💡 **Ventaja de usar PC separada**

**Configuración recomendada:**
- **PC Windows/Linux**: Ejecuta el tunnel SSH (más estable, no duerme)
- **Mac Mini**: Libre para desarrollo y otros usos
- **Ambos**: Conectados al mismo router Starlink
- **Este chat**: Continúa sin interrupción en PC separada

**Beneficios:**
- ✅ **No perdemos comunicación** durante testing
- ✅ **PC más estable** para tunnels 24/7 
- ✅ **Mac Mini libre** para desarrollo
- ✅ **Separation of concerns** - cada máquina su función

## 📋 Arquitectura

```
YouTube ← IP Starlink ← PC/Mac ← SSH Tunnel ← VPS N8N
                ↑                        ↑
         IP Residencial            IP Datacenter
         (No detectado)            (Bloqueado)
```

## 🎯 Beneficios

- ✅ **IP 100% residencial** (Starlink)
- ✅ **Costo $0** (sin VPN premium)
- ✅ **YouTube no detecta VPS**
- ✅ **Control total**
- ✅ **yt-dlp funciona normal**

## ⚙️ Configuración Paso a Paso

### **Fase 1: SSH Tunnel Básico**

#### En PC/Mac (Starlink):
```bash
# 1. Verificar IP actual
curl ifconfig.me
# Debe mostrar IP de Starlink

# 2. Crear usuario para tunnel
sudo adduser tunnel
sudo usermod -aG sudo tunnel

# 3. Generar SSH key para VPS
ssh-keygen -t ed25519 -f ~/.ssh/vps_tunnel

# Windows: Instalar OpenSSH si no está disponible
# winget install Microsoft.OpenSSH.Beta
```

#### En VPS:
```bash
# 1. Copiar SSH key del PC/Mac
cat ~/.ssh/vps_tunnel.pub | ssh root@157.230.185.25 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# 2. Test conexión básica
ssh root@157.230.185.25 "echo 'Conexión VPS OK'"
```

### **Fase 2: Reverse Tunnel**

#### En PC/Mac:
```bash
# 1. Instalar autossh (auto-reconnect)
# En Mac:
brew install autossh

# En Ubuntu/Debian:
sudo apt install autossh

# En Windows (usar WSL o Git Bash):

# 2. Crear tunnel reverso
# Puerto 8080 en VPS → Puerto 8080 en PC/Mac
ssh -R 8080:localhost:8080 root@157.230.185.25

# 3. Verificar tunnel
# En otra terminal:
python3 -m http.server 8080
# O en Windows: python -m http.server 8080
```

#### En VPS (verificar tunnel):
```bash
# Debe mostrar la página del servidor Python del PC/Mac
curl http://localhost:8080
```

### **Fase 3: HTTP Proxy en PC/Mac**

#### Instalar y configurar Squid proxy:
```bash
# En Mac:
brew install squid

# En Ubuntu/Debian:
sudo apt install squid

# En Windows: Usar WSL o alternativa como Privoxy

# Configurar squid
# Mac: sudo nano /usr/local/etc/squid.conf
# Linux: sudo nano /etc/squid/squid.conf
```

#### Configuración Squid (Mac: `/usr/local/etc/squid.conf`, Linux: `/etc/squid/squid.conf`):
```bash
# Puerto del proxy
http_port 3128

# Permitir conexiones del VPS
acl vps_network src 10.0.0.0/8
acl vps_network src 172.16.0.0/12
acl vps_network src 192.168.0.0/16
acl localhost src 127.0.0.1/32

http_access allow vps_network
http_access allow localhost
http_access deny all

# No logs para privacidad
access_log none
cache deny all
```

#### Iniciar proxy:
```bash
# Iniciar Squid
sudo squid -N -d1

# O como servicio:
# Mac: brew services start squid
# Linux: sudo systemctl start squid
```

### **Fase 4: Tunnel para Proxy**

#### En PC/Mac:
```bash
# Tunnel reverso para proxy HTTP
ssh -R 3128:localhost:3128 root@157.230.185.25
```

#### En VPS (configurar proxy):
```bash
# Configurar proxy para todo el sistema
export http_proxy=http://127.0.0.1:3128
export https_proxy=http://127.0.0.1:3128

# Verificar IP (debe mostrar IP de Starlink)
curl ifconfig.me
```

### **Fase 5: Configurar yt-dlp con Proxy**

#### En VPS:
```bash
# Test yt-dlp con proxy
yt-dlp --proxy http://127.0.0.1:3128 "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --get-title

# Si funciona, configurar N8N para usar proxy
```

## 🔄 Auto-Reconnect (Producción)

### **Script de Auto-Reconnect en PC/Mac:**

```bash
#!/bin/bash
# ~/tunnel-manager.sh
# Para Windows: crear tunnel-manager.bat o usar WSL

VPS_IP="157.230.185.25"
TUNNEL_PORTS="8080:localhost:8080 3128:localhost:3128"

while true; do
    echo "$(date): Iniciando tunnel..."
    
    autossh -M 20000 \
        -R $TUNNEL_PORTS \
        -o ServerAliveInterval=30 \
        -o ServerAliveCountMax=3 \
        -o ExitOnForwardFailure=yes \
        root@$VPS_IP
    
    echo "$(date): Tunnel caído, reconectando en 10s..."
    sleep 10
done
```

### **Hacer script ejecutable y correr:**
```bash
chmod +x ~/tunnel-manager.sh
nohup ~/tunnel-manager.sh > ~/tunnel.log 2>&1 &
```

## 🔧 N8N Configuration

### **Actualizar Execute Command en N8N:**

```bash
# Comando original (falla)
yt-dlp -x --audio-format mp3 -o "/tmp/{{$json.video_id}}.mp3" "{{$json.youtube_url}}"

# Comando con proxy (funciona)
HTTP_PROXY=http://127.0.0.1:3128 HTTPS_PROXY=http://127.0.0.1:3128 yt-dlp -x --audio-format mp3 -o "/tmp/{{$json.video_id}}.mp3" "{{$json.youtube_url}}"
```

## 📊 Monitoring y Troubleshooting

### **Verificaciones rápidas:**

```bash
# En VPS - verificar IP actual
curl ifconfig.me

# En VPS - verificar tunnel activo
netstat -tulpn | grep :3128
netstat -tulpn | grep :8080

# En VPS - test proxy
curl --proxy http://127.0.0.1:3128 ifconfig.me

# En Mac Mini - ver conexiones activas
netstat -an | grep :3128
netstat -an | grep :8080
```

### **Logs importantes:**

```bash
# En Mac Mini
tail -f ~/tunnel.log

# En VPS
docker compose logs -f n8n

# Starlink status
# (verificar en app Starlink)
```

## ⚡ Session Recovery (Si se corta comunicación)

### **Comandos de verificación rápida:**

```bash
# 1. ¿Tunnel activo?
ssh root@157.230.185.25 "curl ifconfig.me"

# 2. ¿N8N funcionando?
curl http://157.230.185.25:5678/webhook-test/youtube-transcript

# 3. ¿Proxy funcionando?
ssh root@157.230.185.25 "curl --proxy http://127.0.0.1:3128 ifconfig.me"
```

### **Restart desde cero:**

```bash
# En Mac Mini
pkill -f autossh
pkill -f ssh
~/tunnel-manager.sh &

# En VPS
docker compose restart n8n
```

## 🚀 Testing Plan

### **Test 1: SSH Básico (2 min)**
```bash
ssh root@157.230.185.25 "echo 'OK'"
```

### **Test 2: Reverse Tunnel (5 min)**
```bash
# PC/Mac
python3 -m http.server 8080 &
# Windows: python -m http.server 8080 &
ssh -R 8080:localhost:8080 root@157.230.185.25

# VPS
curl http://localhost:8080
```

### **Test 3: Proxy HTTP (10 min)**
```bash
# PC/Mac
sudo squid -N &
ssh -R 3128:localhost:3128 root@157.230.185.25

# VPS
curl --proxy http://127.0.0.1:3128 ifconfig.me
```

### **Test 4: yt-dlp (15 min)**
```bash
# VPS
HTTP_PROXY=http://127.0.0.1:3128 yt-dlp --get-title "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### **Test 5: N8N Workflow (20 min)**
```bash
# Actualizar N8N Execute Command con proxy
# Test completo con FoundIt.at
```

## 🔒 Security Considerations

- **SSH Key authentication** (no passwords)
- **Firewall rules** en PC/Mac
- **Proxy access control** (solo VPS)
- **Monitor bandwidth** usage
- **Starlink data** limits (verificar)

## 📈 Performance Expectations

### **Starlink specs:**
- **Download:** 50-200 Mbps
- **Upload:** 10-40 Mbps
- **Latency:** 20-100ms
- **Reliability:** 95%+

### **Expected performance:**
- **yt-dlp:** +30-60s por video (vs directo)
- **Bandwidth:** ~50-100MB por video
- **Concurrent videos:** 2-3 max

## 🎯 Success Criteria

✅ **VPS muestra IP de Starlink** - COMPLETADO (143.105.21.56)  
✅ **yt-dlp descarga sin "bot" error** - COMPLETADO (Rick Astley video)  
🔄 **N8N workflow completo funciona** - Pendiente actualizar proxy  
🔄 **Auto-reconnect tras cortes de Starlink** - Pendiente script  
🔄 **FoundIt.at recibe transcripts reales** - Pendiente test final

## ✅ IMPLEMENTACIÓN EXITOSA - 21 Junio 2025

### 🏆 Configuración Final Funcional

**PC (Windows 11 + WSL Ubuntu):**
- ✅ SSH Server habilitado (puerto 22)
- ✅ WSL Ubuntu instalado con Developer Mode
- ✅ Squid proxy configurado en puerto 8118
- ✅ SSH tunnel hacia VPS (puerto 8118)

**VPS (DigitalOcean Ubuntu):**
- ✅ SSH keys configuradas (Mac + PC)
- ✅ N8N + PostgreSQL corriendo
- ✅ Túnel reverso activo (PC:8118 → VPS:8118)
- ✅ yt-dlp funcional via proxy

**Comandos finales que funcionan:**
```bash
# En PC WSL: Squid corriendo
sudo systemctl start squid

# En PC: Túnel SSH al VPS
ssh -i ~/.ssh/vps_tunnel -R 8118:localhost:8118 root@157.230.185.25

# En VPS: yt-dlp con proxy (¡FUNCIONA!)
HTTP_PROXY=http://127.0.0.1:8118 HTTPS_PROXY=http://127.0.0.1:8118 yt-dlp --get-title "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
# Resultado: "Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)"
```

**Verificación de IP bypass:**
```bash
# VPS sin proxy (IP del datacenter)
curl ifconfig.me
# 2604:a880:400:d1::3305:1001

# VPS con proxy (IP de Starlink)
curl --proxy http://localhost:8118 ifconfig.me  
# 143.105.21.56 ✅ SUCCESS!
```  

## 📋 Next Steps

1. **Test básico** con Starlink
2. **Si funciona:** Automatizar con autossh
3. **Performance tuning:** Multiple tunnels, load balancing
4. **Migration plan:** Mover a Xfinity cuando sea posible
5. **Backup strategy:** ExpressVPN como fallback

---

**Status:** Ready for implementation  
**Estimated setup time:** 30-45 minutes  
**Estimated test time:** 1-2 hours  
**Dependencies:** Starlink stable connection, VPS SSH access