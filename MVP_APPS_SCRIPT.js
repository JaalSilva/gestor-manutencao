/**
 * BABA ELITE - FASE 1: MVP GOOGLE SHEETS
 * Copie este código para o Editor de Scripts (Extensões > Apps Script) da sua Planilha.
 * 
 * Estrutura da Planilha:
 * 1. Aba "JOGADORES": [Nome, Telefone, Status Pagamento, Data Pagamento]
 * 2. Aba "PRESENCA": [Nome, Data, Status]
 * 3. Aba "CONFIG": [Chave, Valor] -> (CAMPOS: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID)
 */

const CONFIG = {
  WHATSAPP_PHONE_ID: "SEU_ID",
  WHATSAPP_TOKEN: "SEU_TOKEN",
  API_URL: "https://ais-pre-a4k5ec4lu7sykj55jd34pj-408956280934.us-west2.run.app" // URL do seu sistema web
};

/**
 * Dispara cobranças para jogadores com status "PENDENTE"
 */
function cobrarAtrasos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("JOGADORES");
  const data = sheet.getDataRange().getValues();
  
  // Pula o cabeçalho
  for (let i = 1; i < data.length; i++) {
    const nome = data[i][0];
    const telefone = data[i][1];
    const status = data[i][2];
    
    if (status === "PENDENTE") {
      const msg = `Querido amigo da bola ${nome}, chegou o dia pra pagar nossa brincadeira semanal. A chave pix ta no grupo do baba. Seus 40 reais é necessario para garantir o pagamento do espaço. OBRIGADO`;
      
      enviarWhatsApp(telefone, msg);
      Logger.log("Cobrança enviada para: " + nome);
      
      // Opcional: registrar na planilha que foi cobrado
      sheet.getRange(i + 1, 4).setValue(new Date()); 
    }
  }
}

/**
 * Calcula o Ranking Fair Play baseado em Presença e Pagamento
 */
function calcularFairPlay() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const playersSheet = ss.getSheetByName("JOGADORES");
  const presenceSheet = ss.getSheetByName("PRESENCA");
  
  const players = playersSheet.getDataRange().getValues();
  const presence = presenceSheet.getDataRange().getValues();
  
  const ranking = {}; // { Nome: Score }

  // 1. Pontuação por Presença
  for (let i = 1; i < presence.length; i++) {
    const nome = presence[i][0];
    const status = presence[i][2];
    
    if (!ranking[nome]) ranking[nome] = 0;
    
    if (status === "PRESENTE") ranking[nome] += 10;
    if (status === "JUSTIFICADO") ranking[nome] += 5;
  }

  // 2. Pontuação por Pagamento
  for (let i = 1; i < players.length; i++) {
    const nome = players[i][0];
    const status = players[i][2];
    
    if (!ranking[nome]) ranking[nome] = 0;
    if (status === "PAGO") ranking[nome] += 10;
  }

  Logger.log("Ranking Calculado: " + JSON.stringify(ranking));
  return ranking;
}

/**
 * Envia Premiação para o TOP 1
 */
function enviarPremiacao() {
  const ranking = calcularFairPlay();
  const sorted = Object.entries(ranking).sort((a, b) => b[1] - a[1]);
  
  if (sorted.length > 0) {
    const campeao = sorted[0];
    const msg = `🏆 HALL OF HONOR: Parabéns ${campeao[0]}! Você é o atual líder do ranking Fair Play com ${campeao[1]} pontos. Continue com o bom comportamento!`;
    
    // Pegar telefone do campeão na aba JOGADORES
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const players = ss.getSheetByName("JOGADORES").getDataRange().getValues();
    const tel = players.find(row => row[0] === campeao[0])[1];
    
    if (tel) enviarWhatsApp(tel, msg);
  }
}

/**
 * Helper para envio via Meta API (ou Proxy do Sistema Web)
 */
function enviarWhatsApp(telefone, mensagem) {
  const url = `https://graph.facebook.com/v18.0/${CONFIG.WHATSAPP_PHONE_ID}/messages`;
  
  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + CONFIG.WHATSAPP_TOKEN
    },
    payload: JSON.stringify({
      messaging_product: "whatsapp",
      to: telefone.toString().replace(/\D/g, ""),
      type: "text",
      text: { body: mensagem }
    }),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    Logger.log(response.getContentText());
  } catch(e) {
    Logger.log("Erro ao enviar: " + e.toString());
  }
}
