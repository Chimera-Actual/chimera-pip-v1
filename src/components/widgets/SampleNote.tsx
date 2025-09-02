import React, { useEffect, useState } from "react";
import { FileText, Save } from "lucide-react";
import WidgetFrame from "@/components/dashboard/WidgetFrame";
import { motion } from "framer-motion";

export default function SampleNote() {
  const [value, setValue] = useState(() => 
    localStorage.getItem("demo:note") || "Enter your notes here...\n\nThis is a persistent notepad widget."
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem("demo:note", value);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    setHasUnsavedChanges(true);
  };

  const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = value.length;

  return (
    <WidgetFrame 
      title="Notes Terminal"
      right={
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges ? (
            <motion.div 
              className="flex items-center space-x-1 text-xs crt-accent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
              <span>SAVING...</span>
            </motion.div>
          ) : lastSaved && (
            <motion.div 
              className="flex items-center space-x-1 text-xs crt-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Save className="w-3 h-3" />
              <span>SAVED</span>
            </motion.div>
          )}
          <FileText className="w-4 h-4 crt-accent" />
        </div>
      }
    >
      <div className="flex flex-col h-full space-y-2">
        <textarea
          className="flex-1 w-full bg-transparent crt-input rounded p-3 resize-none font-mono text-sm leading-relaxed focus:ring-2 focus:ring-[var(--crt-border)]/50 placeholder-crt-muted"
          value={value}
          onChange={handleChange}
          placeholder="Enter your notes here..."
        />
        
        <div className="flex justify-between items-center text-xs crt-muted font-mono border-t crt-border pt-2">
          <div className="flex space-x-4">
            <span>{charCount} chars</span>
            <span>{wordCount} words</span>
          </div>
          {lastSaved && (
            <span>
              Last saved: {lastSaved.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}
        </div>
      </div>
    </WidgetFrame>
  );
}