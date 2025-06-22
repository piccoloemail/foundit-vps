# RASPBERRY PI 4 - COMANDOS SETUP TUNNEL

# Conectar al Pi
ssh admin@192.168.1.184

# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar paquetes necesarios
sudo apt install squid autossh screen -y

# 3. Borrar configuración default de Squid (alternativa)
sudo mv /etc/squid/squid.conf /etc/squid/squid.conf.backup

# 4. Crear configuración simple
echo "http_port 8118" | sudo tee /etc/squid/squid.conf
echo "http_access allow all" | sudo tee -a /etc/squid/squid.conf

# 5. Reiniciar y habilitar Squid
sudo systemctl restart squid
sudo systemctl enable squid
sudo systemctl status squid

# 6. Generar SSH key para el VPS
ssh-keygen -t ed25519 -f ~/.ssh/vps_tunnel

# 7. Ver la clave pública
cat ~/.ssh/vps_tunnel.pub

# 8. Agregar clave al VPS (desde otra terminal en Mac)
ssh root@157.230.185.25 "echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBlOIjP/EDwv2qCWvTWjjsJXEooAMGRKPIi4mMRygTBF admin@tunnelSSH' >> ~/.ssh/authorized_keys"

# 9. Test conexión desde Pi
ssh -i ~/.ssh/vps_tunnel root@157.230.185.25 "echo Conexion exitosa"

# 10. Establecer túnel SSH manual
ssh -i ~/.ssh/vps_tunnel -R 8118:localhost:8118 root@157.230.185.25

# 11. En otra terminal de Mac, verificar el túnel
ssh root@157.230.185.25 "curl --proxy http://localhost:8118 ifconfig.me"

# 12. Salir del VPS (Ctrl+C o exit) y crear servicio systemd en Pi
sudo nano /etc/systemd/system/foundit-tunnel.service

[Unit]
Description=FoundIt SSH Tunnel to VPS
After=network.target

[Service]
Type=simple
User=admin
ExecStart=/usr/bin/autossh -M 0 -N -o "ServerAliveInterval 30" -o "ServerAliveCountMax 3" -o "ExitOnForwardFailure=yes" -i /home/admin/.ssh/vps_tunnel -R 8118:localhost:8118 root@157.230.185.25
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# 13. Habilitar y arrancar el servicio
sudo systemctl daemon-reload
sudo systemctl enable foundit-tunnel
sudo systemctl start foundit-tunnel

# 14. Verificar estado
sudo systemctl status foundit-tunnel

# 15. Ver logs
sudo journalctl -u foundit-tunnel -f

# 16. TEST FINAL desde Mac
ssh root@157.230.185.25 "curl --proxy http://localhost:8118 ifconfig.me"

# 17. Test con yt-dlp
ssh root@157.230.185.25 'HTTP_PROXY=http://127.0.0.1:8118 HTTPS_PROXY=http://127.0.0.1:8118 yt-dlp --get-title "https://www.youtube.com/watch?v=dQw4w9WgXcQ"'

# 18. TAILSCALE - Setup en Pi
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# 19. TAILSCALE - Setup en VPS
ssh root@157.230.185.25 "curl -fsSL https://tailscale.com/install.sh | sh"
ssh root@157.230.185.25 "tailscale up"

# 20. Ver IPs de Tailscale
tailscale status

# 21. IMPLEMENTAR AUTO-RECUPERACIÓN VERDADERA

# En VPS - Configurar SSH timeouts agresivos
ssh root@157.230.185.25
sudo nano /etc/ssh/sshd_config
# Agregar:
# ClientAliveInterval 15
# ClientAliveCountMax 2
# TCPKeepAlive yes
sudo systemctl restart sshd

# En VPS - Crear script de limpieza automática
sudo nano /usr/local/bin/cleanup-ssh-tunnels.sh
sudo chmod +x /usr/local/bin/cleanup-ssh-tunnels.sh

# En VPS - Agregar cron job de limpieza
sudo crontab -e
# Agregar: */5 * * * * /usr/local/bin/cleanup-ssh-tunnels.sh >/dev/null 2>&1

# En Pi - Actualizar servicio con pre-limpieza
sudo nano /etc/systemd/system/foundit-tunnel.service
# Agregar ExecStartPre antes de ExecStart:
# ExecStartPre=/usr/bin/ssh -i /home/admin/.ssh/vps_tunnel root@157.230.185.25 '/usr/local/bin/cleanup-ssh-tunnels.sh'
sudo systemctl daemon-reload
sudo systemctl restart foundit-tunnel

# En Pi - Crear health check inteligente
nano /home/admin/tunnel-health-check.sh
chmod +x /home/admin/tunnel-health-check.sh

# En Pi - Agregar cron job de monitoreo
crontab -e
# Agregar: */2 * * * * /home/admin/tunnel-health-check.sh

# TEST auto-recuperación completa
ssh root@157.230.185.25 "curl --proxy http://localhost:8118 ifconfig.me"