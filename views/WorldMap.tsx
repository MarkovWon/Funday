import React from 'react';
import { Asset, Region } from '../types';
import AssetCard from '../components/AssetCard';

interface WorldMapProps {
  assets: Asset[];
}

// A simplified abstract map visualization
const WorldMap: React.FC<WorldMapProps> = ({ assets }) => {
  // Group assets by region
  const regions = Object.values(Region);
  const assetsByRegion = regions.reduce((acc, region) => {
    acc[region] = assets.filter(a => a.region === region);
    return acc;
  }, {} as Record<Region, Asset[]>);

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white tracking-widest uppercase">
          <span className="text-emerald-500">Geo-Grid</span> // Global Distribution
        </h2>
        <p className="text-slate-400">Asset deployment across global theaters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {regions.map((region) => {
           const regionAssets = assetsByRegion[region];
           const totalValue = regionAssets.reduce((sum, a) => sum + a.value, 0);
           
           if (regionAssets.length === 0) return null;

           return (
             <div key={region} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
               <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
                 <h3 className="font-bold text-lg text-emerald-400 uppercase tracking-widest">{region}</h3>
                 <span className="font-mono text-slate-300 text-sm">Deployment: ${(totalValue / 1000).toFixed(1)}k</span>
               </div>
               
               <div className="space-y-3">
                 {regionAssets.map(asset => (
                   <AssetCard key={asset.id} asset={asset} compact />
                 ))}
               </div>
             </div>
           )
        })}
      </div>
      
      {/* Decorative World Outline (CSS Art or SVG) */}
      <div className="fixed bottom-10 right-10 opacity-5 pointer-events-none z-0">
          <svg width="400" height="200" viewBox="0 0 100 50">
             <path fill="currentColor" d="M10,20 Q15,10 25,15 T40,18 T60,12 T80,18 T90,30 T70,40 T40,35 T20,40 T10,20" />
          </svg>
      </div>
    </div>
  );
};

export default WorldMap;