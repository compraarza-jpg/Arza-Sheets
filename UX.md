# UX/UI — Arza Sheets

## Filosofía de diseño

No es un ERP que reemplace a Rossy. Es un **asistente de control** que le da visibilidad y herramientas para que ella misma limpie, unifique y decida sobre sus datos. El sistema debe:

1. **Mostrar el problema, no esconderlo.** Si hay duplicados, códigos huérfanos o precios desfasados, deben ser visibles inmediatamente.
2. **Dar contexto para decidir.** Rossy necesita ver el origen del dato, las opciones y las consecuencias antes de corregir.
3. **Permitir acciones graduales.** Corregir una fila, una orden, un material, o aplicar un bulk-fix cuando esté segura.
4. **No sobrescribir fuentes originales.** La app propone, exporta y sincroniza; no borra los Excel/Sheets originales.
5. **Hablar el lenguaje del equipo.** Obras, lotes, prototipos, semanas, remisiones, faltantes — no abstracciones técnicas.

---

## Roles y necesidades

### Rossy Lares Morales — Coordinación de Compras y Materiales
- **Meta:** Generar órdenes de compra correctas, dar seguimiento a entregas y mantener el catálogo limpio.
- **Dolor:** Muchos archivos dispersos, duplicidad de materiales, códigos que no cuadran con costos, discrepancias de bodega que detecta tarde.
- **Necesita:**
  - Ver qué está desfasado de un vistazo.
  - Crear órdenes rápido desde el catálogo maestro.
  - Recibir sugerencias del agente con controles para aprobar/rechazar.
  - Exportar reportes para Margarita y proveedores.

### Margarita Lares — Costos / Presupuestos
- **Meta:** Que los códigos y precios de las órdenes coincidan con la explosión de insumos de Ruba.
- **Dolor:** Rossy usa descripciones libres, hay duplicados, no se respeta el código unificado.
- **Necesita:**
  - Ver qué materiales aún no tienen código oficial.
  - Aprobar o ajustar precios de referencia.
  - Recibir un reporte de discrepancias sin tener que abrir los Excel.

### Joli / Kari — Almacenistas
- **Meta:** Registrar lo que llega a bodega y reportar faltantes de forma simple.
- **Dolor:** Tienen que leer órdenes largas, no saben qué cantidad esperar, reportan por WhatsApp.
- **Necesita:**
  - Una vista simple de “¿qué debe llegar hoy?”.
  - Marcar recibido parcial/completo con un clic.
  - Fotos o notas rápidas de discrepancia.

---

## User flows principales

### Flow 1: Rossy llega por la mañana y revisa el estado
1. Abre Arza Sheets.
2. El **Centro de Control** muestra:
   - Alertas críticas (precios fuera de catálogo, códigos huérfanos, entregas con faltante).
   - KPIs de gasto por obra, estado de órdenes, discrepancias.
3. Si hay alertas, clica y va a la pantalla de **Auditoría**.
4. Revisa cada incidencia con contexto (obra, proveedor, orden, material).
5. Aplica corrección individual o en bloque.
6. Exporta un reporte a Google Sheets o lo copia para WhatsApp.

### Flow 2: Rossy crea una orden de compra
1. Va a **Órdenes de Compra**.
2. Clica “Nueva orden”.
3. Selecciona obra y semana.
4. Escribe el código del material (autocomplete desde catálogo).
5. El sistema llena descripción, unidad y precio pactado.
6. Ingresa cantidad y proveedor.
7. Guarda. El sistema verifica que el precio coincida con el catálogo; si no, alerta.

### Flow 3: Kari registra una entrada de bodega
1. Kari abre la vista **Bodega** (o recibe un link directo a una orden).
2. Ve las órdenes pendientes de recepción de hoy.
3. Clica en la orden y marca “Recibido completo” o “Recibido parcial”.
4. Si es parcial, ingresa cantidad recibida y una foto/nota.
5. El sistema actualiza el estado y alerta a Rossy.

### Flow 4: Margarita revisa códigos sin homologar
1. Va a **Catálogo Maestro**.
2. Filtra materiales “Sin código oficial”.
3. Revisa descripción y asigna/valida código de Ruba.
4. Guarda. El sistema propaga el código a las órdenes huérfanas relacionadas.

### Flow 5: Importar datos de un Excel/Sheet existente
1. Rossy va a **Importar**.
2. Selecciona archivo de Drive o sube Excel.
3. El sistema detecta columnas y pide confirmar el mapeo.
4. Muestra preview con problemas detectados (duplicados, celdas vacías, precios fuera de rango).
5. Rossy confirma importación parcial o total.

---

## Arquitectura de información

```
Arza Sheets
├── Centro de Control (Dashboard)
│   ├── Alertas críticas
│   ├── KPIs por obra
│   ├── Gráficas de gasto / entregas
│   └── Accesos rápidos: Nueva OC, Auditoría, Importar
├── Chat con Agente
│   ├── Historial
│   ├── Sugerencias ejecutables
│   └── Atajos de voz/texto
├── Catálogo Maestro
│   ├── Lista de materiales
│   ├── Filtros: con/sin código, por obra, por proveedor
│   ├── Edición inline
│   └── Sugerencias de unificación
├── Órdenes de Compra
│   ├── Lista de órdenes
│   ├── Filtros por obra/estado/proveedor
│   ├── Formulario de nueva orden
│   └── Detalle de orden + recepciones
├── Bodega / Recepciones
│   ├── Entradas pendientes de hoy
│   ├── Historial de recepciones
│   ├── Registro de discrepancia
│   └── Vistas por almacenista
├── Auditoría
│   ├── Precios fuera de catálogo
│   ├── Códigos huérfanos
│   ├── Faltantes de bodega
│   ├── Duplicados de materiales
│   └── Reporte exportable
├── Proveedores
│   ├── Directorio
│   ├── Evaluación (tiempos, precios, discrepancias)
│   └── Órdenes por proveedor
└── Configuración / Sincronización
    ├── Conectar Google Drive/Sheets
    ├── Seleccionar hoja maestra
    ├── Exportar/Importar
    └── Perfiles de usuario
```

---

## Pantallas y funcionalidades

### 1. Centro de Control
**Objetivo:** Dar el estado general y alertar sobre lo que requiere atención.

**Contenido:**
- Header con obra activa, usuario, modo (sandbox/conectado).
- KPI cards: costo real aprobado, fuga detectada, alertas de auditoría, catálogo unificado.
- Barra de alertas críticas (ej: “8 materiales sin código oficial”, “3 entregas con faltante”).
- Gráficas: gasto por obra, gasto por proveedor, entregas limpias vs discrepancias.
- Tarjetas de obras con progreso y estado.
- Accesos rápidos al agente y a las acciones más comunes.

**Principios UX:**
- Las alertas deben ser accionables: clic lleva a la vista de auditoría filtrada.
- Los números grandes deben compararse con un baseline (presupuesto, semana anterior).
- No mostrar todo en una sola pantalla; usar tabs o secciones colapsables.

### 2. Chat con Agente
**Objetivo:** Ser el canal natural de Rossy para preguntar, dictar y ejecutar acciones.

**Contenido:**
- Burbujas de conversación con distinción clara user/assistant.
- Cuando el agente propone una acción, se muestra una tarjeta con:
  - Qué va a hacer.
  - En qué datos afecta.
  - Botón “Aplicar” o “Modificar antes”.
- Atajos rápidos con las preguntas más frecuentes.
- Botón de micrófono para dictado.
- Indicador de si la acción ya fue ejecutada.

**Principios UX:**
- Rossy no es técnica: el lenguaje debe ser conversacional, no de base de datos.
- Cada acción propuesta debe poder editarse antes de aplicar.
- Nunca aplicar automáticamente; siempre pedir confirmación.

### 3. Catálogo Maestro
**Objetivo:** La fuente de verdad de materiales, códigos y precios.

**Contenido:**
- Tabla con columnas: código, descripción, unidad, precio pactado, obras donde se usa, estado (ok/sin código/duplicado).
- Buscador prominente.
- Filtros: obra, estado, proveedor, familia (PVC, plomería, acero, etc.).
- Acción “Unificar duplicados”: muestra candidatos y permite elegir cuál conservar.
- Acción “Asignar código oficial”: sugiere código de Ruba basado en descripción.

**Principios UX:**
- Mostrar visualmente qué materiales están limpios y cuáles no.
- La edición debe ser inline para cambios simples.
- Las acciones masivas requieren confirmación y preview.

### 4. Órdenes de Compra
**Objetivo:** Crear, revisar y dar seguimiento a órdenes.

**Contenido:**
- Lista de órdenes con estados (pendiente/parcial/completado).
- Filtros por obra, proveedor, semana, estado.
- Formulario de nueva orden con autocomplete de material.
- Validación en tiempo real: precio vs catálogo, código existente.
- Detalle de orden: material, cantidad, entregas, discrepancias.

**Principios UX:**
- El formulario debe sentirse como un Excel mejorado, no como un ERP intimidante.
- Cuando se detecta inconsistencia, mostrar sugerencia al lado del campo.
- Permitir duplicar una orden anterior.

### 5. Bodega / Recepciones
**Objetivo:** Que Joli/Kari registren entregas sin fricción.

**Contenido:**
- Vista “Hoy”: órdenes esperadas con botón grande de recibir.
- Vista “Historial”: entradas pasadas.
- Formulario de recepción: cantidad recibida, foto, observación.
- Estados: completo, parcial, discrepancia.

**Principios UX:**
- Diseño mobile-first para usar en bodega con celular.
- Botones grandes y claros.
- Fotos y notas de voz para reportar faltantes rápido.

### 6. Auditoría
**Objetivo:** Centralizar todos los problemas detectados y dar herramientas para resolverlos.

**Contenido:**
- Tabs por tipo de problema:
  - Precios alterados.
  - Claves huérfanas.
  - Faltantes de flete/bodega.
  - Materiales duplicados.
- Cada ítem muestra: qué es, dónde ocurre, impacto ($), acción recomendada.
- Botones: corregir uno, corregir todos similares, ignorar, exportar reporte.

**Principios UX:**
- Ordenar por impacto económico, no alfabéticamente.
- Mostrar el dinero en riesgo para priorizar.
- Permitir “ignorar con razón” para casos excepcionales.

### 7. Proveedores
**Objetivo:** Evaluar y comparar proveedores.

**Contenido:**
- Lista de proveedores con score.
- Métricas: entregas a tiempo, discrepancias, precio promedio vs catálogo.
- Órdenes por proveedor.

### 8. Importar / Sincronizar
**Objetivo:** Traer datos de Sheets/Excel sin romper nada.

**Contenido:**
- Seleccionar archivo de Drive o subir Excel.
- Mapeo de columnas automático con confirmación.
- Preview con errores detectados.
- Opción de importar solo filas válidas o forzar corrección.

---

## Componentes clave

### Alert Card
- Título de alerta, contador, impacto ($), botón “Ver y corregir”.
- Estados: crítico (error), atención (warning), info.

### Data Table
- Encabezados fijos, filas con hover, celdas editables inline.
- Columnas de acción al final.
- Badges de estado.
- Selección múltiple para acciones masivas.

### Suggestion Pill
- Aparece junto a un campo con problema.
- Texto: “¿Quisiste decir [código oficial]?”.
- Botones: “Sí, aplicar”, “No, ignorar”, “Ver catálogo”.

### Action Card (en chat)
- Resumen de la acción propuesta por el agente.
- Datos afectados.
- Botones: “Aplicar”, “Modificar”, “Cancelar”.

### Recepción Rápida
- Tarjeta de orden pendiente.
- Dos botones grandes: “Recibido completo” / “Faltante”.
- Al expandir: campo de cantidad, nota, foto.

### Empty State
- Ilustración ligera, mensaje claro, CTA a la acción siguiente.
- Ejemplo: “No hay órdenes pendientes. ¿Quieres crear una nueva orden?”.

---

## Estados de error y vacío

- **Sin conexión a Drive:** mostrar modo sandbox con opción de conectar y explicar qué funciona offline.
- **Sin datos importados:** wizard de importación inicial.
- **Sin alertas:** celebrar con mensaje positivo y mostrar acciones recomendadas.
- **Error del agente:** mensaje amigable, opción de reintentar, fallback a sugerencias predefinidas.
- **Fila con datos incompletos:** resaltar celda, mostrar tooltip con qué falta.

---

## Métricas de éxito

- Rossy identifica y corrige una incidencia en menos de 3 clics.
- Kari registra una recepción en menos de 30 segundos.
- Margarita puede exportar un reporte de discrepancias sin ayuda.
- El número de códigos huérfanos disminuye semana a semana.
- Las órdenes nuevas usan el catálogo maestro en >90% de los casos.
