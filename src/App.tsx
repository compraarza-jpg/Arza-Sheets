/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

import { Material, PurchaseOrder, WarehouseEntry, Message } from './types';
import { INITIAL_MATERIALS, INITIAL_ORDERS, INITIAL_WAREHOUSE, INITIAL_CHAT } from './mockData';
import { initAuth, googleSignIn, logout } from './auth';
import {
  fetchMaterialsFromCloud,
  saveMaterialToCloud,
  fetchOrdersFromCloud,
  saveOrderToCloud,
  fetchWarehouseFromCloud,
  saveWarehouseEntryToCloud,
  ensureUserProfile,
  type UserRole,
} from './firestore';

import DriveBrowser from './components/DriveBrowser';
import AppShell, { type View, canAccessTab } from './components/layout/AppShell';

import DashboardView from './views/DashboardView';
import ChatView from './views/ChatView';
import CatalogView from './views/CatalogView';
import OrdersView from './views/OrdersView';
import WarehouseView from './views/WarehouseView';
import AuditView from './views/AuditView';
import SuppliersView from './views/SuppliersView';
import ImportSettingsView from './views/ImportSettingsView';

export default function App() {
  // Authentication & source state
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSandbox, setIsSandbox] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('rossy');

  // Sheets data states
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);
  const [orders, setOrders] = useState<PurchaseOrder[]>(INITIAL_ORDERS);
  const [warehouse, setWarehouse] = useState<WarehouseEntry[]>(INITIAL_WAREHOUSE);

  // Active view
  const [activeView, setActiveView] = useState<View>('dashboard');

  // Chat states
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMicRecording, setIsMicRecording] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<any>(null);

  // Manual order form
  const [formProject, setFormProject] = useState('Solum T18');
  const [formMaterialCode, setFormMaterialCode] = useState(INITIAL_MATERIALS[0].code);
  const [formQuantity, setFormQuantity] = useState(10);
  const [formSupplier, setFormSupplier] = useState('PVC y Plomería de Occidente');

  // Success feedback
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Google Drive & Sheets states
  const [spreadsheets, setSpreadsheets] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState(false);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string | null>(null);
  const [selectedSpreadsheetName, setSelectedSpreadsheetName] = useState<string | null>(null);
  const [isSyncingToSheets, setIsSyncingToSheets] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Enforce role-based view access
  useEffect(() => {
    if (!canAccessTab(activeView, userRole)) {
      if (userRole === 'margarita') setActiveView('catalogo');
      else if (userRole === 'bodega') setActiveView('bodega');
      else setActiveView('dashboard');
    }
  }, [activeView, userRole]);

  // Fetch spreadsheets list from Google Drive
  const fetchSpreadsheetsFromDrive = async (accessToken: string) => {
    try {
      setIsLoadingSpreadsheets(true);
      const res = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=mimeType%3D'application%2Fvnd.google-apps.spreadsheet'&fields=files(id%2Cname)&pageSize=30",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSpreadsheets(data.files || []);
      }
    } catch (err) {
      console.error('Error listing files from Drive:', err);
    } finally {
      setIsLoadingSpreadsheets(false);
    }
  };

  // Create an official Arza Spreadsheet inside Rossy's Google Drive
  const createSpreadsheetInDrive = async (accessToken: string) => {
    try {
      setIsSyncingToSheets(true);
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          properties: {
            title: 'Control de Inventarios y Compras - Arza',
          },
          sheets: [
            { properties: { title: 'Catálogo de Materiales' } },
            { properties: { title: 'Órdenes de Compra' } },
            { properties: { title: 'Entradas de Bodega' } },
          ],
        }),
      });

      if (createRes.ok) {
        const sheet = await createRes.json();
        setSelectedSpreadsheetId(sheet.spreadsheetId);
        setSelectedSpreadsheetName(sheet.properties.title);
        showToast('¡Hoja de cálculo de Arza creada con éxito!');
        await writeDataToGoogleSheets(sheet.spreadsheetId, accessToken);
        await fetchSpreadsheetsFromDrive(accessToken);
      } else {
        showToast('No se pudo crear la hoja de cálculo. Revisa tu saldo/permisos.');
      }
    } catch (err) {
      console.error('Error creating sheet:', err);
      showToast('Detalle al conectar tu Google Drive.');
    } finally {
      setIsSyncingToSheets(false);
    }
  };

  // Upload/overwrite materials, orders and warehouse logs to Google Sheets
  const writeDataToGoogleSheets = async (spreadsheetId: string, accessToken: string) => {
    try {
      setIsSyncingToSheets(true);

      const materialsValues = [
        ['Código Arza', 'Descripción', 'Unidad', 'Precio Pactado'],
        ...materials.map((m) => [m.code, m.description, m.unit, m.price]),
      ];

      const ordersValues = [
        [
          'ID Orden',
          'Obra / Proyecto',
          'Código Material',
          'Descripción',
          'Unidad',
          'Cantidad Solicitada',
          'Precio Pactado',
          'Cantidad Recibida',
          'Estado',
          'Proveedor',
          'Semana',
          'Comentarios / Observaciones',
          'Monto Total',
          'Fecha de Emisión',
        ],
        ...orders.map((o) => [
          o.id,
          o.project,
          o.code,
          o.description,
          o.unit,
          o.quantity,
          o.price,
          o.receivedQuantity,
          o.status,
          o.supplier,
          o.week,
          o.observation,
          o.total,
          o.date,
        ]),
      ];

      const warehouseValues = [
        [
          'ID Entrada',
          'ID Orden',
          'Obra / Proyecto',
          'Código Material',
          'Descripción',
          'Cantidad Recibida',
          'Estado Recibo',
          'Observación / Comentario',
          'Fecha Entrada',
          'Responsable',
        ],
        ...warehouse.map((w) => [
          w.id,
          w.orderId,
          w.project,
          w.materialCode,
          w.materialName,
          w.receivedQuantity,
          w.status,
          w.observation,
          w.date,
          w.receivedBy,
        ]),
      ];

      const updateSheetData = async (range: string, values: any[][]) => {
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
            range
          )}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ values }),
          }
        );
      };

      await updateSheetData(
        'Catálogo de Materiales!A1:D' + (materialsValues.length + 5),
        materialsValues
      );
      await updateSheetData('Órdenes de Compra!A1:N' + (ordersValues.length + 5), ordersValues);
      await updateSheetData(
        'Entradas de Bodega!A1:J' + (warehouseValues.length + 5),
        warehouseValues
      );

      showToast('¡Tablas exportadas a Google Sheets!');
    } catch (err) {
      console.error('Error writing values to Google Sheets:', err);
      showToast('Tuvimos un error al escribir las columnas.');
    } finally {
      setIsSyncingToSheets(false);
    }
  };

  // Import / Read all values from a connected Google Sheets spreadsheet
  const readDataFromGoogleSheets = async (spreadsheetId: string, accessToken: string) => {
    try {
      setIsSyncingToSheets(true);

      const fetchSheetValues = async (range: string) => {
        const res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (res.ok) {
          return await res.json();
        }
        return null;
      };

      const matsData = await fetchSheetValues('Catálogo de Materiales!A2:D500');
      if (matsData && matsData.values) {
        const parsedMats: Material[] = matsData.values
          .map((row: any) => ({
            code: row[0] || '',
            description: row[1] || '',
            unit: row[2] || 'PZ',
            price: Number(row[3]) || 0,
          }))
          .filter((m: any) => m.code);
        if (parsedMats.length > 0) setMaterials(parsedMats);
      }

      const ordersData = await fetchSheetValues('Órdenes de Compra!A2:N1000');
      if (ordersData && ordersData.values) {
        const parsedOrders: PurchaseOrder[] = ordersData.values
          .map((row: any) => ({
            id: row[0] || '',
            project: row[1] || '',
            code: row[2] || '',
            description: row[3] || '',
            unit: row[4] || 'PZ',
            quantity: Number(row[5]) || 0,
            price: Number(row[6]) || 0,
            receivedQuantity: Number(row[7]) || 0,
            status: (row[8] || 'pendiente') as any,
            supplier: row[9] || '',
            week: row[10] || '',
            observation: row[11] || '',
            total: Number(row[12]) || 0,
            date: row[13] || new Date().toISOString().split('T')[0],
          }))
          .filter((o: any) => o.id);
        if (parsedOrders.length > 0) setOrders(parsedOrders);
      }

      const whData = await fetchSheetValues('Entradas de Bodega!A2:J1000');
      if (whData && whData.values) {
        const parsedWH: WarehouseEntry[] = whData.values
          .map((row: any) => ({
            id: row[0] || '',
            orderId: row[1] || '',
            project: row[2] || '',
            materialCode: row[3] || '',
            materialName: row[4] || '',
            receivedQuantity: Number(row[5]) || 0,
            status: (row[6] || 'completo') as any,
            observation: row[7] || '',
            date: row[8] || new Date().toISOString().split('T')[0],
            receivedBy: row[9] || 'Kari',
          }))
          .filter((e: any) => e.id);
        if (parsedWH.length > 0) setWarehouse(parsedWH);
      }

      showToast('¡Datos importados de Google Sheets con éxito!');
    } catch (err) {
      console.error('Error reading sheets:', err);
      showToast('Revisa que tu hoja contenga las pestañas indicadas.');
    } finally {
      setIsSyncingToSheets(false);
    }
  };

  // Reusable Firestore synchronizer function
  const syncFromFirestore = async () => {
    try {
      const cloudMats = await fetchMaterialsFromCloud();
      if (cloudMats && cloudMats.length > 0) {
        setMaterials(cloudMats);
      } else {
        for (const m of INITIAL_MATERIALS) {
          await saveMaterialToCloud(m);
        }
      }

      const cloudOrders = await fetchOrdersFromCloud();
      if (cloudOrders && cloudOrders.length > 0) {
        setOrders(cloudOrders);
      } else {
        for (const o of INITIAL_ORDERS) {
          await saveOrderToCloud(o);
        }
      }

      const cloudWH = await fetchWarehouseFromCloud();
      if (cloudWH && cloudWH.length > 0) {
        setWarehouse(cloudWH);
      } else {
        for (const w of INITIAL_WAREHOUSE) {
          await saveWarehouseEntryToCloud(w);
        }
      }
    } catch (err) {
      console.error('Failed syncing Firestore:', err);
    }
  };

  // Integrators for Google Drive dynamic parsed data imports
  const handleImportMaterials = async (parsedMaterials: Material[]) => {
    setMaterials(parsedMaterials);
    for (const m of parsedMaterials) {
      await saveMaterialToCloud(m);
    }
    showToast(`¡Catálogo de Materiales cargado (${parsedMaterials.length} registros)!`);
  };

  const handleImportOrders = async (parsedOrders: PurchaseOrder[]) => {
    setOrders(parsedOrders);
    for (const o of parsedOrders) {
      await saveOrderToCloud(o);
    }
    showToast(`¡Órdenes de Compra cargadas (${parsedOrders.length} registros)!`);
  };

  const handleImportWarehouse = async (parsedWarehouse: WarehouseEntry[]) => {
    setWarehouse(parsedWarehouse);
    for (const w of parsedWarehouse) {
      await saveWarehouseEntryToCloud(w);
    }
    showToast(`¡Entradas de Bodega cargadas (${parsedWarehouse.length} registros)!`);
  };

  // Load chat and auth on startup
  useEffect(() => {
    setMessages(
      INITIAL_CHAT.map((m, idx) => ({
        id: `starter-${idx}`,
        role: m.role,
        content: m.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }))
    );

    initAuth(
      async (googleUser, accessToken) => {
        setUser(googleUser);
        setToken(accessToken);
        setIsSandbox(false);
        const profile = await ensureUserProfile(googleUser, 'rossy');
        setUserRole(profile.role);
        showToast(`¡Sesión activada como ${profile.role}!`);
        await syncFromFirestore();
        await fetchSpreadsheetsFromDrive(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsSandbox(true);
      }
    );
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setIsSandbox(false);
        const profile = await ensureUserProfile(result.user, 'rossy');
        setUserRole(profile.role);
        showToast(`¡Conectada como ${profile.role}!`);
        await syncFromFirestore();
        await fetchSpreadsheetsFromDrive(result.accessToken);

        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'assistant',
            content: `🟢 **¡Excelente, Rossy!** Te has conectado como **${result.user.displayName}**.

He activado los permisos para mapear tu hoja de cálculo real de Arza en Google Drive. Estoy analizando de fondo tus archivos "Solum 18 viviendas" y "Catálogo de Materiales 2026".

¿Quieres que hagamos alguna auditoría de duplicados o carguemos códigos unificados para Margarita? Pídeme lo que necesites.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('Hubo un detalle en la conexión con Google OAuth.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setIsSandbox(true);
    showToast('Sesión de Google Drive finalizada. Copia Cloud local activa.');
    setSpreadsheets([]);
    setSelectedSpreadsheetId(null);
    setSelectedSpreadsheetName(null);
    await syncFromFirestore();
  };

  // Chat submit process
  const handleSubmitMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const query = customText || inputMessage;
    if (!query.trim()) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsGenerating(true);
    setActiveSuggestion(null);

    const sheetsContext = {
      isOfficialSheetsConnected: !isSandbox,
      userProfile: {
        name: user?.displayName || 'Rossy',
        email: user?.email || 'compraarza@gmail.com',
      },
      active_materials_catalog: materials,
      active_purchase_orders: orders.slice(-8),
      warehouse_entries: warehouse.slice(-5),
    };

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          sheetsContext,
        }),
      });

      if (!response.ok) throw new Error('Could not process message');
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: data.action ? { ...data.action, executed: false } : undefined,
        },
      ]);

      if (data.action) {
        setActiveSuggestion(data.action);
        if (data.action.type === 'add_order') setActiveView('ordenes');
        if (data.action.type === 'sync_codes') setActiveView('catalogo');
        if (data.action.type === 'update_received') setActiveView('bodega');
      }
    } catch (err) {
      console.error('Agent error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-fallback-${Date.now()}`,
          role: 'assistant',
          content: `Tuvimos un inconveniente al conectarnos con el servidor de IA de Arza, Rossy. Pero descuida, puedo asistirte de forma simulada.

¿Quieres que unifiquemos los códigos del catalogo de Margarita ahora mismo con un solo clic?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Simulated dictation feature
  const handleToggleMic = () => {
    if (isMicRecording) {
      setIsMicRecording(false);
      const simulatedTexts = [
        'Crea una orden de compra de 15 tubos de PVC para Solum T18 con el proveedor PVC y Plomería de Occidente',
        'Por favor busca si hay algún codo de PVC sanitario que no tenga código asignado',
        'Kari me avisa que llegaron 100 codos de PVC sanitario a la obra Solum T18 en lugar de los 120 que pedimos en la orden 001',
        'Muéstrame el reporte consolidado de cuánto llevamos gastado por proveedor en la semana 23',
      ];
      const randomText = simulatedTexts[Math.floor(Math.random() * simulatedTexts.length)];
      setInputMessage(randomText);
      showToast('¡Voz transcrita con éxito!');
    } else {
      setIsMicRecording(true);
      showToast('Escuchando tu voz, Rossy…');
    }
  };

  const handleClearChat = () => {
    setMessages((prev) => [
      prev[0],
      {
        id: `cl-${Date.now()}`,
        role: 'assistant',
        content:
          '🧹 ¡Historial de chat reiniciado con éxito, Rossy! Estás en sintonía con un bloque libre de contexto.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Apply suggested agent spreadsheet payload
  const handleExecuteAction = (action: any) => {
    if (!action) return;

    if (action.type === 'add_order') {
      const payload = action.payload;
      const orderId = `OC-2026-0${orders.length + 1}`;
      const newOrder: PurchaseOrder = {
        id: orderId,
        date: new Date().toISOString().split('T')[0],
        week: 24,
        project: payload.project || 'Solum T18',
        supplier: payload.supplier || 'Comercializadora Ruba',
        code: payload.code || '1350110',
        description: payload.description || 'Material no codificado',
        unit: payload.unit || 'PZ',
        quantity: Number(payload.quantity) || 10,
        price: Number(payload.price) || 120,
        total: (Number(payload.quantity) || 10) * (Number(payload.price) || 120),
        receivedQuantity: 0,
        status: 'pendiente',
      };

      setOrders((prev) => [newOrder, ...prev]);
      saveOrderToCloud(newOrder);
      showToast(`¡Arza Sheets Actualizado! Creada exitosamente la Orden ${orderId}.`);
    }

    if (action.type === 'sync_codes') {
      const payload = action.payload;
      if (payload.mappings && payload.mappings.length > 0) {
        payload.mappings.forEach((m: any) => {
          const exists = materials.some((mat) => mat.code === m.suggestedCode);
          if (!exists) {
            const newMaterial = {
              code: m.suggestedCode,
              description: m.name,
              unit: 'PZ',
              price: m.price,
            };
            setMaterials((prev) => [newMaterial, ...prev]);
            saveMaterialToCloud(newMaterial);
          }
        });
      }
      showToast('¡Códigos sincronizados correctamente con el Catálogo de Margarita!');
    }

    if (action.type === 'update_received') {
      const payload = action.payload;

      setOrders((prev) => {
        const next = prev.map((o) => {
          if (o.id === payload.orderId) {
            const received = Number(payload.quantity);
            const stat = received >= o.quantity ? 'completado' : 'parcial';
            const updatedOrder = {
              ...o,
              receivedQuantity: received,
              status: stat,
              observation: payload.observation || `Recibido parcial de ${received} unidades.`,
            };
            saveOrderToCloud(updatedOrder);
            return updatedOrder;
          }
          return o;
        });
        return next;
      });

      const targetOrder = orders.find((o) => o.id === payload.orderId);
      if (targetOrder) {
        const newEntry: WarehouseEntry = {
          id: `ENT-00${warehouse.length + 1}`,
          date: new Date().toISOString().split('T')[0],
          orderId: payload.orderId,
          code: targetOrder.code,
          description: targetOrder.description,
          expectedQuantity: targetOrder.quantity,
          receivedQuantity: Number(payload.quantity),
          status: Number(payload.quantity) === targetOrder.quantity ? 'completo' : 'discrepancia',
          observer: 'Kari (Auditora de Recibos)',
          observation: payload.observation || 'Recibido parcial.',
        };
        setWarehouse((prev) => [newEntry, ...prev]);
        saveWarehouseEntryToCloud(newEntry);
      }

      showToast(`¡Recibo de Bodega Cargado! Estado de orden ${payload.orderId} actualizado.`);
    }

    setMessages((prev) =>
      prev.map((m) => {
        if (m.action && m.action.type === action.type) {
          return { ...m, action: { ...m.action, executed: true } };
        }
        return m;
      })
    );
    setActiveSuggestion(null);
  };

  // Callback functions for ArzaAuditor
  const handleUpdateOrder = (updatedOrder: PurchaseOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    saveOrderToCloud(updatedOrder);
  };

  const handleUpdateMaterial = (updatedMaterial: Material) => {
    setMaterials((prev) => {
      const exists = prev.some((m) => m.code === updatedMaterial.code);
      if (exists) {
        return prev.map((m) => (m.code === updatedMaterial.code ? updatedMaterial : m));
      }
      return [updatedMaterial, ...prev];
    });
    saveMaterialToCloud(updatedMaterial);
  };

  const handleBulkUpdateOrders = (updatedOrders: PurchaseOrder[]) => {
    setOrders(updatedOrders);
    updatedOrders.forEach((o) => {
      saveOrderToCloud(o);
    });
  };

  // Quick action: manual order form add
  const handleAddManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const materialSelected = materials.find((m) => m.code === formMaterialCode);
    if (!materialSelected) return;

    const orderId = `OC-2026-0${orders.length + 1}`;
    const newOrder: PurchaseOrder = {
      id: orderId,
      date: new Date().toISOString().split('T')[0],
      week: 24,
      project: formProject,
      supplier: formSupplier,
      code: materialSelected.code,
      description: materialSelected.description,
      unit: materialSelected.unit,
      quantity: Number(formQuantity),
      price: materialSelected.price,
      total: Number(formQuantity) * materialSelected.price,
      receivedQuantity: 0,
      status: 'pendiente',
    };

    setOrders((prev) => [newOrder, ...prev]);
    if (!isSandbox) {
      saveOrderToCloud(newOrder);
    }
    showToast(`Orden manual ${orderId} creada correctamente.`);

    setMessages((prev) => [
      ...prev,
      {
        id: `manual-notif-${Date.now()}`,
        role: 'assistant',
        content: `📝 **Rossy, he registrado manualmente tu Orden de Compra:**
* **Orden:** ${orderId}
* **Obra:** ${formProject}
* **Proveedor:** ${formSupplier}
* **Material:** [${materialSelected.code}] ${materialSelected.description}
* **Total:** $${(Number(formQuantity) * materialSelected.price).toLocaleString('es-MX', {
          minimumFractionDigits: 2,
        })}

¿Te gustaría que verifiquemos si el costo se ajusta al presupuesto de costos unificados?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleApplyPreset = (text: string) => {
    handleSubmitMessage(undefined, text);
  };

  const handleReconcileWarehouse = (entry: WarehouseEntry) => {
    const updated = {
      ...entry,
      receivedQuantity: entry.expectedQuantity,
      status: 'completo' as const,
    };
    const index = warehouse.findIndex((w) => w.id === entry.id);
    if (index !== -1) {
      const newWarehouse = [...warehouse];
      newWarehouse[index] = updated;
      setWarehouse(newWarehouse);
      if (!isSandbox) {
        saveWarehouseEntryToCloud(updated);
      }
      showToast(`¡Entrada ${entry.id} reconciliada de conformidad!`);
    }
  };

  // Derived counts for badges
  const pendingOrdersCount = orders.filter((o) => o.status === 'pendiente' || o.status === 'parcial').length;

  const priceMismatchesCount = orders.filter((o) => {
    const match = materials.find((m) => m.code === o.code);
    return match && o.price !== match.price;
  }).length;
  const orphanCodesCount = orders.filter((o) => !materials.some((m) => m.code === o.code)).length;
  const warehouseDiscrepancyCount = warehouse.filter(
    (entry) => entry.expectedQuantity !== entry.receivedQuantity
  ).length;
  const totalAuditIssues = priceMismatchesCount + orphanCodesCount + warehouseDiscrepancyCount;

  // Drive browser element reused across views
  const driveBrowser = (
    <DriveBrowser
      token={token}
      isSandbox={isSandbox}
      onImportMaterials={handleImportMaterials}
      onImportOrders={handleImportOrders}
      onImportWarehouse={handleImportWarehouse}
      showToast={showToast}
      currentMaterials={materials}
    />
  );

  // Sheet action wrappers
  const handleReadSheets = () => {
    if (selectedSpreadsheetId && token) {
      readDataFromGoogleSheets(selectedSpreadsheetId, token);
    }
  };
  const handleWriteSheets = () => {
    if (selectedSpreadsheetId && token) {
      writeDataToGoogleSheets(selectedSpreadsheetId, token);
    }
  };
  const handleCreateSpreadsheet = () => {
    if (token) {
      createSpreadsheetInDrive(token);
    }
  };
  const handleSelectSpreadsheet = (sheet: { id: string; name: string }) => {
    setSelectedSpreadsheetId(sheet.id);
    setSelectedSpreadsheetName(sheet.name);
    showToast(`¡Hoja "${sheet.name}" seleccionada!`);
    if (token) {
      readDataFromGoogleSheets(sheet.id, token);
    }
  };

  // Render active view
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            materials={materials}
            orders={orders}
            warehouse={warehouse}
            isSandbox={isSandbox}
            token={token}
            spreadsheets={spreadsheets}
            isLoadingSpreadsheets={isLoadingSpreadsheets}
            selectedSpreadsheetId={selectedSpreadsheetId}
            selectedSpreadsheetName={selectedSpreadsheetName}
            isSyncingToSheets={isSyncingToSheets}
            onCreateSpreadsheet={handleCreateSpreadsheet}
            onReadSheets={handleReadSheets}
            onWriteSheets={handleWriteSheets}
            onSelectSpreadsheet={handleSelectSpreadsheet}
            onNavigateToAudit={() => setActiveView('auditoria')}
            onLogin={handleLogin}
            showToast={showToast}
            driveBrowser={driveBrowser}
          />
        );
      case 'chat':
        return (
          <ChatView
            messages={messages}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            isGenerating={isGenerating}
            isMicRecording={isMicRecording}
            onSubmitMessage={handleSubmitMessage}
            onToggleMic={handleToggleMic}
            onApplyPreset={handleApplyPreset}
            onExecuteAction={handleExecuteAction}
            onClearChat={handleClearChat}
            messagesEndRef={messagesEndRef}
          />
        );
      case 'catalogo':
        return <CatalogView materials={materials} orders={orders} warehouse={warehouse} showToast={showToast} />;
      case 'ordenes':
        return (
          <OrdersView
            materials={materials}
            orders={orders}
            warehouse={warehouse}
            showToast={showToast}
            onAddManualOrder={handleAddManualOrder}
            formProject={formProject}
            setFormProject={setFormProject}
            formMaterialCode={formMaterialCode}
            setFormMaterialCode={setFormMaterialCode}
            formQuantity={formQuantity}
            setFormQuantity={setFormQuantity}
            formSupplier={formSupplier}
            setFormSupplier={setFormSupplier}
            onModifyPrice={(order, officialPrice) => {
              handleUpdateOrder({
                ...order,
                price: officialPrice,
                total: order.quantity * officialPrice,
              });
              showToast(`¡Precio conciliado a $${officialPrice} para ${order.id}!`);
            }}
            onModifyCode={(order, correctMaterial) => {
              handleUpdateOrder({
                ...order,
                code: correctMaterial.code,
                description: correctMaterial.description,
                price: correctMaterial.price,
                total: order.quantity * correctMaterial.price,
              });
              showToast(`¡OC ${order.id} re-enlazada al código oficial ${correctMaterial.code}!`);
            }}
          />
        );
      case 'bodega':
        return (
          <WarehouseView
            materials={materials}
            orders={orders}
            warehouse={warehouse}
            onReconcileWarehouse={handleReconcileWarehouse}
            showToast={showToast}
          />
        );
      case 'auditoria':
        return (
          <AuditView
            materials={materials}
            orders={orders}
            warehouse={warehouse}
            token={token}
            user={user}
            userRole={userRole}
            onUpdateOrder={handleUpdateOrder}
            onUpdateMaterial={handleUpdateMaterial}
            onBulkUpdateOrders={handleBulkUpdateOrders}
            showToast={showToast}
          />
        );
      case 'proveedores':
        return <SuppliersView orders={orders} warehouse={warehouse} />;
      case 'import':
        return (
          <ImportSettingsView
            isSandbox={isSandbox}
            token={token}
            spreadsheets={spreadsheets}
            isLoadingSpreadsheets={isLoadingSpreadsheets}
            selectedSpreadsheetId={selectedSpreadsheetId}
            selectedSpreadsheetName={selectedSpreadsheetName}
            isSyncingToSheets={isSyncingToSheets}
            onCreateSpreadsheet={handleCreateSpreadsheet}
            onReadSheets={handleReadSheets}
            onWriteSheets={handleWriteSheets}
            onSelectSpreadsheet={handleSelectSpreadsheet}
            onLogin={handleLogin}
            driveBrowser={driveBrowser}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AppShell
      user={user}
      userRole={userRole}
      isSandbox={isSandbox}
      isLoggingIn={isLoggingIn}
      activeView={activeView}
      onNavigate={setActiveView}
      onLogin={handleLogin}
      onLogout={handleLogout}
      successToast={successToast}
      pendingOrdersCount={pendingOrdersCount}
      totalAuditIssues={totalAuditIssues}
    >
      {renderView()}
    </AppShell>
  );
}
