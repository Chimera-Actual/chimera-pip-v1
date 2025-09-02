import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Factory, Check, AlertCircle, Info } from 'lucide-react';
import { WidgetFactory, WidgetConfig, WidgetDefinition } from '@/lib/WidgetFactory';
import { WidgetConfigValidator, defaultValidator } from '@/lib/WidgetConfigValidator';
import { WidgetFactoryUtils, DASHBOARD_TEMPLATES } from '@/lib/WidgetFactoryUtils';
import WidgetAdapter from '@/components/dashboard/WidgetAdapter';
import { BaseWidgetProps } from '@/types/widget';

interface WidgetFactoryDemoProps extends BaseWidgetProps {}

// Mock widget definitions for demonstration
const mockWidgetDefinitions: WidgetDefinition[] = [
  {
    id: 'sample-clock',
    name: 'System Clock',
    category: 'utilities',
    icon: 'Clock',
    component_name: 'SampleClock',
    description: 'A digital clock widget with customizable display options',
    default_settings: {
      fontSize: 'medium',
      format24h: true,
      showDate: true,
      showSeconds: true,
      theme: 'default'
    }
  },
  {
    id: 'sample-note',
    name: 'Notes Terminal',
    category: 'productivity',
    icon: 'FileText',
    component_name: 'SampleNote',
    description: 'A persistent notepad widget for quick notes',
    default_settings: {
      autoSave: true,
      fontSize: 'medium',
      showWordCount: true,
      theme: 'default'
    }
  }
];

const WidgetFactoryDemo: React.FC<WidgetFactoryDemoProps> = ({
  widgetInstanceId,
  widgetName,
  onCollapseChange
}) => {
  const [createdWidgets, setCreatedWidgets] = useState<WidgetConfig[]>([]);
  const [validationResults, setValidationResults] = useState<Array<{ config: WidgetConfig; result: ReturnType<typeof defaultValidator.validate> }>>([]);

  const demonstrateFactory = () => {
    // Demo 1: Create single widget with factory
    const clockWidget = WidgetFactory.fromWidgetDefinition(
      mockWidgetDefinitions[0],
      'demo-tab',
      {
        customName: 'Factory Clock',
        overrideSettings: { theme: 'dark', showSeconds: false },
        layoutOverrides: { w: 3, h: 3 }
      }
    );

    // Demo 2: Create multiple widgets with bulk creation
    const bulkWidgets = WidgetFactoryUtils.createWidgetsBulk(
      {
        widgets: [
          {
            widgetId: 'sample-note',
            customName: 'Factory Notes',
            overrideSettings: { theme: 'minimal' }
          },
          {
            widgetId: 'sample-clock',
            customName: 'Mini Clock',
            layoutOverrides: { w: 2, h: 2 }
          }
        ],
        tabId: 'demo-tab',
        startPosition: 1,
        spacing: 1
      },
      mockWidgetDefinitions
    );

    // Demo 3: Create from template
    const templateWidgets = WidgetFactoryUtils.fromTemplate(
      DASHBOARD_TEMPLATES.productivity,
      'demo-tab',
      mockWidgetDefinitions
    );

    // Demo 4: Clone existing widget
    const clonedWidget = WidgetFactory.cloneWidget(clockWidget, 'demo-tab', {
      name: 'Cloned Clock',
      position: 10
    });

    const allWidgets = [clockWidget, ...bulkWidgets, ...templateWidgets, clonedWidget];

    // Validate all created widgets
    const results = allWidgets.map(config => ({
      config,
      result: defaultValidator.validate(config)
    }));

    setCreatedWidgets(allWidgets);
    setValidationResults(results);
  };

  const clearDemo = () => {
    setCreatedWidgets([]);
    setValidationResults([]);
  };

  const validCount = validationResults.filter(r => r.result.valid).length;
  const invalidCount = validationResults.length - validCount;
  const totalGridUsage = WidgetFactoryUtils.calculateGridUsage(createdWidgets);

  return (
    <WidgetAdapter
      title="Widget Factory Demo"
      widgetInstanceId={widgetInstanceId}
      widgetName={widgetName}
      icon={<Factory className="w-4 h-4" />}
      onCollapseChange={onCollapseChange}
    >
      <div className="space-y-4">
        {/* Factory Controls */}
        <div className="flex gap-2">
          <Button onClick={demonstrateFactory} size="sm" className="flex-1">
            <Factory className="w-4 h-4 mr-2" />
            Run Factory Demo
          </Button>
          <Button onClick={clearDemo} variant="outline" size="sm">
            Clear Results
          </Button>
        </div>

        {/* Factory Statistics */}
        {createdWidgets.length > 0 && (
          <Card className="bg-background/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono">Factory Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Info className="w-3 h-3 text-blue-500" />
                  <span>Widgets Created: {createdWidgets.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>Valid: {validCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-red-500" />
                  <span>Invalid: {invalidCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-primary rounded-sm" />
                  <span>Grid Usage: {totalGridUsage} units</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Widget Configurations */}
        {createdWidgets.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-mono font-semibold">Created Widget Configurations</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {validationResults.map(({ config, result }, index) => (
                <Card key={config.instanceId} className="bg-background/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-mono">
                        {config.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {config.category}
                        </Badge>
                        <Badge 
                          variant={result.valid ? "default" : "destructive"} 
                          className="text-xs"
                        >
                          {result.valid ? "Valid" : "Invalid"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>ID: <code className="text-xs">{config.instanceId.slice(0, 8)}...</code></div>
                      <div>Position: {config.position}</div>
                      <div>Layout: {config.layout.w}×{config.layout.h}</div>
                      <div>Settings: {Object.keys(config.settings).length} keys</div>
                    </div>
                    
                    {!result.valid && (
                      <div className="space-y-1">
                        <Separator />
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-red-500">Validation Errors:</div>
                          {result.errors.map((error, i) => (
                            <div key={i} className="text-xs text-red-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.warnings.length > 0 && (
                      <div className="space-y-1">
                        <Separator />
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-yellow-500">Warnings:</div>
                          {result.warnings.map((warning, i) => (
                            <div key={i} className="text-xs text-yellow-400 flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              {warning}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Factory Capabilities Demo */}
        <Card className="bg-background/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono">Factory Capabilities</CardTitle>
            <CardDescription className="text-xs">
              What the Widget Factory can do:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-500" />
                <span>Create widgets with unique IDs using crypto.randomUUID()</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-500" />
                <span>Merge default settings with custom overrides</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-500" />
                <span>Apply category-specific enhancements</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-500" />
                <span>Validate widget configurations</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-500" />
                <span>Bulk creation with proper positioning</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-500" />
                <span>Clone existing widgets with new instances</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-500" />
                <span>Create from dashboard templates</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-500" />
                <span>Layout optimization and conflict detection</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </WidgetAdapter>
  );
};

export default WidgetFactoryDemo;