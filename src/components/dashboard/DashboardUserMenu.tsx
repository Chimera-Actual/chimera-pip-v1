import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/Layout/UserAvatar";
import { useAuth } from "@/hooks/useAuth";

export const DashboardUserMenu = React.memo(() => {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="relative">
      <Button
        onClick={() => setShowUserMenu(!showUserMenu)}
        variant="ghost"
        className="p-0 h-auto"
      >
        <UserAvatar />
      </Button>
      
      <AnimatePresence>
        {showUserMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 crt-card p-3 space-y-2 min-w-[160px] z-10"
          >
            <div className="text-xs crt-muted px-2 py-1 border-b crt-border">
              {user?.email}
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
              <User className="w-3 h-3 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
              <Settings className="w-3 h-3 mr-2" />
              Settings
            </Button>
            <Button 
              onClick={signOut}
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-xs text-red-400 hover:text-red-300"
            >
              <LogOut className="w-3 h-3 mr-2" />
              Sign Out
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

DashboardUserMenu.displayName = "DashboardUserMenu";