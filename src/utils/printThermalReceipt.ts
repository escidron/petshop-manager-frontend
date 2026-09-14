/**
 * Utilitário para impressão direta de cupons térmicos (bobinas de 80mm / 58mm).
 * Cria um iframe isolado para garantir que a impressão:
 * 1. Capture exclusivamente a área do cupom (sem modais, menus, barras de rolagem ou backdrops);
 * 2. Aplique a largura exata de bobina térmica (80mm) sem cortes;
 * 3. Remova margens desnecessárias e cabeçalhos automáticos de URL do navegador;
 * 4. Preserve todas as cores, divisórias e formatações monoespaçadas.
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

  // Clona todas as tags de estilo e links CSS da página principal para manter as fontes e classes MUI/Emotion
  const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map((el) => el.outerHTML)
    .join("\n");

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${docTitle}</title>
        ${styles}
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

  // Pequeno intervalo para o navegador processar as folhas de estilo do iframe
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error("[printThermalReceipt] Falha ao acionar impressão:", err);
    } finally {
      // Remove o iframe da memória após a impressão
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  }, 250);

  return true;
}
