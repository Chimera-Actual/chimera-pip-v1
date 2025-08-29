import React, { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const UserAvatar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const [isHovered, setIsHovered] = useState(false);

  // Create 8-bit style pixelated avatar
  const avatarPixels = [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 2, 1, 1, 2, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 1, 2, 2, 1, 2, 1],
    [1, 1, 2, 1, 1, 2, 1, 1],
    [0, 1, 1, 2, 2, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
  ];

  const getPixelColor = (value: number) => {
    switch (value) {
      case 0: return 'transparent';
      case 1: return 'hsl(var(--primary))';
      case 2: return 'hsl(var(--accent))';
      default: return 'transparent';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-12 h-12 p-1 hover:bg-primary/10 transition-colors"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {profile?.avatar_url ? (
            <div className={`relative w-full h-full transition-all duration-200 ${isHovered ? 'scale-110' : ''}`}>
              <img 
                src={profile.avatar_url} 
                alt="Avatar" 
                className="w-full h-full object-cover rounded-sm border border-primary/50"
                style={{ imageRendering: 'pixelated' }}
              />
              {/* Glowing effect */}
              <div className="absolute inset-0 rounded-sm bg-primary/20 opacity-0 hover:opacity-100 transition-opacity duration-200 crt-glow" />
            </div>
          ) : (
            <>
              <div className={`grid grid-cols-8 gap-0 w-full h-full transition-all duration-200 ${isHovered ? 'scale-110' : ''}`}>
                {avatarPixels.flat().map((pixel, index) => (
                  <div
                    key={index}
                    className="aspect-square border-0"
                    style={{
                      backgroundColor: getPixelColor(pixel),
                      imageRendering: 'pixelated',
                    }}
                  />
                ))}
              </div>
              
              {/* Glowing effect */}
              <div className="absolute inset-0 rounded-sm bg-primary/20 opacity-0 hover:opacity-100 transition-opacity duration-200 crt-glow" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-card border-border">
        <DropdownMenuLabel className="text-primary font-mono">
          {profile?.display_name || 'Vault Dweller'}
        </DropdownMenuLabel>
        <DropdownMenuLabel className="text-xs text-muted-foreground font-mono font-normal">
          {user?.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem 
          onClick={signOut}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};