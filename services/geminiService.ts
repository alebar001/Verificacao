
import { GoogleGenAI, Type } from "@google/genai";
import { TickerData, AIAnalysisResult } from "../types";

const API_KEY = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;

if (!API_KEY) {
  console.warn("API_KEY não encontrada. Configure-a para habilitar a análise neural.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const ESTRATEGIA_ASSERTIVA = `
  ESTRATÉGIA DE MAXIMIZAÇÃO DE ACERTO (SMART MONEY CONCEPTS):
  1. CONFLUÊNCIA OBRIGATÓRIA: O sinal 'BULLISH' exige que o 1h esteja acima da média de 24h E o 4h esteja em estrutura de alta.
  2. CICLOS 2018-2025: Identifique se o preço está em zona de acumulação histórica ou topo de euforia (estresse de volume).
  3. ANOMALIA DE VOLUME: Se o volume subir > 20% com preço estável, indique ABSORÇÃO. Se volume cair com preço subindo, indique EXAUSTÃO.
  4. GERENCIAMENTO: O Stop Loss deve ser posicionado abaixo da última zona de liquidez identificada no 4h.
`;

export const getAIAnalysis = async (ticker: TickerData): Promise<AIAnalysisResult> => {
  const prompt = `
    ATUE COMO UM ALGORITMO DE ALTA PRECISÃO (HFT QUANT).
    
    DADOS DO ATIVO EM TEMPO REAL:
    - Símbolo: ${ticker.symbol}
    - Último Preço: ${ticker.lastPrice}
    - Variação 24h: ${ticker.priceChangePercent}%
    - Volume Relativo: ${ticker.quoteVolume}
    - Volatilidade (High-Low): ${ticker.highPrice} / ${ticker.lowPrice}

    ${ESTRATEGIA_ASSERTIVA}

    INSTRUÇÕES DE EXECUÇÃO:
    - Analise a convergência dos tempos 1h, 4h e Diário.
    - Se houver divergência (ex: 1h subindo, mas 1D em forte baixa), o sentimento DEVE ser 'NEUTRAL' ou 'BEARISH' (priorize a tendência maior).
    - Defina alvos (Target) com base no próximo nível de liquidez institucional não testado.
    - Redija o 'insight' e os alertas 'discrepancies' de forma técnica e direta em Português (PT-BR).

    REQUISITOS DE RESPOSTA (JSON):
    - insight: Diagnóstico técnico da confluência multi-timeframe.
    - sentiment: BULLISH, BEARISH, NEUTRAL, EXTREME_OVERBOUGHT, EXTREME_OVERSOLD.
    - confidence: Score de 0-100 baseado na força da confluência.
    - levels: { target, resistance, support, stopLoss }.
    - discrepancies: Lista de alertas sobre riscos de manipulação ou exaustão.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: "Você é um motor de análise de alta assertividade. Sua função é filtrar ruídos de curto prazo e focar na tendência estrutural multi-timeframe. Responda sempre em PT-BR com precisão matemática.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentiment: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          insight: { type: Type.STRING },
          levels: {
            type: Type.OBJECT,
            properties: {
              target: { type: Type.STRING },
              resistance: { type: Type.STRING },
              support: { type: Type.STRING },
              stopLoss: { type: Type.STRING }
            },
            required: ["target", "resistance", "support", "stopLoss"]
          },
          discrepancies: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["sentiment", "confidence", "insight", "levels", "discrepancies"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Erro na estratégia neural:", e);
    throw new Error("Erro ao processar estratégia de alta assertividade.");
  }
};
