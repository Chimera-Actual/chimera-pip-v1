import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import WidgetFrame from "@/components/dashboard/WidgetFrame";
import { motion } from "framer-motion";

export default function SampleClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeString = time.toLocaleTimeString([], { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateString = time.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <WidgetFrame 
      title="System Clock"
      right={<Clock className="w-4 h-4 crt-accent" />}
    >
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <motion.div 
          className="text-4xl lg:text-5xl font-mono crt-text font-bold tracking-wider"
          key={timeString}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.1 }}
        >
          {timeString}
        </motion.div>
        
        <div className="text-sm font-mono crt-muted uppercase tracking-wide">
          {dateString}
        </div>
        
        <div className="flex items-center space-x-4 text-xs font-mono crt-accent">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
            <span>ONLINE</span>
          </div>
          <div>UTC{time.getTimezoneOffset() > 0 ? '-' : '+'}{Math.abs(time.getTimezoneOffset() / 60)}</div>
        </div>
      </div>
    </WidgetFrame>
  );
}