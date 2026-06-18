# Design System — Arza Sheets

## Product Context

- **What this is:** Dashboard web app para el control de materiales, órdenes de compra, recepciones de bodega y auditoría de precios/códigos de Constructora Arza. El agente conversacional ("Rossy") ayuda a generar órdenes, validar catálogos y detectar discrepancias.
- **Who it's for:** Rossy Lares Morales (compras/materiales), Margarita Lares (costos), y los almacenistas Joli y Kari (recepción en bodega). Usuarios no técnicos que trabajan con datos densos y tablas de Excel durante horas.
- **Space/industry:** Construcción residencial / procurement / gestión de inventarios. Peers: ERPs de construcción (Viewpoint, Procore), dashboards de procurement (Power BI, Tableau), y herramientas internas de materiales.
- **Project type:** Web app / dashboard interno con chat integrado.

## Aesthetic Direction

- **Direction:** Industrial utilitarian refinado.
- **Decoration level:** Intencional.
- **Mood:** Una herramienta de trabajo seria y confiable, que se siente ordenada y precisa como una hoja de cálculo bien hecha, pero con la calidez de una marca de construcción con 30+ años de trayectoria. No debe verse como otro ERP corporativo genérico.
- **Reference sites / research:**
  - [UXmatters — Designing the ERP Dashboard User Experience](https://www.uxmatters.com/mt/archives/2025/02/designing-the-erp-dashboard-user-experience.php)
  - [Klipfolio — Inventory Dashboard Examples](https://www.klipfolio.com/resources/dashboard-examples/supply-chain/inventory-dashboard)
  - [Quantize Analytics — Inventory Dashboard Examples](https://www.quantizeanalytics.co.uk/inventory-dashboard-examples/)
  - [Upsolve — Procurement Dashboard Examples](https://upsolve.ai/blog/procurement-dashboard)
  - [SelectView — Construction ERP Dashboards](https://selectviewdata.com/power-bi-dashboards/)

## Typography

- **Display/Hero:** **Satoshi** (ideal) con **Space Grotesk** como fallback CDN — geométrico, fuerte, moderno. Para títulos de página, hero y marcas de sección.
- **Body:** **Geist** — legible, neutro, optimizado para interfaces. Para párrafos, labels, botones y navegación.
- **UI/Labels:** **Geist** (same as body), peso 500–600.
- **Data/Tables:** **Geist Mono** — obligatorio para cantidades, precios, códigos de material, fechas y cualquier columna que deba alinearse verticalmente. Siempre usar `font-variant-numeric: tabular-nums`.
- **Code:** **Geist Mono**.
- **Loading:** Google Fonts CDN para Geist, Geist Mono y Space Grotesk. Satoshi requiere hosteo propio o Fontshare.
- **Scale:**
  - `xs`: 12px / 0.75rem — captions, badges, timestamps
  - `sm`: 14px / 0.875rem — body compacto, tablas, labels
  - `base`: 16px / 1rem — body estándar
  - `lg`: 18px / 1.125rem — subtítulos
  - `xl`: 20px / 1.25rem — H3
  - `2xl`: 24px / 1.5rem — H2
  - `3xl`: 30px / 1.875rem — H1 móvil
  - `4xl`: 36px / 2.25rem — H1 desktop
  - `5xl`: 48px / 3rem — hero
  - `6xl`: 56px / 3.5rem — hero grande

## Color

- **Approach:** Restrained with a single strong primary.
- **Primary:** `#2D5A3D` (verde bosque Arza) — confianza, construcción, crecimiento, estabilidad. Uso: botones primarios, estados success, acentos estructurales, foco.
- **Primary light:** `#3D7A54` — hover y estados activos.
- **Primary dark:** `#1F3F2B` — texto sobre fondos verdes o elementos de alto énfasis.
- **Secondary:** `#C4A35A` (ámbar tierra) — alertas de atención, acentos cálidos, estados warning. Uso: badges de "pendiente", indicadores de discrepancia leve, highlights.
- **Secondary light:** `#D9BC7A` — hover de secondary.
- **Neutrals (warm):**
  - Background: `#FAF9F7`
  - Surface: `#F2F0EC`
  - Surface raised: `#FFFFFF`
  - Border: `#E5E2DC`
  - Border strong: `#D6D2CA`
  - Muted text: `#8C877E`
  - Text: `#3D3B36`
- **Semantic:**
  - Success: `#2D5A3D`
  - Warning: `#C4A35A`
  - Error: `#B54242`
  - Info: `#3A6EA5`
- **Dark mode:** Reducir saturación 10–20%. Invertir superficies:
  - Background: `#1A1917`
  - Surface: `#242320`
  - Surface raised: `#2C2A26`
  - Border: `#36342F`
  - Border strong: `#47443E`
  - Text: `#E8E6E1`
  - Muted: `#9A958C`
  - Primary: `#4A8A63` (más luminoso para contraste)
  - Secondary: `#D9BC7A`

## Spacing

- **Base unit:** 4px.
- **Density:** Comfortable-compact. Los dashboards de materiales necesitan mostrar muchos datos, pero sin sentirse agobiantes.
- **Scale:**
  - `2xs`: 2px
  - `xs`: 4px
  - `sm`: 8px
  - `md`: 12px
  - `lg`: 16px
  - `xl`: 24px
  - `2xl`: 32px
  - `3xl`: 48px
  - `4xl`: 64px

## Layout

- **Approach:** Grid-disciplined para la app; creative-editorial solo si algún día se hace landing/marketing.
- **Grid:** 12 columnas en desktop, 8 en tablet, 4 en móvil.
- **Max content width:** 1440px para dashboards; 1200px para contenido de marketing/docs.
- **Border radius hierarchy:**
  - `sm`: 6px — inputs, badges, chips
  - `md`: 10px — botones, cards pequeñas
  - `lg`: 14px — cards, modales, paneles
  - `full`: 9999px — avatares, badges pill, toggles

## Motion

- **Approach:** Intencional. Solo animaciones que ayuden a comprender cambios de estado; nada decorativo que distraiga del trabajo.
- **Easing:**
  - Enter: `ease-out`
  - Exit: `ease-in`
  - Move: `ease-in-out`
- **Duration:**
  - Micro: 50–100ms — hover de botones, cambios de color
  - Short: 150–250ms — aparición de tooltips, expansión de rows
  - Medium: 250–400ms — apertura de modales, paneles laterales
  - Long: 400–700ms — page transitions, skeleton loaders

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-17 | Initial design system created | Creado por /design-consultation a partir de la transcripción con Rossy y Margarita, el análisis de los Excel de Drive y el estado actual del código (Geist + Arza green). |
| 2026-06-17 | Verde bosque como primary | Conecta con el nombre y la naturaleza de construcción de Arza; se diferencia del azul/gris genérico de ERPs. |
| 2026-06-17 | Geist Mono para datos | Los usuarios trabajan con códigos, cantidades y precios que deben alinearse; el monospace con tabular-nums reduce errores de lectura. |
| 2026-06-17 | Space Grotesk como display fallback | Satoshi no está en Google Fonts; Space Grotesk es geométrico, fuerte y gratuito por CDN. |
| 2026-06-17 | Estilo "blueprint" con bordes finos | Refuerza la precisión industrial sin caer en sombras pesadas o Material Design genérico. |
