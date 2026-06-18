# Agente de Sheets — Centro de Control Arza

> Asistente inteligente para el control de inventarios, compras y materiales de Constructora Arza.

## Descripción

Este proyecto es un MVP desarrollado originalmente en Google AI Studio y desplegado en Firebase. El objetivo actual es llevarlo a producción **sin cambiar la arquitectura de Firebase** (Hosting, Auth, Firestore), concentrando las mejoras en el **harness del agente conversacional** que impulsa a "Rossy".

El agente ayuda a Rossy Lares Morales a:
- Validar y sincronizar códigos de materiales contra el catálogo maestro.
- Crear órdenes de compra autocompletadas.
- Registrar entradas de bodega y discrepancias reportadas por Joli y Kari.
- Detectar sobreprecios, códigos huérfanos y faltantes.
- Sincronizar todo con Google Sheets y Google Drive.

## Stack Técnico

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Express + TypeScript (`server.ts`)
- **Agente LLM:** Google Gemini (`@google/genai`)
- **Autenticación y BD:** Firebase Auth + Firestore
- **Integraciones:** Google Drive API + Google Sheets API

## Estado

- Iniciado: 2026-06-17
- Fase actual: Refactor del harness del agente para producción

## Mejoras recientes del harness

| Área | Antes | Ahora |
|---|---|---|
| Prompt | Un string monolítico de ~130 líneas | Modular: persona, reglas, contexto, formato y ejemplos |
| Validación | `JSON.parse` sin esquema | Esquemas Zod con `safeParse` |
| Fallback | Palabras clave rígidas | Demo engine con contexto real del catálogo |
| Logs | Ninguno | Logs estructurados por request |
| Extensibilidad | Difícil | Módulos separados en `agent/` |

### Estructura del agente

```
agent/
├── index.ts       # Punto de entrada y fábrica de engines
├── types.ts       # Tipos del agente
├── schema.ts      # Validación Zod de respuestas
├── prompts.ts     # Prompts modulares
├── engine.ts      # Engine con Gemini (producción)
└── demo-engine.ts # Engine local cuando no hay API key
```

## Scripts

```bash
npm install
npm run dev        # Inicia servidor de desarrollo en http://localhost:3000
npm run lint       # Verificación de TypeScript
npm run build      # Build de producción
```

## Variables de entorno

Crea un archivo `.env.local` basado en `.env.example`:

```env
GEMINI_API_KEY=tu_api_key_de_google_ai_studio
GEMINI_MODEL=gemini-2.5-pro   # opcional, default: gemini-2.5-pro
```

Si no se configura `GEMINI_API_KEY`, el servidor opera en **modo demo** con respuestas locales.

## Memoria

Ver [.kimi/memory/](.kimi/memory/)
