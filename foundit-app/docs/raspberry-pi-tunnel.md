# Raspberry Pi 4 - SSH Tunnel Setup

**Mejor solución que PC Windows!** El Pi 4 es ideal para mantener el túnel SSH 24/7.

## 🚀 SETUP RÁPIDO (30 minutos)

### 1. Instalar Raspberry Pi OS
```bash
# Descargar Raspberry Pi Imager
# https://www.raspberrypi.com/software/

# Usar Raspberry Pi OS Lite (sin desktop)
# Habilitar SSH durante instalación
```

### 2. Configuración Inicial
```bash
# Conectar por SSH
ssh pi@[IP-DEL-PI]

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar herramientas necesarias
sudo apt install squid autossh screen -y
```

### 3. Configurar Squid
```bash
# Editar configuración
sudo nano /etc/squid/squid.conf

# Contenido mínimo:
http_port 8118
http_access allow all

# Reiniciar Squid
sudo systemctl restart squid
sudo systemctl enable squid
```

### 4. Configurar SSH Keys
```bash
# Generar key para VPS
ssh-keygen -t ed25519 -f ~/.ssh/vps_tunnel

# Copiar la clave pública
cat ~/.ssh/vps_tunnel.pub

# Agregar al VPS (desde Mac):
ssh root@157.230.185.25
echo "CLAVE_PUBLICA_DEL_PI" >> ~/.ssh/authorized_keys
```

### 5. Test Manual del Túnel
```bash
# Desde el Pi
ssh -i ~/.ssh/vps_tunnel -R 8118:localhost:8118 root@157.230.185.25

# Desde otra terminal (Mac)
ssh root@157.230.185.25 "curl --proxy http://localhost:8118 ifconfig.me"
# Debe mostrar IP de Starlink
```

### 6. Automatizar con systemd
```bash
# Crear servicio
sudo nano /etc/systemd/system/foundit-tunnel.service

[Unit]
Description=FoundIt SSH Tunnel
After=network.target

[Service]
Type=simple
User=pi
ExecStart=/usr/bin/autossh -M 0 -N \
  -o "ServerAliveInterval 30" \
  -o "ServerAliveCountMax 3" \
  -o "ExitOnForwardFailure=yes" \
  -i /home/pi/.ssh/vps_tunnel \
  -R 8118:localhost:8118 \
  root@157.230.185.25
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Habilitar servicio
sudo systemctl daemon-reload
sudo systemctl enable foundit-tunnel
sudo systemctl start foundit-tunnel
```

### 7. Verificar Funcionamiento
```bash
# Estado del servicio
sudo systemctl status foundit-tunnel

# Logs
sudo journalctl -u foundit-tunnel -f

# Test desde Mac
ssh root@157.230.185.25 "curl --proxy http://localhost:8118 ifconfig.me"
```

## 🎯 VENTAJAS vs WINDOWS PC

### Consumo Energético
- **Pi 4**: ~$1/mes electricidad
- **PC Windows**: ~$10-20/mes electricidad

### Estabilidad
- **Pi 4**: Meses sin reiniciar
- **PC Windows**: Updates semanales

### Simplicidad
- **Pi 4**: 1 servicio systemd
- **PC Windows**: WSL + Scripts + Startup

## 🔧 MONITOREO

### Script de Health Check
```bash
#!/bin/bash
# /home/pi/check-tunnel.sh

VPS_IP="157.230.185.25"
EXPECTED_IP="143.105.21.56" # Tu IP Starlink

CURRENT_IP=$(ssh root@$VPS_IP "curl -s --proxy http://localhost:8118 ifconfig.me")

if [ "$CURRENT_IP" != "$EXPECTED_IP" ]; then
    echo "Tunnel down! Restarting..."
    sudo systemctl restart foundit-tunnel
else
    echo "Tunnel OK - IP: $CURRENT_IP"
fi
```

### Cron para monitoreo
```bash
# Agregar a crontab
crontab -e

# Verificar cada 5 minutos
*/5 * * * * /home/pi/check-tunnel.sh >> /home/pi/tunnel.log 2>&1
```

## 📊 COMPARACIÓN FINAL

| Feature | PC Windows | Raspberry Pi 4 |
|---------|------------|----------------|
| **Setup** | 2-3 horas | 30 minutos |
| **Consumo** | 100W+ | 5-10W |
| **Costo/mes** | $10-20 | $1 |
| **Estabilidad** | Media | Alta |
| **Mantenimiento** | Alto | Mínimo |
| **Auto-start** | Complejo | Simple |

## 🚀 MIGRACIÓN DESDE PC

1. **Mantén PC funcionando** hasta que Pi esté listo
2. **Configura Pi** siguiendo esta guía
3. **Test completo** con yt-dlp
4. **Apaga túnel en PC** cuando Pi funcione
5. **Celebra** el ahorro de energía!

---

**Tiempo estimado**: 30 minutos
**Dificultad**: Fácil
**Resultado**: Túnel SSH ultra-estable 24/7