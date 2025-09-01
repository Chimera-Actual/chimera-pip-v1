import React, { createContext, useContext, ReactNode } from 'react';

export type MapEngine = 'maplibre' | 'leaflet';
export type TileProvider = 'osm' | 'cartodb' | 'stamen';

export interface MapProviderConfig {
  engine: MapEngine;
  tileProvider: TileProvider;
  enableOfflineCache?: boolean;
}

interface MapProviderContextType {
  config: MapProviderConfig;
  updateConfig: (config: Partial<MapProviderConfig>) => void;
}

const MapProviderContext = createContext<MapProviderContextType | null>(null);

interface MapProviderProps {
  children: ReactNode;
  defaultConfig?: MapProviderConfig;
}

export const MapProvider: React.FC<MapProviderProps> = ({ 
  children, 
  defaultConfig = { engine: 'maplibre', tileProvider: 'osm' }
}) => {
  const [config, setConfig] = React.useState<MapProviderConfig>(defaultConfig);

  const updateConfig = (updates: Partial<MapProviderConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <MapProviderContext.Provider value={{ config, updateConfig }}>
      {children}
    </MapProviderContext.Provider>
  );
};

export const useMapProvider = () => {
  const context = useContext(MapProviderContext);
  if (!context) {
    throw new Error('useMapProvider must be used within MapProvider');
  }
  return context;
};