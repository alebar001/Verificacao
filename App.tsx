
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TickerData, FilterType, AIAnalysisResult } from './types';
import { getAIAnalysis } from './services/geminiService';
import ScannerTable from './components/ScannerTable';

const App: React.FC = () => {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [favorites, setFavorites] = useState<string[]>(JSON.parse(localStorage.getItem('favs') || '[]'));
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>(FilterType.ALL);
  const [isLive, setIsLive] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const ws = useRef<WebSocket | null>(null);

  const translateSentiment = (sentiment: string | undefined) => {
    if (!sentiment) return 'PROCESSANDO CICLOS...';
    const mapping: Record<string, string> = {
      'BULLISH': 'TENDÊNCIA DE ALTA',
      'BEARISH': 'TENDÊNCIA DE BAIXA',
      'NEUTRAL': 'CONSOLIDAÇÃO',
      'EXTREME_OVERBOUGHT': 'EXAUSTÃO DE COMPRA',
      'EXTREME_OVERSOLD': 'EXAUSTÃO DE VENDA'
    };
    return mapping[sentiment] || sentiment;
  };

  const fetchInitialData = async () => {
    try {
      const res = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
      const data = await res.json();
      const usdtTickers = data.filter((t: any) => t.symbol.endsWith('USDT'));
      setTickers(usdtTickers);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Erro na carga inicial", err);
    }
  };

  const performAIAnalysis = useCallback(async (symbol: string) => {
    const ticker = tickers.find(t => t.symbol === symbol);
    if (!ticker) return;

    setLoadingAI(true);
    try {
      const analysis = await getAIAnalysis(ticker);
      setAiAnalysis(analysis);
    } catch (err) {
      console.error("Erro na análise neural:", err);
    } finally {
      setLoadingAI(false);
    }
  }, [tickers]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (tickers.length > 0 && !aiAnalysis && !loadingAI) {
      performAIAnalysis(selectedSymbol);
    }
  }, [tickers, selectedSymbol, aiAnalysis, loadingAI, performAIAnalysis]);

  useEffect(() => {
    if (isLive) {
      ws.current = new WebSocket('wss://fstream.binance.com/ws/!ticker@arr');
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setTickers(prev => {
          const map = new Map(prev.map(t => [t.symbol, t]));
          data.forEach((t: any) => {
            if (map.has(t.s)) {
              map.set(t.s, {
                symbol: t.s,
                lastPrice: t.c,
                priceChangePercent: t.P,
                quoteVolume: t.q,
                highPrice: t.h,
                lowPrice: t.l
              });
            }
          });
          return Array.from(map.values());
        });
        setLastUpdate(new Date());
      };
      return () => ws.current?.close();
    }
  }, [isLive]);

  const toggleFavorite = (symbol: string) => {
    const newFavs = favorites.includes(symbol) 
      ? favorites.filter(f => f !== symbol) 
      : [...favorites, symbol];
    setFavorites(newFavs);
    localStorage.setItem('favs', JSON.stringify(newFavs));
  };

  return (
    <div className="min-h-screen bg-gradient-dark p-2 md:p-6 text-gray-200">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800 mb-6 gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <i className="fa-solid fa-chart-line text-black text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              CRIPTO <span className="text-emerald-400">NEURAL</span> SCANNER
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">2018-2025</span>
            </h1>
            <p className="text-xs text-zinc-500 font-medium italic">Baseado em Ciclos Históricos da Binance</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-grow min-w-[200px]">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"></i>
            <input 
              type="text" 
              placeholder="Ativo (Ex: BTC, ETH...)"
              className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsLive(!isLive)}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              isLive ? 'bg-zinc-800 text-white' : 'bg-emerald-500 text-black'
            }`}
          >
            {isLive ? 'LIVE' : 'PAUSADO'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 p-3 flex justify-between items-center">
              <span className="text-black font-black text-[10px] tracking-widest uppercase flex items-center gap-2">
                <i className="fa-solid fa-bolt animate-pulse"></i> Modelo Quant: Gemini Pro
              </span>
              {loadingAI && <i className="fa-solid fa-circle-notch fa-spin text-black text-sm"></i>}
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Status do Ciclo</h3>
                  <p className={`text-xl font-black ${
                    aiAnalysis?.sentiment.includes('BULLISH') ? 'text-emerald-400' : 
                    aiAnalysis?.sentiment.includes('BEARISH') ? 'text-rose-400' : 'text-zinc-300'
                  }`}>
                    {translateSentiment(aiAnalysis?.sentiment)}
                  </p>
                </div>
                <div className="bg-zinc-800/80 px-3 py-1 rounded-lg border border-zinc-700">
                   <span className="text-[9px] text-zinc-500 block leading-none">CONFIANÇA</span>
                   <span className="text-emerald-400 font-bold text-lg mono leading-none">{aiAnalysis?.confidence || 0}%</span>
                </div>
              </div>

              <div className="bg-black/60 rounded-xl p-4 border border-zinc-800/50 relative">
                <i className="fa-solid fa-quote-left absolute top-2 left-2 text-zinc-800 text-xl"></i>
                <p className="text-sm leading-relaxed text-zinc-300 pl-4 font-medium italic">
                  {aiAnalysis?.insight || 'Sincronizando com histórico da Binance desde 2018...'}
                </p>
              </div>

              {aiAnalysis?.discrepancies && aiAnalysis.discrepancies.length > 0 && (
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3">
                  <h4 className="text-rose-400 text-[10px] font-black uppercase mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-microchip"></i> Alertas do Algoritmo
                  </h4>
                  <ul className="text-[11px] space-y-1 text-rose-300/70">
                    {aiAnalysis.discrepancies.map((d, i) => <li key={i} className="flex gap-2"><span>•</span> {d}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 backdrop-blur-md">
            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
               <i className="fa-solid fa-crosshairs text-emerald-500"></i> Zonas de Preço (Ciclo 2018+)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 p-3 rounded-xl border border-zinc-800">
                 <span className="text-[9px] text-zinc-500 block mb-1">TARGET 🎯</span>
                 <span className="mono text-emerald-400 font-bold text-sm">{aiAnalysis?.levels.target || '---'}</span>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-zinc-800">
                 <span className="text-[9px] text-zinc-500 block mb-1">RESISTÊNCIA 🚧</span>
                 <span className="mono text-zinc-300 font-bold text-sm">{aiAnalysis?.levels.resistance || '---'}</span>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-zinc-800">
                 <span className="text-[9px] text-zinc-500 block mb-1">SUPORTE 🛡️</span>
                 <span className="mono text-zinc-300 font-bold text-sm">{aiAnalysis?.levels.support || '---'}</span>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-rose-900/40">
                 <span className="text-[9px] text-zinc-500 block mb-1">STOP LOSS 🛑</span>
                 <span className="mono text-rose-500 font-bold text-sm">{aiAnalysis?.levels.stopLoss || '---'}</span>
              </div>
            </div>
            <button 
              onClick={() => performAIAnalysis(selectedSymbol)}
              disabled={loadingAI}
              className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black rounded-xl text-xs font-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2"
            >
              <i className={`fa-solid ${loadingAI ? 'fa-spinner fa-spin' : 'fa-brain'}`}></i>
              {loadingAI ? 'ANALISANDO HISTÓRICO...' : 'REAVALIAR ATIVO'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-4">
          <ScannerTable 
            tickers={tickers}
            selectedSymbol={selectedSymbol}
            onSelect={(s) => {
              setSelectedSymbol(s);
              setAiAnalysis(null);
            }}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            searchTerm={searchTerm}
            filter={filter}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
