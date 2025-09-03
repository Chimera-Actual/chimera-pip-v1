import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface SampleChartProps {
  settings?: Record<string, any>;
  widgetName?: string;
  widgetInstanceId?: string;
  onSettingsUpdate?: (newSettings: Record<string, any>) => void;
}

const SampleChart: React.FC<SampleChartProps> = ({ settings, widgetName }) => {
  const [systemData, setSystemData] = useState<Array<{ time: string; cpu: number; memory: number; network: number }>>([]);
  const [currentStats, setCurrentStats] = useState({ cpu: 0, memory: 0, network: 0 });

  const chartType = settings?.chartType || 'line';
  const showGrid = settings?.showGrid ?? true;
  const dataPoints = settings?.dataPoints || 20;

  useEffect(() => {
    const generateData = () => {
      const now = new Date();
      const cpu = Math.random() * 100;
      const memory = Math.random() * 100;
      const network = Math.random() * 100;
      
      setCurrentStats({ cpu, memory, network });
      
      setSystemData(prev => {
        const newData = [...prev, {
          time: now.toLocaleTimeString(),
          cpu: Math.round(cpu),
          memory: Math.round(memory),
          network: Math.round(network)
        }];
        return newData.slice(-dataPoints);
      });
    };

    generateData();
    const interval = setInterval(generateData, 2000);
    return () => clearInterval(interval);
  }, [dataPoints]);

  const renderChart = () => {
    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={systemData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
            <XAxis dataKey="time" hide />
            <YAxis hide />
            <Area type="monotone" dataKey="cpu" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.3)" />
            <Area type="monotone" dataKey="memory" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.3)" />
            <Area type="monotone" dataKey="network" stackId="1" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary) / 0.3)" />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={systemData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
          <XAxis dataKey="time" hide />
          <YAxis hide />
          <Line type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="memory" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="network" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="h-full flex flex-col bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card p-3">
        <span className="text-primary font-mono text-sm uppercase tracking-wider crt-glow">
          📊 {widgetName || 'SYSTEM MONITOR'}
        </span>
      </div>

      {/* Stats Bar */}
      <div className="flex-shrink-0 border-b border-border bg-background/50 p-3">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs font-mono text-muted-foreground">CPU</div>
            <div className="text-lg font-['VT323'] text-primary crt-glow">{Math.round(currentStats.cpu)}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-mono text-muted-foreground">MEM</div>
            <div className="text-lg font-['VT323'] text-accent">{Math.round(currentStats.memory)}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-mono text-muted-foreground">NET</div>
            <div className="text-lg font-['VT323'] text-secondary">{Math.round(currentStats.network)}%</div>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-4">
        {renderChart()}
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 border-t border-border bg-background/30 p-3">
        <div className="flex justify-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-primary rounded"></div>
            <span className="text-muted-foreground">CPU</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-accent rounded"></div>
            <span className="text-muted-foreground">MEMORY</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-secondary rounded"></div>
            <span className="text-muted-foreground">NETWORK</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleChart;