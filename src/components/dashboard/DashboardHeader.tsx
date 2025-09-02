import React from "react";
import { motion } from "framer-motion";
import { DashboardUserMenu } from "./DashboardUserMenu";
import { DashboardToolbar } from "./DashboardToolbar";

interface DashboardHeaderProps {
  onUndo?: () => void;
  canUndo?: boolean;
  undoCount?: number;
}

export const DashboardHeader = React.memo<DashboardHeaderProps>(({
  onUndo,
  canUndo,
  undoCount
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold crt-accent">
          DASHBOARD CONTROL SYSTEM
        </h1>
        <p className="text-sm crt-muted uppercase tracking-wide">
          Vault-Tec Industries - Dashboard Kit v2.0
        </p>
      </motion.div>
      
      <div className="flex items-center space-x-3">
        <DashboardToolbar 
          onUndo={onUndo}
          canUndo={canUndo}
          undoCount={undoCount}
        />
        <DashboardUserMenu />
      </div>
    </div>
  );
});

DashboardHeader.displayName = "DashboardHeader";