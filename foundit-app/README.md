# FoundIt.at

Tu aplicación personal para guardar y encontrar recuerdos de la web con archivos, videos de YouTube y contenido inteligente.

## 🧠 Descripción

FoundIt.at es una herramienta completa para guardar, organizar y encontrar cualquier contenido digital. Desde videos de YouTube hasta archivos personales, todo en un lugar con búsqueda inteligente y transcripciones automáticas.

## ✨ Características Principales

### 🗂️ **Gestión Simplificada de Contenido**
- **📄 Documentos**: Archivos, URLs, videos de YouTube - todo en una categoría universal
- **📝 Notas**: Pensamientos, ideas y texto libre
- **🎯 Tipos simplificados**: Solo 2 tipos de memoria para máxima usabilidad

### 📁 **Sistema de Archivos Avanzado**
- **🖱️ Drag & Drop**: Arrastra archivos directamente al navegador
- **📋 Paste directo**: Ctrl+V para imágenes (Windows+Shift+S) y texto
- **🗜️ Compresión automática**: Optimiza imágenes grandes automáticamente
- **☁️ Almacenamiento seguro**: Supabase Storage con políticas RLS
- **👀 Vista previa**: Previsualiza imágenes y videos antes de guardar

### 🎥 **Integración YouTube Inteligente**
- **🔍 Detección automática**: Reconoce URLs de YouTube instantáneamente
- **🎞️ Miniaturas y metadata**: Extrae título, canal y descripción
- **📝 Transcripciones**: Automáticas ($0.36/hora) o manuales
- **🧠 Resúmenes IA**: Genera resúmenes inteligentes con herramientas mencionadas
- **⚠️ Detección duplicados**: Evita guardar el mismo video dos veces

### 🌐 **Extracción de Metadata de Sitios Web**
- **🔍 Auto-detección URLs**: Reconoce automáticamente sitios web (no YouTube)
- **🏷️ Metadata inteligente**: Extrae título, descripción y logo automáticamente
- **🎯 Keywords automáticos**: Genera tags basados en títulos y headers de la página
- **🖼️ Logos y favicons**: Busca Apple Touch Icons, favicons de alta calidad
- **📝 Vista previa**: Muestra preview del sitio antes de guardar
- **🔗 Enlaces clickeables**: URLs convertidas en enlaces funcionales

### 🔍 **Búsqueda y Organización**
- **🎯 Búsqueda semántica**: Encuentra contenido por significado, no solo palabras
- **🏷️ Etiquetas inteligentes**: Sistema de tags con auto-generación
- **📂 Categorías**: Personal, Trabajo, Aprendizaje, y más
- **👁️ Vistas múltiples**: Grid de tarjetas o lista compacta
- **📄 Paginación**: Navegación eficiente para muchos recuerdos

### 🎨 **Experiencia de Usuario**
- 🌙 **Modo oscuro/claro** - Switch dinámico entre temas con persistencia
- 📱 **Diseño responsive** - Funciona perfecto en desktop y móvil
- ⚡ **Carga instantánea** - Optimizado para velocidad
- 🔐 **Autenticación segura** - Sistema completo de usuarios

## 🚀 Stack Tecnológico

### Frontend
- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático para mayor robustez
- **CSS Variables** - Sistema de temas dinámico
- **CSS Puro** - Sin Tailwind ni CSS-in-JS
- **React Hooks** - Estado y efectos modernos

### Backend & Database
- **Supabase** - PostgreSQL con APIs automáticas
- **Row Level Security (RLS)** - Seguridad a nivel de fila
- **Supabase Storage** - Almacenamiento de archivos en la nube
- **Supabase Auth** - Autenticación y autorización

### APIs & Servicios
- **YouTube Data API v3** - Metadata de videos
- **AssemblyAI** - Transcripciones automáticas de audio/video
- **OpenAI GPT** - Resúmenes inteligentes y búsqueda semántica
- **Embedding Search** - Búsqueda por significado semántico
- **Cheerio** - Web scraping para extracción de metadata de sitios web
- **N8N** - Automatización y orquestación de workflows de transcripción

## 🛠️ Instalación y Configuración

### 1. Clonar e Instalar
```bash
# Clonar el repositorio
git clone https://github.com/piccoloemail/foundit.at.git
cd foundit.at

# Instalar dependencias
npm install
```

### 2. Variables de Entorno
Crea un archivo `.env.local` con las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# YouTube API (opcional)
NEXT_PUBLIC_YOUTUBE_API_KEY=tu_youtube_api_key

# OpenAI (para IA)
OPENAI_API_KEY=tu_openai_api_key

# AssemblyAI (para transcripciones)
ASSEMBLYAI_API_KEY=tu_assemblyai_api_key

# N8N Configuration (para transcripciones automáticas)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/youtube-transcript
ENABLE_N8N_TRANSCRIPTION=true

# Whisper Transcription
ENABLE_WHISPER_TRANSCRIPTION=false
```

### 3. N8N Setup (Opcional - Para Transcripciones Automáticas)

#### Opción A: N8N Local (Desarrollo)
```bash
# Instalar N8N
npm install -g n8n

# Ejecutar N8N
n8n start

# Acceder a N8N
open http://localhost:5678
```

#### Opción B: N8N con Docker
```bash
# Docker Compose para N8N + PostgreSQL
docker compose -f docs/n8n-docker-compose.yml up -d

# Ver logs
docker compose -f docs/n8n-docker-compose.yml logs -f
```

#### Importar Workflow
1. Accede a N8N en http://localhost:5678
2. Importa el workflow desde: `/Downloads/n8n-wf008.json`
3. Configura las credenciales de AssemblyAI
4. Activa el workflow

#### VPS Production Setup
Para deployment en producción, consulta:
- `/docs/digitalocean.md` - Setup completo de VPS
- `/docs/ssh-tunnel.md` - Bypass de YouTube bot detection
- `/docs/n8n-docker-setup.md` - N8N en producción

### 4. Configurar Supabase

#### Base de Datos
```sql
-- Crear tabla de memories
CREATE TABLE memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  type TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  metadata JSONB,
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own memories" ON memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories" ON memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" ON memories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" ON memories
  FOR DELETE USING (auth.uid() = user_id);
```

#### Storage
```sql
-- Crear bucket para archivos
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', false);

-- Políticas para storage
CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their files" ON storage.objects
  FOR SELECT USING (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 5. Ejecutar la Aplicación
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
foundit.at/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── process-video/     # API para procesar videos YouTube
│   │   │   ├── scrape-website/    # API para extraer metadata de sitios web
│   │   │   └── test/              # Endpoints de testing
│   │   ├── globals.css            # Estilos globales y sistema de temas
│   │   ├── layout.tsx             # Layout principal con auth
│   │   └── page.tsx               # Dashboard principal
│   ├── components/
│   │   ├── AuthModal.tsx          # Modal de autenticación
│   │   ├── EditMemoryModal.tsx    # Modal para editar memorias
│   │   ├── MemoryList.tsx         # Lista/grid de memorias
│   │   ├── NewMemoryModal.tsx     # Modal para crear memorias
│   │   ├── SearchFilters.tsx      # Filtros de búsqueda
│   │   ├── ThemeToggle.tsx        # Switch de temas
│   │   ├── TranscriptDisplay.tsx  # Display de transcripciones
│   │   └── YouTubePreview.tsx     # Preview de videos YouTube
│   ├── hooks/
│   │   ├── useAuth.ts             # Hook de autenticación
│   │   ├── useMemories.ts         # Hook para gestión de memorias
│   │   └── useSearch.ts           # Hook para búsqueda
│   ├── lib/
│   │   └── supabase.ts            # Cliente y tipos de Supabase
│   └── utils/
│       ├── intelligentSearch.ts   # Búsqueda semántica con IA
│       ├── transcriptApi.ts       # API de transcripciones
│       ├── youtube.ts             # Utilidades YouTube
│       └── youtubeApi.ts          # API de YouTube
├── public/                        # Archivos estáticos
├── setup-storage.js               # Script configuración storage
├── debug-auth-storage.js          # Script debug autenticación
└── README.md
```

## 🎨 Sistema de Temas

La aplicación incluye un sistema completo de temas claro/oscuro:

- **Modo oscuro**: Colores oscuros para reducir fatiga visual
- **Modo claro**: Colores claros para mayor legibilidad
- **Switch dinámico**: Botón luna/sol en el header
- **Persistencia**: Recuerda tu preferencia en localStorage

## 🎯 Casos de Uso

### 📚 **Para Estudiantes y Profesionales**
- Guarda videos educativos de YouTube con transcripciones automáticas
- Organiza documentos de trabajo y referencias
- Busca conceptos específicos en tus videos guardados
- Categoriza contenido por materias o proyectos

### 💼 **Para Desarrolladores**
- Archiva tutoriales de programación con resúmenes IA
- Guarda documentación y referencias técnicas
- Organiza snippets de código y notas técnicas
- Busca herramientas mencionadas en videos guardados

### 🎨 **Para Creativos**
- Colecciona inspiración visual y videos de referencia
- Organiza assets y materiales de diseño
- Guarda tutoriales de software creativo
- Mantén un archivo personal de ideas y conceptos

## 🚀 Estado Actual del Proyecto

### ✅ **Funcionalidades Completadas**
- ✅ Sistema completo de autenticación con Supabase
- ✅ Gestión de memorias con tipos simplificados (Document/Note)
- ✅ Upload de archivos con drag & drop y paste
- ✅ Integración YouTube con metadata y thumbnails
- ✅ Transcripciones automáticas y manuales
- ✅ **Extracción de metadata de sitios web** con logos y keywords automáticos
- ✅ Búsqueda semántica con IA
- ✅ Sistema de tags y categorías
- ✅ Vistas múltiples (grid/lista) con paginación
- ✅ Modo oscuro/claro con persistencia
- ✅ Diseño responsive completo
- ✅ **N8N Workflow Integration** - Automatización de transcripciones
- ✅ **VPS Production Setup** - DigitalOcean deployment con Docker
- ✅ **SSH Tunnel Strategy** - IP residencial para bypass YouTube blocks

### 🔄 **Problemas Resueltos Recientemente**
- ✅ **Acordeones en producción**: Solucionado problema de hidratación en Vercel
- ✅ **Click en miniaturas YouTube**: Ahora abre correctamente en nueva pestaña
- ✅ **Compatibilidad Vercel**: Configuración optimizada para deployment
- ✅ **Errores de Supabase Realtime**: Resuelto con configuración de webpack
- ✅ **YouTube Bot Detection**: Implementado sistema híbrido VPS + tunnel para bypass
- ✅ **N8N Production**: Configurado N8N en VPS con PostgreSQL y Docker
- ✅ **Costo Optimization**: Reducido transcripción de $0.90/hora a $0.36/hora

### 🚧 **Desarrollo Actual (Work in Progress)**
- 🔄 **SSH Reverse Tunnel**: VPS → PC/Mac con IP Starlink para bypass YouTube
- 🔄 **Production Architecture**: Estrategia híbrida local + VPS para máxima confiabilidad

## 🔍 **Sistema de Snippets y Transcripts (FUNCIONAL)**

### 📺 **Cómo Funcionan los Transcripts**

FoundIt.at tiene un sistema avanzado de transcripciones que te permite buscar contenido específico dentro de videos y saltar directamente al momento exacto.

#### **Tipos de Transcripts Soportados:**

1. **📝 Transcripts Manuales** (Recomendado)
   - **Funcionamiento**: Copias/pegas el transcript desde YouTube u otra fuente
   - **Ventajas**: Control total sobre calidad y formato
   - **Costo**: GRATIS
   - **Timestamps**: Automáticamente detectados del texto

2. **🤖 YouTube API** (Automático - Limitado)
   - **Funcionamiento**: Intenta obtener subtítulos directos de YouTube
   - **Limitaciones**: Solo funciona si el video tiene subtítulos habilitados
   - **Costo**: GRATIS
   - **Estado**: Muchos videos no tienen subtítulos disponibles via API

3. **🎙️ AssemblyAI** (Automático - De pago)
   - **Funcionamiento**: Transcribe el audio del video automáticamente
   - **Limitaciones**: No puede acceder directamente a URLs de YouTube
   - **Costo**: $0.90/hora
   - **Estado**: Funcional pero requiere descarga previa del audio

#### **Flujo de Procesamiento de Videos:**

```
🎬 Video de YouTube
    ↓
1. 🆓 YouTube API (subtítulos gratis)
    ↓ (si falla)
2. 🤖 N8N Workflow → AssemblyAI ($0.36/hora)
    ↓ (si falla)
3. 📝 Transcript Manual (usuario)
    ↓ (si falla)
4. 🎭 Datos Mock (placeholder)
```

#### **🤖 N8N Integration (Automatización de Transcripciones)**

FoundIt.at integra con **N8N** para automatizar el procesamiento de transcripciones y optimizar costos:

**Características del N8N Workflow:**
- **🎯 Segmentación inteligente**: Divide transcripts en chunks con timestamps precisos
- **⏰ Timestamps estilo YouTube**: Formato MM:SS para navegación directa
- **💰 Costo optimizado**: $0.36/hora vs $0.90/hora (60% menos que AssemblyAI directo)
- **🔄 Procesamiento asíncrono**: No bloquea la interfaz durante transcripción
- **📊 Configuración flexible**: Personalizable longitud de segmentos y duración

### 🔍 **Sistema de Búsqueda de Snippets**

#### **Cómo Funciona la Búsqueda:**

1. **Prioridad de Búsqueda** (de mayor a menor importancia):
   - 🎙️ **Transcripts** (con timestamps)
   - 📝 **Contenido/Descripción**
   - 🧠 **Resumen IA** 
   - 📄 **Título**
   - 🏷️ **Tags**
   - 🔗 **URL**

2. **Detección Automática de Timestamps:**
   ```javascript
   // Detecta formatos como:
   "10:30"     → 10 minutos 30 segundos
   "1:23:45"   → 1 hora 23 minutos 45 segundos
   "2:30.5"    → 2 minutos 30 segundos (ignora decimales)
   ```

3. **Múltiples Snippets por Video:**
   - Encuentra TODAS las menciones de tu búsqueda
   - Muestra hasta 5 snippets por video
   - Cada snippet con su timestamp independiente

#### **Ejemplo de Búsqueda Funcionando:**

```
Buscar: "flujo de trabajo"

📊 Resultados:
┌─────────────────────────────────────┐
│ 🎙️ Found in: Transcript            │
│ ────────────────────────────────────│
│ "...cada iteración he ido afinando  │
│ mi flujo de trabajo para ser más    │
│ eficiente en el desarrollo..."      │
│ 📋 Copiar | ▶️ 10:30               │ ← Clickeable
└─────────────────────────────────────┘
```

### 📝 **Cómo Agregar Transcripts Manuales**

#### **Paso a Paso:**

1. **Guardar Video**:
   - Pega URL de YouTube
   - Activa "🎯 Auto-transcribe video"
   - Guarda el video

2. **Agregar Transcript Manual**:
   - Ve al video guardado
   - Click en "Add manual transcript"
   - Copia el transcript desde YouTube:
     - Ve al video en YouTube
     - Activa subtítulos (CC)
     - Usa herramientas como "YouTube Transcript" (extensión Chrome)
     - O copia manualmente

3. **Formato de Transcript**:
   ```
   0:00
   Hola y bienvenidos a este tutorial
   
   1:30  
   En esta sección vamos a ver
   
   3:45
   Los conceptos más importantes son...
   ```

4. **Búsqueda Automática**:
   - El sistema detecta automáticamente los timestamps
   - Extrae snippets relevantes
   - Genera botones clickeables

### 🎯 **Características del Sistema de Snippets**

#### **✅ Funcionalidades Implementadas:**

- **🔍 Búsqueda Inteligente**: Encuentra palabras en cualquier parte del transcript
- **⏰ Timestamps Automáticos**: Extrae "10:30" del texto y lo convierte en segundos
- **🎯 Salto Directo**: Click en timestamp abre YouTube en el momento exacto
- **📱 Ventana Nueva**: Videos se abren en ventana separada (no refresh de página)
- **🔄 Múltiples Formatos**: Soporta "MM:SS" y "HH:MM:SS"
- **📝 Snippet Context**: Muestra el texto completo alrededor de la búsqueda
- **🎨 UI Intuitiva**: Badges de timestamp con iconos clickeables

#### **💡 Ejemplo de URL Generada:**
```
Buscar: "flujo de trabajo" → Timestamp: "10:30"
URL: https://youtube.com/watch?v=djDZHAi75dk&t=630s
      ↑ Video ID                          ↑ 10*60 + 30 = 630 segundos
```

### 🚀 **Próximas Mejoras para Snippets**

#### **📝 Notas Personales (Planificado - Alta Prioridad)**
**Problema:** Actualmente el campo "note" se usa para descripciones, pero necesitamos poder agregar notas personales a cada memoria.

**Solución:** Agregar un campo adicional `note2` para notas personales del usuario.

**Funcionalidad:**
- **Separación clara**: `note` = descripción/contenido, `note2` = notas personales del usuario
- **Sin migración compleja**: Agregar campo nuevo en lugar de renombrar existente
- **Para todos los tipos**: Videos, websites, documentos y notas pueden tener anotaciones personales
- **Edición rápida**: Botón de editar notas directamente desde las tarjetas de memoria
- **Búsqueda en notas**: Las notas personales serán parte de la búsqueda semántica

**Casos de uso:**
- Anotar por qué guardaste un video específico
- Agregar contexto personal a documentos de trabajo
- Recordatorios sobre cuándo usar cierta información
- Conexiones con otros recuerdos o proyectos

#### 🎯 **Búsqueda Inteligente con IA Semántica (Próximo paso)**
**Objetivo:** Integrar búsqueda semántica con IA para encontrar contenido por significado, no solo palabras exactas.

**Funcionalidades a implementar:**
- **🤖 Búsqueda conceptual**: "videos sobre productividad" encuentra content sin mencionar "productividad"
- **🔗 Conexiones inteligentes**: IA sugiere contenido relacionado
- **📊 Ranking por relevancia**: Mejores resultados primero
- **💡 Preguntas naturales**: "¿cómo optimizar mi flujo de desarrollo?"

#### 📊 **Mejoras Técnicas Planeadas**

**🎯 Estado Actual vs Futuro:**

| Característica | ✅ Actual | 🚀 Futuro |
|----------------|-----------|-----------|
| **Transcripts** | Manual + YouTube API | + AssemblyAI funcional |
| **Búsqueda** | Literal + básica | + IA semántica |
| **Snippets** | Con timestamps | + Múltiples por tema |
| **UI** | Snippets básicos | + Contexto enriquecido |
| **Performance** | Búsqueda cliente | + Índices optimizados |

**🔧 Mejoras Técnicas:**
- **Vectorización**: Convertir transcripts a embeddings para búsqueda semántica
- **Caché inteligente**: Guardar resultados de búsqueda frecuentes
- **Indexación**: Mejorar velocidad de búsqueda con índices DB
- **Snippets con IA**: Generar resúmenes contextuales automáticos

#### 🎨 **Otras mejoras planeadas**
- 📊 **Dashboard analytics** - Estadísticas de uso y contenido
- 🔗 **Extensión de navegador** - Guarda contenido con un click
- 📱 **PWA** - Aplicación web progresiva para móviles
- 🔄 **Sincronización** - Backup y sync entre dispositivos
- 🎨 **Temas personalizados** - Más opciones de personalización
- 🤖 **IA mejorada** - Mejor categorización automática

## 📝 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run lint         # Linter ESLint
```

## 🚀 Despliegue

### Vercel (Recomendado)

#### Configuración para Vercel
1. **Conecta tu repositorio** con Vercel desde el dashboard
2. **Configura las variables de entorno** en Vercel:
   - Todas las variables de `.env.local` deben estar en Vercel
   - Asegúrate de que las URLs de Supabase sean las de producción

#### Archivo vercel.json
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install --legacy-peer-deps",
  "devCommand": "npm run dev",
  "outputDirectory": ".next",
  "functions": {
    "src/app/api/**": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_OPTIONS": "--max-old-space-size=4096"
  }
}
```

#### Solución de problemas comunes en Vercel

##### Problema: Acordeones no funcionan en producción
Si los acordeones (como "AI Summary & Details") no funcionan después del deploy:

1. **Problema de hidratación**: Next.js puede renderizar diferente en servidor vs cliente
2. **Solución aplicada**: Usar verificación `isClient` para componentes interactivos
3. **Código ejemplo**:
```tsx
const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);

// Renderizar acordeón solo en cliente
{isClient && <AccordionComponent />}
```

##### Problema: Errores de Supabase Realtime
Si aparecen errores de `require is not defined`:

1. **Causa**: Conflicto con módulos de Node.js en el navegador
2. **Solución en next.config.ts**:
```typescript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      // ... otros módulos de Node.js
    };
  }
  return config;
}
```

##### Deploy manual desde Vercel Dashboard
1. Ve a tu proyecto en [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click en **"Deployments"**
3. Click en **"Redeploy"** del último deployment
4. O usa los tres puntos (⋮) → **"Redeploy"**

### Scripts de producción
```bash
# Build local como en producción
npm run build:production

# Probar producción localmente
npm run start:production

# Test completo como Vercel
npm run test:vercel
```

### Otros proveedores
La aplicación es compatible con cualquier proveedor que soporte Next.js 15.

## 🧪 Scripts de Desarrollo y Debug

### Configuración Inicial
```bash
# Configurar Supabase Storage
node setup-storage.js

# Debug autenticación y storage
node debug-auth-storage.js
```

### Testing APIs
```bash
# Test transcripciones
node test-transcript.js

# Test búsqueda semántica
node test-semantic-search.js

# Test integración AssemblyAI
node test-assemblyai.js
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### 🐛 Reportar Issues
- Usa el [GitHub Issues](https://github.com/piccoloemail/foundit.at/issues)
- Incluye pasos para reproducir el problema
- Especifica navegador y versión del sistema

## 📊 Métricas del Proyecto

- **Componentes React**: 9 componentes modulares
- **Hooks personalizados**: 3 hooks para estado global
- **APIs integradas**: YouTube, AssemblyAI, OpenAI
- **Líneas de código**: ~2,500 líneas TypeScript/TSX
- **Cobertura de features**: 95% de funcionalidades core completadas

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👨‍💻 Créditos

Desarrollado con ❤️ usando tecnologías modernas:
- **Frontend**: Next.js 15 + TypeScript + CSS Variables
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **IA**: OpenAI GPT + AssemblyAI + Embedding Search

---

**FoundIt.at** - *Tu memoria digital inteligente. Nunca pierdas un recuerdo, archivo o video importante.*

🔗 **Demo**: [foundit.at](https://foundit.at)  
🐙 **Código**: [GitHub](https://github.com/piccoloemail/foundit.at)  
📧 **Contacto**: [Issues](https://github.com/piccoloemail/foundit.at/issues)