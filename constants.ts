import { Asset, AssetType, Region, Relationship } from './types';

export const INITIAL_ASSETS: Asset[] = [
  {
    id: 'a1',
    name: 'Downtown Penthouse',
    type: AssetType.REAL_ESTATE,
    value: 1200000,
    region: Region.NORTH_AMERICA,
    description: 'Luxury residential unit in the city core.',
    roi: 0.04,
    risk: 3,
    gridPosition: { x: 1, y: 1 }
  },
  {
    id: 'a2',
    name: 'TechGiant Corp',
    type: AssetType.STOCK,
    value: 450000,
    region: Region.NORTH_AMERICA,
    description: 'Major holdings in global technology infrastructure.',
    roi: 0.12,
    risk: 7,
    gridPosition: { x: 2, y: 1 }
  },
  {
    id: 'a3',
    name: 'Green Energy ETF',
    type: AssetType.STOCK,
    value: 150000,
    region: Region.EUROPE,
    description: 'Diversified renewable energy portfolio.',
    roi: 0.08,
    risk: 5,
    gridPosition: { x: 3, y: 1 }
  },
  {
    id: 'a4',
    name: 'Asian Logistics Hub',
    type: AssetType.REAL_ESTATE,
    value: 2000000,
    region: Region.ASIA,
    description: 'Commercial warehouse distribution center.',
    roi: 0.06,
    risk: 4,
    gridPosition: { x: 1, y: 2 }
  },
  {
    id: 'a5',
    name: 'Gov Bonds 10Y',
    type: AssetType.BOND,
    value: 300000,
    region: Region.NORTH_AMERICA,
    description: 'Safe haven treasury bonds.',
    roi: 0.035,
    risk: 1,
    gridPosition: { x: 2, y: 2 }
  },
  {
    id: 'a6',
    name: 'Bitcoin Cold Storage',
    type: AssetType.CRYPTO,
    value: 250000,
    region: Region.GLOBAL,
    description: 'Digital gold reserve.',
    roi: 0.25,
    risk: 9,
    gridPosition: { x: 3, y: 2 }
  },
  {
    id: 'a7',
    name: 'StartUp: AI Chips',
    type: AssetType.PRIVATE_EQUITY,
    value: 100000,
    region: Region.ASIA,
    description: 'Seed round investment in AI hardware.',
    roi: 0.00, // Pre-revenue
    risk: 10,
    gridPosition: { x: 4, y: 1 }
  }
];

export const INITIAL_RELATIONSHIPS: Relationship[] = [
  { source: 'a2', target: 'a7', type: 'PARTNER', strength: 0.2 }, // TechGiant partners with AI Startup
  { source: 'a3', target: 'a5', type: 'CORRELATED', strength: 0.3 }, // Energy correlated with rates (bonds) slightly
  { source: 'a1', target: 'a5', type: 'CORRELATED', strength: 0.5 }, // Real estate linked to rates
  { source: 'a6', target: 'a2', type: 'CORRELATED', strength: 0.6 }, // Crypto correlated with Tech stocks
  { source: 'a4', target: 'a7', type: 'OWNS', strength: 0.1 }, // Logistics owns a part of the chip startup (supply chain)
];