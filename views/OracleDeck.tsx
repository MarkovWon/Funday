import React, { useState, useEffect, useMemo } from 'react';
import { Asset, AssetType, Region } from '../types';
import { analyzeMacroCycle, getStrategicAdvice } from '../services/geminiService';

interface OracleDeckProps {
  assets: Asset[];
}

const OracleDeck: React.FC<OracleDeckProps> = ({ assets }) => {
  const [macroAnalysis, setMacroAnalysis] = useState<string>('Initializing link to Global Macro Database...');
  const [macroSources, setMacroSources] = useState<{ title: string; uri: string }[]>([]);
  const [strategy, setStrategy] = useState<string>('Waiting for macro data...');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'zh'>('en');

  // --- ANALYSIS CALCULATIONS ---
  const totalValue = useMemo(() => assets.reduce((acc, curr) => acc + curr.value, 0), [assets]);

  const allocationByType = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach(a => counts[a.type] = (counts[a.type] || 0) + a.value);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, value]) => ({
        type: type as AssetType,
        value,
        percentage: value / totalValue
      }));
  }, [assets, totalValue]);

  const allocationByRegion = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach(a => counts[a.region] = (counts[a.region] || 0) + a.value);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([region, value]) => ({
        region: region as Region,
        value,
        percentage: value / totalValue
      }));
  }, [assets, totalValue]);

  // --- RISK CALCULATIONS ---
  const weightedRisk = useMemo(() => {
    if (totalValue === 0) return 0;
    const totalRiskScore = assets.reduce((acc, a) => acc + (a.value * a.risk), 0);
    return totalRiskScore / totalValue;
  }, [assets, totalValue]);

  const riskDistribution = useMemo(() => {
    const dist = { low: 0, med: 0, high: 0 };
    assets.forEach(a => {
      if (a.risk <= 3) dist.low += a.value;
      else if (a.risk <= 7) dist.med += a.value;
      else dist.high += a.value;
    });
    return [
      { label: 'LOW RISK (0-3)', value: dist.low, color: 'bg-emerald-500', text: 'text-emerald-400' },
      { label: 'MED RISK (4-7)', value: dist.med, color: 'bg-amber-500', text: 'text-amber-400' },
      { label: 'HIGH RISK (8-10)', value: dist.high, color: 'bg-rose-500', text: 'text-rose-400' }
    ];
  }, [assets]);

  const highRiskAssets = useMemo(() => assets.filter(a => a.risk >= 8), [assets]);

  const performAnalysis = async () => {
    setLoading(true);
    setMacroAnalysis(language === 'zh' ? "正在扫描全球指数..." : "Scanning global indices...");
    setMacroSources([]);
    setStrategy(language === 'zh' ? "正在计算战略向量..." : "Computing strategic vectors...");
    
    // 1. Get Macro Data (Using Google Search Tool via Gemini)
    const result = await analyzeMacroCycle(language);
    setMacroAnalysis(result.text);
    setMacroSources(result.sources);

    // 2. Get Strategy based on Macro + Assets
    const strat = await getStrategicAdvice(assets, result.text, language);
    setStrategy(strat);
    
    setLoading(false);
  };

  useEffect(() => {
    // Auto-run on mount for "Game Load" feel
    performAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper for colors
  const getBarColor = (type: string) => {
    switch (type) {
      case AssetType.STOCK: return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
      case AssetType.REAL_ESTATE: return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
      case AssetType.BOND: return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      case AssetType.CRYPTO: return 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]';
      case AssetType.PRIVATE_EQUITY: return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-black text-white tracking-widest uppercase">
            <span className="text-amber-500">Oracle</span> // Strategic Intelligence
          </h2>
          <p className="text-slate-400">Macro-economic cycle analysis & AI directives.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setLanguage(prev => prev === 'en' ? 'zh' : 'en')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-600 rounded transition-colors"
          >
            [{language === 'en' ? 'EN' : 'CN'}]
          </button>
          <button 
            onClick={performAnalysis}
            disabled={loading}
            className={`px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded shadow-lg border-b-4 border-amber-800 active:border-b-0 active:translate-y-1 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (language === 'zh' ? '正在连接...' : 'UPLINKING...') : (language === 'zh' ? '刷新情报' : 'REFRESH INTEL')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* --- ASSET ALLOCATION SUMMARY --- */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg className="w-32 h-32 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 relative z-10 h-full">
            {/* Total Value Panel */}
            <div className="md:w-1/3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-700 pb-6 md:pb-0 md:pr-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Net Worth</h3>
              <div className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">
                ${(totalValue / 1000).toLocaleString()}k
              </div>
              <div className="mt-2 text-xs font-mono text-emerald-400 bg-emerald-900/20 inline-block px-2 py-1 rounded w-fit border border-emerald-900/50">
                ▲ PORTFOLIO ONLINE
              </div>
            </div>

            {/* Allocation Bars */}
            <div className="flex-1 space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <span className="w-1 h-4 bg-cyan-500 rounded-full"></span>
                  Asset Distribution
                </h4>
                <div className="space-y-2">
                  {allocationByType.slice(0, 4).map((item) => (
                    <div key={item.type} className="group/bar">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">{item.type}</span>
                        <span className="text-slate-400 font-mono">{(item.percentage * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor(item.type)}`} 
                          style={{ width: `${item.percentage * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- RISK ANALYSIS DASHBOARD --- */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg className="w-32 h-32 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          </div>

          <div className="flex flex-col md:flex-row gap-6 relative z-10 h-full">
             {/* Risk Score */}
             <div className="md:w-1/3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-700 pb-6 md:pb-0 md:pr-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Threat Level</h3>
              <div className={`text-5xl font-black tracking-tighter drop-shadow-lg ${weightedRisk < 4 ? 'text-emerald-500' : weightedRisk < 7 ? 'text-amber-500' : 'text-rose-600'}`}>
                {weightedRisk.toFixed(1)}<span className="text-lg text-slate-500 font-normal">/10</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">Weighted Average Risk</p>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              {/* Distribution */}
               <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <span className="w-1 h-4 bg-rose-500 rounded-full"></span>
                    Exposure Profile
                  </h4>
                  <div className="flex h-4 w-full bg-slate-900 rounded overflow-hidden border border-slate-700">
                    {riskDistribution.map((tier, idx) => (
                      <div 
                        key={idx} 
                        className={`${tier.color} transition-all duration-1000`} 
                        style={{ width: `${(tier.value / totalValue) * 100}%` }} 
                        title={`${tier.label}: $${(tier.value/1000).toFixed(0)}k`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    {riskDistribution.map((tier, idx) => (
                      <div key={idx} className={tier.text}>
                        {((tier.value / totalValue) * 100).toFixed(0)}% <span className="text-slate-500 text-[10px] hidden sm:inline">{tier.label}</span>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Alerts */}
               {highRiskAssets.length > 0 && (
                 <div className="mt-4 bg-rose-900/20 border border-rose-900/50 rounded p-3">
                   <div className="text-rose-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                     <span className="animate-pulse">⚠</span> Critical Vulnerabilities
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {highRiskAssets.map(a => (
                       <span key={a.id} className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-mono">
                         {a.name} (R:{a.risk})
                       </span>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Macro Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-mono text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              MACRO_ENVIRONMENT_SCAN
            </h3>
          </div>
          <div className="p-6 text-slate-300 leading-relaxed font-light">
             {loading ? (
               <div className="animate-pulse space-y-3">
                 <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                 <div className="h-4 bg-slate-700 rounded w-full"></div>
                 <div className="h-4 bg-slate-700 rounded w-5/6"></div>
               </div>
             ) : (
                <>
                  <div dangerouslySetInnerHTML={{ __html: macroAnalysis.replace(/\n/g, '<br/>') }} />
                  {/* Display sources if available */}
                  {macroSources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Source Uplink:</p>
                      <ul className="space-y-1">
                        {macroSources.map((source, i) => (
                          <li key={i}>
                            <a 
                              href={source.uri} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-xs text-amber-500/80 hover:text-amber-400 hover:underline flex items-center gap-1 truncate"
                            >
                              <span className="opacity-50">›</span> {source.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
             )}
          </div>
        </div>

        {/* Strategy Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl relative">
          <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-mono text-cyan-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
              MISSION_DIRECTIVES
            </h3>
          </div>
          <div className="p-6 text-slate-200">
             {loading ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-4">
                  <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-mono text-cyan-500">CALCULATING PROBABILITIES...</span>
                </div>
             ) : (
               <div 
                 className="prose prose-invert prose-p:text-slate-300 prose-headings:text-cyan-400 prose-li:text-slate-200"
                 dangerouslySetInnerHTML={{ __html: strategy }} 
               />
             )}
          </div>
           {/* Decor */}
           <div className="absolute bottom-0 right-0 p-4 opacity-10 pointer-events-none">
             <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 3.8l6.7 13.2H5.3L12 5.8zM11 16h2v2h-2v-2zm0-7h2v5h-2V9z"/></svg>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OracleDeck;