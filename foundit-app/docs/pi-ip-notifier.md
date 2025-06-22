# Raspberry Pi - Notificador de Cambio de IP

## 🎯 Script Simple de Notificación

### 1. Crear script en Pi
```bash
sudo nano /home/admin/notify-ip-change.sh
```

```bash
#!/bin/bash
# notify-ip-change.sh

# Obtener IP actual
CURRENT_IP=$(curl -s ifconfig.me)
LAST_IP_FILE="/home/admin/.last_ip"
VPS_IP="157.230.185.25"

# Leer última IP conocida
if [ -f "$LAST_IP_FILE" ]; then
    LAST_IP=$(cat "$LAST_IP_FILE")
else
    LAST_IP=""
fi

# Si cambió la IP
if [ "$CURRENT_IP" != "$LAST_IP" ]; then
    echo "IP cambió de $LAST_IP a $CURRENT_IP"
    
    # Guardar nueva IP
    echo "$CURRENT_IP" > "$LAST_IP_FILE"
    
    # Notificar al VPS
    ssh -i /home/admin/.ssh/vps_tunnel root@$VPS_IP "echo 'Pi new IP: $CURRENT_IP' >> /var/log/pi-ips.log"
    
    # Opcional: Enviar email o webhook
    # curl -X POST https://tu-webhook.com/notify -d "ip=$CURRENT_IP"
fi
```

### 2. Hacer ejecutable
```bash
chmod +x /home/admin/notify-ip-change.sh
```

### 3. Agregar a cron (cada 5 minutos)
```bash
crontab -e

# Agregar:
*/5 * * * * /home/admin/notify-ip-change.sh
```

## 🌐 Opción DDNS Completa

### 1. Registrarse en DuckDNS
- Ir a https://www.duckdns.org
- Login con GitHub/Google
- Crear subdominio: `founditpi`
- Obtener token

### 2. Configurar en Pi
```bash
# Crear directorio
mkdir ~/duckdns
cd ~/duckdns

# Crear script
nano duck.sh
```

```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=founditpi&token=TU-TOKEN&ip=" | curl -k -o duck.log -K -
```

### 3. Cron para actualizar
```bash
crontab -e

# Actualizar cada 5 minutos
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

### 4. En el VPS, usar dominio
```bash
# En lugar de IP fija
ssh admin@founditpi.duckdns.org
```

## 🚀 Solución Más Robusta: Tailscale

### Instalar Tailscale (VPN mesh)
```bash
# En Pi y VPS
curl -fsSL https://tailscale.com/install.sh | sh

# Autenticar
sudo tailscale up

# Obtener IP fija de Tailscale
tailscale ip
# Ej: 100.101.102.103
```

**Ventajas:**
- IP fija en red privada
- Funciona detrás de cualquier NAT
- Gratis para uso personal
- Super fácil

## 📱 Para Starlink Móvil

Si mueves el Pi entre ubicaciones con Starlink:

### Script de reconexión automática
```bash
#!/bin/bash
# /home/admin/check-tunnel.sh

# Si el túnel está caído
if ! ssh -O check -i /home/admin/.ssh/vps_tunnel root@157.230.185.25 2>/dev/null; then
    echo "Tunnel caído, reiniciando..."
    sudo systemctl restart foundit-tunnel
    
    # Notificar nueva IP
    sleep 10
    /home/admin/notify-ip-change.sh
fi
```

## 🎯 RECOMENDACIÓN

Para tu caso, sugiero:

1. **Corto plazo**: Script notificador simple
2. **Mediano plazo**: DuckDNS para dominio fijo
3. **Largo plazo**: Tailscale para red mesh

¿Cuál opción te parece mejor? El script simple toma 5 minutos configurarlo.