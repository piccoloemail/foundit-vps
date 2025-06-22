# 🐳 N8N Docker - Problema de Conexión al Proxy

**Fecha:** 22 Junio 2025  
**Hora:** 4:49 AM  
**Estado:** Proxy funciona pero N8N en Docker no puede acceder  

## 🔍 DIAGNÓSTICO COMPLETO

### ✅ Lo que funciona:
1. **Túnel SSH** - Funcionando perfectamente hace 2+ horas
2. **Proxy Squid** - Respondiendo en puerto 8118
3. **IP Starlink** - 143.105.21.56 confirmada
4. **Test manual** - `curl --proxy http://localhost:8118` funciona
5. **Comando yt-dlp** - Sintaxis correcta sin rutas de Mac

### ❌ El problema:
- N8N está en Docker container
- Docker no puede acceder a `localhost:8118` del host
- Intentos fallidos:
  - `127.0.0.1:8118` - Connection refused
  - `host.docker.internal:8118` - Connection refused  
  - `172.17.0.1:8118` - Connection refused

## 🎯 SOLUCIONES POSIBLES

### Opción 1: Modificar docker-compose.yml

```yaml
# Opción A - Network host mode
services:
  n8n:
    network_mode: "host"
    # Esto permite acceso directo a localhost:8118

# Opción B - Extra hosts
services:
  n8n:
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      - HTTP_PROXY=http://host.docker.internal:8118
      - HTTPS_PROXY=http://host.docker.internal:8118

# Opción C - Proxy como servicio Docker
services:
  n8n:
    # config actual
  
  proxy:
    image: sameersbn/squid:latest
    ports:
      - "3128:3128"
    volumes:
      - ./squid.conf:/etc/squid/squid.conf
```

### Opción 2: Instalar yt-dlp dentro del container

```bash
# Entrar al container
docker exec -it n8n-n8n-1 /bin/sh

# Instalar yt-dlp
apk add --no-cache python3 py3-pip ffmpeg
pip3 install yt-dlp

# Verificar
yt-dlp --version
```

### Opción 3: N8N sin Docker (Recomendada)

```bash
# Backup configuración actual
cd /opt/n8n
docker-compose down
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n-backup.tar.gz /data

# Instalar N8N nativo
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g n8n

# Configurar como servicio
sudo nano /etc/systemd/system/n8n.service
```

```ini
[Unit]
Description=n8n - Workflow Automation Tool
After=network.target

[Service]
Type=simple
User=root
Environment="N8N_PORT=5678"
Environment="N8N_PROTOCOL=http"
Environment="N8N_HOST=0.0.0.0"
Environment="WEBHOOK_URL=http://157.230.185.25:5678"
ExecStart=/usr/bin/n8n start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
# Iniciar servicio
sudo systemctl daemon-reload
sudo systemctl enable n8n
sudo systemctl start n8n
```

### Opción 4: SSH Tunnel directo en N8N

En lugar de proxy HTTP, usar túnel SSH directo:

```bash
# En Execute Command node
ssh -o ProxyCommand="ssh -W %h:%p root@157.230.185.25" admin@100.78.110.90 "yt-dlp -x --audio-format mp3 'URL'"
```

## 📋 CHECKLIST PARA MAÑANA

### 1. Verificar configuración Docker actual
```bash
ssh root@157.230.185.25
cd /opt/n8n
cat docker-compose.yml
docker network ls
docker inspect n8n-n8n-1 | grep -A 10 "Networks"
```

### 2. Test de conectividad desde container
```bash
# Test desde dentro del container
docker exec n8n-n8n-1 ping host.docker.internal
docker exec n8n-n8n-1 wget -O- http://host.docker.internal:8118
docker exec n8n-n8n-1 curl http://172.17.0.1:8118
```

### 3. Verificar iptables/firewall
```bash
# En VPS
sudo iptables -L -n | grep 8118
sudo ufw status | grep 8118
```

## 🚀 RECOMENDACIÓN PRINCIPAL

**Migrar N8N fuera de Docker** es la solución más simple y confiable:

1. **Backup todo** antes de migrar
2. **Instalar N8N nativo** con npm
3. **Importar workflows** desde backup
4. **Proxy funcionará inmediatamente** con localhost:8118

## 📝 COMANDOS ÚTILES

### Para dormir tranquilo - Verificar sistema
```bash
# Estado general del sistema
ssh root@157.230.185.25 "systemctl status"
ssh admin@192.168.1.36 "sudo systemctl status foundit-tunnel"

# Logs del túnel
ssh admin@192.168.1.36 "sudo journalctl -u foundit-tunnel --since '1 hour ago'"

# Test proxy básico
ssh root@157.230.185.25 "curl --proxy http://localhost:8118 ifconfig.me"
```

## 💤 RESUMEN EJECUTIVO

**El sistema de túnel SSH está perfecto.** El único problema es que N8N en Docker no puede acceder al proxy en localhost:8118.

**Solución más rápida:** Instalar N8N sin Docker  
**Solución más elegante:** Configurar Docker networking correctamente  
**Solución temporal:** Usar workflow v009 con AssemblyAI directo (sin yt-dlp)

---

**Buenas noches! El sistema está estable, solo necesita ajuste de Docker networking. 🌙**