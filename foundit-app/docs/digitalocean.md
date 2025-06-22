# DigitalOcean VPS Setup - BJC Production Server

**Fecha de creación:** 20 Junio 2025  
**Propósito:** Servidor de producción para múltiples proyectos (FoundIt.at, N8N, etc.)

## 📧 **Información de Cuenta**

**Email:** piccoloemail@gmail.com  
**Plan:** DigitalOcean Personal Account  
**Billing:** $32/mes + transfer costs

## 🖥️ **Especificaciones del VPS**

### **Droplet Details:**
- **Name:** `bjc-prod-01`
- **Plan:** Premium Intel - $32/mes
- **CPU:** 2 Intel vCPUs
- **RAM:** 4GB
- **Storage:** 120GB NVMe SSD
- **Transfer:** 4TB bandwidth incluido
- **OS:** Ubuntu 22.04 LTS
- **Region:** New York (NYC1) - Recommended for AssemblyAI latency

### **Network & Access:**
- **IPv4:** 157.230.185.25
- **IPv6:** Enabled
- **Firewall:** Default (SSH port 22, HTTP 80, HTTPS 443)
- **Authentication:** SSH Key + Password backup

## 🔑 **SSH Access**

### **SSH Key Information:**
- **Key Name:** Mac Mini
- **Key Type:** ed25519 (más seguro que RSA)
- **Created:** 20 Junio 2025
- **Device:** Brandon's Mac Mini M1

### **Public Key:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL4VPHWFvUo0FEHe2Kdzbw/wdaTuaT5zX3aDdNMAZOwD bjc@foundit.at
```

### **Private Key Location:**
- **Mac Mini:** `~/.ssh/id_ed25519`
- **Usage:** `ssh root@[server-ip]`

## 🛡️ **Security Setup**

### **Recommended Post-Deploy:**
- [ ] Create non-root user with sudo privileges
- [ ] Configure UFW firewall
- [ ] Set up fail2ban for SSH protection
- [ ] Configure automatic security updates
- [ ] Set up backup schedule

### **Ports to Open:**
- **22** - SSH (Default)
- **80** - HTTP (For Let's Encrypt)
- **443** - HTTPS (Web traffic)
- **5678** - N8N (Internal/VPN only)
- **3000** - Next.js development (if needed)

## 🐳 **Planned Software Stack**

### **Core Infrastructure:**
- **Docker** + **Docker Compose**
- **Nginx** (Reverse proxy)
- **Let's Encrypt** (SSL certificates)
- **UFW** (Firewall)

### **Applications:**
- **N8N** (Workflow automation)
- **PostgreSQL** (Database for N8N)
- **Redis** (Caching, if needed)
- **Node.js** (For any Node apps)

### **Monitoring:**
- **DigitalOcean Metrics** (Built-in)
- **Docker logs** via docker-compose
- **Nginx access logs**

## 📂 **Directory Structure Plan**

```
/opt/
├── n8n/
│   ├── docker-compose.yml
│   ├── .env
│   └── data/
├── foundit/
│   ├── docker-compose.yml
│   └── backups/
└── shared/
    ├── nginx/
    ├── ssl/
    └── scripts/
```

## 🔄 **Deployment Plan**

### **Phase 1: Basic Setup**
1. Deploy VPS with SSH key
2. Install Docker + Docker Compose
3. Set up basic firewall
4. Create non-root user

### **Phase 2: N8N Setup**
1. Deploy N8N with PostgreSQL
2. Import existing workflow
3. Test AssemblyAI integration
4. Configure persistent storage

### **Phase 3: Domain & SSL**
1. Point subdomain to VPS IP
2. Set up Nginx reverse proxy
3. Configure Let's Encrypt SSL
4. Test N8N webhook access

### **Phase 4: FoundIt.at Integration**
1. Update .env with new N8N URL
2. Test production workflow
3. Monitor performance
4. Set up backups

## 💰 **Cost Breakdown**

### **Monthly Costs:**
- **VPS:** $32.00/mes
- **Bandwidth:** $0 (4TB incluido)
- **Backups:** $3.20/mes (10% of droplet cost)
- **AssemblyAI:** Variable (~$10-50/mes depending on usage)

### **Total Estimated:** $45-85/mes

## 🌐 **Domain Configuration**

### **Subdomain Plan:**
- **n8n.foundit.at** → N8N interface
- **api.foundit.at** → API endpoints
- **admin.foundit.at** → Admin tools

### **DNS Records to Add:**
```
Type    Name    Value           TTL
A       n8n     [VPS-IP]        300
A       api     [VPS-IP]        300
A       admin   [VPS-IP]        300
```

## 🔧 **Initial Commands (Post-Deploy)**

### **First Login:**
```bash
ssh root@[server-ip]
```

### **Basic Setup:**
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Create non-root user
adduser bjc
usermod -aG docker bjc
usermod -aG sudo bjc

# Copy SSH keys
cp -r ~/.ssh /home/bjc/
chown -R bjc:bjc /home/bjc/.ssh
```

## 📝 **Notes**

### **For Future Reference:**
- Server optimizado para múltiples proyectos
- N8N será el primer workload crítico
- Escalabilidad: Puede upgrade a $48/mes (8GB) si necesario
- Location NYC optimizado para AssemblyAI US East
- SSH key está respaldada en APIs file

### **Emergency Access:**
Si pierdes SSH key, puedes usar DigitalOcean Console Access desde el panel web.

### **Next Steps After Deployment:**
1. Document server IP address
2. Test SSH connection
3. Begin N8N setup
4. Update FoundIt.at configuration

---

**Status:** Ready for deployment
**Owner:** Brandon (BJC)
**Contact:** piccoloemail@gmail.com