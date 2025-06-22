# FoundIt.at - Production Architecture

**Estado actual:** Diciembre 2025  
**Enfoque:** Híbrido Development + Production  

## 🏗️ Arquitectura General

### **Development Environment (Local)**
```
Mac Mini M1 (Starlink)
├── FoundIt.at App (Next.js)
├── N8N Local (desarrollo)
├── Supabase (cloud)
└── SSH Tunnel → VPS
```

### **Production Environment (VPS)**
```
DigitalOcean VPS (157.230.185.25)
├── N8N + PostgreSQL (Docker)
├── YouTube Bypass (SSH Tunnel)
├── AssemblyAI Integration
└── 24/7 Processing
```

### **Hybrid Workflow**
```
User Request → FoundIt.at (Local) → N8N (VPS) → AssemblyAI → Response
     ↑                                ↓
   Development              SSH Tunnel (IP Bypass)
     ↑                                ↓
Supabase Cloud ←───────── Starlink IP ←──── YouTube
```

## 🎯 **Strategy: YouTube Bot Detection Bypass**

### **Problem**
- **YouTube blocks VPS IPs** (datacenter detection)
- **AssemblyAI direct** funciona pero es más lento (60-90s vs 30-40s)
- **yt-dlp** en VPS falla con "Sign in to confirm you're not a bot"

### **Solution: SSH Reverse Tunnel**
```
YouTube API ← Starlink IP ← PC/Mac ← SSH Tunnel ← VPS N8N
```

**Benefits:**
- ✅ **YouTube sees residential IP** (Starlink)
- ✅ **VPS processes with full power** 
- ✅ **No geographic restrictions**
- ✅ **Cost $0** (no proxy services)
- ✅ **Full control** over the pipeline

## 📋 **Current Setup Status**

### ✅ **Completed Components**

#### **FoundIt.at Application**
- ✅ **Next.js 15** con TypeScript
- ✅ **Supabase** integration (auth + database + storage)
- ✅ **YouTube API** integration
- ✅ **Transcript system** con timestamps
- ✅ **AI Search** semántica
- ✅ **Responsive UI** con dark/light mode

#### **VPS Infrastructure**
- ✅ **DigitalOcean VPS** (4GB RAM, 2 vCPU)
- ✅ **Docker + Docker Compose**
- ✅ **N8N + PostgreSQL** en contenedores
- ✅ **SSH access** configurado
- ✅ **yt-dlp + ffmpeg** instalados

#### **N8N Workflows**
- ✅ **flow008**: yt-dlp + AssemblyAI (funcional localmente)
- ✅ **flow009**: AssemblyAI directo (loop infinito en VPS)
- ✅ **Webhook endpoints** configurados
- ✅ **Error handling** básico

### ✅ **Completed - SSH Tunnel Implementation**

#### **PC Windows + WSL Setup**
- ✅ **SSH Server** habilitado en Windows
- ✅ **WSL Ubuntu** instalado con Developer Mode
- ✅ **Squid proxy** configurado en puerto 8118
- ✅ **SSH keys** generadas y configuradas

#### **Túnel Reverse VPS → PC**
- ✅ **Conexión SSH** desde PC a VPS funcionando
- ✅ **Port forwarding** 8118 (PC → VPS) activo
- ✅ **Proxy HTTP/HTTPS** redirigiendo tráfico correctamente
- ✅ **YouTube bypass** verificado con yt-dlp

### 🔄 **In Progress**

#### **N8N Workflow Integration**
- 🔄 **Actualizar comandos** yt-dlp con variables proxy
- 🔄 **Test workflow completo** con video real
- 🔄 **Auto-reconnect** scripts para producción

### 📋 **Pending Tasks**

#### **Tunnel Testing & Implementation**
1. **SSH tunnel básico** (PC → VPS)
2. **HTTP proxy** setup (Squid)
3. **yt-dlp testing** via tunnel
4. **N8N integration** con proxy
5. **Auto-reconnect** para producción

#### **Production Optimization**
1. **Performance tuning** (concurrent videos)
2. **Monitoring setup** (logs, alerts)
3. **Backup strategy** (workflows, data)
4. **SSL/Domain** setup (opcional)

## 💰 **Cost Analysis**

### **Current Costs**
| Component | Cost/Month | Status |
|-----------|------------|---------|
| **DigitalOcean VPS** | $32 | ✅ Running |
| **Supabase** | $0 (free tier) | ✅ Active |
| **AssemblyAI** | ~$10-30 (usage) | ✅ Active |
| **Starlink** | ~$100 (ya existente) | ✅ Available |
| **Total** | **~$42-62/month** | 🎯 **Viable** |

### **Cost Comparison vs Alternatives**
| Solution | Cost/Month | Reliability | Setup |
|----------|------------|-------------|-------|
| **SSH Tunnel** | $32 | 90% | Complex |
| **Residential Proxies** | $150+ | 95% | Easy |
| **Multiple VPS** | $200+ | 85% | Complex |
| **YouTube API Premium** | $10,000+ | 100% | Impossible |

## 🚀 **Deployment Architecture**

### **Development (Current)**
```bash
# Local environment
cd foundit.at
npm run dev              # http://localhost:3000

# Local N8N (opcional)
n8n start               # http://localhost:5678
```

### **Production (Future)**
```bash
# VPS N8N (ya corriendo)
ssh root@157.230.185.25
docker compose ps       # Ver status

# Vercel deployment
vercel --prod           # foundit-at-eu2i.vercel.app
```

### **Hybrid (Planned)**
```bash
# PC/Mac tunnel
./tunnel-manager.sh     # SSH tunnel automático

# FoundIt.at
npm run dev             # Local development
# O Vercel production    # Vercel hosting

# VPS Processing
# N8N via tunnel        # YouTube bypass
```

## 🔍 **Monitoring & Maintenance**

### **Health Checks**
```bash
# VPS Status
ssh root@157.230.185.25 "docker compose ps"

# N8N Availability
curl http://157.230.185.25:5678

# Tunnel Status (cuando esté activo)
curl --proxy http://127.0.0.1:3128 ifconfig.me

# FoundIt.at Status
curl https://foundit-at-eu2i.vercel.app
```

### **Logs importantes**
```bash
# N8N logs
docker compose logs -f n8n

# VPS system logs
journalctl -f

# Tunnel logs (futuro)
tail -f ~/tunnel.log
```

## 🎯 **Success Metrics**

### **Performance Goals**
- **Transcription time**: <60 segundos por video
- **Success rate**: >90% videos procesados
- **Uptime**: >95% availability
- **Cost**: <$100/month total

### **Current Performance**
- **Local N8N**: ✅ 30-40s per video
- **VPS Direct**: ❌ YouTube blocks
- **VPS Tunnel**: 🔄 Testing pending

## 📚 **Documentation**

### **Setup Guides**
- 📄 `README.md` - General setup
- 📄 `docs/digitalocean.md` - VPS setup
- 📄 `docs/ssh-tunnel.md` - Tunnel implementation
- 📄 `docs/n8n-docker-setup.md` - N8N production

### **Troubleshooting**
- 📄 `console-read.md` - Error logs
- 📄 `tests/` folder - Testing scripts
- 📄 GitHub Issues - Problem tracking

## 🔮 **Future Roadmap**

### **Short Term (Next Week)**
1. ✅ **Complete SSH tunnel** implementation
2. ✅ **Test end-to-end** workflow
3. ✅ **Auto-reconnect** scripts
4. ✅ **Performance optimization**

### **Medium Term (Next Month)**
1. **SSL/Domain** setup (opcional)
2. **Multiple PC support** (redundancy)
3. **Monitoring dashboard**
4. **Backup automation**

### **Long Term (Future)**
1. **Scale to multiple users**
2. **Commercial pricing**
3. **Advanced AI features**
4. **Mobile app** (PWA)

## 🤝 **Team & Responsibilities**

### **Development**
- **BJC**: Full-stack development, architecture
- **Claude**: Code assistance, documentation

### **Infrastructure**
- **BJC**: VPS management, tunnel setup
- **Starlink**: IP provision (residential)
- **DigitalOcean**: Hosting infrastructure

### **Services**
- **Supabase**: Database, auth, storage
- **AssemblyAI**: Transcription processing
- **OpenAI**: AI summaries, search
- **Vercel**: Frontend hosting

---

**Last Updated:** 2025-06-20  
**Next Review:** After tunnel implementation  
**Status:** 🟡 Development in progress