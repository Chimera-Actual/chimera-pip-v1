import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useWidgetAnalytics } from '@/hooks/useWidgetAnalytics';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  Zap, 
  Target,
  Users,
  Gauge,
  Calendar
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    widgetStats,
    performanceStats,
    activityPatterns,
    loading,
    getTopWidgets,
    getTotalUsageTime,
    getPerformanceScore,
    getPeakUsageHours,
  } = useWidgetAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"></div>
          <div className="text-sm font-mono text-primary">ANALYZING DATA...</div>
        </div>
      </div>
    );
  }

  const topWidgets = getTopWidgets(5);
  const totalUsageTime = getTotalUsageTime();
  const performanceScore = getPerformanceScore();
  const peakHours = getPeakUsageHours();

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted))'];

  const chartData = topWidgets.map(widget => ({
    name: widget.widget_name,
    usage: widget.usage_count,
    time: Math.round(widget.total_time_active / 60), // Convert to minutes
  }));

  const activityChartData = activityPatterns.map(pattern => ({
    hour: `${pattern.hour.toString().padStart(2, '0')}:00`,
    activity: pattern.activity_count,
    duration: Math.round(pattern.avg_duration / 60),
  }));

  return (
    <div className={`p-4 space-y-6 ${isMobile ? 'max-w-full' : 'max-w-6xl mx-auto'}`}>
      <div className="flex items-center space-x-3">
        <Activity className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-mono text-primary crt-glow uppercase tracking-wider">
          SYSTEM ANALYTICS
        </h2>
      </div>

      {/* Key Metrics */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <Card className="bg-background/30 border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-primary" />
              <div className="font-mono text-xs text-muted-foreground">TOTAL TIME</div>
            </div>
            <div className="font-mono text-lg font-bold text-primary">
              {formatTime(totalUsageTime)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/30 border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-primary" />
              <div className="font-mono text-xs text-muted-foreground">PERFORMANCE</div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="font-mono text-lg font-bold text-primary">
                {performanceScore}%
              </div>
              <Progress value={performanceScore} className="flex-1 h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/30 border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-primary" />
              <div className="font-mono text-xs text-muted-foreground">WIDGETS</div>
            </div>
            <div className="font-mono text-lg font-bold text-primary">
              {widgetStats.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/30 border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <div className="font-mono text-xs text-muted-foreground">SESSIONS</div>
            </div>
            <div className="font-mono text-lg font-bold text-primary">
              {performanceStats?.total_sessions || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Widget Usage Chart */}
        <Card className="bg-background/30 border-border">
          <CardHeader>
            <CardTitle className="text-sm font-mono text-primary uppercase tracking-wider flex items-center">
              <BarChart className="w-4 h-4 mr-2" />
              TOP WIDGETS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="usage" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Patterns */}
        <Card className="bg-background/30 border-border">
          <CardHeader>
            <CardTitle className="text-sm font-mono text-primary uppercase tracking-wider flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              DAILY ACTIVITY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={activityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="activity" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.3)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Peak Usage Hours */}
        <Card className="bg-background/30 border-border">
          <CardHeader>
            <CardTitle className="text-sm font-mono text-primary uppercase tracking-wider flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              PEAK HOURS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {peakHours.map((peak, index) => (
              <div key={peak.hour} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    #{index + 1}
                  </Badge>
                  <span className="font-mono text-sm">{peak.formattedHour}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={(peak.activity / Math.max(...peakHours.map(p => p.activity))) * 100} className="w-20 h-2" />
                  <span className="font-mono text-xs text-muted-foreground w-8">
                    {peak.activity}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Most Used Widgets */}
        <Card className="bg-background/30 border-border">
          <CardHeader>
            <CardTitle className="text-sm font-mono text-primary uppercase tracking-wider flex items-center">
              <Users className="w-4 h-4 mr-2" />
              WIDGET LEADERBOARD
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topWidgets.slice(0, 5).map((widget, index) => (
              <div key={widget.widget_type} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    #{index + 1}
                  </Badge>
                  <span className="font-mono text-sm truncate max-w-24">
                    {widget.widget_name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTime(widget.total_time_active)}
                  </span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {widget.usage_count}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};