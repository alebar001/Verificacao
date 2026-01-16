
import React from 'react';
import { TickerData, FilterType } from '../types';

interface ScannerTableProps {
  tickers: TickerData[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
  favorites: string[];
  toggleFavorite: (symbol: string) => void;
  searchTerm: string;
  filter: FilterType;
}

const ScannerTable: React.FC<ScannerTableProps> = ({ 
  tickers, 
  selectedSymbol, 
  onSelect, 
  favorites, 
  toggleFavorite,
  searchTerm,
  filter
}) => {
  const filtered = tickers
    .filter(t => t.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(t => {
      if (filter === FilterType.ALL) return true;
      const change = parseFloat(t.priceChangePercent);
      return filter === FilterType.STRONG_ENTRY ? change > 2.5 : change < -2.5;
    })
    .sort((a, b) => {
      const favA = favorites.includes(a.symbol) ? 1 : 0;
      const favB = favorites.includes(b.symbol) ? 1 : 0;
      if (favA !== favB) return favB - favA;
      return parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume);
    });

  const formatVolume = (v: string) => {
    const vol = parseFloat(v);
    if (vol > 1e9) return (vol / 1e9).toFixed(2) + 'B';
    if (vol > 1e6) return (vol / 1e6).toFixed(2) + 'M';
    return vol.toLocaleString();
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-widest font-bold">
            <th className="px-4 py-4 w-10">★</th>
            <th className="px-4 py-4">Ativo</th>
            <th className="px-4 py-4">Preço</th>
            <th className="px-4 py-4 text-center">24h %</th>
            <th className="px-4 py-4 hidden md:table-cell">Volume</th>
            <th className="px-4 py-4 text-center">Sinal IA</th>
            <th className="px-4 py-4 text-right pr-6">Tendência</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(t => {
            const change = parseFloat(t.priceChangePercent);
            const isSelected = selectedSymbol === t.symbol;
            const isFav = favorites.includes(t.symbol);

            return (
              <tr 
                key={t.symbol}
                onClick={() => onSelect(t.symbol)}
                className={`group cursor-pointer border-b border-zinc-800/50 transition-all hover:bg-zinc-800/40 ${isSelected ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500' : ''}`}
              >
                <td className="px-4 py-4" onClick={(e) => { e.stopPropagation(); toggleFavorite(t.symbol); }}>
                  <i className={`fa-star ${isFav ? 'fa-solid text-yellow-500' : 'fa-regular text-zinc-600'}`}></i>
                </td>
                <td className="px-4 py-4">
                  <span className="font-bold text-gray-100">{t.symbol.replace('USDT', '')}</span>
                  <span className="ml-1 text-[10px] text-zinc-500">USDT</span>
                </td>
                <td className="px-4 py-4 mono font-medium">
                  ${parseFloat(t.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                </td>
                <td className={`px-4 py-4 text-center font-semibold ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(2)}%
                </td>
                <td className="px-4 py-4 hidden md:table-cell text-zinc-400 mono text-xs">
                  ${formatVolume(t.quoteVolume)}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-tighter ${
                    change > 2.5 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    change < -2.5 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    'bg-zinc-700/30 text-zinc-500'
                  }`}>
                    {change > 2.5 ? 'COMPRA' : change < -2.5 ? 'VENDA' : 'NEUTRO'}
                  </span>
                </td>
                <td className="px-4 py-4 text-right pr-6">
                   <div className="inline-flex w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${change >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(Math.abs(change) * 10, 100)}%` }}
                      ></div>
                   </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ScannerTable;
