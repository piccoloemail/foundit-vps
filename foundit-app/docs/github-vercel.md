# GitHub y Vercel - Guía Completa de Deployment

## ¿Qué pasó y por qué no aparecían los cambios online?

### El Problema
Cuando subíamos cambios a GitHub, los cambios no aparecían en la aplicación de Vercel. La confusión principal fue que **el código se estaba deployando al proyecto Vercel equivocado**.

### La Explicación
1. **Teníamos DOS proyectos en Vercel:**
   - `foundit-at` (proyecto equivocado)
   - `foundit-at-eu2i` (proyecto correcto donde queríamos que aparecieran los cambios)

2. **GitHub estaba conectado al proyecto equivocado**, por eso:
   - Los cambios sí se subían a GitHub ✅
   - Los cambios sí se deployaban automáticamente ✅
   - ¡Pero se deployaban al proyecto equivocado! ❌

3. **La solución fue cambiar la configuración** para que GitHub se conectara al proyecto correcto.

---

## Comandos Esenciales para GitHub

### 1. Verificar el Estado del Repositorio
```bash
# Ver qué archivos han cambiado
git status

# Ver diferencias entre archivos
git diff

# Ver historial de commits
git log --oneline -10
```

### 2. Subir Cambios a GitHub
```bash
# Agregar TODOS los archivos modificados
git add .

# O agregar archivos específicos
git add src/components/NewMemoryModal.tsx

# Crear un commit con mensaje descriptivo
git commit -m "Add website metadata extraction feature

- Create /api/scrape-website endpoint
- Auto-detect non-YouTube URLs 
- Extract title, description, logo, and keywords
- Show website preview in modal"

# Subir al repositorio remoto
git push origin main
```

### 3. Bajar Cambios de GitHub
```bash
# Traer los últimos cambios sin aplicarlos
git fetch

# Aplicar los cambios al branch actual
git pull origin main

# O hacer ambos en un comando
git pull
```

### 4. Verificar Configuración
```bash
# Ver a qué repositorio remoto está conectado
git remote -v

# Ver en qué branch estás
git branch

# Ver el usuario configurado
git config user.name
git config user.email
```

---

## Comandos para Vercel

### 1. Verificar Proyecto Actual
```bash
# Ver a qué proyecto de Vercel está conectado
vercel
```

### 2. Cambiar de Proyecto (como hicimos)
```bash
# Conectar a un proyecto específico
vercel link --project foundit-at-eu2i

# Esto crea/actualiza el archivo .vercel/project.json
```

### 3. Deploy Manual
```bash
# Deploy al proyecto configurado
vercel deploy

# Deploy a producción
vercel deploy --prod
```

### 4. Ver Logs y Estado
```bash
# Ver deployments recientes
vercel list

# Ver logs de la aplicación
vercel logs
```

---

## El Flujo de Trabajo Correcto

### Desarrollo Local
1. Hacer cambios en el código
2. Probar localmente: `npm run dev`
3. Verificar que todo funciona

### Subir a GitHub
```bash
git add .
git commit -m "Descripción clara de los cambios"
git push origin main
```

### Verificar en Vercel
1. Vercel detecta automáticamente el push
2. Inicia el build automáticamente
3. Si todo está bien, despliega a producción
4. La URL de producción se actualiza automáticamente

---

## Señales de que algo está mal

### GitHub
- `git push` falla → problema de permisos o configuración
- `git status` muestra archivos no committeados → hacer commit
- `git log` no muestra tus commits → verificar branch

### Vercel
- Los cambios no aparecen en el sitio → verificar proyecto correcto
- Build falla → revisar logs de Vercel
- Variables de entorno faltantes → configurar en dashboard

---

## Comandos de Emergencia

### Si algo se rompe en GitHub
```bash
# Ver diferencias con el último commit
git diff HEAD~1

# Deshacer el último commit (mantener cambios)
git reset --soft HEAD~1

# Deshacer cambios locales (PELIGROSO - borra cambios)
git checkout -- .
```

### Si algo se rompe en Vercel
```bash
# Rollback al deployment anterior
vercel rollback [deployment-url]

# Forzar redeploy
vercel deploy --force
```

---

## Estructura de Archivos Importantes

```
├── .vercel/
│   └── project.json          # Configuración del proyecto Vercel
├── .git/                     # Configuración de Git (no tocar)
├── src/                      # Tu código fuente
├── package.json              # Dependencias
├── next.config.ts            # Configuración de Next.js
├── netlify.toml             # Configuración de Netlify (no usar)
└── README.md                # Documentación del proyecto
```

---

## Tips Importantes

1. **Siempre hacer `git status` antes de hacer commit**
2. **Usar mensajes de commit descriptivos**
3. **Probar localmente antes de hacer push**
4. **Verificar que estás en el proyecto Vercel correcto**
5. **No hacer push directo a main si estás trabajando en equipo**

---

¡Ahora ya sabes exactamente qué pasó y cómo evitarlo en el futuro!