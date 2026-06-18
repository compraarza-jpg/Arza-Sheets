/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not configured correctly.");
    }
    // Lazy instantiate
    aiClient = new GoogleGenAI({ apiKey: key || "" });
  }
  return aiClient;
}

// API endpoint for Rossy's conversational assistant
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages, sheetsContext } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      // Graceful fallback response when API key is missing
      const lastMsg = messages[messages.length - 1]?.content || "";
      let simulatedReply = "¡Hola Rossy! Estoy operando en **Modo Demo (Sin API Key)**. ";
      
      if (lastMsg.toLowerCase().includes("orden") || lastMsg.toLowerCase().includes("compra")) {
        simulatedReply += "Entiendo que quieres generar una Orden de Compra. Te sugiero agregar una orden en Solum T18 para 'Codo PVC 2\"' con el código de unificación `1350150`. ¿Deseas que lo ejecute en la tabla?";
        return res.json({
          content: simulatedReply,
          action: {
            type: "add_order",
            payload: {
              project: "Solum T18",
              code: "1350150",
              description: "Codo de 2\" x 45 PVC Sanitario",
              unit: "PZ",
              quantity: 15,
              price: 18.50,
              supplier: "PVC y Plomería de Occidente"
            }
          }
        });
      } else if (lastMsg.toLowerCase().includes("codigo") || lastMsg.toLowerCase().includes("sincro") || lastMsg.toLowerCase().includes("error")) {
        simulatedReply += "He detectado discrepancias en tu tabla actual. Por ejemplo, hay un material listado como 'Codo PVC de 2 pulgadas' sin código unificado. He mapeado el código correcto `1350150` de tu Catálogo Maestro. ¿Quieres que sincronice la tabla?";
        return res.json({
          content: simulatedReply,
          action: {
            type: "sync_codes",
            payload: {
              discrepancyCount: 1,
              mappings: [{ name: "Codo PVC de 2 pulgadas", suggestedCode: "1350150", price: 18.50 }]
            }
          }
        });
      } else if (lastMsg.toLowerCase().includes("bode") || lastMsg.toLowerCase().includes("recib") || lastMsg.toLowerCase().includes("lleg")) {
        simulatedReply += "Entendido, estoy listo para registrar entradas a la bodega. Kari reporta que se recibieron 100 codos de PVC en lugar de 120 de la orden regulada. He preparado el comando para actualizar la cantidad recibida a 100 y marcar la orden como 'Parcial'. ¿Procedemos?";
        return res.json({
          content: simulatedReply,
          action: {
            type: "update_received",
            payload: { orderId: "OC-2026-001", quantity: 100, status: "parcial", observation: "Recibido parcial por Kari con discrepancia." }
          }
        });
      } else {
        simulatedReply += `Para darte respuestas completamente inteligentes y con razonamiento avanzado, pídele a tu administrador que configure una clave real de Google AI Studio (\`GEMINI_API_KEY\`). 

Mientras tanto, puedes usar todas las herramientas interactivas del simulador táctil a la derecha para sincronizar códigos, registrar entregas parciales y ver los gráficos consolidadores.`;
        return res.json({ content: simulatedReply });
      }
    }

    const ai = getGenAIClient();
    
    // System Instruction defining Rossy's helpful Expert Agent persona
    const systemPrompt = `Eres el Agente Inteligente Experto en Google Sheets para Constructora Arza (o Arzada). Estás al servicio personal de Rossy Lares Morales (Rossy).
Rossy es una administradora encargada de compras y de coordinar con las bodegueras (Joli y Kari) los envíos y validación de códigos de materiales.
Rossy NO sabe programar ni fórmulas avanzadas de Excel, suele trabajar copiando y pegando. Quiere que seas extremadamente amable, explicativo, hables en un español mexicano amigable y directo, y le facilites todo el trabajo rutinario para que no sufra cansancio.

El contexto de la hoja actual de Rossy es el siguiente:
- Catálogo Maestro de Materiales unificados: Define código de artículo, descripción homologada y precio pactado (para evitar duplicaciones y sobre-costos promovidos por Margarita/Mago).
- Registro de Órdenes de Compra (OC): Contiene columnas de obra (Solum T18/T40, Maple, Ignis, Terra, Aquatec), proveedor, semanal, códigos, cantidades, precio pactado y cantidad total recibida.
- Entradas de Almacén: Tracking de cuándo ingresa el material y si hay discrepancia (ej. pidieron 120 pero llegaron 100 codos de PVC sanitario de 2").

Datos de las hojas activas actualmente en la app:
${JSON.stringify(sheetsContext, null, 2)}

Tu rol es:
1. Responder amigablemente a la duda de Rossy.
2. Si Rossy te pide o insinúa crear una Orden de Compra, validar códigos de materiales, buscar duplicados o registrar recibos de bodega:
   a. Sugiere la corrección o acción en español claro.
   b. Adjunta un bloque JSON ejecutable especificando la acción recomendada usando UNO de los siguientes formatos de acción.
   
Formatos de Acción válidos que puedes retornar como propiedad JSON 'action' en tu respuesta principal (NO los pongas en texto plano, asócialos estructuradamente en la respuesta):
- Para crear una orden de compra:
  { "type": "add_order", "payload": { "project": "Nombre Obra", "code": "Código", "description": "Descripción", "unit": "PZ/SACO etc", "quantity": numero, "price": numero, "supplier": "Proveedor" } }
- Para resolver discrepancias de códigos (unificación de catálogo):
  { "type": "sync_codes", "payload": { "mappings": [ { "name": "Nombre original", "suggestedCode": "Código catálogo", "price": numero } ] } }
- Para registrar entrada de almacén/unidad recibida:
  { "type": "update_received", "payload": { "orderId": "OC-ID", "quantity": numero, "status": "parcial"|"completado", "observation": "Razón" } }

Asegúrate de retornar siempre un objeto JSON puro como respuesta con la estructura:
{
  "content": "Tu explicación amigable para Rossy en español, con viñetas scannable y explicaciones claras sobre códigos unificados.",
  "action": <actionObject o null>
}
`;

    // Process chat history into content parts
    const contents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: msg.content }]
    }));

    // Generate output with structured configuration
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const replyText = response.text;
    try {
      if (replyText) {
        const parsed = JSON.parse(replyText);
        return res.json(parsed);
      }
    } catch (parseErr) {
      console.warn("Could not parse Gemini output as JSON, returning raw:", replyText);
      return res.json({ content: replyText || "Lo siento, tuve un problema analizando esta solicitud. ¿Me la podrías repetir?" });
    }

    return res.json({ content: "No obtuve respuesta del agente. Por favor vuelve a intentar." });

  } catch (err: any) {
    console.error("Gemini route error:", err);
    res.status(500).json({ error: err.message || "Error procesando el agente conversacional" });
  }
});

// Configure Vite middleware in development or static serving inside production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Arza Google Sheets Agent server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
