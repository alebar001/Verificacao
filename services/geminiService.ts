
import { GoogleGenAI, Type } from "@google/genai";
import { TickerData, AIAnalysisResult } from "../types";

const API_KEY = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;

if (!API_KEY) {
  console.warn("API_KEY não encontrada. Configure-a para habilitar a análise neural.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const HISTORICAL_CONTEXT = `
  CONTEXTO DE MERCADO (2018-2025):
  - 2018: Grande correção (Bear Market), suporte em volumes baixos.
  - 2020: Crash Covid seguido de expansão institucional.
  - 2021: Bull Market, euforia, topos duplos.
  - 2022-2023: Desalavancagem e lateralização profunda.
  - 2024-2025: Ciclo de ETFs e Halving.
  Analise o ativo atual considerando esses ciclos de 4 anos e a correlação com o BTC.
`;

export const getAIAnalysis = async (ticker: TickerData): Promise<AIAnalysisResult> => {
  const prompt = `
    ATUE COMO UM ANALISTA QUANTITATIVO SENIOR DA BINANCE.
    
    DADOS ATUAIS DE MERCADO:
    - Ativo: ${ticker.symbol}
    - Preço Atual: ${ticker.lastPrice}
    - Variação 24h: ${ticker.priceChangePercent}%
    - Volume 24h (Quote): ${ticker.quoteVolume}
    - Range 24h: ${ticker.lowPrice} - ${ticker.highPrice}

    ${HISTORICAL_CONTEXT}

    TAREFA:
    1. Baseado em padrões históricos desde 2018, este movimento atual parece uma armadilha (bull/bear trap) ou rompimento genuíno?
    2. Avalie a exaustão do preço.
    3. Forneça níveis técnicos (Alvo, Resistência, Suporte, Stop) com precisão matemática.
    4. Identifique discrepâncias (Ex: Preço subindo mas volume relativo menor que a média histórica de 2018).

    REQUISITOS DE RESPOSTA (JSON):
    - insight: Análise detalhada em português do Brasil.
    - sentiment: BULLISH, BEARISH, NEUTRAL, EXTREME_OVERBOUGHT, EXTREME_OVERSOLD.
    - confidence: 0-100.
    - levels: { target, resistance, support, stopLoss }.
    - discrepancies: Lista de alertas técnicos.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: "Você é um modelo treinado em dados históricos da Binance (2018-2025). Sua especialidade é detectar anomalias de volume e reversões de tendência baseadas em ciclos de mercado.",
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
    console.error("Erro na análise neural:", e);
    throw new Error("Falha ao processar dados históricos.");
  }
};
