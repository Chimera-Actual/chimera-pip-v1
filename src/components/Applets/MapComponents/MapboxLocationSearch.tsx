import React, { useState, useRef } from 'react';
import { Search, MapPin, Loader2, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SearchResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  display_name: string;
}

interface MapboxLocationSearchProps {
  value: string;
  results: SearchResult[];
  isSearching: boolean;
  onSearchChange: (query: string) => void;
  onResultSelect: (result: SearchResult) => void;
  onAddPlacemark: (result: SearchResult) => void;
  onClear: () => void;
  className?: string;
}

export const MapboxLocationSearch: React.FC<MapboxLocationSearchProps> = ({
  value,
  results,
  isSearching,
  onSearchChange,
  onResultSelect,
  onAddPlacemark,
  onClear,
  className = ""
}) => {
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onSearchChange(query);
    setShowResults(query.length > 0);
  };

  const handleResultClick = (result: SearchResult) => {
    onResultSelect(result);
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleClear = () => {
    onClear();
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleAddPlacemark = (result: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddPlacemark(result);
    setShowResults(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          {isSearching ? (
            <Loader2 size={16} className="text-muted-foreground animate-spin" />
          ) : (
            <Search size={16} className="text-muted-foreground" />
          )}
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search locations..."
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowResults(value.length > 0)}
          className="pl-10 pr-10 bg-card/80 backdrop-blur-sm border-border font-mono text-sm"
        />
        
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 p-0 hover:bg-muted"
            onClick={handleClear}
          >
            <X size={14} />
          </Button>
        )}
      </div>

      {/* Search Results */}
      {showResults && (results.length > 0 || isSearching) && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-sm border-border z-20 max-h-64 overflow-y-auto">
          {isSearching && results.length === 0 && (
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                <span className="font-mono text-xs">◈ SEARCHING...</span>
              </div>
            </div>
          )}
          
          {results.map((result) => (
            <div
              key={result.id}
              className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0 transition-colors"
              onClick={() => handleResultClick(result)}
            >
              <MapPin size={16} className="text-primary flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-foreground font-semibold truncate">
                  {result.name}
                </div>
                <div className="font-mono text-xs text-muted-foreground truncate">
                  {result.display_name}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 flex-shrink-0 hover:bg-primary/20"
                onClick={(e) => handleAddPlacemark(result, e)}
                title="Add as placemark"
              >
                <Plus size={14} />
              </Button>
            </div>
          ))}
          
          {results.length === 0 && !isSearching && value && (
            <div className="p-3 text-center">
              <div className="text-muted-foreground font-mono text-xs">
                ◈ NO RESULTS FOUND
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Click outside to close */}
      {showResults && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};