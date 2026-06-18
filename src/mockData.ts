/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Material, PurchaseOrder, WarehouseEntry } from './types';

export const INITIAL_MATERIALS: Material[] = [
  // PVC/Electrical/Plumbing Plumbing codes mentioned in transcript (e.g. 1350150, 1350750)
  { code: '1350150', description: 'Codo de 2" x 45 PVC Sanitario', unit: 'PZ', price: 18.50 },
  { code: '1350750', description: 'Codo de 4" x 90 PVC Sanitario', unit: 'PZ', price: 34.20 },
  { code: '1350110', description: 'Tubo PVC Sanitario 2" x 6m', unit: 'TRAMO', price: 145.00 },
  { code: '1350120', description: 'Tubo PVC Sanitario 4" x 6m', unit: 'TRAMO', price: 295.00 },
  { code: '1350220', description: 'Yee de 4" x 4" PVC Sanitario', unit: 'PZ', price: 58.00 },
  
  // Tubo Plus (Hydraulics PN20 20mm/25mm)
  { code: '1420120', description: 'Tubo Tubo Plus Hidráulico PN20 25mm x 4m', unit: 'TRAMO', price: 168.00 },
  { code: '1420110', description: 'Tubo Tubo Plus Hidráulico PN20 20mm x 4m', unit: 'TRAMO', price: 112.00 },
  { code: '1420320', description: 'Llave de Paso Tubo Plus 25mm', unit: 'PZ', price: 115.00 },
  { code: '1420410', description: 'Codo 90 Tubo Plus 25mm', unit: 'PZ', price: 14.50 },
  { code: '1420500', description: 'Tee Tubo Plus 25mm', unit: 'PZ', price: 19.80 },

  // Generics (Steel, Cement, Consumables)
  { code: '2100100', description: 'Cemento Portland Gris APASCO 50kg', unit: 'SACO', price: 245.00 },
  { code: '2100200', description: 'Varilla Corrugada No. 3 (3/8") Grado 42', unit: 'TON', price: 21500.00 },
  { code: '2100340', description: 'Alambrón de 1/4" para Estribos', unit: 'KG', price: 26.50 },
  { code: '2100450', description: 'Alambre Recocido Calibre 18', unit: 'KG', price: 31.00 },
  
  // Specific Finishes (varying per project types Ignis, Terra, Aquatec)
  { code: '3150110', description: 'Monomando para Lavabo Metálico Satín (Ignis)', unit: 'PZ', price: 890.00 },
  { code: '3150120', description: 'Monomando para Fregadero Alto Lujo (Terra)', unit: 'PZ', price: 1450.00 },
  { code: '3150240', description: 'Coladera de Latón Cromado con Trampa', unit: 'PZ', price: 320.00 },
  { code: '3150400', description: 'Boiler de Paso Rápido COBY 6L LP', unit: 'PZ', price: 2350.00 },
  { code: '3150500', description: 'Inodoro de Dos Piezas Grado Ecológico Blanco', unit: 'PZ', price: 1850.00 }
];

export const INITIAL_ORDERS: PurchaseOrder[] = [
  {
    id: 'OC-2026-001',
    date: '2026-06-01',
    week: 22,
    project: 'Solum T18',
    supplier: 'PVC y Plomería de Occidente',
    code: '1350150',
    description: 'Codo de 2" x 45 PVC Sanitario',
    unit: 'PZ',
    quantity: 120,
    price: 18.50,
    total: 2220.00,
    receivedQuantity: 100, // Discrepancy mentioned in the meeting! "recibí 100 en lugar de 120"
    status: 'parcial',
    observation: 'El transportista solo entregó 100 de los 120 pactados. Pendiente reclamo.'
  },
  {
    id: 'OC-2026-002',
    date: '2026-06-02',
    week: 22,
    project: 'Solum T40',
    supplier: 'Comercializadora Ruba',
    code: '2100100',
    description: 'Cemento Portland Gris APASCO 50kg',
    unit: 'SACO',
    quantity: 80,
    price: 245.00,
    total: 19600.00,
    receivedQuantity: 80,
    status: 'completado',
    observation: 'Recibido completo por Joli (almacenista).'
  },
  {
    id: 'OC-2026-003',
    date: '2026-06-08',
    week: 23,
    project: 'Maple',
    supplier: 'Aceros y Materiales de Saltillo',
    code: '2100200',
    description: 'Varilla Corrugada No. 3 (3/8") Grado 42',
    unit: 'TON',
    quantity: 5,
    price: 21500.00,
    total: 107500.00,
    receivedQuantity: 5,
    status: 'completado',
    observation: 'Pesaje directo en báscula coincide.'
  },
  {
    id: 'OC-2026-004',
    date: '2026-06-10',
    week: 23,
    project: 'Ignis',
    supplier: 'Distribuidora Industrial Alar',
    code: '3150110',
    description: 'Monomando para Lavabo Metálico Satín (Ignis)',
    unit: 'PZ',
    quantity: 15,
    price: 890.00,
    total: 13350.00,
    receivedQuantity: 0,
    status: 'pendiente',
    observation: 'Programado por el proveedor para el viernes.'
  },
  {
    id: 'OC-2026-005',
    date: '2026-06-12',
    week: 23,
    project: 'Terra',
    supplier: 'PVC y Plomería de Occidente',
    code: '1420120',
    description: 'Tubo Tubo Plus Hidráulico PN20 25mm x 4m',
    unit: 'TRAMO',
    quantity: 50,
    price: 168.00,
    total: 8400.00,
    receivedQuantity: 50,
    status: 'completado',
    observation: 'Sin siniestros.'
  },
  {
    id: 'OC-2026-006',
    date: '2026-06-14',
    week: 24,
    project: 'Aquatec',
    supplier: 'Distribuidora Industrial Alar',
    code: '3150240',
    description: 'Coladera de Latón Cromado con Trampa',
    unit: 'PZ',
    quantity: 30,
    price: 320.00,
    total: 9600.00,
    receivedQuantity: 25,
    status: 'parcial',
    observation: 'Llegaron 5 golpeadas. Se devolvieron con el chofer.'
  },
  {
    id: 'OC-2026-007',
    date: '2026-06-15',
    week: 24,
    project: 'Terra',
    supplier: 'PVC y Plomería de Occidente',
    code: '1350110',
    description: 'Tubo PVC Sanitario 2" x 6m', // official price 145.00
    unit: 'TRAMO',
    quantity: 120,
    price: 195.00, // overcharged!
    total: 23400.00,
    receivedQuantity: 120,
    status: 'completado',
    observation: 'Margarita ingresó precio de $195.00 en factura, favor de auditar.'
  },
  {
    id: 'OC-2026-008',
    date: '2026-06-16',
    week: 24,
    project: 'Solum T18',
    supplier: 'PVC y Plomería de Occidente',
    code: 'ERR-750', // Wrong master code, should match 1350750
    description: 'Codo de 4" x 90 PVC Sanitario',
    unit: 'PZ',
    quantity: 150,
    price: 34.20,
    total: 5130.00,
    receivedQuantity: 150,
    status: 'completado',
    observation: 'Guardado con clave errónea ERR-750 por Rosy.'
  }
];

export const INITIAL_WAREHOUSE: WarehouseEntry[] = [
  {
    id: 'ENT-001',
    date: '2026-06-03',
    orderId: 'OC-2026-001',
    code: '1350150',
    description: 'Codo de 2" x 45 PVC Sanitario',
    expectedQuantity: 120,
    receivedQuantity: 100,
    status: 'discrepancia',
    observer: 'Kari (Bodega)',
    observation: 'Solo llegaron 100 de 120 en la tarima.'
  },
  {
    id: 'ENT-002',
    date: '2026-06-03',
    orderId: 'OC-2026-002',
    code: '2100100',
    description: 'Cemento Portland Gris APASCO 50kg',
    expectedQuantity: 80,
    receivedQuantity: 80,
    status: 'completo',
    observer: 'Joli (Bodega)',
    observation: 'Estibado correcto en bodega Solum.'
  },
  {
    id: 'ENT-003',
    date: '2026-06-10',
    orderId: 'OC-2026-003',
    code: '2100200',
    description: 'Varilla Corrugada No. 3 (3/8") Grado 42',
    expectedQuantity: 5,
    receivedQuantity: 5,
    status: 'completo',
    observer: 'Joli (Bodega)',
    observation: 'Coincide peso neto en remisión.'
  }
];

// Provide initial conversation starter mimicking We Law and Rossy/Mago
export const INITIAL_CHAT: { role: 'user' | 'assistant'; content: string }[] = [
  {
    role: 'assistant',
    content: `¡Hola Rossy! 👋 Bienvenido a tu **Agente Inteligente de Sheets para Arza**.

He analizado tu transcripción con José Pablo (We Law) y Margarita (Mago) del **11 de junio de 2026**. Sé que trabajas en el **Centro de Control Arza** administrando compras, códigos de material y entradas a bodega para proyectos como **Solum, Ignis, Terra y Maple**.

Sé que odias la captura manual y prefieres usar **copiar y pegar (copy-paste)**. ¡Mi objetivo es ser tu experto de cabecera!

He cargado un **Simulador Sandbox de tus datos de Arza**. Con este simulador o conectándote directamente a tu cuenta de **Google Sheets** (usando el botón de arriba), podemos:
1. **Validar y Sincronizar Códigos**: Asignar los códigos correctos del catálogo (como el \`1350150\` para codos de PVC) para evitar productos duplicados.
2. **Crear Órdenes de Compra**: Sin teclear de más, autocompletando descripción y costo del Catálogo Maestro.
3. **Controlar Entradas a Bodega**: Registrar recibos con discrepancias, como cuando Kari o Joli reportan que llegaron solo 100 en lugar de 120 sacos o codos.
4. **Resumen Gráfico del Centro de Control**: Ver de un vistazo el gasto por obra, semanas o proveedores.

¿En qué archivo de Excel/Sheets te gustaría que trabajemos hoy? Puedes pedirme cosas como:
* *"Analiza mi lista de materiales y busca códigos incorrectos"*
* *"Crea una orden de compra para Cemento en la obra Solum T18"*
* *"Registra que llegaron 100 codos de PVC en lugar de 120"*
* *"Muéstrame el dashboard del gasto total por obra"*`
  }
];
