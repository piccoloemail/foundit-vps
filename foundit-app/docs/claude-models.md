# Claude Models - Guía de Uso

## Ver el modelo actual

```bash
# Comando para ver qué modelo estás usando
claude --model
```

## Cambiar de modelo

```bash
# Cambiar a Sonnet 4 (recomendado para programación)
claude --model claude-sonnet-4

# Cambiar a Opus 4 (cuando esté disponible)
claude --model claude-opus-4

# Cambiar a Haiku (más rápido, menos potente)
claude --model claude-haiku-4
```

## Ver todos los modelos disponibles

```bash
# Lista todos los modelos disponibles
claude --help | grep model
```

## Configurar modelo por defecto

```bash
# Establecer Sonnet 4 como predeterminado
claude config set model claude-sonnet-4
```

## Ver configuración actual

```bash
# Ver toda tu configuración actual
claude config list
```

## En el chat

También puedes usar el comando slash dentro del chat:
```
/model claude-sonnet-4
```

## Modelos disponibles

### Claude Opus 4
- **Uso**: Tareas muy complejas de razonamiento
- **Ventajas**: Análisis más profundo, mejor para problemas complejos
- **Limitaciones**: Límites más restrictivos, se resetean cada 24 horas
- **Ideal para**: Arquitectura compleja, análisis profundo de código

### Claude Sonnet 4 ⭐ (Recomendado para programación)
- **Uso**: Programación y tareas técnicas
- **Ventajas**: Límites más generosos, velocidad excelente
- **Limitaciones**: Ninguna significativa para desarrollo
- **Ideal para**: Desarrollo de software, debugging, refactoring

### Claude Haiku 4
- **Uso**: Tareas rápidas y simples
- **Ventajas**: Muy rápido, límites muy generosos
- **Limitaciones**: Menos potente para tareas complejas
- **Ideal para**: Scripts simples, consultas rápidas

## Sistema de Límites

- **Reseteo**: Cada 24 horas desde el primer uso del día
- **No es medianoche**: Se basa en período de 24 horas
- **Ejemplo**: Si usaste Opus 4 a las 2:00 PM, se resetea mañana a las 2:00 PM

## Tips importantes

1. **El modelo se mantiene durante toda la conversación**
2. **Para cambiar modelo efectivamente, inicia un nuevo chat**
3. **Sonnet 4 es perfecto para desarrollo de software**
4. **Claude te avisa automáticamente cuando cambias de modelo por límites**

## Configuración recomendada para desarrollo

```bash
# Configurar Sonnet 4 como predeterminado
claude config set model claude-sonnet-4
```

Esto asegura que siempre tengas el mejor balance entre capacidad y límites para programación.