
export interface TickerData {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
}

export interface AIAnalysisResult {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'EXTREME_OVERBOUGHT' | 'EXTREME_OVERSOLD';
  confidence: number;
  insight: string;
  levels: {
    target: string;
    resistance: string;
    support: string;
    stopLoss: string;
  };
  discrepancies: string[];
}

export enum FilterType {
  ALL = 'all',
  STRONG_ENTRY = 'entrada-forte',
  STRONG_EXIT = 'saida-forte'
}
