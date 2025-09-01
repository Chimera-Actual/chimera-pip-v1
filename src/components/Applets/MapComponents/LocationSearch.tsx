import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, MapPin, Plus } from 'lucide-react';

interface SearchResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  display_name: string;
}

interface LocationSearchProps {
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  onSearchChange: (query: string) => void;
  onSearchResultClick: (result: SearchResult) => void;
  onAddPlacemark?: (result: SearchResult) => void;
  onClearSearch: () => void;
  className?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  searchQuery,
  searchResults,
  isSearching,
  onSearchChange,
  onSearchResultClick,
  onAddPlacemark,
  onClearSearch,
  className = ""
}) => {
  const [showResults, setShowResults] = useState(false);

  const handleSearchChange = (value: string) => {
    onSearchChange(value);
    setShowResults(value.length > 0);
  };

  const handleResultClick = (result: SearchResult) => {
    onSearchResultClick(result);
    setShowResults(false);
    onSearchChange(result.name);
  };

  const handleAddPlacemark = (result: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddPlacemark?.(result);
  };

  const handleClear = () => {
    onClearSearch();
    setShowResults(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search locations..."
          className="pl-9 pr-9 h-9 text-xs font-mono bg-background/50 border-border"
          onFocus={() => setShowResults(searchQuery.length > 0)}
        />
        {(searchQuery || isSearching) && (
          <Button
            onClick={handleClear}
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-destructive/20"
          >
            <X size={12} />
          </Button>
        )}
        {isSearching && (
          <div className="absolute right-9 top-1/2 -translate-y-1/2">
            <div className="animate-spin w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-card/95 backdrop-blur-sm border border-border rounded-md shadow-lg overflow-hidden">
          <ScrollArea className="max-h-60">
            <div className="p-2">
              <div className="text-xs font-mono text-muted-foreground mb-2 px-2">
                ◈ SEARCH RESULTS ({searchResults.length})
              </div>
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="group flex items-center justify-between p-2 hover:bg-accent/20 rounded-sm cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <MapPin size={14} className="text-accent mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-foreground font-bold truncate">
                        {result.name}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {result.display_name}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground mt-1">
                        {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  {onAddPlacemark && (
                    <Button
                      onClick={(e) => handleAddPlacemark(result, e)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity retro-button"
                    >
                      <Plus size={12} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* No Results Message */}
      {showResults && !isSearching && searchQuery && searchResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-card/95 backdrop-blur-sm border border-border rounded-md p-4 text-center">
          <div className="text-xs font-mono text-muted-foreground">
            NO LOCATIONS FOUND
          </div>
        </div>
      )}
    </div>
  );
};