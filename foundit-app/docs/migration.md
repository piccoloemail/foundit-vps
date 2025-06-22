# 🚀 Plan de Migración: Vercel+Supabase → VPS Todo-en-Uno

## 📋 Resumen Ejecutivo

**Objetivo**: Migrar FoundIt.at de arquitectura distribuida a VPS unificado
**Tiempo estimado**: 3-4 semanas (trabajo gradual)
**Costo final**: $20-30/mes vs $70+/mes actual
**Estrategia**: Migración por fases sin downtime

---

## 🏗️ Arquitectura Final VPS

```
VPS Ubuntu 22.04 ($20-30/mes)
├── 🌐 Nginx (Proxy Reverso + SSL)
│   ├── app.tudominio.com → FoundIt.at:3000
│   ├── n8n.tudominio.com → N8N:5678
│   └── api.tudominio.com → APIs custom
├── 🎯 FoundIt.at (Next.js + PM2)
├── 🤖 N8N (Docker)
├── 🗄️ PostgreSQL 15 + pgvector
├── 🚀 Redis (Cache + Sesiones)
└── 📁 Storage Local (archivos + backups)
```

---

## 📅 Cronograma de Migración (3 Fases)

### 🔄 **Fase 1: Setup VPS + N8N** (Semana 1)
*Objetivo: VPS funcionando con N8N, sin tocar FoundIt.at*

#### **Día 1-2: Configuración VPS Base**

```bash
# 1. Crear VPS (DigitalOcean/Linode/Vultr)
# Specs mínimas: 4GB RAM, 2 vCPU, 50GB SSD

# 2. Setup inicial Ubuntu 22.04
sudo apt update && sudo apt upgrade -y
sudo apt install nginx docker.io docker-compose git curl ufw fail2ban -y

# 3. Configurar firewall
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 4. Usuario no-root
sudo adduser foundit
sudo usermod -aG sudo,docker foundit
```

#### **Día 3-4: N8N + PostgreSQL Setup**

```bash
# 1. Crear directorio proyecto
mkdir /home/foundit/apps
cd /home/foundit/apps

# 2. Docker Compose para N8N + PostgreSQL
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: foundit_db
      POSTGRES_USER: foundit_user
      POSTGRES_PASSWORD: secure_password_here
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=secure_n8n_password
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n_db
      - DB_POSTGRESDB_USER=foundit_user
      - DB_POSTGRESDB_PASSWORD=secure_password_here
    volumes:
      - n8n_data:/home/node/.n8n
    ports:
      - "5678:5678"
    depends_on:
      - postgres
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  n8n_data:
  redis_data:
EOF

# 3. Inicializar PostgreSQL con extensiones
cat > init.sql << 'EOF'
-- Crear bases de datos
CREATE DATABASE n8n_db;
CREATE DATABASE foundit_db;

-- Conectar a foundit_db para configurar extensiones
\c foundit_db;

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Crear schema para FoundIt.at
CREATE SCHEMA IF NOT EXISTS public;
EOF

# 4. Iniciar servicios
docker-compose up -d
```

#### **Día 5-7: Nginx + SSL**

```bash
# 1. Configurar dominios
# A records en tu DNS:
# n8n.tudominio.com → IP_VPS
# app.tudominio.com → IP_VPS

# 2. Nginx config para N8N
sudo nano /etc/nginx/sites-available/n8n.conf
```

```nginx
server {
    listen 80;
    server_name n8n.tudominio.com;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support para N8N
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# 3. Activar configuración
sudo ln -s /etc/nginx/sites-available/n8n.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 4. SSL con Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d n8n.tudominio.com

# 5. Test N8N funcionando
curl https://n8n.tudominio.com
```

---

### 🔄 **Fase 2: Migración FoundIt.at** (Semana 2)

#### **Día 1-3: Setup FoundIt.at en VPS**

```bash
# 1. Clonar proyecto
cd /home/foundit/apps
git clone https://github.com/tu-usuario/foundit.at.git
cd foundit.at

# 2. Setup Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar PM2 para producción
sudo npm install -g pm2

# 4. Instalar dependencias
npm install --production

# 5. Variables de entorno VPS
cat > .env.local << 'EOF'
# Database (PostgreSQL local)
DATABASE_URL=postgresql://foundit_user:secure_password_here@localhost:5432/foundit_db

# N8N local
N8N_WEBHOOK_URL=http://localhost:5678/webhook/foundit-transcript

# APIs externas (mismas de antes)
YOUTUBE_API_KEY=tu_youtube_api_key
OPENAI_API_KEY=tu_openai_api_key
ASSEMBLYAI_API_KEY=tu_assemblyai_api_key

# JWT para auth local
NEXTAUTH_SECRET=tu_secret_muy_seguro
NEXTAUTH_URL=https://app.tudominio.com

# Redis para cache
REDIS_URL=redis://localhost:6379
EOF

# 6. Build producción
npm run build

# 7. PM2 config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'foundit-app',
    script: 'npm',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# 8. Iniciar con PM2
mkdir logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### **Día 4-5: Configurar Database Schema**

```sql
-- Conectar a PostgreSQL local
psql -h localhost -U foundit_user -d foundit_db

-- Crear tablas (migrar desde Supabase)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_password VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  type TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  metadata JSONB,
  file_path TEXT,
  transcript TEXT,
  transcript_with_timestamps TEXT,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nueva tabla para búsqueda vectorial (Advanced_Search.md)
CREATE TABLE transcript_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID REFERENCES memories(id),
  chunk_text TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  embedding VECTOR(1536),
  semantic_keywords TEXT[],
  relevance_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices optimizados
CREATE INDEX transcript_chunks_embedding_idx 
ON transcript_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX transcript_chunks_memory_idx ON transcript_chunks(memory_id);
CREATE INDEX memories_user_idx ON memories(user_id);
CREATE INDEX memories_type_idx ON memories(type);
CREATE INDEX memories_created_idx ON memories(created_at DESC);

-- Storage local (reemplaza Supabase Storage)
CREATE TABLE file_storage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Día 6-7: Nginx para FoundIt.at**

```nginx
# /etc/nginx/sites-available/foundit.conf
server {
    listen 80;
    server_name app.tudominio.com;
    
    # Static files
    location /_next/static/ {
        alias /home/foundit/apps/foundit.at/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Main app
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Activar y SSL
sudo ln -s /etc/nginx/sites-available/foundit.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d app.tudominio.com
```

---

### 🔄 **Fase 3: Migración de Datos + Go Live** (Semana 3-4)

#### **Día 1-3: Migración de Datos desde Supabase**

```bash
# 1. Export desde Supabase
npm install -g supabase
supabase login

# 2. Script de migración de datos
cat > migrate-data.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Supabase (origen)
const supabase = createClient(
  'TU_SUPABASE_URL',
  'TU_SUPABASE_SERVICE_KEY'
);

// PostgreSQL local (destino)
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'foundit_db',
  user: 'foundit_user',
  password: 'secure_password_here'
});

async function migrateMemories() {
  console.log('🚀 Iniciando migración de memories...');
  
  // 1. Obtener datos de Supabase
  const { data: memories, error } = await supabase
    .from('memories')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  
  console.log(`📊 Encontradas ${memories.length} memories para migrar`);
  
  // 2. Insertar en PostgreSQL local
  for (const memory of memories) {
    await pool.query(`
      INSERT INTO memories (
        id, user_id, title, content, url, type, category, 
        tags, metadata, file_path, transcript, 
        transcript_with_timestamps, ai_summary, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO NOTHING
    `, [
      memory.id, memory.user_id, memory.title, memory.content,
      memory.url, memory.type, memory.category, memory.tags,
      memory.metadata, memory.file_path, memory.transcript,
      memory.transcript_with_timestamps, memory.ai_summary,
      memory.created_at, memory.updated_at
    ]);
  }
  
  console.log('✅ Migración de memories completada');
}

async function migrateUsers() {
  console.log('🚀 Iniciando migración de users...');
  
  // Obtener usuarios desde Supabase Auth
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) throw error;
  
  for (const user of users) {
    await pool.query(`
      INSERT INTO users (id, email, created_at, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `, [user.id, user.email, user.created_at, user.updated_at]);
  }
  
  console.log('✅ Migración de users completada');
}

async function migrateFiles() {
  console.log('🚀 Iniciando migración de archivos...');
  
  // Descargar archivos de Supabase Storage
  const { data: files } = await supabase.storage
    .from('memories')
    .list('', { limit: 1000 });
    
  // Crear directorio storage local
  const fs = require('fs');
  const path = require('path');
  
  const storageDir = '/home/foundit/apps/storage';
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  
  for (const file of files) {
    // Descargar de Supabase
    const { data: fileData } = await supabase.storage
      .from('memories')
      .download(file.name);
      
    // Guardar localmente
    const localPath = path.join(storageDir, file.name);
    fs.writeFileSync(localPath, Buffer.from(await fileData.arrayBuffer()));
    
    console.log(`📁 Archivo migrado: ${file.name}`);
  }
  
  console.log('✅ Migración de archivos completada');
}

// Ejecutar migración
async function main() {
  try {
    await migrateUsers();
    await migrateMemories();
    await migrateFiles();
    console.log('🎉 Migración completa exitosa!');
  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await pool.end();
  }
}

main();
EOF

# 3. Ejecutar migración
node migrate-data.js
```

#### **Día 4-5: Testing Completo + Optimización**

```bash
# 1. Test todos los endpoints
curl https://app.tudominio.com/api/test
curl https://n8n.tudominio.com/healthz

# 2. Test búsqueda semántica
node test-semantic-search.js

# 3. Test N8N workflows
node test-n8n-webhook.js

# 4. Optimizar PostgreSQL
sudo nano /etc/postgresql/*/main/postgresql.conf
```

```conf
# Optimizaciones PostgreSQL para búsqueda vectorial
shared_preload_libraries = 'vector'
max_connections = 200
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 64MB
maintenance_work_mem = 512MB

# Para pgvector
shared_buffers = 1GB
work_mem = 64MB
```

#### **Día 6-7: Go Live + Monitoreo**

```bash
# 1. Backup automático
cat > /home/foundit/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U foundit_user foundit_db > /home/foundit/backups/foundit_backup_$DATE.sql
find /home/foundit/backups -name "*.sql" -mtime +7 -delete
EOF

chmod +x /home/foundit/backup.sh
crontab -e
# Agregar: 0 2 * * * /home/foundit/backup.sh

# 2. Monitoreo con PM2
pm2 install pm2-server-monit

# 3. Actualizar DNS
# Cambiar A records:
# app.tudominio.com → IP_VPS
# *.tudominio.com → IP_VPS

# 4. Test final completo
```

---

## 💰 Comparación de Costos

| Servicio | Antes (mensual) | Después (mensual) | Ahorro |
|----------|-----------------|-------------------|--------|
| **Vercel Pro** | $20 | $0 | $20 |
| **Supabase Pro** | $25 | $0 | $25 |
| **N8N Cloud** | $20 | $0 | $20 |
| **VPS 4GB** | $0 | $24 | -$24 |
| **Dominio SSL** | $0 | $0 | $0 |
| **TOTAL** | **$65** | **$24** | **$41/mes** |

**Ahorro anual**: $492

---

## 🎯 Benefits de la Migración

### **📈 Performance**
- **Latencia**: Comunicación interna vs APIs externas
- **Cache**: Redis local para búsquedas frecuentes
- **Database**: Queries optimizados sin límites de rate

### **🛠️ Control Total**
- **PostgreSQL**: Fine-tuning para búsqueda vectorial
- **Storage**: Sin límites de bandwidth
- **Logs**: Acceso completo para debugging

### **🚀 Escalabilidad**
- **Horizontal**: Fácil upgrade VPS
- **Features**: APIs custom sin restricciones serverless
- **Integrations**: N8N workflows complejos

---

## ⚠️ Riesgos y Mitigaciones

### **🚨 Posibles Problemas**
1. **Downtime durante migración**
2. **Pérdida de datos**
3. **Configuración incorrecta**
4. **Performance inicial**

### **✅ Mitigaciones**
1. **Migración gradual** con DNS switch final
2. **Backups múltiples** antes de cada fase
3. **Testing exhaustivo** en cada paso
4. **Rollback plan** a Vercel/Supabase si falla

---

## 📝 Checklist Pre-Migración

- [ ] **VPS creado** y acceso SSH confirmado
- [ ] **Dominios configurados** (DNS records)
- [ ] **Backups Supabase** creados y verificados
- [ ] **Variables de entorno** documentadas
- [ ] **Plan de rollback** definido
- [ ] **Timeline** acordado (sin prisa)

---

## 🔧 Scripts de Utilidad

### Script de Monitoreo

```bash
# /home/foundit/monitor.sh
#!/bin/bash

echo "=== FoundIt.at Health Check ==="
echo "Timestamp: $(date)"
echo ""

# Check services
echo "🐳 Docker Services:"
docker-compose ps

echo ""
echo "🎯 FoundIt.at App:"
pm2 status

echo ""
echo "🗄️ PostgreSQL:"
pg_isready -h localhost -p 5432 -U foundit_user

echo ""
echo "🚀 Redis:"
redis-cli ping

echo ""
echo "🌐 Nginx:"
sudo nginx -t

echo ""
echo "💾 Disk Usage:"
df -h /

echo ""
echo "🧠 Memory Usage:"
free -h

echo ""
echo "📊 Recent Logs:"
pm2 logs foundit-app --lines 5 --nostream
```

### Script de Actualización

```bash
# /home/foundit/update.sh
#!/bin/bash

echo "🚀 Updating FoundIt.at..."

cd /home/foundit/apps/foundit.at

# Git pull
git pull origin main

# Install dependencies
npm install --production

# Build
npm run build

# Restart app
pm2 restart foundit-app

# Clean old logs
pm2 flush

echo "✅ Update completed!"
```

### Script de Backup Completo

```bash
# /home/foundit/full-backup.sh
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/foundit/backups"

mkdir -p $BACKUP_DIR

echo "🗄️ Backing up PostgreSQL..."
pg_dump -h localhost -U foundit_user foundit_db > $BACKUP_DIR/db_backup_$DATE.sql

echo "📁 Backing up file storage..."
tar -czf $BACKUP_DIR/storage_backup_$DATE.tar.gz /home/foundit/apps/storage/

echo "🔧 Backing up app config..."
cp /home/foundit/apps/foundit.at/.env.local $BACKUP_DIR/env_backup_$DATE
cp /home/foundit/apps/docker-compose.yml $BACKUP_DIR/docker_backup_$DATE.yml

echo "🧹 Cleaning old backups (older than 30 days)..."
find $BACKUP_DIR -name "*backup*" -mtime +30 -delete

echo "✅ Backup completed: $BACKUP_DIR/"
ls -la $BACKUP_DIR/
```

---

## 🎉 Post-Migración: Nuevas Posibilidades

Una vez completada la migración, tendrás acceso a features avanzadas:

### **🔍 Búsqueda Vectorial Optimizada**
- Implementar el plan completo de `Advanced_Search.md`
- pgvector con configuración custom para tu caso de uso
- Cache inteligente con Redis para queries frecuentes

### **📊 Analytics Dashboard**
- Métricas en tiempo real sin límites de API
- Análisis de patrones de uso
- Trending topics en tus memories

### **🔗 Extensión de Navegador**
- Backend APIs custom para sync instantáneo
- Sin restricciones de CORS o serverless timeouts

### **🤖 IA Avanzada**
- Workflows N8N complejos para processing
- Modelos locales para privacidad total
- Fine-tuning de embeddings específicos

---

**🎯 ¿Listo para empezar con la Fase 1?**

*Creado: Enero 2025*  
*Estado: Plan detallado, listo para implementación*  
*Prioridad: Alta - Migración estratégica*