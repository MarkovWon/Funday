export enum AssetType {
  REAL_ESTATE = 'Real Estate',
  STOCK = 'Stock',
  BOND = 'Bond',
  CASH = 'Cash',
  CRYPTO = 'Crypto',
  PRIVATE_EQUITY = 'Private Equity'
}

export enum Region {
  NORTH_AMERICA = 'North America',
  ASIA = 'Asia',
  EUROPE = 'Europe',
  EMERGING_MARKETS = 'Emerging Markets',
  GLOBAL = 'Global'
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number; // In USD
  region: Region;
  description: string;
  roi: number; // Return on Investment %
  risk: number; // 1-10
  gridPosition?: { x: number; y: number }; // For the "Board" view
}

export interface Relationship {
  source: string; // Asset ID
  target: string; // Asset ID
  type: 'OWNS' | 'PARTNER' | 'SUBSIDIARY' | 'CORRELATED';
  strength: number; // 0-1, represents % ownership or correlation
}

export interface GameState {
  assets: Asset[];
  relationships: Relationship[];
  cash: number;
  cycleStage: string;
}

export interface OracleAnalysis {
  cycleAssessment: string;
  opportunities: string[];
  risks: string[];
  strategy: string;
}