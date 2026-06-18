# TODOS — Arza Sheets

## En progreso
- [ ] Integrar Google Sheets para escribir hoja de auditoría auxiliar
  - [ ] Crear hoja "Auditoría Arza" en Drive
  - [ ] Escribir sugerencias sin tocar originales
- [ ] Agregar roles básicos en Firebase
  - [ ] Rossy: todo
  - [ ] Margarita: catálogo/precios
  - [ ] Kari/Joli: solo bodega

## Por hacer
- [ ] Exportar reporte de auditoría a Google Sheets auxiliar
- [ ] Notificar por email/ WhatsApp-style cuando hay hallazgos críticos

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
  - [x] POST `/api/audit` (consolidado)
  - [x] POST `/api/audit/suggest-codes`
- [x] Mejorar frontend con herramientas de corrección
  - [x] Centro de Control con alertas reales
  - [x] Vista de Auditoría accionable (pestaña propia)
  - [x] Acciones de aprobación explícita por Rossy
  - [x] Corrección de precios, homologación de códigos, conciliación de bodega
- [x] Verificar lint y build
- [x] Guardar memoria en GBrain
- [x] Commit
