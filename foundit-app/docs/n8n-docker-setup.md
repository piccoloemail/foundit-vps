# N8N Docker Setup - Production VPS

**Server:** 157.230.185.25  
**Purpose:** N8N + PostgreSQL for FoundIt.at transcription workflow

## 🐳 **Docker Compose Configuration**

### **Directory Structure:**
```
/opt/n8n/
├── docker-compose.yml
├── .env
├── data/
│   ├── n8n/
│   └── postgres/
└── backups/
```

### **docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - n8n_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 3

  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_PORT: 5432
      DB_POSTGRESDB_DATABASE: ${POSTGRES_DB}
      DB_POSTGRESDB_USER: ${POSTGRES_USER}
      DB_POSTGRESDB_PASSWORD: ${POSTGRES_PASSWORD}
      N8N_BASIC_AUTH_ACTIVE: ${N8N_BASIC_AUTH_ACTIVE}
      N8N_BASIC_AUTH_USER: ${N8N_BASIC_AUTH_USER}
      N8N_BASIC_AUTH_PASSWORD: ${N8N_BASIC_AUTH_PASSWORD}
      N8N_HOST: ${N8N_HOST}
      N8N_PORT: 5678
      N8N_PROTOCOL: http
      WEBHOOK_URL: ${WEBHOOK_URL}
      GENERIC_TIMEZONE: America/New_York
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - n8n_network
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  n8n_data:
  postgres_data:

networks:
  n8n_network:
    driver: bridge
```

### **.env file:**
```bash
# Database Configuration
POSTGRES_DB=n8n
POSTGRES_USER=n8n
POSTGRES_PASSWORD=n8n_secure_password_2025

# N8N Configuration
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=admin_secure_password_2025
N8N_HOST=157.230.185.25
WEBHOOK_URL=http://157.230.185.25:5678
```

## 🚀 **Installation Commands**

### **1. Install Docker:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
docker --version
```

### **2. Install Docker Compose:**
```bash
apt install docker-compose-plugin -y
docker compose version
```

### **3. Create Directory Structure:**
```bash
mkdir -p /opt/n8n/data/n8n
mkdir -p /opt/n8n/data/postgres
mkdir -p /opt/n8n/backups
cd /opt/n8n
```

### **4. Create Configuration Files:**
```bash
# Create .env file
cat > .env << 'EOF'
POSTGRES_DB=n8n
POSTGRES_USER=n8n
POSTGRES_PASSWORD=n8n_secure_password_2025
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=admin_secure_password_2025
N8N_HOST=157.230.185.25
WEBHOOK_URL=http://157.230.185.25:5678
EOF

# Create docker-compose.yml (copy from above)
```

### **5. Start Services:**
```bash
docker compose up -d
docker compose ps
docker compose logs -f n8n
```

## 🔧 **Post-Installation**

### **Access N8N:**
- **URL:** http://157.230.185.25:5678
- **Username:** admin
- **Password:** admin_secure_password_2025

### **Import Workflow:**
1. Copy workflow from `/Users/bjc/Downloads/n8n-wf008.json`
2. Import via N8N interface
3. Test webhook: `http://157.230.185.25:5678/webhook/youtube-transcript`

### **Update FoundIt.at:**
```bash
# In .env.local
N8N_WEBHOOK_URL=http://157.230.185.25:5678/webhook/youtube-transcript
```

## 🛡️ **Security Configuration**

### **Firewall Setup:**
```bash
ufw allow 22/tcp      # SSH
ufw allow 5678/tcp    # N8N (temporary - should be behind proxy)
ufw enable
```

### **Basic Security:**
```bash
# Create non-root user
adduser bjc
usermod -aG docker bjc
usermod -aG sudo bjc

# Copy SSH keys
cp -r ~/.ssh /home/bjc/
chown -R bjc:bjc /home/bjc/.ssh
```

## 📊 **Monitoring & Maintenance**

### **Check Status:**
```bash
docker compose ps
docker compose logs n8n
docker compose logs postgres
```

### **Backup Database:**
```bash
docker compose exec postgres pg_dump -U n8n n8n > /opt/n8n/backups/n8n_$(date +%Y%m%d_%H%M%S).sql
```

### **Update N8N:**
```bash
docker compose pull
docker compose up -d
```

## 🔍 **Troubleshooting**

### **Common Issues:**
- **Port 5678 blocked:** Check UFW rules
- **Database connection:** Check postgres health
- **Webhook not working:** Verify WEBHOOK_URL in .env

### **Logs:**
```bash
# N8N logs
docker compose logs -f n8n

# PostgreSQL logs
docker compose logs -f postgres

# All services
docker compose logs -f
```

## 📝 **Next Steps**

1. ✅ Deploy N8N with Docker
2. ✅ Import existing workflow
3. ✅ Test AssemblyAI integration
4. ✅ Update FoundIt.at configuration
5. ✅ Test end-to-end workflow
6. 🔄 Set up SSL/domain (future)
7. 🔄 Configure backups (future)

---

**Status:** Ready for deployment  
**Estimated time:** 10-15 minutes  
**Dependencies:** Docker, docker-compose