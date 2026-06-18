/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Mic, 
  Plus, 
  Check, 
  AlertCircle, 
  FileSpreadsheet, 
  Database, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  Search, 
  User, 
  LogOut, 
  RotateCw, 
  FileText, 
  CheckCircle2, 
  Briefcase, 
  AlertTriangle, 
  HelpCircle,
  Copy,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

import { Material, PurchaseOrder, WarehouseEntry, Message } from './types';
import { INITIAL_MATERIALS, INITIAL_ORDERS, INITIAL_WAREHOUSE, INITIAL_CHAT } from './mockData';
import { initAuth, googleSignIn, logout } from './auth';
import DriveBrowser from './components/DriveBrowser';
import ArzaAuditor from './components/ArzaAuditor';
import SpreadsheetGrid from './components/SpreadsheetGrid';
import { 
  fetchMaterialsFromCloud, 
  saveMaterialToCloud, 
  fetchOrdersFromCloud, 
  saveOrderToCloud, 
  fetchWarehouseFromCloud, 
  saveWarehouseEntryToCloud 
} from './firestore';

export default function App() {
  // Authentication & Source State
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSandbox, setIsSandbox] = useState(true);

  // Sheets Data States
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);
  const [orders, setOrders] = useState<PurchaseOrder[]>(INITIAL_ORDERS);
  const [warehouse, setWarehouse] = useState<WarehouseEntry[]>(INITIAL_WAREHOUSE);

  // Active View Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalogo' | 'ordenes' | 'bodega'>('dashboard');
  
  // Filtering & Searches
  const [materialSearch, setMaterialSearch] = useState('');
  const [orderFilterObra, setOrderFilterObra] = useState('ALL');
  const [newOrderForm, setNewOrderForm] = useState(false);

  // Chat States
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMicRecording, setIsMicRecording] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<any>(null);

  // Quick Action Forms
  const [formProject, setFormProject] = useState('Solum T18');
  const [formMaterialCode, setFormMaterialCode] = useState(INITIAL_MATERIALS[0].code);
  const [formQuantity, setFormQuantity] = useState(10);
  const [formSupplier, setFormSupplier] = useState('PVC y Plomería de Occidente');

  // Success Feedbacks
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Google Drive & Sheets States
  const [spreadsheets, setSpreadsheets] = useState<{ id: string, name: string }[]>([]);
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState(false);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string | null>(null);
  const [selectedSpreadsheetName, setSelectedSpreadsheetName] = useState<string | null>(null);
  const [isSyncingToSheets, setIsSyncingToSheets] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Spreadsheets list from Google Drive
  const fetchSpreadsheetsFromDrive = async (accessToken: string) => {
    try {
      setIsLoadingSpreadsheets(true);
      const res = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType%3D'application%2Fvnd.google-apps.spreadsheet'&fields=files(id%2Cname)&pageSize=30", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSpreadsheets(data.files || []);
      }
    } catch (err) {
      console.error("Error listing files from Drive:", err);
    } finally {
      setIsLoadingSpreadsheets(false);
    }
  };

  // Create an official Arza Spreadsheet inside Rossy's Google Drive
  const createSpreadsheetInDrive = async (accessToken: string) => {
    try {
      setIsSyncingToSheets(true);
      const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          properties: {
            title: "Control de Inventarios y Compras - Arza"
          },
          sheets: [
            { properties: { title: "Catálogo de Materiales" } },
            { properties: { title: "Órdenes de Compra" } },
            { properties: { title: "Entradas de Bodega" } }
          ]
        })
      });

      if (createRes.ok) {
        const sheet = await createRes.json();
        setSelectedSpreadsheetId(sheet.spreadsheetId);
        setSelectedSpreadsheetName(sheet.properties.title);
        showToast("¡Hoja de cálculo de Arza creada con éxito!");
        await writeDataToGoogleSheets(sheet.spreadsheetId, accessToken);
        await fetchSpreadsheetsFromDrive(accessToken);
      } else {
        showToast("No se pudo crear la hoja de cálculo. Revisa tu saldo/permisos.");
      }
    } catch (err) {
      console.error("Error creating sheet:", err);
      showToast("Detalle al conectar tu Google Drive.");
    } finally {
      setIsSyncingToSheets(false);
    }
  };

  // Upload/overwrite materials, orders and warehouse logs to Google Sheets
  const writeDataToGoogleSheets = async (spreadsheetId: string, accessToken: string) => {
    try {
      setIsSyncingToSheets(true);
      
      const materialsValues = [
        ["Código Arza", "Descripción", "Unidad", "Precio Pactado"],
        ...materials.map(m => [m.code, m.description, m.unit, m.price])
      ];

      const ordersValues = [
        ["ID Orden", "Obra / Proyecto", "Código Material", "Descripción", "Unidad", "Cantidad Solicitada", "Precio Pactado", "Cantidad Recibida", "Estado", "Proveedor", "Semana", "Comentarios / Observaciones", "Monto Total", "Fecha de Emisión"],
        ...orders.map(o => [
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
          o.date
        ])
      ];

      const warehouseValues = [
        ["ID Entrada", "ID Orden", "Obra / Proyecto", "Código Material", "Descripción", "Cantidad Recibida", "Estado Recibo", "Observación / Comentario", "Fecha Entrada", "Responsable"],
        ...warehouse.map(w => [
          w.id,
          w.orderId,
          w.project,
          w.materialCode,
          w.materialName,
          w.receivedQuantity,
          w.status,
          w.observation,
          w.date,
          w.receivedBy
        ])
      ];

      const updateSheetData = async (range: string, values: any[][]) => {
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ values })
        });
      };

      await updateSheetData("Catálogo de Materiales!A1:D" + (materialsValues.length + 5), materialsValues);
      await updateSheetData("Órdenes de Compra!A1:N" + (ordersValues.length + 5), ordersValues);
      await updateSheetData("Entradas de Bodega!A1:J" + (warehouseValues.length + 5), warehouseValues);

      showToast("¡Tablas exportadas a Google Sheets!");
    } catch (err) {
      console.error("Error writing values to Google Sheets:", err);
      showToast("Tuvimos un error al escribir las columnas.");
    } finally {
      setIsSyncingToSheets(false);
    }
  };

  // Import / Read all values from a connected Google Sheets spreadsheet
  const readDataFromGoogleSheets = async (spreadsheetId: string, accessToken: string) => {
    try {
      setIsSyncingToSheets(true);

      const fetchSheetValues = async (range: string) => {
        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          return await res.json();
        }
        return null;
      };

      const matsData = await fetchSheetValues("Catálogo de Materiales!A2:D500");
      if (matsData && matsData.values) {
        const parsedMats: Material[] = matsData.values.map((row: any) => ({
          code: row[0] || "",
          description: row[1] || "",
          unit: row[2] || "PZ",
          price: Number(row[3]) || 0
        })).filter((m: any) => m.code);
        if (parsedMats.length > 0) setMaterials(parsedMats);
      }

      const ordersData = await fetchSheetValues("Órdenes de Compra!A2:N1000");
      if (ordersData && ordersData.values) {
        const parsedOrders: PurchaseOrder[] = ordersData.values.map((row: any) => ({
          id: row[0] || "",
          project: row[1] || "",
          code: row[2] || "",
          description: row[3] || "",
          unit: row[4] || "PZ",
          quantity: Number(row[5]) || 0,
          price: Number(row[6]) || 0,
          receivedQuantity: Number(row[7]) || 0,
          status: (row[8] || "pendiente") as any,
          supplier: row[9] || "",
          week: row[10] || "",
          observation: row[11] || "",
          total: Number(row[12]) || 0,
          date: row[13] || new Date().toISOString().split('T')[0]
        })).filter((o: any) => o.id);
        if (parsedOrders.length > 0) setOrders(parsedOrders);
      }

      const whData = await fetchSheetValues("Entradas de Bodega!A2:J1000");
      if (whData && whData.values) {
        const parsedWH: WarehouseEntry[] = whData.values.map((row: any) => ({
          id: row[0] || "",
          orderId: row[1] || "",
          project: row[2] || "",
          materialCode: row[3] || "",
          materialName: row[4] || "",
          receivedQuantity: Number(row[5]) || 0,
          status: (row[6] || "completo") as any,
          observation: row[7] || "",
          date: row[8] || new Date().toISOString().split('T')[0],
          receivedBy: row[9] || "Kari"
        })).filter((e: any) => e.id);
        if (parsedWH.length > 0) setWarehouse(parsedWH);
      }

      showToast("¡Datos importados de Google Sheets con éxito!");
    } catch (err) {
      console.error("Error reading sheets:", err);
      showToast("Revisa que tu hoja contenga las pestañas indicadas.");
    } finally {
      setIsSyncingToSheets(false);
    }
  };

  // Reusable Firestore Synchronizer function
  const syncFromFirestore = async () => {
    try {
      const cloudMats = await fetchMaterialsFromCloud();
      if (cloudMats && cloudMats.length > 0) {
        setMaterials(cloudMats);
      } else {
        // Bootstrap Firestore materials in background
        for (const m of INITIAL_MATERIALS) {
          await saveMaterialToCloud(m);
        }
      }

      const cloudOrders = await fetchOrdersFromCloud();
      if (cloudOrders && cloudOrders.length > 0) {
        setOrders(cloudOrders);
      } else {
        // Bootstrap Firestore orders in background
        for (const o of INITIAL_ORDERS) {
          await saveOrderToCloud(o);
        }
      }

      const cloudWH = await fetchWarehouseFromCloud();
      if (cloudWH && cloudWH.length > 0) {
        setWarehouse(cloudWH);
      } else {
        // Bootstrap Firestore warehouse entries in background
        for (const w of INITIAL_WAREHOUSE) {
          await saveWarehouseEntryToCloud(w);
        }
      }
    } catch (err) {
      console.error("Failed syncing Firestore:", err);
    }
  };

  // Integrators for Google Drive dynamic parsed data imports
  const handleImportMaterials = async (parsedMaterials: Material[]) => {
    setMaterials(parsedMaterials);
    // Persist to Cloud Firestore in background
    for (const m of parsedMaterials) {
      await saveMaterialToCloud(m);
    }
    showToast(`¡Catálogo de Materiales cargado (${parsedMaterials.length} registros)!`);
  };

  const handleImportOrders = async (parsedOrders: PurchaseOrder[]) => {
    setOrders(parsedOrders);
    // Persist to Cloud Firestore in background
    for (const o of parsedOrders) {
      await saveOrderToCloud(o);
    }
    showToast(`¡Órdenes de Compra cargadas (${parsedOrders.length} registros)!`);
  };

  const handleImportWarehouse = async (parsedWarehouse: WarehouseEntry[]) => {
    setWarehouse(parsedWarehouse);
    // Persist to Cloud Firestore in background
    for (const w of parsedWarehouse) {
      await saveWarehouseEntryToCloud(w);
    }
    showToast(`¡Entradas de Bodega cargadas (${parsedWarehouse.length} registros)!`);
  };

  // Load chat and auth on startup
  useEffect(() => {
    // Generate starter message
    setMessages(INITIAL_CHAT.map((m, idx) => ({
      id: `starter-${idx}`,
      role: m.role,
      content: m.content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })));

    initAuth(
      async (googleUser, accessToken) => {
        setUser(googleUser);
        setToken(accessToken);
        setIsSandbox(false);
        showToast("¡Sesión de Google Sheets oficial activada con éxito!");
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
        showToast("¡Conectada a Google Sheets correctamente!");
        await syncFromFirestore();
        await fetchSpreadsheetsFromDrive(result.accessToken);
        
        // Simulating loading actual sheets columns on connection
        setMessages(prev => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'assistant',
            content: `🟢 **¡Excelente, Rossy!** Te has conectado como **${result.user.displayName}**.

He activado los permisos para mapear tu hoja de cálculo real de Arza en Google Drive. Estoy analizando de fondo tus archivos "Solum 18 viviendas" y "Catálogo de Materiales 2026".

¿Quieres que hagamos alguna auditoría de duplicados o carguemos códigos unificados para Margarita? Pídeme lo que necesites.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast("Hubo un detalle en la conexión con Google OAuth.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setIsSandbox(true);
    showToast("Volviendo a modo de simulación Sandbox.");
    setMaterials(INITIAL_MATERIALS);
    setOrders(INITIAL_ORDERS);
    setWarehouse(INITIAL_WAREHOUSE);
    setSpreadsheets([]);
    setSelectedSpreadsheetId(null);
    setSelectedSpreadsheetName(null);
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsGenerating(true);
    setActiveSuggestion(null);

    // Context summary prepared for Gemini to reduce payload size and respect token optimization
    const sheetsContext = {
      isOfficialSheetsConnected: !isSandbox,
      userProfile: { name: user?.displayName || "Rossy", email: user?.email || "compraarza@gmail.com" },
      active_materials_catalog: materials,
      active_purchase_orders: orders.slice(-8), // last few orders
      warehouse_entries: warehouse.slice(-5)
    };

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          sheetsContext
        })
      });

      if (!response.ok) throw new Error("Could not process message");
      const data = await response.json();

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: data.action ? { ...data.action, executed: false } : undefined
        }
      ]);

      if (data.action) {
        setActiveSuggestion(data.action);
        // Switch tabs dynamically based on recommended agent actions to help Rossy visually understand
        if (data.action.type === 'add_order') setActiveTab('ordenes');
        if (data.action.type === 'sync_codes') setActiveTab('catalogo');
        if (data.action.type === 'update_received') setActiveTab('bodega');
      }

    } catch (err) {
      console.error("Agent error:", err);
      // Fallback
      setMessages(prev => [
        ...prev,
        {
          id: `bot-fallback-${Date.now()}`,
          role: 'assistant',
          content: `Tuvimos un inconveniente al conectarnos con el servidor de IA de Arza, Rossy. Pero descuida, puedo asistirte de forma simulada. 

¿Quieres que unifiquemos los códigos del catalogo de Margarita ahora mismo con un solo clic?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Simulating the dictation feature Rossy loves using her voice
  const handleToggleMic = () => {
    if (isMicRecording) {
      setIsMicRecording(false);
      // Fill simulated typed text
      const simulatedTexts = [
        "Crea una orden de compra de 15 tubos de PVC para Solum T18 con el proveedor PVC y Plomería de Occidente",
        "Por favor busca si hay algún codo de PVC sanitario que no tenga código asignado",
        "Kari me avisa que llegaron 100 codos de PVC sanitario a la obra Solum T18 en lugar de los 120 que pedimos en la orden 001",
        "Muéstrame el reporte consolidado de cuánto llevamos gastado por proveedor en la semana 23"
      ];
      const randomText = simulatedTexts[Math.floor(Math.random() * simulatedTexts.length)];
      setInputMessage(randomText);
      showToast("¡Voz transcrita con éxito!");
    } else {
      setIsMicRecording(true);
      showToast("Escuchando tu voz, Rossy...");
    }
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
        status: 'pendiente'
      };

      setOrders(prev => [newOrder, ...prev]);
      if (!isSandbox) {
        saveOrderToCloud(newOrder);
      }
      showToast(`¡Arza Sheets Actualizado! Creada exitosamente la Orden ${orderId}.`);
    }

    if (action.type === 'sync_codes') {
      const payload = action.payload;
      // Add a missing code or unifed mapping to materials state
      if (payload.mappings && payload.mappings.length > 0) {
        payload.mappings.forEach((m: any) => {
          // Check if already in materials list
          const exists = materials.some(mat => mat.code === m.suggestedCode);
          if (!exists) {
            const newMaterial = { code: m.suggestedCode, description: m.name, unit: 'PZ', price: m.price };
            setMaterials(prev => [newMaterial, ...prev]);
            if (!isSandbox) {
              saveMaterialToCloud(newMaterial);
            }
          }
        });
      }
      showToast("¡Códigos sincronizados correctamente con el Catálogo de Margarita!");
    }

    if (action.type === 'update_received') {
      const payload = action.payload;
      
      // Update the Order receipt quantity and state
      setOrders(prev => {
        const next = prev.map(o => {
          if (o.id === payload.orderId) {
            const received = Number(payload.quantity);
            const stat = received >= o.quantity ? 'completado' : 'parcial';
            const updatedOrder = {
              ...o,
              receivedQuantity: received,
              status: stat,
              observation: payload.observation || `Recibido parcial de ${received} unidades.`
            };
            if (!isSandbox) {
              saveOrderToCloud(updatedOrder);
            }
            return updatedOrder;
          }
          return o;
        });
        return next;
      });

      // Create detailed warehouse entry log
      const targetOrder = orders.find(o => o.id === payload.orderId);
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
          observation: payload.observation || 'Recibido parcial.'
        };
        setWarehouse(prev => [newEntry, ...prev]);
        if (!isSandbox) {
          saveWarehouseEntryToCloud(newEntry);
        }
      }

      showToast(`¡Recibo de Bodega Cargado! Estado de orden ${payload.orderId} actualizado.`);
    }

    // Mark current action as executed in UI
    setMessages(prev => prev.map(m => {
      if (m.action && m.action.type === action.type) {
        return { ...m, action: { ...m.action, executed: true } };
      }
      return m;
    }));
    setActiveSuggestion(null);
  };

  // Callback functions for ArzaAuditor
  const handleUpdateOrder = (updatedOrder: PurchaseOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    if (!isSandbox) {
      saveOrderToCloud(updatedOrder);
    }
  };

  const handleUpdateMaterial = (updatedMaterial: Material) => {
    setMaterials(prev => prev.map(m => m.code === updatedMaterial.code ? updatedMaterial : m));
    if (!isSandbox) {
      saveMaterialToCloud(updatedMaterial);
    }
  };

  const handleBulkUpdateOrders = (updatedOrders: PurchaseOrder[]) => {
    setOrders(updatedOrders);
    if (!isSandbox) {
      updatedOrders.forEach(o => {
        saveOrderToCloud(o);
      });
    }
  };

  // Quick Action: Manual Order Form Add
  const handleAddManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const materialSelected = materials.find(m => m.code === formMaterialCode);
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
      status: 'pendiente'
    };

    setOrders(prev => [newOrder, ...prev]);
    if (!isSandbox) {
      saveOrderToCloud(newOrder);
    }
    setNewOrderForm(false);
    showToast(`Orden manual ${orderId} creada correctamente.`);
    setActiveTab('ordenes');

    // Inform Rossy in chat about the creation
    setMessages(prev => [
      ...prev,
      {
        id: `manual-notif-${Date.now()}`,
        role: 'assistant',
        content: `📝 **Rossy, he registrado manualmente tu Orden de Compra:**
* **Orden:** ${orderId}
* **Obra:** ${formProject}
* **Proveedor:** ${formSupplier}
* **Material:** [${materialSelected.code}] ${materialSelected.description}
* **Total:** $${(Number(formQuantity) * materialSelected.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}

¿Te gustaría que verifiquemos si el costo se ajusta al presupuesto de costos unificados?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleApplyPreset = (text: string) => {
    handleSubmitMessage(undefined, text);
  };

  // Chart data calculations
  const calculateSpendByProject = () => {
    const dataObj: { [key: string]: number } = {};
    orders.forEach(o => {
      dataObj[o.project] = (dataObj[o.project] || 0) + o.total;
    });
    return Object.keys(dataObj).map(key => ({
      name: key,
      gasto: dataObj[key]
    }));
  };

  const calculateSpendBySupplier = () => {
    const dataObj: { [key: string]: number } = {};
    orders.forEach(o => {
      dataObj[o.supplier] = (dataObj[o.supplier] || 0) + o.total;
    });
    return Object.keys(dataObj).map(key => ({
      name: key.length > 15 ? key.substring(0, 15) + '...' : key,
      gasto: dataObj[key]
    }));
  };

  const calculateDiscrepancyStats = () => {
    const discrepancy = warehouse.filter(w => w.status === 'discrepancia').length;
    const clean = warehouse.filter(w => w.status === 'completo').length;
    return [
      { name: 'Entregas Completas', value: clean },
      { name: 'Discrepancias (Faltantes)', value: discrepancy }
    ];
  };

  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

  // Totalized quick statistics summary with audit trace for Rossy
  const rawOrdersTotal = orders.reduce((sum, o) => sum + o.total, 0);

  const overchargeLeak = orders.reduce((sum, o) => {
    const catalogMatch = materials.find(m => m.code === o.code);
    if (catalogMatch && o.price > catalogMatch.price) {
      return sum + (o.price - catalogMatch.price) * o.quantity;
    }
    return sum;
  }, 0);

  const deliveryShortageLeak = orders.reduce((sum, o) => {
    if (o.receivedQuantity < o.quantity && o.status !== 'pendiente') {
      const catalogMatch = materials.find(m => m.code === o.code);
      const priceToUse = catalogMatch ? catalogMatch.price : o.price;
      const gap = o.quantity - o.receivedQuantity;
      return sum + (gap * priceToUse);
    }
    return sum;
  }, 0);

  const totalSpend = rawOrdersTotal; // retain reference to prevent breaking other chart metrics
  const trueAuditedCost = rawOrdersTotal - overchargeLeak - deliveryShortageLeak;

  const pendingOrdersCount = orders.filter(o => o.status === 'pendiente' || o.status === 'parcial').length;
  const materialsCount = materials.length;

  const priceMismatchesCount = orders.filter(o => {
    const match = materials.find(m => m.code === o.code);
    return match && o.price !== match.price;
  }).length;
  
  const orphanCodesCount = orders.filter(o => !materials.some(m => m.code === o.code)).length;
  const warehouseDiscrepancyCount = warehouse.filter(entry => entry.expectedQuantity !== entry.receivedQuantity).length;
  const totalAuditIssues = priceMismatchesCount + orphanCodesCount + warehouseDiscrepancyCount;

  return (
    <div id="app-root" className="min-h-screen bg-[#f3f5f8] text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast alert overlay */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center space-x-2 border border-emerald-500"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bar / Header */}
      <header className="bg-gradient-to-r from-[#0d4f30] to-[#126b43] border-b border-emerald-800 px-5 py-4 shrink-0 shadow-sm text-white rounded-b-xl max-w-7xl w-full mx-auto mt-2 select-none">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-md">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300 font-black animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center">
                  Consolidación de Inventarios y Compras
                </h1>
                <span className="text-[10px] bg-emerald-600/60 text-emerald-200 border border-emerald-400/40 px-2.5 py-0.5 rounded-full font-bold">
                  Sincronizado con Drive y Sheets
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 font-medium">Control de Obra y Audición Directa para Rossy Lares Morales</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 ${
              isSandbox 
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' 
                : 'bg-emerald-500/15 text-emerald-250 border-emerald-500/25'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isSandbox ? 'bg-amber-500' : 'bg-emerald-400'} animate-ping`} />
              <span>{isSandbox ? 'Modo de Prueba (Simulador Excel)' : 'Google Sheets Oficial Conectado'}</span>
            </div>

            {isSandbox ? (
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="gsi-material-button text-xs font-semibold shrink-0 cursor-pointer overflow-hidden border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 transition-all rounded-lg flex items-center space-x-2 px-3 py-1.5 h-8"
              >
                {isLoggingIn ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                )}
                <span>Google Drive</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 text-white">
                <div className="flex items-center space-x-2 bg-emerald-800/60 px-3 py-1 rounded-lg border border-emerald-700/50">
                  <User className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-xs font-semibold text-slate-100 truncate max-w-[120px]">{user?.displayName || "Rossy"}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1 px-2.5 bg-rose-900/30 text-rose-100 border border-rose-800/35 rounded-lg hover:bg-rose-900/60 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  title="Desconectar cuenta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Salir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Primary KPI Header strip */}
      <section className="bg-transparent max-w-7xl w-full mx-auto mt-4 px-1 select-none animate-fadeIn">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3 md:space-x-3.5 hover:shadow-xs transition-all">
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Costo Real Aprobado</p>
              <h4 className="text-md md:text-lg font-black text-emerald-800 font-mono">
                ${trueAuditedCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </h4>
              {overchargeLeak + deliveryShortageLeak > 0 && (
                <span className="text-[9.5px] text-slate-400 font-medium block leading-none mt-0.5">
                  Monto en Facturas: <span className="line-through font-mono">${rawOrdersTotal.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                </span>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3 md:space-x-3.5 hover:shadow-xs transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              (overchargeLeak + deliveryShortageLeak) > 0 
                ? 'bg-rose-50 border-rose-100 text-rose-600' 
                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
            }`}>
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Fuga y Faltante Detectado</p>
              <h4 className={`text-md md:text-lg font-black font-mono ${(overchargeLeak + deliveryShortageLeak) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                -${(overchargeLeak + deliveryShortageLeak).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </h4>
              <span className="text-[9px] text-slate-400 font-medium block leading-none mt-0.5">
                Sobrep: ${overchargeLeak.toLocaleString("es-MX", { maximumFractionDigits: 0 })} | Shortage: ${deliveryShortageLeak.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3 md:space-x-3.5 hover:shadow-xs transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              totalAuditIssues > 0 
                ? 'bg-amber-50 border-amber-100 text-amber-600 animate-pulse' 
                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Alertas de Auditoría</p>
              <h4 className="text-md md:text-lg font-black text-slate-800 font-mono">
                {totalAuditIssues} incidencias
              </h4>
              <span className="text-[9px] text-slate-400 font-medium block leading-none mt-0.5">
                {priceMismatchesCount} precios | {orphanCodesCount} claves | {warehouseDiscrepancyCount} bodega
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3 md:space-x-3.5 hover:shadow-xs transition-all">
            <div className="w-10 h-10 bg-cyan-50 border border-cyan-100 rounded-xl flex items-center justify-center text-cyan-600 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Catálogo Unificado</p>
              <h4 className="text-md md:text-lg font-black text-slate-800 font-mono">{materialsCount} insumos</h4>
              <span className="text-[9px] text-slate-400 font-medium block leading-none mt-0.5">
                Códigos homologados con Mago
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container - Left: Agent Sidebar, Right: Dashboard Tab Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6 p-4 overflow-hidden">
        
        {/* LEFT SIDEBAR: Conversational Chat client mimicking Open Code (6 columns) */}
        <section id="chat-panel" className="w-full lg:w-5/12 bg-white border border-slate-200 flex flex-col rounded-2xl overflow-hidden h-[680px] shadow-sm">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 shrink-0 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Agente de Conversión Arza</span>
            </div>
            <button 
              onClick={() => {
                setMessages(prev => [
                  prev[0], // Keep starter message
                  {
                    id: `cl-${Date.now()}`,
                    role: 'assistant',
                    content: '🧹 ¡Historial de chat reiniciado con éxito, Rossy! Estás en sintonía con un bloque libre de contexto.',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                ]);
              }}
              className="text-[10px] bg-white px-2.5 py-1.5 rounded-lg inline-flex items-center hover:bg-slate-50 text-slate-500 border border-slate-200 hover:text-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              Borrar Charla
            </button>
          </div>

          {/* Chat Messages flow scrollable */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/45 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs shrink-0 self-start shadow-2xs border border-emerald-500">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                  msg.role === 'user' 
                    ? 'bg-white border border-slate-250 text-slate-800 font-medium' 
                    : 'bg-emerald-50/75 border border-emerald-100 text-slate-800'
                }`}>
                  {/* Standard text parser */}
                  <div className="whitespace-pre-line prose prose-xs text-slate-700 font-medium">
                    {msg.content}
                  </div>

                  {/* Executable agent recommendations trigger buttons */}
                  {msg.action && (
                    <div className="mt-3.5 pt-3 border-t border-emerald-100/50">
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-150 text-[11px] mb-2 shadow-2xs">
                        <p className="font-bold text-emerald-700 mb-1 flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Modificación sugerida:
                        </p>
                        {msg.action.type === 'add_order' && (
                          <span className="text-slate-600 font-mono">
                            Crear orden en <strong>{msg.action.payload.project}</strong> por {msg.action.payload.quantity} {msg.action.payload.unit} de <strong>{msg.action.payload.description}</strong>.
                          </span>
                        )}
                        {msg.action.type === 'sync_codes' && (
                          <span className="text-slate-600 font-mono">
                            Sincronizar códigos huérfanos con el catálogo de códigos Rossy.
                          </span>
                        )}
                        {msg.action.type === 'update_received' && (
                          <span className="text-slate-600 font-mono">
                            Ingresar recibo en bodega para {msg.action.payload.orderId}. Cantidad recibida parcial: {msg.action.payload.quantity} unidades.
                          </span>
                        )}
                      </div>

                      {msg.action.executed ? (
                        <span className="inline-flex items-center text-emerald-700 font-bold text-[10px] bg-emerald-100 px-2.5 py-1 rounded-full shadow-2xs border border-emerald-250">
                          <Check className="w-3 h-3 mr-1 text-emerald-600" />
                          Aplicado correctamente en tus Tablas
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleExecuteAction(msg.action)}
                          className="w-full bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10.5px] hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
                        >
                          Aplicar cambio en mi Google Sheets
                        </button>
                      )}
                    </div>
                  )}

                  <span className={`block opacity-45 text-[9px] mt-1.5 font-mono ${msg.role === 'user' ? 'text-right text-slate-500' : 'text-slate-550'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center text-xs shrink-0 self-start animate-pulse shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="max-w-[85%] rounded-2xl p-3 bg-white border border-slate-205 text-slate-500 text-xs shadow-2xs flex items-center space-x-2">
                  <span className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  <span>Mapeando tu catálogo de Arza y escribiendo...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick-reply templates Rossy can trigger for comfort */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 shrink-0 select-none">
            <p className="text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-wide">Rossy, presiona un atajo rápido:</p>
            <div className="flex flex-wrap gap-1.5">
              <button 
                onClick={() => handleApplyPreset("¿Qué materiales no tienen códigos de Margarita asignados?")}
                className="text-[10.5px] bg-white hover:bg-slate-50 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              >
                🔍 Buscar Mismatches de Códigos
              </button>
              <button 
                onClick={() => handleApplyPreset("Crea una orden de compra para 20 Monomandos en Solum T40")}
                className="text-[10.5px] bg-white hover:bg-slate-50 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              >
                📝 Crear OC para Monomandos
              </button>
              <button 
                onClick={() => handleApplyPreset("Registra que llegaron 100 codos en lugar de 120 de la orden 001")}
                className="text-[10.5px] bg-white hover:bg-slate-50 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              >
                📦 Discrepancia: Recibo Parcial
              </button>
            </div>
          </div>

          {/* Prompt Entry Fields with microphone option */}
          <form 
            onSubmit={handleSubmitMessage}
            className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center gap-2"
          >
            <button 
              type="button"
              onClick={handleToggleMic}
              className={`p-3 rounded-xl border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                isMicRecording 
                  ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-sm' 
                  : 'bg-white hover:bg-slate-100 border-slate-250 text-slate-600 hover:text-slate-850 shadow-2xs'
              }`}
              title="Dictar por Voz ( Rossy's way )"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input 
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escríbele o háblale a tu agente de Sheets..."
              className="flex-1 bg-white border border-slate-200 text-slate-800 placeholder-slate-450 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:border-emerald-600 text-xs transition-colors shadow-2xs"
            />

            <button 
              type="submit"
              disabled={!inputMessage.trim() || isGenerating}
              className={`p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center shrink-0 transition-all font-semibold cursor-pointer ${
                (!inputMessage.trim() || isGenerating) ? 'opacity-40 cursor-not-allowed' : 'shadow-sm shadow-emerald-600/10'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>

        {/* RIGHT VISUALIZER PANEL: Tabs (Dashboard, Catalog, Purchase Orders, Warehouses) */}
        <section id="visualizer-panel" className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[680px]">
          
          {/* Tab Menu Header - Excel Style */}
          <div className="bg-slate-50 border-b border-slate-200 shrink-0 flex flex-wrap justify-between items-center sm:px-4 select-none">
            <div className="flex space-x-1.5 p-2">
              <button 
                onClick={() => { setActiveTab('dashboard'); setNewOrderForm(false); }}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'dashboard' 
                    ? 'bg-white text-emerald-800 shadow-2xs border border-slate-205' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Centro de Control</span>
              </button>

              <button 
                onClick={() => { setActiveTab('catalogo'); setNewOrderForm(false); }}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'catalogo' 
                    ? 'bg-white text-emerald-800 shadow-2xs border border-slate-205' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Catálogo Maestro</span>
                <span className="sm:hidden">Catálogo</span>
              </button>

              <button 
                onClick={() => { setActiveTab('ordenes'); setNewOrderForm(false); }}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                  activeTab === 'ordenes' 
                    ? 'bg-white text-emerald-800 shadow-2xs border border-slate-205' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Órdenes Compra</span>
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>

              <button 
                onClick={() => { setActiveTab('bodega'); setNewOrderForm(false); }}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'bodega' 
                    ? 'bg-white text-emerald-800 shadow-2xs border border-slate-205' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Entradas de Bodega</span>
                <span className="md:hidden">Bodega</span>
              </button>
            </div>

            {/* Quick manual entry or reload actions inside header tab strip */}
            <div className="p-2 flex gap-2 w-full sm:w-auto shrink-0 justify-end">
              <button 
                onClick={() => {
                  setNewOrderForm(true);
                  setActiveTab('ordenes');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cargar OC Manual</span>
              </button>
            </div>
          </div>

          {/* Main Visualizer Body Content Display */}
          <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 select-all bg-white">
            
            <AnimatePresence mode="wait">
              {/* TAB 1: Dashboard with Charts and summaries */}
              {activeTab === 'dashboard' && (
                <motion.div 
                  key="dash"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/55 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#0d4f30] uppercase tracking-wider">Centro de Control de Obra</h3>
                      <p className="text-xs text-slate-500">Auditoría consolidada y reporteo de gastos del grupo Arza</p>
                    </div>
                    <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full uppercase">Auditoría en Tiempo Real</span>
                  </div>

                  {/* Graphs container layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
                    {/* Spent by project chart */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1.5 text-emerald-600" />
                        Gasto Acumulado por Obra ($ MXN)
                      </h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={calculateSpendByProject()} margin={{ bottom: 15 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `$${val/1000}k`} />
                            <ChartTooltip 
                              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', fontSize: '11px', borderRadius: '8px' }} 
                              formatter={(value) => [`$${Number(value).toLocaleString("es-MX")}`, 'Total Gastado']}
                            />
                            <Bar dataKey="gasto" fill="#10b981" radius={[4, 4, 0, 0]}>
                              {calculateSpendByProject().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Spent by supplier chart */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3 flex items-center">
                        <BarChart3 className="w-4 h-4 mr-1.5 text-emerald-600" />
                        Gasto por Proveedor Principal ($ MXN)
                      </h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={calculateSpendBySupplier()} layout="vertical" margin={{ left: 10, right: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `$${val/1000}k`} />
                            <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} width={90} tickLine={false} />
                            <ChartTooltip 
                              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', fontSize: '11px', borderRadius: '8px' }} 
                              formatter={(value) => [`$${Number(value).toLocaleString("es-MX")}`, 'Gastado']}
                            />
                            <Bar dataKey="gasto" fill="#6366f1" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Receipts audit clean ratio */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs md:col-span-2 flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1 space-y-2">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-500" />
                          Auditoría de Bodega y Remisiones (Kari & Joli)
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          La unificación de códigos busca mitigar las discrepancias en remisiones que reportan Kari o Joli. En el gráfico adjunto se calcula la frecuencia de entregas limpias vs entregas con discrepancias volumétricas.
                        </p>
                        <div className="text-[11px] font-mono text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                          ⚠️ **Sugerencia del Agente:** La orden **OC-2026-001** reporta un faltante de 20 codos de PVC del proveedor *PVC y Plomería de Occidente*.
                        </div>
                      </div>

                      <div className="w-full md:w-56 h-40 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={calculateDiscrepancyStats()}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={55}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell fill="#10B981" />
                              <Cell fill="#EF4444" />
                            </Pie>
                            <ChartTooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', fontSize: '11px', borderRadius: '8px' }} />
                            <Legend wrapperStyle={{ fontSize: '9px', color: '#64748b' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* WHERE DO WE WORK Section (El "Dónde" y "Cómo se trabaja" visual deck) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 select-none">
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center">
                        <Briefcase className="w-4 h-4 mr-1.5 text-emerald-600" />
                        Obras y Desarrollos en Proceso (Registro Territorial)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Estado de materiales recibidos, órdenes pendientes y costos aprobados para cada frente de obra de Arza.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { name: "Solum T18", progress: 85, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", status: "Fase de Acabados" },
                        { name: "Solum T40", progress: 60, color: "from-cyan-500 to-blue-600", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-100", status: "Instalación Hidráulica" },
                        { name: "Terra", progress: 95, color: "from-green-500 to-emerald-600", bg: "bg-green-50", text: "text-green-700", border: "border-green-100", status: "Conclusión de Obra" },
                        { name: "Ignis", progress: 40, color: "from-amber-500 to-orange-600", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", status: "Cimentación y Redes" },
                        { name: "Maple", progress: 70, color: "from-purple-500 to-indigo-600", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100", status: "Colocación de Interiores" },
                        { name: "Ignis Phase 2", progress: 15, color: "from-rose-500 to-red-600", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100", status: "Trazado Preliminar" },
                      ].map((project, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${project.border} ${project.bg} space-y-3 shadow-2xs hover:scale-[1.01] transition-all`}>
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-black ${project.text}`}>{project.name}</span>
                            <span className="text-[10px] font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">{project.progress}%</span>
                          </div>
                          
                          <div className="w-full bg-slate-200/55 h-2 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${project.color} rounded-full`} style={{ width: `${project.progress}%` }} />
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-550 font-medium">
                            <span>Estado: <strong>{project.status}</strong></span>
                            <span className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 font-mono">Frente #{i+1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Real-time Central Auditor Dashboard Section */}
                  <ArzaAuditor 
                    materials={materials} 
                    orders={orders} 
                    warehouse={warehouse} 
                    onUpdateOrder={handleUpdateOrder}
                    onUpdateMaterial={handleUpdateMaterial}
                    onBulkUpdateOrders={handleBulkUpdateOrders}
                    showToast={showToast}
                  />

                  {/* Google Drive & Sheets Live Integration Panel */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200/80">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          Conexión Activa de Google Sheets y Google Drive Real
                        </h4>
                        <p className="text-xs text-slate-500">
                          Sincroniza y resguarda la información de Arza directamente en tus archivos de Google Workspace.
                        </p>
                      </div>
                      
                      {!isSandbox && token ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => createSpreadsheetInDrive(token)}
                            disabled={isSyncingToSheets}
                            className="text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5 animate-pulse" />
                            Crear Nueva Hoja
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2.5 py-0.5 rounded-lg font-mono font-bold">
                          Bajo Simulación Sandbox
                        </span>
                      )}
                    </div>

                    {isSandbox ? (
                      <div className="space-y-6">
                        <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto animate-bounce" />
                          <div className="space-y-1 px-4">
                            <p className="text-xs font-extrabold text-slate-800">¿Deseas conectar tus hojas reales de Google Sheets?</p>
                            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                              Inicia sesión de forma segura arriba para mapear tus archivos de Drive y actualizar los códigos del catálogo sin errores de Margarita.
                            </p>
                          </div>
                          <button
                            onClick={handleLogin}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-all inline-flex items-center gap-1.5 focus:ring-1 focus:ring-emerald-500 shadow-xs"
                          >
                            Conectar Google Sheets Ahora
                          </button>
                        </div>

                        <div className="border-t border-slate-200/70 pt-5">
                          <DriveBrowser 
                            token={token}
                            isSandbox={isSandbox}
                            onImportMaterials={handleImportMaterials}
                            onImportOrders={handleImportOrders}
                            onImportWarehouse={handleImportWarehouse}
                            showToast={showToast}
                            currentMaterials={materials}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          
                          {/* Selected sheet details and state sync */}
                          <div className="space-y-3 select-none">
                            <p className="text-xs font-bold text-slate-700">Hoja de Trabajo Vinculada:</p>
                            
                            {selectedSpreadsheetId ? (
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-xs font-bold text-slate-800 truncate max-w-[220px]">{selectedSpreadsheetName}</p>
                                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">ID: {selectedSpreadsheetId}</p>
                                  </div>
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">Vinculado</span>
                                </div>

                                <div className="flex gap-2 pt-1 font-bold">
                                  <button
                                    onClick={() => readDataFromGoogleSheets(selectedSpreadsheetId, token!)}
                                    disabled={isSyncingToSheets}
                                    className="flex-1 py-1.5 px-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[10.5px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 transition-all shadow-2xs"
                                  >
                                    {isSyncingToSheets ? (
                                      <RotateCw className="w-3 h-3 animate-spin text-emerald-600" />
                                    ) : (
                                      <RotateCw className="w-3 h-3 text-emerald-600" />
                                    )}
                                    Importar Datos
                                  </button>
                                  <button
                                    onClick={() => writeDataToGoogleSheets(selectedSpreadsheetId, token!)}
                                    disabled={isSyncingToSheets}
                                    className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10.5px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 transition-all shadow-xs"
                                  >
                                    {isSyncingToSheets ? (
                                      <RotateCw className="w-3 h-3 animate-spin text-white" />
                                    ) : (
                                      <FileSpreadsheet className="w-3 h-3" />
                                    )}
                                    Exportar / Subir
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-550">
                                No has seleccionado ninguna hoja aún. Elige un archivo del explorador de Drive abajo para comenzar a sincronizar o crea uno nuevo.
                              </div>
                            )}
                          </div>

                          {/* List of files spotted from Drive */}
                          <div className="space-y-2.5 select-none">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                              <span>Tus Hojas detectadas en Drive 📂:</span>
                              {isLoadingSpreadsheets && <RotateCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />}
                            </div>

                            <div className="bg-slate-50 rounded-xl p-2 max-h-[140px] overflow-y-auto border border-slate-200 space-y-1">
                              {spreadsheets.length > 0 ? (
                                spreadsheets.map(sheet => (
                                  <button
                                    key={sheet.id}
                                    onClick={() => {
                                      setSelectedSpreadsheetId(sheet.id);
                                      setSelectedSpreadsheetName(sheet.name);
                                      showToast(`¡Hoja "${sheet.name}" seleccionada!`);
                                      readDataFromGoogleSheets(sheet.id, token!);
                                    }}
                                    className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-between border ${
                                      selectedSpreadsheetId === sheet.id 
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-2xs' 
                                        : 'hover:bg-slate-100 bg-white border-slate-200 text-slate-600 hover:text-slate-800'
                                    }`}
                                  >
                                    <span className="truncate max-w-[200px] font-medium">{sheet.name}</span>
                                    <span className="text-[9px] font-mono text-slate-400">ID: {sheet.id.slice(0, 6)}...</span>
                                  </button>
                                ))
                              ) : (
                                <div className="text-center py-4 text-[11px] text-slate-500">
                                  {isLoadingSpreadsheets ? "Buscando archivos..." : "No encontramos hojas en la raíz de Drive. ¡Usa el explorador abajo para buscar en tus carpetas!"}
                                </div>
                              )}
                            </div>
                          </div>

                        </div>

                        <div className="border-t border-slate-800/60 pt-5">
                          <DriveBrowser 
                            token={token}
                            isSandbox={isSandbox}
                            onImportMaterials={handleImportMaterials}
                            onImportOrders={handleImportOrders}
                            onImportWarehouse={handleImportWarehouse}
                            showToast={showToast}
                            currentMaterials={materials}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: Catálogo Maestro with Search & Add unifications */}
              {activeTab === 'catalogo' && (
                <motion.div 
                  key="cat"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-2 select-none">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center">
                        <Database className="w-4 h-4 mr-1.5 text-emerald-600" />
                        Catálogo Maestro de Costos Unificados
                      </h3>
                      <p className="text-xs text-slate-550">Estructura madre de precios y códigos pactados para mitigar duplicidades</p>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Buscar material o código..."
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        className="bg-white border border-slate-250 text-slate-800 placeholder-slate-450 text-[11.5px] pl-8.5 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full sm:w-56 transition-all"
                      />
                    </div>
                  </div>

                  <SpreadsheetGrid 
                    type="materials"
                    materials={materials}
                    orders={orders}
                    warehouse={warehouse}
                    searchQuery={materialSearch}
                    showToast={showToast}
                  />
                </motion.div>
              )}

              {/* TAB 3: Órdenes de Compra tracker with unreceived indicators */}
              {activeTab === 'ordenes' && (
                <motion.div 
                  key="ord"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-4"
                >
                  {/* Dynamic Manual Order placement block inside Visualizer */}
                  {newOrderForm && (
                    <motion.form 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      onSubmit={handleAddManualOrder}
                      className="bg-slate-50 p-4 rounded-2xl border border-emerald-200 space-y-3 shrink-0"
                    >
                      <h4 className="text-xs font-black text-emerald-850 uppercase tracking-wider flex items-center">
                        <Plus className="w-4 h-4 mr-1.5 text-emerald-600" />
                        Formulario de Órdenes de Compra Manual
                      </h4>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">Obra / Destino</label>
                          <select 
                            value={formProject} 
                            onChange={(e) => setFormProject(e.target.value)}
                            className="w-full bg-white border border-slate-250 text-slate-800 rounded-lg p-2 focus:outline-none focus:border-emerald-500 font-medium"
                          >
                            <option value="Solum T18">Solum T18 (18 Viv)</option>
                            <option value="Solum T40">Solum T40 (40 Viv)</option>
                            <option value="Maple">Maple</option>
                            <option value="Ignis">Ignis</option>
                            <option value="Terra">Terra</option>
                            <option value="Aquatec">Aquatec</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-600 font-bold mb-1">Material del Catálogo</label>
                          <select 
                            value={formMaterialCode} 
                            onChange={(e) => setFormMaterialCode(e.target.value)}
                            className="w-full bg-white border border-slate-250 text-slate-800 rounded-lg p-2 focus:outline-none focus:border-emerald-500 font-medium"
                          >
                            {materials.map(m => (
                              <option key={m.code} value={m.code}>[{m.code}] {m.description}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-600 font-bold mb-1">Cantidad Requerida</label>
                          <input 
                            type="number" 
                            value={formQuantity} 
                            onChange={(e) => setFormQuantity(Number(e.target.value))}
                            className="w-full bg-white border border-slate-250 text-slate-800 rounded-lg p-2 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 font-bold mb-1">Proveedor Asignado</label>
                          <select 
                            value={formSupplier} 
                            onChange={(e) => setFormSupplier(e.target.value)}
                            className="w-full bg-white border border-slate-250 text-slate-800 rounded-lg p-2 focus:outline-none focus:border-emerald-500 font-medium"
                          >
                            <option value="Comercializadora Ruba">Comercializadora Ruba</option>
                            <option value="Aceros y Materiales de Saltillo">Aceros de Saltillo</option>
                            <option value="PVC y Plomería de Occidente">PVC y Plomería de Occidente</option>
                            <option value="Distribuidora Industrial Alar">Distribuidora Industrial Alar</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2 text-[10.5px]">
                        <button 
                          type="button" 
                          onClick={() => setNewOrderForm(false)}
                          className="bg-slate-200 hover:bg-slate-350 text-slate-705 font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg cursor-pointer transition-all shadow-xs"
                        >
                          Crear y Sincronizar Orden
                        </button>
                      </div>
                    </motion.form>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0 select-none">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center">
                        <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
                        Registro General de Órdenes de Compra (OC)
                      </h3>
                      <p className="text-xs text-slate-550">Padrón de insumos despachados para control y auditoría de Margarita</p>
                    </div>

                    <div className="flex gap-2">
                      <select 
                        value={orderFilterObra} 
                        onChange={(e) => setOrderFilterObra(e.target.value)}
                        className="bg-white border border-slate-250 text-slate-700 text-[11.5px] font-bold px-3.5 py-1.5 rounded-xl focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                      >
                        <option value="ALL">Todas las Obras</option>
                        <option value="Solum T18">Solum T18</option>
                        <option value="Solum T40">Solum T40</option>
                        <option value="Maple">Maple</option>
                        <option value="Ignis">Ignis</option>
                        <option value="Terra">Terra</option>
                        <option value="Aquatec">Aquatec</option>
                      </select>
                    </div>
                  </div>

                  <SpreadsheetGrid 
                    type="orders"
                    materials={materials}
                    orders={orders}
                    warehouse={warehouse}
                    searchQuery={orderFilterObra === 'ALL' ? '' : orderFilterObra}
                    onModifyPrice={(order, officialPrice) => {
                      handleUpdateOrder({
                        ...order,
                        price: officialPrice,
                        total: order.quantity * officialPrice
                      });
                      showToast(`¡Precio conciliado a $${officialPrice} para ${order.id}!`);
                    }}
                    onModifyCode={(order, correctMaterial) => {
                      handleUpdateOrder({
                        ...order,
                        code: correctMaterial.code,
                        description: correctMaterial.description,
                        price: correctMaterial.price,
                        total: order.quantity * correctMaterial.price
                      });
                      showToast(`¡OC ${order.id} re-enlazada al código oficial ${correctMaterial.code}!`);
                    }}
                    showToast={showToast}
                  />
                </motion.div>
              )}

              {/* TAB 4: Warehouse entries tracker with discrepancy flag details */}
              {activeTab === 'bodega' && (
                <motion.div 
                  key="bod"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-4"
                >
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0 select-none">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center">
                      <FileText className="w-4 h-4 mr-1.5 text-emerald-600" />
                      Entradas Auxiliares a Bodega (Almacenamiento)
                    </h3>
                    <p className="text-xs text-slate-550">Verificaciones de entrega y volumetría cargadas por Joli y Kari</p>
                  </div>

                  <SpreadsheetGrid 
                    type="warehouse"
                    materials={materials}
                    orders={orders}
                    warehouse={warehouse}
                    searchQuery=""
                    onReconcileWarehouse={(entry) => {
                      const updated = {
                        ...entry,
                        receivedQuantity: entry.expectedQuantity,
                        status: 'completo' as const
                      };
                      const index = warehouse.findIndex(w => w.id === entry.id);
                      if (index !== -1) {
                        const newWarehouse = [...warehouse];
                        newWarehouse[index] = updated;
                        setWarehouse(newWarehouse);
                        if (!isSandbox) {
                          saveWarehouseEntryToCloud(updated);
                        }
                        showToast(`¡Entrada ${entry.id} reconciliada de conformidad!`);
                      }
                    }}
                    showToast={showToast}
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Footer of Visualizer Panel */}
          <footer className="bg-slate-50 border-t border-slate-200 px-5 py-3 text-[10.5px] text-slate-500 flex flex-col sm:flex-row justify-between items-center shrink-0">
            <span>Soporte Express de unificación de catálogos para Margarita</span>
            <span className="font-mono text-[9.5px] text-slate-450">Constructora Arza S.A. de C.V. — 2026</span>
          </footer>

        </section>

      </main>

      {/* Guide Help Dialog banner at page base */}
      <section className="bg-emerald-50 text-center py-3 text-xs text-emerald-900 font-semibold border-t border-emerald-100 shrink-0 select-none">
        <p className="flex items-center justify-center space-x-1">
          <HelpCircle className="w-4 h-4 text-emerald-600 mr-1.5 animate-pulse" />
          <span>¿Necesitas una plantilla de control? Conecta tu Google Sheets o pídele al Agente *"Sincroniza mis códigos"*</span>
        </p>
      </section>
    </div>
  );
}
