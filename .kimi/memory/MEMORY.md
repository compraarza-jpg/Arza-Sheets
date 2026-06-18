# Memoria — Arza Sheets

## Proyecto
**Arza Sheets** — Centro de control para Constructora Arza.
Dashboard React + Express para control de materiales, órdenes de compra, recepciones de bodega y auditoría asistida por IA.

## Stack
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS v4
- Backend: Express + TypeScript (`server.ts`)
- Agente LLM: Google Gemini (`@google/genai`)
- Auth/BD: Firebase Auth + Firestore
- Integraciones: Google Drive API + Google Sheets API

## Usuarios clave
- **Rossy Lares Morales**: compras/materiales, usuaria principal.
- **Margarita Lares**: costos, define códigos oficiales y precios.
- **Joli / Kari**: almacenistas, registran recepciones.

## Principio de diseño aprobado
El sistema **NO arregla automáticamente** las inconsistencias de los Excel/Sheets. Le da a Rossy y al equipo las herramientas para detectar, entender y corregir con contexto y aprobación explícita.

## Decisiones técnicas
- Design system en `DESIGN.md` (verde bosque `#2D5A3D`, Geist + Space Grotesk).
- UX documentado en `UX.md`.
- Tokens CSS actualizados en `src/index.css` para alinear con `DESIGN.md`.
- Auditoría con fallback local: si no hay `GEMINI_API_KEY`, el backend usa reglas locales en `agent/audit.ts`.
- Endpoints de auditoría: `POST /api/audit`, `POST /api/audit/suggest-codes`, `POST /api/audit/export-to-sheets`.
- Frontend `ArzaAuditor.tsx` separado en pestaña propia (`Auditoría`) con tres sub-vistas: hallazgos, duplicados, sugerir códigos.
- Cada corrección requiere clic de aprobación; los cambios se reflejan en estado local y Firestore, nunca en Sheets originales sin permiso.
- Exportar a Google Sheets crea una hoja auxiliar "Auditoría Arza" con tres pestañas: Hallazgos, Duplicados, Sugerencias.
- Roles básicos en Firebase:
  - `rossy`: acceso total y puede aprobar correcciones.
  - `margarita`: Dashboard, Catálogo y Auditoría (solo lectura).
  - `bodega`: solo pestaña Entradas de Bodega.
  - Los perfiles se guardan en Firestore (`users/{uid}`) y se crean automáticamente al iniciar sesión.
- Log de correcciones: cada aprobación guarda before/after en Firestore (`audit_logs`).
- Notificaciones críticas: badge en header de auditoría + persistencia en `critical_notifications`.

## Estado actual
- Backend con agente Gemini (`/api/gemini/chat`) + endpoints de auditoría.
- Frontend con Dashboard, Chat, Catálogo, Órdenes, Bodega y Auditoría.
- Integración con Firebase y Google Drive/Sheets funcional.
- `npm run lint` y `npm run build` pasan.

## Próximas fases
1. Envío real de notificaciones por email/WhatsApp para hallazgos críticos.
