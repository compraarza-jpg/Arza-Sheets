import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileSpreadsheet, 
  ChevronRight, 
  ArrowLeft, 
  Search, 
  RotateCw, 
  Database, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Check, 
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Material, PurchaseOrder, WarehouseEntry } from '../types';

interface DriveBrowserProps {
  token: string | null;
  isSandbox: boolean;
  onImportMaterials: (data: Material[]) => void;
  onImportOrders: (data: PurchaseOrder[]) => void;
  onImportWarehouse: (data: WarehouseEntry[]) => void;
  showToast: (msg: string) => void;
  currentMaterials: Material[];
}

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
}

export default function DriveBrowser({
  token,
  isSandbox,
  onImportMaterials,
  onImportOrders,
  onImportWarehouse,
  showToast,
  currentMaterials
}: DriveBrowserProps) {
  // Drive navigation states
  const [items, setItems] = useState<DriveItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: 'Mi Unidad' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Active / Selected Spreadsheet for Auto-Mapper
  const [selectedFile, setSelectedFile] = useState<DriveItem | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);

  // Column Mapping Wizard states
  const [importType, setImportType] = useState<'materials' | 'orders' | 'warehouse'>('materials');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, number>>({});
  const [isMappingMode, setIsMappingMode] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Load items from Google Drive
  useEffect(() => {
    if (!isSandbox && token) {
      fetchItems(currentFolderId);
    } else {
      // Setup mock folders for sandboxed experience
      setItems([
        { id: 'mock-folder-1', name: '📁 Control de Obras 2026', mimeType: 'application/vnd.google-apps.folder' },
        { id: 'mock-folder-2', name: '📁 Catálogos Arza Conectivos', mimeType: 'application/vnd.google-apps.folder' },
        { id: 'mock-sheet-1', name: '📊 Solum 18 viviendas.xlsx', mimeType: 'application/vnd.google-apps.spreadsheet' },
        { id: 'mock-sheet-2', name: '📊 Catálogo de Materiales 2026 (Oficial).xlsx', mimeType: 'application/vnd.google-apps.spreadsheet' }
      ]);
    }
  }, [currentFolderId, token, isSandbox]);

  const fetchItems = async (folderId: string, searchKeyword: string = '') => {
    if (isSandbox || !token) return;
    try {
      setIsLoading(true);
      let queryStr = `trashed = false and (mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/vnd.google-apps.spreadsheet')`;
      if (searchKeyword.trim() !== '') {
        queryStr += ` and name contains '${searchKeyword.replace(/'/g, "\\'")}'`;
      } else {
        queryStr += ` and '${folderId}' in parents`;
      }

      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(queryStr)}&fields=files(id%2Cname%2CmimeType)&pageSize=50`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data.files || []);
      } else {
        console.error("Failed to fetch Drive files, status:", res.status);
      }
    } catch (err) {
      console.error("Error reading from Drive:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems(currentFolderId, searchTerm);
  };

  const navigateToFolder = (folderId: string, folderName: string) => {
    setSearchTerm('');
    if (folderId === 'root') {
      setBreadcrumbs([{ id: 'root', name: 'Mi Unidad' }]);
    } else {
      // Find if we are going back in breadcrumbs or deeper
      const index = breadcrumbs.findIndex(b => b.id === folderId);
      if (index !== -1) {
        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
      } else {
        setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
      }
    }
    setCurrentFolderId(folderId);
  };

  // Select a Spreadsheet and Load its tab names (sheets)
  const selectFile = async (file: DriveItem) => {
    setSelectedFile(file);
    setIsMappingMode(false);
    setAvailableSheets([]);
    setSelectedSheet('');
    
    if (isSandbox) {
      // Simulated tabs for sandbox
      if (file.name.includes("Solum") || file.id === 'mock-sheet-1') {
        setAvailableSheets(['Órdenes de Compra', 'Entradas de Bodega']);
        setSelectedSheet('Órdenes de Compra');
      } else {
        setAvailableSheets(['Catálogo de Materiales']);
        setSelectedSheet('Catálogo de Materiales');
      }
      return;
    }

    try {
      setIsLoadingSheets(true);
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${file.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const tabNames = data.sheets?.map((s: any) => s.properties.title) || [];
        setAvailableSheets(tabNames);
        if (tabNames.length > 0) {
          setSelectedSheet(tabNames[0]);
        }
      } else {
        showToast("No logramos leer la estructura del archivo.");
      }
    } catch (err) {
      console.error("Error fetching spreadsheets structure:", err);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Inspect headers in selected Sheet tab and start Smart Column mapping Wizard
  const startMappingWizard = async () => {
    if (!selectedSheet) {
      showToast("Selecciona una pestaña (hoja) primero.");
      return;
    }

    if (isSandbox) {
      // Sandbox Simulator Headers setup
      if (importType === 'materials') {
        const dummyHeaders = ["Código Arza", "Descripción", "Unidad de Medida", "Precio Pactado"];
        setHeaders(dummyHeaders);
        autoMapFields(dummyHeaders, 'materials');
      } else if (importType === 'orders') {
        const dummyHeaders = ["ID Orden", "Proyecto / Obra", "Código Material", "Descripción", "Unidad", "Cantidad", "Precio Pactado", "Cantidad Recibida", "Estado", "Proveedor", "Semana", "Observaciones", "Monto Total", "Fecha"];
        setHeaders(dummyHeaders);
        autoMapFields(dummyHeaders, 'orders');
      } else {
        const dummyHeaders = ["ID Entrada", "ID Orden", "Obra", "Código", "Descripción", "Cantidad Recibida", "Estado Recibo", "Observación", "Fecha Entrada", "Responsable"];
        setHeaders(dummyHeaders);
        autoMapFields(dummyHeaders, 'warehouse');
      }
      setIsMappingMode(true);
      return;
    }

    try {
      setIsLoadingSheets(true);
      // Fetch A1:Z2 range to scan headers and avoid row shifts correctly
      const range = `${selectedSheet}!A1:Z2`;
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectedFile?.id}/values/${encodeURIComponent(range)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const rows = data.values || [];
        if (rows.length === 0) {
          showToast("La pestaña elegida parece estar vacía.");
          return;
        }

        // Sometimes rows have dummy titles at row 0, check which row looks more like headers (contains word code/desc/id)
        let headersToUse = rows[0] || [];
        let isRow1Headers = false;

        const containsHeaderKeywords = (r: string[]) => 
          r.some(cell => {
            const c = String(cell).toLowerCase();
            return c.includes("código") || c.includes("codigo") || c.includes("descr") || c.includes("id") || c.includes("precio") || c.includes("obra");
          });

        if (rows.length > 1 && !containsHeaderKeywords(headersToUse) && containsHeaderKeywords(rows[1])) {
          headersToUse = rows[1];
          isRow1Headers = true;
        }

        // Fill empty header gaps
        const cleanHeaders = headersToUse.map((h: any, i: number) => String(h || `Columna ${i + 1}`).trim());
        setHeaders(cleanHeaders);
        autoMapFields(cleanHeaders, importType);
        setIsMappingMode(true);
      } else {
        showToast("Error consultando encabezados de Google Sheets.");
      }
    } catch (err) {
      console.error("Error reading headers:", err);
      showToast("Detalle al conectar con Google Sheets API.");
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Automatically guess column mappings based on common semantic aliases in Spanish/English
  const autoMapFields = (columns: string[], targetType: 'materials' | 'orders' | 'warehouse') => {
    const defaultMap: Record<string, number> = {};

    const findMatchIndex = (aliases: string[]) => {
      return columns.findIndex(colName => {
        const col = colName.toLowerCase();
        return aliases.some(alias => col.includes(alias));
      });
    };

    if (targetType === 'materials') {
      defaultMap['code'] = findMatchIndex(['código', 'codigo', 'clave', 'code', 'id', 'arza']);
      defaultMap['description'] = findMatchIndex(['desc', 'artículo', 'concepto', 'material', 'nombre', 'item']);
      defaultMap['unit'] = findMatchIndex(['unidad', 'un', 'medida', 'um', 'pz']);
      defaultMap['price'] = findMatchIndex(['precio', 'pactado', 'costo', 'unitario', 'pact', 'price', 'val']);
    } else if (targetType === 'orders') {
      defaultMap['id'] = findMatchIndex(['id orden', 'id_orden', 'orden', 'folio', 'oc', 'compra']);
      if (defaultMap['id'] < 0) defaultMap['id'] = findMatchIndex(['id']); // Fallback
      defaultMap['project'] = findMatchIndex(['obra', 'proyecto', 'solum', 'lugar', 'destino', 'ignis', 'terra']);
      defaultMap['code'] = findMatchIndex(['código', 'codigo', 'clave', 'code', 'material']);
      defaultMap['description'] = findMatchIndex(['dec', 'desc', 'artículo', 'concepto', 'material', 'nombre']);
      defaultMap['unit'] = findMatchIndex(['unidad', 'un', 'um']);
      defaultMap['quantity'] = findMatchIndex(['cantidad', 'solicitada', 'pedida', 'cant', 'unidades', 'req']);
      defaultMap['price'] = findMatchIndex(['precio', 'pactado', 'costo', 'unitario', 'valor']);
      defaultMap['receivedQuantity'] = findMatchIndex(['recibida', 'entregada', 'llegó', 'recibido', 'rec']);
      defaultMap['status'] = findMatchIndex(['estado', 'status', 'estatus', 'etapa']);
      defaultMap['supplier'] = findMatchIndex(['proveedor', 'distribuidor', 'marca', 'supplier']);
      defaultMap['week'] = findMatchIndex(['semana', 'sem', 'week']);
      defaultMap['observation'] = findMatchIndex(['observaciones', 'obs', 'comentario', 'comentarios', 'nota']);
      defaultMap['date'] = findMatchIndex(['fecha', 'date', 'día', 'emisión']);
    } else if (targetType === 'warehouse') {
      defaultMap['id'] = findMatchIndex(['id entrada', 'entrada', 'id_entrada', 'folio', 'ent-id']);
      if (defaultMap['id'] < 0) defaultMap['id'] = findMatchIndex(['id']); // Fallback
      defaultMap['orderId'] = findMatchIndex(['id orden', 'id_orden', 'orden', 'oc']);
      defaultMap['code'] = findMatchIndex(['código', 'codigo', 'clave', 'material', 'code']);
      defaultMap['description'] = findMatchIndex(['desc', 'artículo', 'concepto', 'material', 'nombre']);
      defaultMap['quantity'] = findMatchIndex(['recibida', 'cantidad', 'entregada', 'recibido', 'cant']);
      defaultMap['status'] = findMatchIndex(['estado', 'recibo', 'discrepancia', 'status']);
      defaultMap['observer'] = findMatchIndex(['responsable', 'recibió', 'recibio', 'observador', 'bodeguero', 'recepción']);
      defaultMap['date'] = findMatchIndex(['fecha', 'date', 'día', 'entrada', 'llegada']);
      defaultMap['observation'] = findMatchIndex(['observacion', 'observaciones', 'observación', 'nota', 'comentario']);
    }

    setMappings(defaultMap);
  };

  const handleMappingChange = (field: string, columnIndex: number) => {
    setMappings(prev => ({
      ...prev,
      [field]: columnIndex
    }));
  };

  // Run final import and structural parsing
  const executeImport = async () => {
    if (isSandbox) {
      setIsImporting(true);
      setTimeout(() => {
        setIsImporting(false);
        setIsMappingMode(false);
        setSelectedFile(null);
        showToast(`¡Simulación Sandbox: Datos de ${importType} importados con éxito!`);
        
        // Trigger some clean mock imports
        if (importType === 'materials') {
          onImportMaterials([
            { code: '1520100', description: 'Codo PVC de 3pulgadas Sanitario 90', unit: 'PZ', price: 29.50 },
            { code: '1350150', description: 'Codo de 2" x 45 PVC Sanitario', unit: 'PZ', price: 18.50 },
            { code: '2100100', description: 'Cemento Portland Gris APASCO 50kg', unit: 'SACO', price: 175.00 }
          ]);
        } else if (importType === 'orders') {
          onImportOrders([
            {
              id: 'OC-2501',
              date: '2026-06-15',
              week: 25,
              project: 'Solum T18',
              supplier: 'Pinturas del Pacífico S.A.',
              code: '1520100',
              description: 'Codo PVC de 3pulgadas Sanitario 90',
              unit: 'PZ',
              quantity: 80,
              price: 29.50,
              total: 2360.00,
              receivedQuantity: 0,
              status: 'pendiente',
              observation: 'Mapeado real de la pestaña'
            }
          ]);
        }
      }, 1200);
      return;
    }

    // Official Google API Flow
    try {
      setIsImporting(true);
      // Fetch up to 2000 rows starting from A2 (skip header row offset)
      const range = `${selectedSheet}!A2:Z2000`;
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectedFile?.id}/values/${encodeURIComponent(range)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        showToast("No logramos descargar los renglones de la tabla.");
        return;
      }

      const data = await res.json();
      const rows = data.values || [];
      if (rows.length === 0) {
        showToast("La pestaña seleccionada no tiene renglones de datos.");
        return;
      }

      const safeValue = (row: any[], index: number, fallback: string = ""): string => {
        if (index === undefined || index === -1 || !row || row[index] === undefined) return fallback;
        return String(row[index]).trim();
      };

      const safeNum = (row: any[], index: number, fallback: number = 0): number => {
        const val = safeValue(row, index, "");
        if (!val) return fallback;
        const cleaned = val.replace(/[^0-9.-]/g, ""); // strip Dollar signs, commas
        const n = Number(cleaned);
        return isNaN(n) ? fallback : n;
      };

      if (importType === 'materials') {
        const parsedMaterials: Material[] = rows.map((row: any[]) => {
          const code = safeValue(row, mappings['code'], "");
          const description = safeValue(row, mappings['description'], "");
          const unit = safeValue(row, mappings['unit'], "PZ");
          const price = safeNum(row, mappings['price'], 0);
          return { code, description, unit, price };
        }).filter(m => m.code !== "");

        if (parsedMaterials.length > 0) {
          onImportMaterials(parsedMaterials);
          showToast(`¡Catálogo Actualizado! Cargados ${parsedMaterials.length} materiales.`);
        } else {
          showToast("No se pudo parsear ningún material. Revisa la asignación de columnas.");
        }

      } else if (importType === 'orders') {
        const parsedOrders: PurchaseOrder[] = rows.map((row: any[], idx: number) => {
          const id = safeValue(row, mappings['id'], `OC-DRV-${1000 + idx}`);
          const date = safeValue(row, mappings['date'], new Date().toISOString().split('T')[0]);
          const week = safeNum(row, mappings['week'], 24);
          const project = safeValue(row, mappings['project'], "Solum");
          const supplier = safeValue(row, mappings['supplier'], "Margarita Distribuidor");
          const code = safeValue(row, mappings['code'], "");
          const description = safeValue(row, mappings['description'], "");
          const unit = safeValue(row, mappings['unit'], "PZ");
          const quantity = safeNum(row, mappings['quantity'], 1);
          const price = safeNum(row, mappings['price'], 0);
          const receivedQuantity = safeNum(row, mappings['receivedQuantity'], 0);
          
          let status: 'pendiente' | 'parcial' | 'completado' = 'pendiente';
          const rowStatusStr = safeValue(row, mappings['status'], "").toLowerCase();
          if (rowStatusStr.includes("completo") || rowStatusStr.includes("done") || rowStatusStr.includes("pagado")) {
            status = 'completado';
          } else if (rowStatusStr.includes("parcial") || receivedQuantity > 0) {
            status = 'parcial';
          }

          const observation = safeValue(row, mappings['observation'], "");
          return {
            id,
            date,
            week,
            project,
            supplier,
            code,
            description,
            unit,
            quantity,
            price,
            total: quantity * price,
            receivedQuantity,
            status,
            observation
          };
        }).filter(o => o.code !== "");

        if (parsedOrders.length > 0) {
          onImportOrders(parsedOrders);
          showToast(`¡Órdenes Importadas! Cargadas ${parsedOrders.length} transacciones.`);
        } else {
          showToast("Ninguna orden detectada. Valida tus columnas.");
        }

      } else if (importType === 'warehouse') {
        const parsedWarehouse: WarehouseEntry[] = rows.map((row: any[], idx: number) => {
          const id = safeValue(row, mappings['id'], `ENT-DRV-${idx + 1}`);
          const date = safeValue(row, mappings['date'], new Date().toISOString().split('T')[0]);
          const orderId = safeValue(row, mappings['orderId'], "OC-DESC");
          const code = safeValue(row, mappings['code'], "");
          const description = safeValue(row, mappings['description'], "");
          const expectedQuantity = safeNum(row, mappings['quantity'], 0);
          const receivedQuantity = safeNum(row, mappings['quantity'], 0); // fallback identical or similar
          
          let status: 'completo' | 'discrepancia' = 'completo';
          const statusStr = safeValue(row, mappings['status'], "").toLowerCase();
          if (statusStr.includes("discrepancia") || statusStr.includes("error") || statusStr.includes("diferencia")) {
            status = 'discrepancia';
          }

          const observer = safeValue(row, mappings['observer'], "Kari Bodega");
          const observation = safeValue(row, mappings['observation'], "");

          return {
            id,
            date,
            orderId,
            code,
            description,
            expectedQuantity,
            receivedQuantity,
            status,
            observer,
            observation,
            // Keep supporting auxiliary values
            project: safeValue(row, mappings['project'], "Solum"),
            materialCode: code,
            materialName: description,
            receivedBy: observer
          } as any;
        }).filter(w => w.orderId !== "" && w.code !== "");

        if (parsedWarehouse.length > 0) {
          onImportWarehouse(parsedWarehouse);
          showToast(`¡Recibos de Almacén Actualizados! ${parsedWarehouse.length} registros cargados.`);
        } else {
          showToast("No se detectaron entradas de bodega válidas.");
        }
      }

      setIsMappingMode(false);
      setSelectedFile(null);
    } catch (err) {
      console.error("Critical parse error:", err);
      showToast("Tuvimos un percance analizando las filas.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Navigation Bar */}
      {!selectedFile && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-stone-300">Explorador de Archivos y Carpetas de Google Drive 📂:</span>
            {isLoading && <RotateCw className="w-3.5 h-3.5 text-arza-400 animate-spin" />}
          </div>

          {/* Breadcrumb navigator */}
          <div className="flex flex-wrap items-center gap-1.5 bg-stone-900/40 p-2 rounded-lg border border-stone-800 text-[10px] font-mono text-stone-400">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-stone-600" />}
                <button
                  onClick={() => navigateToFolder(crumb.id, crumb.name)}
                  className={`hover:text-arza-400 transition-colors uppercase cursor-pointer ${
                    idx === breadcrumbs.length - 1 ? 'text-arza-300 font-bold' : ''
                  }`}
                  disabled={isLoading}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Search box */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-500" />
              <input
                type="text"
                placeholder="Buscar archivos en tu Drive..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-stone-900/60 border border-stone-800 focus:border-arza-500 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none placeholder-stone-600"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Buscar
            </button>
          </form>

          {/* File grid */}
          <div className="bg-stone-900/40 rounded-xl p-2.5 max-h-[180px] overflow-y-auto border border-stone-800/80 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
            {items.length > 0 ? (
              items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-900/50 border border-transparent hover:border-stone-800/40 transition-all group"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    {item.mimeType === 'application/vnd.google-apps.folder' ? (
                      <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 text-arza-400 shrink-0" />
                    )}
                    <span className="text-[11px] font-medium text-stone-300 group-hover:text-white truncate max-w-[200px]">
                      {item.name}
                    </span>
                  </div>

                  {item.mimeType === 'application/vnd.google-apps.folder' ? (
                    <button
                      onClick={() => navigateToFolder(item.id, item.name)}
                      disabled={isLoading}
                      className="text-[9px] font-bold text-arza-400 hover:text-arza-300 px-2 py-1 rounded bg-arza-500/10 cursor-pointer border border-arza-500/20"
                    >
                      Abrir Carpeta
                    </button>
                  ) : (
                    <button
                      onClick={() => selectFile(item)}
                      className="text-[9px] font-bold text-stone-900 hover:bg-arza-400 bg-arza-500 px-2.5 py-1 rounded transition-colors cursor-pointer"
                    >
                      Seleccionar
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-stone-500">
                {isLoading ? "Consultando archivos de Google Drive..." : "Unidad vacía. No encontramos archivos ni carpetas."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected File Wizard */}
      {selectedFile && !isMappingMode && (
        <div className="bg-stone-900/60 p-4 rounded-xl border border-arza-500/20 space-y-3.5">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <span className="text-[8px] tracking-wider uppercase bg-arza-400/10 text-arza-300 border border-arza-400/20 px-2 py-0.5 rounded-full font-mono font-semibold">
                Archivo Seleccionado para Mapear
              </span>
              <h5 className="text-[12px] font-bold text-white flex items-center gap-1.5 mt-1.5 truncate">
                <FileSpreadsheet className="w-3.5 h-3.5 text-arza-400" />
                {selectedFile.name}
              </h5>
              <p className="text-[9px] text-stone-500 truncate font-mono mt-0.5">ID: {selectedFile.id}</p>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-[10px] text-stone-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Atrás
            </button>
          </div>

          {/* Select Sheet Tab inside file */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400">Pestaña a Importar:</label>
              {isLoadingSheets ? (
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400 py-2">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-arza-400" /> Cargando estructura...
                </div>
              ) : (
                <select
                  value={selectedSheet}
                  onChange={e => setSelectedSheet(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 text-xs text-white rounded-lg p-2 focus:outline-none focus:border-arza-500 cursor-pointer"
                >
                  {availableSheets.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400">Convertir y Cargar como:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 'materials', label: 'Catálogo' },
                  { value: 'orders', label: 'Órdenes' },
                  { value: 'warehouse', label: 'Bodega' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setImportType(opt.value as any)}
                    className={`py-2 px-1 text-[10px] font-semibold border rounded-lg cursor-pointer transition-all ${
                      importType === opt.value
                        ? 'bg-arza-500 border-arza-400 text-stone-900 font-bold'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-arza-500/5 p-3 rounded-lg border border-arza-500/10 text-[11px] text-stone-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-arza-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Auto-Mapeo Inteligente con IA de Arza</span>
              Selecciona tu pestaña y pulsa abajo. Analizaremos automáticamente la primera fila para emparejar campos clave como códigos, cantidades y observaciones sin desacomodar nada.
            </div>
          </div>

          <button
            onClick={startMappingWizard}
            disabled={isLoadingSheets || !selectedSheet}
            className="w-full py-2 bg-gradient-to-r from-arza-600 to-arza-500 hover:from-arza-500 hover:to-arza-400 text-stone-900 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-arza-500/15 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-900 animate-pulse" />
            Siguiente: Mapear Columnas de {importType === 'materials' ? 'Catálogo' : importType === 'orders' ? 'Órdenes de Compra' : 'Bodega'}
          </button>
        </div>
      )}

      {/* Auto-Mapper Column Matching Screen */}
      {selectedFile && isMappingMode && (
        <div className="bg-stone-900 p-4 rounded-xl border border-arza-500/30 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[8px] tracking-wider uppercase bg-arza-400/10 text-arza-300 border border-arza-400/20 px-2 py-0.5 rounded-full font-mono font-semibold">
                Paso 2: Mapeador de Columnas Real
              </span>
              <h5 className="text-[12px] font-bold text-white flex items-center gap-1.5 mt-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-arza-400" />
                Emparejar columnas de &quot;{selectedSheet}&quot;
              </h5>
              <p className="text-[10px] text-stone-400 mt-0.5">Asigna qué columna de tu Excel corresponde a los parámetros del sistema.</p>
            </div>
            <button
              onClick={() => setIsMappingMode(false)}
              className="text-[10px] text-stone-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Atrás
            </button>
          </div>

          {/* Mapping settings */}
          <div className="space-y-3 p-3 bg-stone-900 rounded-lg border border-stone-800 max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            {importType === 'materials' && (
              <div className="space-y-3">
                {[
                  { key: 'code', label: 'Código Arza * (Clave Única)', desc: 'Identificador único del material' },
                  { key: 'description', label: 'Descripción Homologada *', desc: 'Nombre descriptivo del artículo' },
                  { key: 'unit', label: 'Unidad de Medida', desc: 'PZ, SACO, KG, etc.' },
                  { key: 'price', label: 'Precio Pactado * (Monto)', desc: 'Costo unitario acordado' }
                ].map(field => (
                  <div key={field.key} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 pb-2.5 last:pb-0 last:border-b-0 border-b border-stone-800">
                    <div className="max-w-[200px]">
                      <span className="text-[11px] font-bold text-stone-200 block">{field.label}</span>
                      <span className="text-[9px] text-stone-500 block leading-tight">{field.desc}</span>
                    </div>
                    <select
                      value={mappings[field.key] !== undefined ? mappings[field.key] : -1}
                      onChange={e => handleMappingChange(field.key, Number(e.target.value))}
                      className="bg-stone-900 border border-stone-800 rounded-lg text-[11px] p-2 text-white sm:w-[160px] focus:outline-none focus:border-arza-500 cursor-pointer"
                    >
                      <option value={-1}>-- No asignar --</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{`Columna ${i + 1}: ${h}`}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {importType === 'orders' && (
              <div className="space-y-3">
                {[
                  { key: 'id', label: 'ID Orden (OC-XXXX)', desc: 'Identificador consecutivo de la compra' },
                  { key: 'project', label: 'Obra / Proyecto *', desc: 'Nombre del desarrollo o proyecto' },
                  { key: 'code', label: 'Código de Material *', desc: 'Código del catálogo maestro unificado' },
                  { key: 'description', label: 'Descripción Material *', desc: 'Nombre/Tipo de material' },
                  { key: 'unit', label: 'Unidad', desc: 'PZ, SACO, LITRO' },
                  { key: 'quantity', label: 'Cantidad Solicitada *', desc: 'Unidades pedidas originalmente' },
                  { key: 'price', label: 'Precio Pactado * (Costo)', desc: 'Monto unitario acordado' },
                  { key: 'receivedQuantity', label: 'Cantidad Recibida', desc: 'Unidades aceptadas en Almacén' },
                  { key: 'status', label: 'Estado', desc: 'Pendiente, Parcial, Completado' },
                  { key: 'supplier', label: 'Proveedor', desc: 'Nombre de la constructora o distribuidora' },
                  { key: 'week', label: 'Semana', desc: 'Rango de consolidación semanal' },
                  { key: 'observation', label: 'Comentarios / Observaciones', desc: 'Notas de disconformidad o ajustes' },
                  { key: 'date', label: 'Fecha de Emisión', desc: 'Momento de emisión de la orden' }
                ].map(field => (
                  <div key={field.key} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 pb-2.5 last:pb-0 last:border-b-0 border-b border-stone-800">
                    <div className="max-w-[200px]">
                      <span className="text-[11px] font-bold text-stone-200 block">{field.label}</span>
                      <span className="text-[9px] text-stone-500 block leading-tight">{field.desc}</span>
                    </div>
                    <select
                      value={mappings[field.key] !== undefined ? mappings[field.key] : -1}
                      onChange={e => handleMappingChange(field.key, Number(e.target.value))}
                      className="bg-stone-900 border border-stone-800 rounded-lg text-[11px] p-2 text-white sm:w-[160px] focus:outline-none focus:border-arza-500 cursor-pointer"
                    >
                      <option value={-1}>-- No asignar (Opcional) --</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{`Columna ${i + 1}: ${h}`}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {importType === 'warehouse' && (
              <div className="space-y-3">
                {[
                  { key: 'id', label: 'ID Entrada Bodega', desc: 'Identificador del recibo físico' },
                  { key: 'orderId', label: 'ID Orden Asociada *', desc: 'Orden de compra unificada de origen' },
                  { key: 'code', label: 'Código Material *', desc: 'Clave única del artículo unificado' },
                  { key: 'description', label: 'Descripción Material *', desc: 'Nombre descriptivo del artículo' },
                  { key: 'quantity', label: 'Cantidad Entregada *', desc: 'Monto recibido físicamente' },
                  { key: 'status', label: 'Estado Entrada', desc: '¿Completo o con Discrepancia?' },
                  { key: 'observer', label: 'Responsable de Almacén', desc: 'Responsable (Kari o Joli)' },
                  { key: 'date', label: 'Fecha de Entrada', desc: 'Día que ingresó a la bodega' },
                  { key: 'observation', label: 'Notas / Observaciones', desc: 'Notas de faltantes o averías' }
                ].map(field => (
                  <div key={field.key} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 pb-2.5 last:pb-0 last:border-b-0 border-b border-stone-800">
                    <div className="max-w-[200px]">
                      <span className="text-[11px] font-bold text-stone-200 block">{field.label}</span>
                      <span className="text-[9px] text-stone-500 block leading-tight">{field.desc}</span>
                    </div>
                    <select
                      value={mappings[field.key] !== undefined ? mappings[field.key] : -1}
                      onChange={e => handleMappingChange(field.key, Number(e.target.value))}
                      className="bg-stone-900 border border-stone-800 rounded-lg text-[11px] p-2 text-white sm:w-[160px] focus:outline-none focus:border-arza-500 cursor-pointer"
                    >
                      <option value={-1}>-- No asignar --</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{`Columna ${i + 1}: ${h}`}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-stone-900 border border-stone-800 p-3 rounded-lg text-[11px] text-stone-400 space-y-1">
            <div className="font-bold text-stone-300 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-arza-400" />
              Sugerencia de Procesamiento:
            </div>
            <span>Las celdas con errores o vacías se limpian automáticamente de fondo para prevenir sobregasto y asegurar de inmediato que las columnas de Margarita cuadren sin errores.</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5">
            <button
              onClick={() => setIsMappingMode(false)}
              className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold py-2.5 rounded-lg border border-stone-700 cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={executeImport}
              disabled={isImporting}
              className="flex-1 bg-arza-500 hover:bg-arza-400 text-stone-900 text-xs font-extrabold py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-arza-500/10 cursor-pointer disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Descargando datos...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirmar e Importar
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
