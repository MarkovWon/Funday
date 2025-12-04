import React from 'react';
import { Asset, AssetType } from '../types';

interface AssetCardProps {
  asset: Asset;
  compact?: boolean;
}

const getTypeColor = (type: AssetType) => {
  switch (type) {
    case AssetType.STOCK: return 'border-blue-500 text-blue-400';
    case AssetType.REAL_ESTATE: return 'border-amber-500 text-amber-400';
    case AssetType.BOND: return 'border-emerald-500 text-emerald-400';
    case AssetType.CRYPTO: return 'border-purple-500 text-purple-400';
    case AssetType.PRIVATE_EQUITY: return 'border-rose-500 text-rose-400';
    default: return 'border-slate-500 text-slate-400';
  }
};

const AssetCard: React.FC<AssetCardProps> = ({ asset, compact }) => {
  const typeStyle = getTypeColor(asset.type);

  return (
    <div className={`relative bg-slate-800/80 backdrop-blur-md border-l-4 ${typeStyle} p-4 rounded-r-lg shadow-lg hover:bg-slate-800 transition-colors group`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-slate-100">{asset.name}</h3>
          <p className="text-xs font-mono opacity-70 uppercase tracking-wider">{asset.type}</p>
        </div>
        <div className="text-right">
          <p className="font-mono font-bold text-lg">${(asset.value / 1000).toFixed(1)}k</p>
          <span className={`text-xs px-2 py-0.5 rounded ${asset.roi >= 0.05 ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
            +{(asset.roi * 100).toFixed(1)}% Yield
          </span>
        </div>
      </div>
      
      {!compact && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Region: {asset.region}</span>
            <span>Risk Lvl: {asset.risk}</span>
          </div>
          <p className="text-sm text-slate-300 italic">{asset.description}</p>
        </div>
      )}
      
      {/* Selection Glow */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/10 rounded-r-lg pointer-events-none transition-all" />
    </div>
  );
};

export default AssetCard;