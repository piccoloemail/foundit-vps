# Tunnel Auto-Start - Configuración Automática

**Propósito:** Configurar el SSH tunnel para que inicie automáticamente cuando Windows arranca.

## 🎯 CONFIGURACIÓN AUTOMÁTICA

### Método 1: Scripts Windows Startup (Recomendado)

#### 1. Script para iniciar Squid
```batch
@echo off
REM tunnel-start-squid.bat
echo Iniciando Squid proxy...
wsl sudo systemctl start squid
wsl sudo systemctl status squid
echo Squid iniciado correctamente
```

#### 2. Script para iniciar tunnel SSH
```batch
@echo off
REM tunnel-start-ssh.bat
echo Iniciando SSH tunnel...
ssh -i %USERPROFILE%\.ssh\vps_tunnel -R 8118:localhost:8118 root@157.230.185.25 -N
```

#### 3. Script maestro
```batch
@echo off
REM tunnel-start-all.bat
echo ============================================
echo Iniciando FoundIt.at SSH Tunnel System
echo ============================================

echo [1/3] Verificando SSH Server...
net start sshd

echo [2/3] Iniciando Squid proxy en WSL...
start "Squid" /min cmd /c "wsl sudo systemctl start squid && echo Squid OK && pause"

echo [3/3] Esperando 10 segundos...
timeout /t 10

echo [4/3] Iniciando SSH tunnel...
start "SSH Tunnel" /min cmd /c "ssh -i %USERPROFILE%\.ssh\vps_tunnel -R 8118:localhost:8118 root@157.230.185.25 -N"

echo ============================================
echo Sistema iniciado. Verificando en 15 segundos...
echo ============================================
timeout /t 15

echo Verificando funcionamiento...
ssh root@157.230.185.25 "curl --proxy http://localhost:8118 ifconfig.me"

pause
```

### Método 2: Tareas Programadas Windows

#### Crear tarea para Squid
```batch
schtasks /create /tn "FoundIt-Squid" /tr "wsl sudo systemctl start squid" /sc onstart /ru %USERNAME%
```

#### Crear tarea para SSH Tunnel
```batch
schtasks /create /tn "FoundIt-Tunnel" /tr "ssh -i %USERPROFILE%\.ssh\vps_tunnel -R 8118:localhost:8118 root@157.230.185.25 -N" /sc onstart /ru %USERNAME% /delay 0001:00
```

### Método 3: WSL systemd (Más avanzado)

#### 1. Habilitar systemd en WSL
```bash
# En WSL, editar wsl.conf
sudo nano /etc/wsl.conf

# Agregar:
[boot]
systemd=true
```

#### 2. Crear servicio para tunnel
```bash
# En WSL
sudo nano /etc/systemd/system/foundit-tunnel.service

[Unit]
Description=FoundIt SSH Tunnel
After=network.target

[Service]
Type=simple
User=robce
ExecStart=/usr/bin/ssh -i /home/robce/.ssh/vps_tunnel -R 8118:localhost:8118 root@157.230.185.25 -N
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 3. Habilitar servicios
```bash
# Habilitar Squid automático
sudo systemctl enable squid

# Habilitar tunnel automático
sudo systemctl enable foundit-tunnel
```

## 🔧 INSTALACIÓN PASO A PASO

### Opción Rápida: Scripts Batch

#### 1. Crear directorio de scripts
```batch
mkdir C:\FoundIt\scripts
cd C:\FoundIt\scripts
```

#### 2. Crear tunnel-start-all.bat
```batch
notepad tunnel-start-all.bat
# Copiar el script maestro de arriba
```

#### 3. Agregar a Windows Startup
```batch
# Copiar a carpeta de inicio
copy tunnel-start-all.bat "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\"

# O crear acceso directo
mklink "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\FoundIt-Tunnel.lnk" "C:\FoundIt\scripts\tunnel-start-all.bat"
```

### Opción Avanzada: Task Scheduler

#### 1. Abrir Task Scheduler
```batch
taskschd.msc
```

#### 2. Crear tarea básica
- **Name**: FoundIt SSH Tunnel
- **Trigger**: At startup
- **Action**: Start a program
- **Program**: C:\FoundIt\scripts\tunnel-start-all.bat
- **Settings**: 
  - Run whether user is logged on or not
  - Run with highest privileges

## ⚠️ CONSIDERACIONES IMPORTANTES

### Seguridad SSH Keys
```bash
# Verificar permisos SSH key
icacls %USERPROFILE%\.ssh\vps_tunnel

# Debería ser solo para tu usuario
%USERPROFILE%\.ssh\vps_tunnel BUILTIN\Administrators:(F) [USERNAME]:(F)
```

### Monitoreo automático
```batch
@echo off
REM tunnel-health-check.bat
echo Verificando estado del tunnel...

ssh root@157.230.185.25 "curl -s --proxy http://localhost:8118 ifconfig.me" > tunnel-ip.txt

set /p TUNNEL_IP=<tunnel-ip.txt
echo IP detectada: %TUNNEL_IP%

if "%TUNNEL_IP%"=="143.105.21.56" (
    echo ✅ Tunnel funcionando correctamente
) else (
    echo ❌ Tunnel caído, reiniciando...
    taskkill /f /im ssh.exe
    timeout /t 5
    start "SSH Tunnel" /min cmd /c "ssh -i %USERPROFILE%\.ssh\vps_tunnel -R 8118:localhost:8118 root@157.230.185.25 -N"
)
```

### Logging
```batch
@echo off
REM Con logging
echo [%DATE% %TIME%] Iniciando tunnel... >> C:\FoundIt\logs\tunnel.log
ssh -i %USERPROFILE%\.ssh\vps_tunnel -R 8118:localhost:8118 root@157.230.185.25 -N 2>> C:\FoundIt\logs\tunnel-error.log
```

## 🔄 TESTING Y VERIFICACIÓN

### Test manual del auto-start
```batch
# 1. Reiniciar PC
shutdown /r /t 0

# 2. Después del reinicio, verificar
# - ¿SSH Server corriendo?
net start | findstr sshd

# - ¿Squid corriendo en WSL?
wsl sudo systemctl status squid

# - ¿Tunnel SSH activo?
tasklist | findstr ssh

# - ¿Funcionamiento correcto?
ssh root@157.230.185.25 "curl --proxy http://localhost:8118 ifconfig.me"
```

### Troubleshooting común
```batch
# Si WSL no inicia automáticamente
wsl --shutdown
wsl --set-default Ubuntu

# Si Squid no inicia
wsl sudo systemctl restart squid

# Si SSH tunnel falla
ssh-add %USERPROFILE%\.ssh\vps_tunnel
```

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] **Scripts creados** en C:\FoundIt\scripts\
- [ ] **Permisos SSH** configurados correctamente
- [ ] **Windows Startup** configurado (batch o task)
- [ ] **Logging** habilitado para troubleshooting
- [ ] **Health check** script funcionando
- [ ] **Test completo** post-reinicio
- [ ] **Backup manual** documentado

## 🎯 RECOMENDACIÓN

**Para FoundIt.at, recomiendo:**

1. **Corto plazo**: Script batch en Windows Startup (fácil)
2. **Mediano plazo**: Task Scheduler con health checks
3. **Largo plazo**: Migración a MikroTik (más confiable)

¿Quieres que implemente la **Opción Rápida** primero para que tengas auto-start inmediato?