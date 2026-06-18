# TODOS — Arza Sheets

## En progreso
- [ ] Notificar por email/ WhatsApp-style cuando hay hallazgos críticos

## Por hacer
- [ ] Persistir log de correcciones aprobadas por Rossy

## Completado
- [x] Design system (`DESIGN.md`, `CLAUDE.md`)
- [x] UX completo (`UX.md`)
- [x] Prototipo HTML navegable
- [x] Alinear tokens CSS con design system
- [x] Extender agente Gemini con capacidades de auditoría
  - [x] Detectar duplicados por similitud de descripción
  - [x] Sugerir códigos oficiales para materiales sin código
  - [x] Comparar precios de órdenes vs catálogo
  - [x] Detectar faltantes de bodega
- [x] Agregar endpoints de auditoría en backend
  - [x] POST `/api/audit`
  - [x] POST `/api/audit/suggest-codes`
  - [x] POST `/api/audit/export-to-sheets`
- [x] Integrar Google Sheets para escribir hoja de auditoría auxiliar
  - [x] Crear hoja "Auditoría Arza" en Drive
  - [x] Escribir hallazgos, duplicados y sugerencias sin tocar originales
- [x] Mejorar frontend con herramientas de corrección
  - [x] Centro de Control con alertas reales
  - [x] Vista de Auditoría accionable
  - [x] Catálogo con sugerencias de IA
  - [x] Bodega simplificada para almacenistas
- [x] Agregar roles básicos en Firebase
  - [x] Rossy: todo
  - [x] Margarita: catálogo/precios + ver auditoría
  - [x] Kari/Joli: solo bodega
- [x] Verificar lint y build
- [x] Guardar memoria en GBrain
- [x] Commit
