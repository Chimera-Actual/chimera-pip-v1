export type MapLayer = 'standard' | 'satellite' | 'terrain' | 'transport' | 'dark' | 'light';
export type TileProvider = 'osm' | 'cartodb' | 'stamen';

export interface MapStyle {
  id: string;
  name: string;
  style: any;
  attribution: string;
}

export class MapStyleManager {
  private static readonly OSM_STYLES: Record<MapLayer, MapStyle> = {
    standard: {
      id: 'osm-standard',
      name: 'OpenStreetMap Standard',
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      attribution: '© OpenStreetMap contributors'
    },
    satellite: {
      id: 'esri-satellite',
      name: 'Satellite Imagery',
      style: {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: 'Tiles © Esri'
          }
        },
        layers: [
          {
            id: 'satellite-tiles',
            type: 'raster',
            source: 'esri-satellite',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    },
    terrain: {
      id: 'osm-terrain',
      name: 'Terrain',
      style: {
        version: 8,
        sources: {
          'terrain': {
            type: 'raster',
            tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenTopoMap'
          }
        },
        layers: [
          {
            id: 'terrain-tiles',
            type: 'raster',
            source: 'terrain',
            minzoom: 0,
            maxzoom: 17
          }
        ]
      },
      attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap'
    },
    transport: {
      id: 'osm-transport',
      name: 'Transport',
      style: {
        version: 8,
        sources: {
          'transport': {
            type: 'raster',
            tiles: ['https://tile.memomaps.de/tilegen/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© MeMoMaps'
          }
        },
        layers: [
          {
            id: 'transport-tiles',
            type: 'raster',
            source: 'transport',
            minzoom: 0,
            maxzoom: 18
          }
        ]
      },
      attribution: 'Map © MeMoMaps, Data © OpenStreetMap contributors'
    },
    dark: {
      id: 'cartodb-dark',
      name: 'Dark Theme',
      style: {
        version: 8,
        sources: {
          'dark': {
            type: 'raster',
            tiles: ['https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© CartoDB'
          }
        },
        layers: [
          {
            id: 'dark-tiles',
            type: 'raster',
            source: 'dark',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      attribution: '© CartoDB, © OpenStreetMap contributors'
    },
    light: {
      id: 'cartodb-light',
      name: 'Light Theme',
      style: {
        version: 8,
        sources: {
          'light': {
            type: 'raster',
            tiles: ['https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© CartoDB'
          }
        },
        layers: [
          {
            id: 'light-tiles',
            type: 'raster',
            source: 'light',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      attribution: '© CartoDB, © OpenStreetMap contributors'
    }
  };

  static getStyle(layer: MapLayer, provider: TileProvider = 'osm'): MapStyle {
    return this.OSM_STYLES[layer] || this.OSM_STYLES.standard;
  }

  static getAllLayers(): MapLayer[] {
    return Object.keys(this.OSM_STYLES) as MapLayer[];
  }

  static getLayerName(layer: MapLayer): string {
    return this.OSM_STYLES[layer]?.name || 'Unknown';
  }
}