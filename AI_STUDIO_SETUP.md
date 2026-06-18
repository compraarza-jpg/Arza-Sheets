# Arza Sheets — Instrucciones para AI Studio

## Estado del repositorio

Este repositorio contiene la versión completa de Arza Sheets con las herramientas de auditoría implementadas.

Rama principal: `main`
Commit de referencia: `1edaccb` (merge de `feature/audit-tools`)

## Cambios incluidos

- Backend: endpoints `/api/audit`, `/api/audit/suggest-codes`, `/api/audit/export-to-sheets`.
- Frontend: pestaña "Auditoría" con hallazgos, duplicados y sugerencias de códigos.
- Correcciones con aprobación explícita (Rossy).
- Exportar auditoría a Google Sheets auxiliar.
- Roles de Firebase: `rossy`, `margarita`, `bodega`.
- Log de correcciones en Firestore.
- Notificaciones críticas in-app.

## Cómo actualizar en AI Studio

1. En AI Studio, di al agente:
   > "Actualiza la app desde el repositorio de GitHub. Limpia caché y reinicia el servidor de desarrollo."

2. Si la interfaz no cambia, es probable caché del navegador. Prueba:
   - `Ctrl + Shift + R` (Windows/Linux)
   - `Cmd + Shift + R` (Mac)
   - O abre en ventana de incógnito.

3. Verifica que estás viendo el servidor de desarrollo actual, no una URL anterior.

## Verificación rápida

Si la importación fue correcta, en `src/App.tsx` debe aparecer la pestaña `"auditoria"` y en `src/components/ArzaAuditor.tsx` deben existir las tabs `"issues"`, `"duplicates"`, `"codes"`.

## Build local

```bash
npm install
npm run lint
npm run build
npm run dev
```

La app corre en `http://0.0.0.0:3000`.
