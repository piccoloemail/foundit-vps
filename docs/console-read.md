# Test si el t�nel sigue funcionando despu�s del cambio de IP
ssh root@157.230.185.25 "curl --proxy http://localhost:8118 ifconfig.me"

# Ver estado del servicio en el Pi
ssh admin@192.168.1.36 "sudo systemctl status foundit-tunnel"

# Ver logs recientes
ssh admin@192.168.1.36 "sudo journalctl -u foundit-tunnel --since '5 minutes ago'"

# Esperar 30 segundos y verificar status
sleep 30
ssh admin@192.168.1.36 "sudo systemctl status foundit-tunnel"

# Generar SSH key desde Mac para el Pi con nueva IP
ssh-keygen -t ed25519 -f ~/.ssh/pi_tunnel

# Copiar clave p�blica al Pi
ssh-copy-id -i ~/.ssh/pi_tunnel admin@192.168.1.36

# Test conexi�n sin password
ssh -i ~/.ssh/pi_tunnel admin@192.168.1.36 "sudo systemctl status foundit-tunnel"

# Ver logs detallados del error
ssh -i ~/.ssh/pi_tunnel admin@192.168.1.36 "sudo journalctl -u foundit-tunnel --since '10 minutes ago' -n 20"

# DESDE LA MAC - Ver procesos SSH en VPS que ocupan puerto 8118
ssh root@157.230.185.25 "ss -tulpn | grep :8118"

# DESDE LA MAC - Matar procesos SSH antiguos en VPS  
ssh root@157.230.185.25 "pkill -f '8118:localhost:8118'"

# Reiniciar servicio en Pi
ssh -i ~/.ssh/pi_tunnel admin@192.168.1.36 "sudo systemctl restart foundit-tunnel"

# TEST FINAL - Verificar t�nel funciona con nueva IP
ssh root@157.230.185.25 "curl --proxy http://localhost:8118 ifconfig.me"

# TEST FINAL - yt-dlp con proxy
ssh root@157.230.185.25 'HTTP_PROXY=http://127.0.0.1:8118 HTTPS_PROXY=http://127.0.0.1:8118 yt-dlp --get-title "https://www.youtube.com/watch?v=dQw4w9WgXcQ"'

# ========================================
# AUTO-RECUPERACI�N VERDADERA - IMPLEMENTACI�N
# ========================================

# PASO 1: VPS - SSH timeouts agresivos (elimina conexiones muertas en 30s)
ssh root@157.230.185.25 'echo "ClientAliveInterval 15" >> /etc/ssh/sshd_config'
ssh root@157.230.185.25 'echo "ClientAliveCountMax 2" >> /etc/ssh/sshd_config' 
ssh root@157.230.185.25 'echo "TCPKeepAlive yes" >> /etc/ssh/sshd_config'
ssh root@157.230.185.25 'systemctl restart sshd'

# PASO 2: VPS - Script limpieza autom�tica puerto 8118
ssh root@157.230.185.25 'cat > /usr/local/bin/cleanup-ssh-tunnels.sh << EOF
#!/bin/bash
LOG_FILE="/var/log/ssh-tunnel-cleanup.log"
log_message() { echo "$(date '"'"'+%Y-%m-%d %H:%M:%S'"'"') - $1" >> "$LOG_FILE"; }
cleanup_port_8118() {
    local processes=$(ss -tulpn | grep :8118 | awk '"'"'{print $7}'"'"' | grep -o '"'"'[0-9]*'"'"' | head -1)
    if [ ! -z "$processes" ]; then
        log_message "Puerto 8118 ocupado por proceso: $processes"
        for pid in $processes; do
            if kill -9 "$pid" 2>/dev/null; then
                log_message "Proceso $pid eliminado exitosamente"
            fi
        done
        sleep 2
        if ! ss -tulpn | grep -q :8118; then
            log_message "Puerto 8118 liberado exitosamente"
            return 0
        fi
    fi
}
cleanup_port_8118
EOF'

ssh root@157.230.185.25 'chmod +x /usr/local/bin/cleanup-ssh-tunnels.sh'

# PASO 3: VPS - Cron job limpieza cada 5 minutos  
ssh root@157.230.185.25 'echo "*/5 * * * * /usr/local/bin/cleanup-ssh-tunnels.sh >/dev/null 2>&1" | crontab -'

# PASO 4: Pi - Health check inteligente con auto-reparaci�n
ssh admin@192.168.1.36 'cat > /home/admin/tunnel-health-check.sh << EOF
#!/bin/bash
VPS_IP="157.230.185.25"
EXPECTED_IP="143.105.21.56"
LOG_FILE="/home/admin/tunnel-health.log"
log_message() { echo "$(date '"'"'+%Y-%m-%d %H:%M:%S'"'"') - $1" >> "$LOG_FILE"; }
test_proxy() {
    local result=$(ssh -i ~/.ssh/vps_tunnel root@$VPS_IP "curl -s --connect-timeout 10 --proxy http://localhost:8118 ifconfig.me" 2>/dev/null)
    if [ "$result" = "$EXPECTED_IP" ]; then
        log_message " Proxy funcionando - IP: $result"
        return 0
    else
        log_message "L Proxy no funciona - IP: $result"
        return 1
    fi
}
repair_tunnel() {
    log_message "=' Iniciando reparaci�n..."
    ssh -i ~/.ssh/vps_tunnel root@$VPS_IP '"'"'/usr/local/bin/cleanup-ssh-tunnels.sh'"'"'
    sudo systemctl restart foundit-tunnel
    sleep 15
    if test_proxy; then
        log_message " T�nel reparado"
    fi
}
if ! test_proxy; then
    repair_tunnel
fi
EOF'

ssh admin@192.168.1.36 'chmod +x /home/admin/tunnel-health-check.sh'

# PASO 5: Pi - Cron job health check cada 2 minutos
ssh admin@192.168.1.36 'echo "*/2 * * * * /home/admin/tunnel-health-check.sh" | crontab -'

# PASO 6: Pi - Actualizar servicio con pre-limpieza autom�tica
ssh admin@192.168.1.36 'sudo cp /etc/systemd/system/foundit-tunnel.service /etc/systemd/system/foundit-tunnel.service.backup'

ssh admin@192.168.1.36 'sudo cat > /etc/systemd/system/foundit-tunnel.service << EOF
[Unit]
Description=FoundIt SSH Tunnel to VPS
After=network.target

[Service]
Type=simple
User=admin
ExecStartPre=/usr/bin/ssh -i /home/admin/.ssh/vps_tunnel root@157.230.185.25 /usr/local/bin/cleanup-ssh-tunnels.sh
ExecStart=/usr/bin/autossh -M 0 -N -o "ServerAliveInterval 30" -o "ServerAliveCountMax 3" -o "ExitOnForwardFailure=yes" -i /home/admin/.ssh/vps_tunnel -R 8118:localhost:8118 root@157.230.185.25
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF'

ssh admin@192.168.1.36 'sudo systemctl daemon-reload'
ssh admin@192.168.1.36 'sudo systemctl restart foundit-tunnel'

# ========================================
# CAMBIO DE IP DEL PI - SOLUCIONES
# ========================================

# OPCI�N 1: IP Notifier (Detecta cambio IP y reinicia t�nel)
ssh admin@192.168.1.36 'cat > /home/admin/notify-ip-change.sh << EOF
#!/bin/bash
CURRENT_IP=$(ip route get 8.8.8.8 | awk '"'"'{print $7}'"'"' | head -1)
LAST_IP_FILE="/home/admin/.last_local_ip"
VPS_IP="157.230.185.25"

if [ -f "$LAST_IP_FILE" ]; then
    LAST_IP=$(cat "$LAST_IP_FILE")
else
    LAST_IP=""
fi

if [ "$CURRENT_IP" != "$LAST_IP" ]; then
    echo "$(date '"'"'+%Y-%m-%d %H:%M:%S'"'"') - IP cambi� de $LAST_IP a $CURRENT_IP" >> /home/admin/ip-change.log
    echo "$CURRENT_IP" > "$LAST_IP_FILE"
    ssh -i ~/.ssh/vps_tunnel root@$VPS_IP "echo '"'"'Pi new local IP: $CURRENT_IP'"'"' >> /var/log/pi-ips.log"
    sudo systemctl restart foundit-tunnel
    echo " T�nel reiniciado desde nueva IP: $CURRENT_IP"
fi
EOF'

ssh admin@192.168.1.36 'chmod +x /home/admin/notify-ip-change.sh'
ssh admin@192.168.1.36 'echo "* * * * * /home/admin/notify-ip-change.sh" | crontab -'

# OPCI�N 2: Tailscale (IP fija virtual - RECOMENDADA)
ssh admin@192.168.1.36 'curl -fsSL https://tailscale.com/install.sh | sh'
ssh admin@192.168.1.36 'sudo tailscale up'

ssh root@157.230.185.25 'curl -fsSL https://tailscale.com/install.sh | sh'
ssh root@157.230.185.25 'tailscale up'

# Ver IPs Tailscale asignadas
ssh admin@192.168.1.36 'tailscale ip'
ssh root@157.230.185.25 'tailscale ip'

# Actualizar servicio Pi para usar IP Tailscale del VPS
# ssh admin@192.168.1.36 'sudo nano /etc/systemd/system/foundit-tunnel.service'
# Cambiar 157.230.185.25 por la IP Tailscale del VPS (ej: 100.x.x.x)

# TEST FINAL - Auto-recuperaci�n completa implementada
ssh root@157.230.185.25 "curl --proxy http://localhost:8118 ifconfig.me"

# ========================================
# COMANDOS DE MONITOREO
# ========================================

# Ver logs de auto-recuperaci�n
ssh admin@192.168.1.36 'tail -f /home/admin/tunnel-health.log'

# Ver logs de cambio IP
ssh admin@192.168.1.36 'tail -f /home/admin/ip-change.log'

# Ver logs de limpieza VPS
ssh root@157.230.185.25 'tail -f /var/log/ssh-tunnel-cleanup.log'

# Estado completo del sistema
ssh admin@192.168.1.36 'sudo systemctl status foundit-tunnel'
ssh admin@192.168.1.36 'ps aux | grep autossh'
ssh root@157.230.185.25 'ss -tulpn | grep :8118'

# ========================================
# CONFIGURACIÓN N8N PARA USAR PROXY
# ========================================

# PASO 1: Acceder a N8N
# IMPORTANTE: Usar túnel SSH local para acceder a N8N
ssh -L 5678:localhost:5678 root@157.230.185.25
# Mantener esa terminal abierta y en navegador ir a:
# http://localhost:5678
# Usuario: admin / Password: [tu-password]

# PASO 2: Test manual yt-dlp con proxy en VPS
ssh root@157.230.185.25 'HTTP_PROXY=http://127.0.0.1:8118 HTTPS_PROXY=http://127.0.0.1:8118 yt-dlp --get-title "https://www.youtube.com/watch?v=dQw4w9WgXcQ"'

# PASO 3: Webhook de prueba para N8N
curl -X POST http://157.230.185.25:5678/webhook-test/youtube-transcript \
  -H "Content-Type: application/json" \
  -d '{
    "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "video_id": "dQw4w9WgXcQ", 
    "memory_id": "test-proxy-123"
  }'

# COMANDO ACTUALIZADO PARA NODOS N8N:
# Cambiar en Execute Command nodes de:
# yt-dlp [opciones] "{{$json.youtube_url}}"
# 
# A:
# HTTP_PROXY=http://127.0.0.1:8118 HTTPS_PROXY=http://127.0.0.1:8118 yt-dlp [opciones] "{{$json.youtube_url}}"

# ========================================
# SISTEMA COMPLETAMENTE DOCUMENTADO Y LISTO
# ========================================

# Ver documentación completa en:
# /docs/sistema-final-documentation.md
# /docs/n8n-proxy-setup-final.md