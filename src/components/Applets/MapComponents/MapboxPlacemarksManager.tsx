import React from 'react';
import { Eye, EyeOff, Trash2, MapPin, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Placemark } from '@/hooks/useMapboxState';

interface MapboxPlacemarksManagerProps {
  placemarks: Placemark[];
  onToggleVisibility: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Placemark>) => void;
  onNavigate: (placemark: Placemark) => void;
  className?: string;
}

export const MapboxPlacemarksManager: React.FC<MapboxPlacemarksManagerProps> = ({
  placemarks,
  onToggleVisibility,
  onRemove,
  onUpdate,
  onNavigate,
  className = ""
}) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState({ name: '', description: '' });

  const handleEditStart = (placemark: Placemark) => {
    setEditingId(placemark.id);
    setEditForm({
      name: placemark.name,
      description: placemark.description || ''
    });
  };

  const handleEditSave = (id: string) => {
    onUpdate(id, editForm);
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({ name: '', description: '' });
  };

  if (placemarks.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-muted-foreground font-mono text-sm space-y-2">
          <MapPin size={32} className="mx-auto opacity-50" />
          <div>◈ NO PLACEMARKS</div>
          <div className="text-xs">
            Use the search bar to add locations
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className={`h-full ${className}`}>
      <div className="space-y-3 p-1">
        {placemarks.map((placemark) => (
          <Card key={placemark.id} className="p-3 bg-card/50 border-border">
            {editingId === placemark.id ? (
              // Edit Mode
              <div className="space-y-3">
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Placemark name"
                  className="font-mono text-sm"
                />
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description (optional)"
                  className="font-mono text-sm min-h-16 resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditSave(placemark.id)}
                    className="retro-button text-xs"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditCancel}
                    className="retro-button text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-semibold text-foreground truncate">
                      {placemark.name}
                    </div>
                    {placemark.description && (
                      <div className="font-mono text-xs text-muted-foreground line-clamp-2">
                        {placemark.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 hover:bg-muted"
                      onClick={() => onToggleVisibility(placemark.id)}
                      title={placemark.visible ? 'Hide placemark' : 'Show placemark'}
                    >
                      {placemark.visible ? (
                        <Eye size={14} className="text-primary" />
                      ) : (
                        <EyeOff size={14} className="text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Coordinates */}
                <div className="font-mono text-xs text-muted-foreground space-y-1">
                  <div>LAT: {placemark.latitude.toFixed(6)}</div>
                  <div>LNG: {placemark.longitude.toFixed(6)}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <Button
                    size="sm"
                    variant="outline"
                    className="retro-button text-xs flex-1"
                    onClick={() => onNavigate(placemark)}
                  >
                    <MapPin size={12} className="mr-1" />
                    Navigate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 h-8 p-0 hover:bg-muted"
                    onClick={() => handleEditStart(placemark)}
                    title="Edit placemark"
                  >
                    <Edit3 size={12} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 h-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => onRemove(placemark.id)}
                    title="Remove placemark"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};