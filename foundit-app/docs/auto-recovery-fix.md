# 🔧 Auto-Recuperación SSH Tunnel - Verdadera Auto-Reparación

**Problema actual:** Cuando el Pi cambia de IP, autossh detecta la desconexión y trata de reconectar, pero el puerto 8118 en el VPS queda ocupado por el proceso SSH anterior. Esto requiere intervención manual (`kill PID`).

**Objetivo:** Implementar verdadera auto-recuperación sin intervención manual.

## 🎯 SOLUCIÓN 1: SSH Timeouts Agresivos en VPS

### 1. Configurar SSH Server en VPS para timeouts cortos

```bash
# En VPS: Editar /etc/ssh/sshd_config
sudo nano /etc/ssh/sshd_config

# Agregar configuraciones agresivas de timeout
ClientAliveInterval 15
ClientAliveCountMax 2
TCPKeepAlive yes
```

**Efecto:** SSH server mata conexiones muertas en 30 segundos (15 × 2).

### 2. Reiniciar SSH service
```bash
sudo systemctl restart sshd
```

## 🔧 SOLUCIÓN 2: Script de Limpieza Automática en VPS

### 1. Crear script cleanup en VPS
```bash
sudo nano /usr/local/bin/cleanup-ssh-tunnels.sh
```

```bash
#!/bin/bash
# cleanup-ssh-tunnels.sh - Limpia túneles SSH colgados

LOG_FILE="/var/log/ssh-tunnel-cleanup.log"

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Función para limpiar puerto 8118
cleanup_port_8118() {
    local processes=$(ss -tulpn | grep :8118 | awk '{print $7}' | grep -o '[0-9]*' | head -1)
    
    if [ ! -z "$processes" ]; then
        log_message "Puerto 8118 ocupado por proceso: $processes"
        
        # Matar proceso que usa puerto 8118
        for pid in $processes; do
            if kill -9 "$pid" 2>/dev/null; then
                log_message "Proceso $pid eliminado exitosamente"
            else
                log_message "Error al eliminar proceso $pid"
            fi
        done
        
        # Verificar que puerto está libre
        sleep 2
        if ! ss -tulpn | grep -q :8118; then
            log_message "Puerto 8118 liberado exitosamente"
            return 0
        else
            log_message "ERROR: Puerto 8118 sigue ocupado"
            return 1
        fi
    else
        log_message "Puerto 8118 ya está libre"
        return 0
    fi
}

# Ejecutar limpieza
cleanup_port_8118

# Log estadísticas
log_message "Limpieza completada - Procesos SSH activos: $(ps aux | grep -c '[s]sh.*8118')"
```

### 2. Hacer ejecutable
```bash
sudo chmod +x /usr/local/bin/cleanup-ssh-tunnels.sh
```

### 3. Probar script
```bash
sudo /usr/local/bin/cleanup-ssh-tunnels.sh
```

## 🔄 SOLUCIÓN 3: Modificar Servicio Pi con Pre-Limpieza

### 1. Actualizar servicio systemd en Pi
```bash
sudo nano /etc/systemd/system/foundit-tunnel.service
```

```ini
[Unit]
Description=FoundIt SSH Tunnel to VPS
After=network.target

[Service]
Type=simple
User=admin
# PRE-LIMPIEZA: Limpiar puerto en VPS antes de conectar
ExecStartPre=/usr/bin/ssh -i /home/admin/.ssh/vps_tunnel root@157.230.185.25 '/usr/local/bin/cleanup-ssh-tunnels.sh'
# CONEXIÓN: Establecer túnel
ExecStart=/usr/bin/autossh -M 0 -N -o "ServerAliveInterval 30" -o "ServerAliveCountMax 3" -o "ExitOnForwardFailure=yes" -i /home/admin/.ssh/vps_tunnel -R 8118:localhost:8118 root@157.230.185.25
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. Recargar y reiniciar servicio
```bash
sudo systemctl daemon-reload
sudo systemctl restart foundit-tunnel
```

## 🕐 SOLUCIÓN 4: Cron Job de Mantenimiento en VPS

### 1. Crear cron job en VPS para limpieza periódica
```bash
sudo crontab -e

# Limpiar túneles colgados cada 5 minutos
*/5 * * * * /usr/local/bin/cleanup-ssh-tunnels.sh >/dev/null 2>&1
```

## 🔍 SOLUCIÓN 5: Monitoreo Inteligente en Pi

### 1. Script de health check en Pi
```bash
sudo nano /home/admin/tunnel-health-check.sh
```

```bash
#!/bin/bash
# tunnel-health-check.sh - Verifica y repara túnel

VPS_IP="157.230.185.25"
EXPECTED_IP="143.105.21.56"  # IP de Starlink
LOG_FILE="/home/admin/tunnel-health.log"

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Test 1: ¿Funciona el proxy?
test_proxy() {
    local result=$(ssh -i ~/.ssh/vps_tunnel root@$VPS_IP "curl -s --connect-timeout 10 --proxy http://localhost:8118 ifconfig.me" 2>/dev/null)
    
    if [ "$result" = "$EXPECTED_IP" ]; then
        log_message "✅ Proxy funcionando - IP: $result"
        return 0
    else
        log_message "❌ Proxy no funciona - IP: $result (esperaba: $EXPECTED_IP)"
        return 1
    fi
}

# Reparar túnel
repair_tunnel() {
    log_message "🔧 Iniciando reparación de túnel..."
    
    # 1. Limpiar puerto en VPS
    ssh -i ~/.ssh/vps_tunnel root@$VPS_IP '/usr/local/bin/cleanup-ssh-tunnels.sh'
    
    # 2. Reiniciar servicio local
    sudo systemctl restart foundit-tunnel
    
    # 3. Esperar 15 segundos
    sleep 15
    
    # 4. Verificar reparación
    if test_proxy; then
        log_message "✅ Túnel reparado exitosamente"
        return 0
    else
        log_message "❌ Fallo en reparación de túnel"
        return 1
    fi
}

# Ejecutar test
if ! test_proxy; then
    repair_tunnel
fi
```

### 2. Hacer ejecutable
```bash
chmod +x /home/admin/tunnel-health-check.sh
```

### 3. Agregar a cron en Pi
```bash
crontab -e

# Health check cada 2 minutos
*/2 * * * * /home/admin/tunnel-health-check.sh
```

## 📋 IMPLEMENTACIÓN COMPLETA

### Comandos para implementar todo:

#### En VPS:
```bash
# 1. SSH timeouts agresivos
sudo nano /etc/ssh/sshd_config
# Agregar: ClientAliveInterval 15, ClientAliveCountMax 2
sudo systemctl restart sshd

# 2. Script de limpieza
sudo nano /usr/local/bin/cleanup-ssh-tunnels.sh
# [Copiar script completo de arriba]
sudo chmod +x /usr/local/bin/cleanup-ssh-tunnels.sh

# 3. Cron job de mantenimiento
sudo crontab -e
# Agregar: */5 * * * * /usr/local/bin/cleanup-ssh-tunnels.sh >/dev/null 2>&1
```

#### En Raspberry Pi:
```bash
# 1. Actualizar servicio con pre-limpieza
sudo nano /etc/systemd/system/foundit-tunnel.service
# [Agregar ExecStartPre]
sudo systemctl daemon-reload

# 2. Script health check
nano /home/admin/tunnel-health-check.sh
# [Copiar script completo]
chmod +x /home/admin/tunnel-health-check.sh

# 3. Cron job de monitoreo
crontab -e
# Agregar: */2 * * * * /home/admin/tunnel-health-check.sh
```

## ✅ RESULTADO ESPERADO

**Antes:** 
- Cambio de IP → Túnel muerto → Intervención manual requerida

**Después:**
- Cambio de IP → Túnel muerto → Auto-limpieza en 15-30 segundos → Túnel restaurado automáticamente

## 🧪 TESTING

### 1. Simular fallo desconectando Pi del WiFi
```bash
# En Pi
sudo systemctl stop foundit-tunnel
```

### 2. Verificar que el puerto queda ocupado en VPS
```bash
# En Mac
ssh root@157.230.185.25 'ss -tulpn | grep :8118'
```

### 3. Reconectar Pi y verificar auto-recuperación
```bash
# En Pi
sudo systemctl start foundit-tunnel

# Esperar 30 segundos y verificar
ssh root@157.230.185.25 "curl --proxy http://localhost:8118 ifconfig.me"
```

## 🌐 SOLUCIÓN 6: Cambio de IP del Pi (IP Mobility)

### Problema: IP del Pi cambia, VPS no lo sabe

Cuando Pi cambia de 192.168.1.184 → 192.168.1.36, el túnel se rompe porque:
1. Pi intenta reconectar desde nueva IP
2. VPS no tiene problema (es servidor)
3. Pi health check detecta problema
4. **PERO** Pi necesita notificar nueva IP

### Solución A: Dynamic DNS (DuckDNS)

#### 1. Setup DuckDNS en Pi
```bash
# En Pi - Crear script DuckDNS
sudo nano /home/admin/update-duckdns.sh
```

```bash
#!/bin/bash
# update-duckdns.sh
DOMAIN="founditpi"  # founditpi.duckdns.org
TOKEN="TU-TOKEN-DUCKDNS"  # Obtener de duckdns.org
LOG_FILE="/home/admin/duckdns.log"

# Obtener IP actual del Pi
CURRENT_IP=$(curl -s ifconfig.me)

# Actualizar DuckDNS
RESPONSE=$(curl -s "https://www.duckdns.org/update?domains=$DOMAIN&token=$TOKEN&ip=$CURRENT_IP")

echo "$(date '+%Y-%m-%d %H:%M:%S') - IP: $CURRENT_IP - Response: $RESPONSE" >> "$LOG_FILE"

if [ "$RESPONSE" = "OK" ]; then
    echo "✅ DuckDNS actualizado: $DOMAIN.duckdns.org → $CURRENT_IP"
else
    echo "❌ Error actualizando DuckDNS: $RESPONSE"
fi
```

#### 2. Cron job para DuckDNS
```bash
# En Pi
chmod +x /home/admin/update-duckdns.sh
crontab -e

# Actualizar cada 5 minutos
*/5 * * * * /home/admin/update-duckdns.sh
```

### Solución B: IP Notifier al VPS

#### 1. Script notificador en Pi
```bash
sudo nano /home/admin/notify-ip-change.sh
```

```bash
#!/bin/bash
# notify-ip-change.sh
CURRENT_IP=$(ip route get 8.8.8.8 | awk '{print $7}' | head -1)
LAST_IP_FILE="/home/admin/.last_local_ip"
VPS_IP="157.230.185.25"

# Leer última IP conocida
if [ -f "$LAST_IP_FILE" ]; then
    LAST_IP=$(cat "$LAST_IP_FILE")
else
    LAST_IP=""
fi

# Si cambió la IP local
if [ "$CURRENT_IP" != "$LAST_IP" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - IP cambió de $LAST_IP a $CURRENT_IP" >> /home/admin/ip-change.log
    
    # Guardar nueva IP
    echo "$CURRENT_IP" > "$LAST_IP_FILE"
    
    # Notificar al VPS la nueva IP del Pi
    ssh -i ~/.ssh/vps_tunnel root@$VPS_IP "echo 'Pi new local IP: $CURRENT_IP' >> /var/log/pi-ips.log"
    
    # Reiniciar túnel para forzar reconexión desde nueva IP
    sudo systemctl restart foundit-tunnel
    
    echo "✅ Túnel reiniciado desde nueva IP: $CURRENT_IP"
fi
```

#### 2. Cron job cada minuto
```bash
chmod +x /home/admin/notify-ip-change.sh
crontab -e

# Detectar cambio IP cada minuto
* * * * * /home/admin/notify-ip-change.sh
```

### Solución C: Tailscale (Recomendada)

#### Setup en Pi y VPS
```bash
# En Pi
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# En VPS  
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Obtener IPs fijas Tailscale
tailscale ip
# Pi: 100.101.102.103
# VPS: 100.101.102.104
```

#### Modificar servicio para usar Tailscale
```bash
# En Pi - Usar IP Tailscale del VPS
sudo nano /etc/systemd/system/foundit-tunnel.service

# Cambiar:
# ExecStart=... root@157.230.185.25
# Por:
# ExecStart=... root@100.101.102.104
```

## 🔄 IMPLEMENTACIÓN COMPLETA PARA CAMBIO IP

### Opción 1: IP Notifier (Rápido)
```bash
# En Pi - Script detector de cambio IP
nano /home/admin/notify-ip-change.sh
# [Script completo arriba]
chmod +x /home/admin/notify-ip-change.sh

# Cron job cada minuto
echo "* * * * * /home/admin/notify-ip-change.sh" | crontab -
```

### Opción 2: Tailscale (Mejor)
```bash
# En Pi
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# En VPS
ssh root@157.230.185.25 "curl -fsSL https://tailscale.com/install.sh | sh"
ssh root@157.230.185.25 "tailscale up"

# Actualizar servicio en Pi para usar IP Tailscale
# sudo nano /etc/systemd/system/foundit-tunnel.service
# Cambiar IP por la Tailscale del VPS
```

## ✅ RESULTADO FINAL

**Con IP Notifier:**
- Pi cambia IP → Detectado en 1 minuto → VPS notificado → Túnel reiniciado

**Con Tailscale:**
- Pi cambia IP → No importa → IP Tailscale fija → Túnel sigue funcionando

**Recomendación:** Tailscale es la mejor solución para true IP mobility.

**Con esta implementación, el sistema será verdaderamente auto-reparable como prometimos originalmente, incluyendo cambios de IP del Pi.**