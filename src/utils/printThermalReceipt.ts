/**
 * Utilitário para impressão direta de cupons térmicos (bobinas de 80mm / 58mm).
 * Cria um iframe isolado para garantir que a impressão:
 * 1. Capture exclusivamente a área do cupom (sem modais, menus, barras de rolagem ou backdrops);
 * 2. Aplique a largura exata de bobina térmica (80mm) sem cortes;
 * 3. Remova margens desnecessárias e cabeçalhos automáticos de URL do navegador;
 * 4. Funcione de forma idêntica tanto em desenvolvimento quanto em PRODUÇÃO (capturando regras do Emotion inseridas via insertRule).
 */
export function printThermalReceipt(elementId: string, docTitle = "Comprovante"): boolean {
  const printArea = document.getElementById(elementId);
  if (!printArea) {
    console.error(`[printThermalReceipt] Elemento com ID #${elementId} não foi encontrado.`);
    return false;
  }

  // Cria um iframe oculto isolado no documento
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return false;
  }

  // 1. Extrai regras de TODAS as folhas de estilo ativas no documento.
  // Em produção, o Emotion (MUI) usa insertRule() direto no CSSOM ("speedy mode").
  // Por isso, ler style.innerHTML retorna vazio em produção. A leitura de sheet.cssRules resolve isso!
  let extractedCss = "";
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (const rule of Array.from(rules)) {
            extractedCss += rule.cssText + "\n";
          }
        }
      } catch {
        // Ignora folhas de outros domínios protegidas por CORS
      }
    }
  } catch (err) {
    console.warn("[printThermalReceipt] Erro ao extrair styleSheets:", err);
  }

  // 2. Coleta tags <link rel="stylesheet">
  const linkTags = Array.from(document.querySelectorAll("link[rel='stylesheet']"))
    .map((el) => el.outerHTML)
    .join("\n");

  // 3. Coleta tags <style> normais
  const staticStyles = Array.from(document.querySelectorAll("style"))
    .map((el) => el.innerHTML)
    .filter(Boolean)
    .join("\n");

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${docTitle}</title>
        ${linkTags}
        <style>
          ${staticStyles}
          ${extractedCss}
        </style>
        <style>
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 80mm !important;
            max-width: 80mm !important;
          }
          #${elementId} {
            width: 100% !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 2mm 2.5mm !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace !important;
          }
          #${elementId} * {
            font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace !important;
            color: #000000 !important;
            box-sizing: border-box !important;
          }
          .receipt-flex-row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            width: 100% !important;
          }
          .receipt-divider-dashed {
            border-bottom: 1px dashed #000000 !important;
            width: 100% !important;
            margin: 6px 0 !important;
          }
          .receipt-text-center {
            text-align: center !important;
            width: 100% !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        </style>
      </head>
      <body>
        ${printArea.outerHTML}
      </body>
    </html>
  `);
  doc.close();

  // Intervalo seguro para o navegador renderizar as fontes e regras
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error("[printThermalReceipt] Falha ao acionar impressão:", err);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  }, 300);

  return true;
}
