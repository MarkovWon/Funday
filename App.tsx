import React, { useState } from 'react';
import Layout from './components/Layout';
import GridRealm from './views/GridRealm';
import GraphNexus from './views/GraphNexus';
import WorldMap from './views/WorldMap';
import OracleDeck from './views/OracleDeck';
import { INITIAL_ASSETS, INITIAL_RELATIONSHIPS } from './constants';
import { Asset, Relationship } from './types';

type View = 'REALM' | 'NEXUS' | 'GEO' | 'ORACLE';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('REALM');
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [relationships] = useState<Relationship[]>(INITIAL_RELATIONSHIPS);

  const handleAssetMove = (id: string, newPos: { x: number; y: number }) => {
    setAssets(prevAssets => prevAssets.map(asset => {
      if (asset.id === id) {
        return { ...asset, gridPosition: newPos };
      }
      return asset;
    }));
  };

  const renderView = () => {
    switch (currentView) {
      case 'REALM':
        return <GridRealm assets={assets} onAssetMove={handleAssetMove} />;
      case 'NEXUS':
        return <GraphNexus assets={assets} relationships={relationships} />;
      case 'GEO':
        return <WorldMap assets={assets} />;
      case 'ORACLE':
        return <OracleDeck assets={assets} />;
      default:
        return <GridRealm assets={assets} onAssetMove={handleAssetMove} />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;