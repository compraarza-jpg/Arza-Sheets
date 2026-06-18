# PROGRESS — Arza Sheets

## Fase: Audit Tools
**Branch**: `feature/audit-tools`
**Última actualización**: 2026-06-17

### Completado
- [x] Backend: endpoints `/api/audit`, `/api/audit/suggest-codes`, `/api/audit/export-to-sheets`.
- [x] Backend: motor de auditoría local (`agent/audit.ts`) + integración Gemini (`agent/audit-engine.ts`).
- [x] Esquemas Zod para reportes de auditoría y sugerencias de código (`agent/schema.ts`).
- [x] Prompts de auditoría para Gemini (`agent/prompts.ts`).
- [x] Frontend: `ArzaAuditor.tsx` reescrito con tabs y acciones de aprobación.
- [x] Frontend: pestaña "Auditoría" en navegación principal (`App.tsx`).
- [x] Frontend: exportar reporte a Google Sheets auxiliar desde el panel de auditoría.
- [x] Frontend: roles básicos de Firebase (`rossy`, `margarita`, `bodega`) con acceso condicional a tabs y acciones.
- [x] Backend/Frontend: perfiles de usuario en Firestore con creación automática al login.
- [x] Log de correcciones: `saveAuditLog` guarda before/after en Firestore.
- [x] Notificaciones críticas in-app: badge en header + persistencia en `critical_notifications`.
- [x] Corrección: `handleUpdateMaterial` ahora permite agregar materiales nuevos.
- [x] Verificación: `npm run lint` ✅ y `npm run build` ✅.
- [x] Prueba local de `/api/audit` detectó price mismatch correctamente.

### Pendiente de fases siguientes
1. Envío real de notificaciones por email/WhatsApp para hallazgos críticos.
