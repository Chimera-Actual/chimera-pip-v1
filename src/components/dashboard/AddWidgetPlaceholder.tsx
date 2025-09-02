import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface AddWidgetPlaceholderProps {
  onClick: () => void;
}

export default function AddWidgetPlaceholder({ onClick }: AddWidgetPlaceholderProps) {
  return (
    <motion.div
      className="h-full w-full flex flex-col items-center justify-center cursor-pointer group hover:crt-card transition-all duration-200 border-2 border-dashed crt-border opacity-50 hover:opacity-100"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.5 }}
    >
      <motion.div
        className="flex flex-col items-center space-y-2 group-hover:crt-accent transition-colors"
        whileHover={{ y: -2 }}
      >
        <Plus className="w-8 h-8" />
        <span className="text-xs font-mono uppercase tracking-wide">Add Widget</span>
      </motion.div>
    </motion.div>
  );
}