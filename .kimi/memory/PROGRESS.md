# PROGRESS — Arza Sheets

## Fase: Audit Tools
**Branch**: `feature/audit-tools`
**Última actualización**: 2026-06-17

### Completado
- [x] Backend: endpoints `/api/audit` y `/api/audit/suggest-codes`.
- [x] Backend: motor de auditoría local (`agent/audit.ts`) + integración Gemini (`agent/audit-engine.ts`).
- [x] Esquemas Zod para reportes de auditoría y sugerencias de código (`agent/schema.ts`).
- [x] Prompts de auditoría para Gemini (`agent/prompts.ts`).
- [x] Frontend: `ArzaAuditor.tsx` reescrito con tabs y acciones de aprobación.
- [x] Frontend: pestaña "Auditoría" en navegación principal (`App.tsx`).
- [x] Corrección: `handleUpdateMaterial` ahora permite agregar materiales nuevos.
- [x] Verificación: `npm run lint` ✅ y `npm run build` ✅.
- [x] Prueba local de `/api/audit` detectó price mismatch correctamente.

### Pendiente de fases siguientes
- Exportar reporte a Google Sheets auxiliar.
- Roles de Firebase.
