# WSL (Windows Subsystem for Linux) - Guía Básica

**Propósito:** Comandos esenciales para trabajar con WSL Ubuntu en Windows para el proyecto FoundIt.at.

## 🚀 INSTALACIÓN Y CONFIGURACIÓN INICIAL

### Instalar WSL
```bash
# En PowerShell como Administrador
wsl --install

# Si falla, habilitar características manualmente
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Reiniciar PC y volver a intentar
wsl --install
```

### Habilitar Developer Mode (para sudo)
1. **Windows Settings** → **Privacy & Security** → **For developers** 
2. **Enable Developer Mode**
3. Reiniciar WSL

### Primera configuración
```bash
# Crear usuario (durante instalación)
# Username: robce
# Password: [tu password]

# Actualizar sistema
sudo apt update && sudo apt upgrade -y
```

## 🔧 COMANDOS BÁSICOS DE WSL

### Acceso y navegación
```bash
# Entrar a WSL desde Windows
wsl

# Entrar a WSL desde PowerShell/CMD
wsl -d Ubuntu

# Salir de WSL
exit

# Ver distribuciones instaladas
wsl --list

# Ver estado de WSL
wsl --status
```

### Gestión de archivos
```bash
# Ver archivos de Windows desde WSL
ls /mnt/c/Users/robce/

# Ir al directorio home de Windows
cd /mnt/c/Users/robce/

# Ver archivos WSL desde Windows
# Windows: \\wsl$\Ubuntu\home\robce\
```

### Servicios y procesos
```bash
# Ver servicios systemd
sudo systemctl --type=service

# Estado de un servicio
sudo systemctl status [service-name]

# Iniciar servicio
sudo systemctl start [service-name]

# Parar servicio
sudo systemctl stop [service-name]

# Reiniciar servicio
sudo systemctl restart [service-name]

# Habilitar inicio automático
sudo systemctl enable [service-name]
```

## 🔧 SQUID PROXY - COMANDOS ESPECÍFICOS

### Instalación
```bash
# Actualizar repositorios
sudo apt update

# Instalar Squid
sudo apt install squid -y
```

### Configuración
```bash
# Editar configuración
sudo nano /etc/squid/squid.conf

# Configuración mínima funcional:
http_port 8118
http_access allow all

# Guardar: Ctrl+X → Y → Enter
```

### Gestión del servicio
```bash
# Estado de Squid
sudo systemctl status squid

# Iniciar Squid
sudo systemctl start squid

# Parar Squid
sudo systemctl stop squid

# Reiniciar Squid
sudo systemctl restart squid

# Ver logs de Squid
sudo journalctl -u squid -f

# Verificar configuración
sudo squid -k parse
```

### Verificación de funcionamiento
```bash
# Ver puertos en uso
sudo netstat -tulpn | grep :8118
# O con ss:
sudo ss -tulpn | grep :8118

# Test local del proxy
curl --proxy http://localhost:8118 httpbin.org/ip

# Ver procesos Squid
ps aux | grep squid
```

## 🌐 COMANDOS DE RED Y CONECTIVIDAD

### Información de red
```bash
# Ver IP de WSL
ip addr show eth0

# Ver puertos abiertos
sudo netstat -tulpn
# O con ss (más moderno):
sudo ss -tulpn

# Test conectividad
ping google.com

# Test proxy externo
curl --proxy http://localhost:8118 ifconfig.me
```

### Diagnóstico de túneles SSH
```bash
# Ver conexiones SSH activas
ps aux | grep ssh

# Ver conexiones de red hacia VPS
netstat -an | grep 157.230.185.25

# Verificar redirección de puertos
sudo netstat -tlnp | grep :8118
```

## 📁 GESTIÓN DE ARCHIVOS Y DIRECTORIOS

### Navegación básica
```bash
# Directorio actual
pwd

# Listar archivos
ls -la

# Cambiar directorio
cd /path/to/directory

# Crear directorio
mkdir nombre_directorio

# Eliminar archivo
rm archivo.txt

# Eliminar directorio
rm -rf directorio/
```

### Edición de archivos
```bash
# Nano (editor simple)
nano archivo.txt
# Guardar: Ctrl+X → Y → Enter

# Ver contenido de archivo
cat archivo.txt

# Ver archivo con paginación
less archivo.txt

# Buscar en archivo
grep "texto" archivo.txt
```

### Permisos
```bash
# Ver permisos
ls -la archivo.txt

# Cambiar permisos
chmod 755 archivo.txt
chmod +x script.sh

# Cambiar propietario
sudo chown usuario:grupo archivo.txt
```

## 🛠️ INSTALACIÓN DE PAQUETES

### APT (gestor de paquetes)
```bash
# Actualizar lista de paquetes
sudo apt update

# Actualizar paquetes instalados
sudo apt upgrade

# Instalar paquete
sudo apt install nombre_paquete

# Buscar paquete
apt search nombre_paquete

# Información de paquete
apt show nombre_paquete

# Eliminar paquete
sudo apt remove nombre_paquete

# Eliminar paquete y configuración
sudo apt purge nombre_paquete

# Limpiar caché
sudo apt autoremove && sudo apt autoclean
```

### Paquetes útiles para FoundIt.at
```bash
# Herramientas de red
sudo apt install curl wget net-tools

# Herramientas de desarrollo
sudo apt install git nodejs npm python3 python3-pip

# Proxy y túneles
sudo apt install squid openssh-client

# Herramientas de monitoreo
sudo apt install htop tree
```

## 🔍 TROUBLESHOOTING WSL

### Problemas comunes
```bash
# WSL no inicia
wsl --shutdown
wsl

# Reiniciar servicio WSL
# En PowerShell como Admin:
Restart-Service LxssManager

# Reset completo de WSL
wsl --shutdown
wsl --unregister Ubuntu
wsl --install
```

### Problemas de permisos
```bash
# Si sudo no funciona
# Verificar Developer Mode en Windows Settings

# Problemas con systemctl
sudo systemctl --failed

# Verificar que systemd esté activo
systemctl is-system-running
```

### Problemas de red
```bash
# Reiniciar red en WSL
sudo service networking restart

# Verificar DNS
nslookup google.com

# Configurar DNS manualmente si es necesario
sudo nano /etc/resolv.conf
# Agregar: nameserver 8.8.8.8
```

## 📊 MONITOREO Y LOGS

### Ver recursos del sistema
```bash
# Uso de CPU y memoria
htop

# Uso de disco
df -h

# Procesos activos
ps aux

# Ver logs del sistema
sudo journalctl -f

# Logs específicos de un servicio
sudo journalctl -u squid -f
```

### Archivos de configuración importantes
```bash
# Configuración Squid
/etc/squid/squid.conf

# Logs de Squid
/var/log/squid/

# Configuración SSH
/etc/ssh/sshd_config

# Resolución DNS
/etc/resolv.conf

# Configuración de red
/etc/netplan/
```

## 🚀 COMANDOS ESPECÍFICOS PARA FOUNDIT.AT

### Rutina diaria de inicio
```bash
# 1. Entrar a WSL
wsl

# 2. Verificar servicios
sudo systemctl status squid

# 3. Iniciar Squid si está parado
sudo systemctl start squid

# 4. Verificar funcionamiento
sudo ss -tulpn | grep :8118

# 5. Salir para establecer túnel SSH
exit
```

### Rutina de diagnóstico
```bash
# Verificar todo el stack
wsl
sudo systemctl status squid
curl --proxy http://localhost:8118 httpbin.org/ip
exit
```

### Rutina de limpieza
```bash
# Limpiar logs
sudo journalctl --vacuum-time=7d

# Limpiar paquetes
sudo apt autoremove && sudo apt autoclean

# Verificar espacio
df -h
```

## 📋 CHECKLIST WSL SALUDABLE

- [ ] **WSL inicia correctamente** (`wsl` funciona)
- [ ] **Developer Mode habilitado** (`sudo` funciona)
- [ ] **Squid instalado** (`systemctl status squid`)
- [ ] **Squid configurado** (puerto 8118, allow all)
- [ ] **Red funcional** (`ping google.com`)
- [ ] **Proxy funcional** (`curl --proxy localhost:8118`)

## ⚠️ TIPS IMPORTANTES

### Do's
- ✅ **Siempre usar sudo** para comandos administrativos
- ✅ **Verificar servicios** antes de usar
- ✅ **Usar systemctl** para gestionar servicios
- ✅ **Mantener sistema actualizado** (apt update/upgrade)

### Don'ts
- ❌ **No modificar archivos Windows** desde WSL
- ❌ **No instalar GUI apps** (usar terminal)
- ❌ **No usar comandos Windows** en WSL
- ❌ **No editar /etc/resolv.conf** directamente (se resetea)

---

**Última actualización:** 21 Junio 2025  
**WSL Version:** WSL 2  
**Ubuntu Version:** 22.04 LTS  
**Próxima revisión:** Según necesidades del proyecto