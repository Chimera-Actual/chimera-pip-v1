import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Palette, Layout, Zap, Settings, Monitor, Smartphone } from 'lucide-react';
import ModernWidgetFrame from '@/components/ui/modern-widget-frame';
import { BaseWidgetProps } from '@/types/widget';

interface ModernCSSDemoProps extends BaseWidgetProps {}

const ModernCSSDemo: React.FC<ModernCSSDemoProps> = ({
  widgetInstanceId,
  widgetName,
  onCollapseChange
}) => {
  const [currentDemo, setCurrentDemo] = useState<'tokens' | 'logical' | 'layers' | 'container' | 'transitions'>('tokens');
  const [containerSize, setContainerSize] = useState<'small' | 'medium' | 'large'>('medium');

  const demoContent = {
    tokens: (
      <div className="space-y-4">
        <h4 className="text-responsive-lg font-heading">CSS Custom Properties Demo</h4>
        <div className="grid grid-cols-1 gap-3">
          <div className="padding-md border-radius-lg" style={{ background: 'hsl(var(--widget-background))' }}>
            <p className="text-responsive-sm">Widget Background: <code>var(--widget-background)</code></p>
          </div>
          <div className="padding-md border-radius-lg" style={{ background: 'hsl(var(--color-surface))' }}>
            <p className="text-responsive-sm">Surface Color: <code>var(--color-surface)</code></p>
          </div>
          <div className="space-y-2">
            <p className="text-responsive-sm font-semibold">Spacing System:</p>
            <div className="flex items-center gap-2">
              <div className="bg-primary/20 border-radius-sm" style={{ width: 'var(--space-xs)', height: 'var(--space-md)' }}></div>
              <span className="text-xs">--space-xs (4px)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-primary/20 border-radius-sm" style={{ width: 'var(--space-sm)', height: 'var(--space-md)' }}></div>
              <span className="text-xs">--space-sm (8px)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-primary/20 border-radius-sm" style={{ width: 'var(--space-md)', height: 'var(--space-md)' }}></div>
              <span className="text-xs">--space-md (16px)</span>
            </div>
          </div>
        </div>
      </div>
    ),
    logical: (
      <div className="space-y-4">
        <h4 className="text-responsive-lg font-heading">Logical Properties Demo</h4>
        <div className="space-y-3">
          <div className="padding-inline-md padding-block-sm bg-primary/10 border-radius-md">
            <p className="text-responsive-sm">Using <code>padding-inline-md</code> and <code>padding-block-sm</code></p>
          </div>
          <div className="margin-inline-auto bg-primary/10 border-radius-md padding-md" style={{ maxInlineSize: '200px' }}>
            <p className="text-responsive-sm text-center">
              <code>max-inline-size: 200px</code><br/>
              <code>margin-inline: auto</code>
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-responsive-sm font-semibold">Benefits:</p>
            <ul className="text-xs space-y-1 margin-inline-start-md">
              <li>• Automatic RTL/LTR support</li>
              <li>• Better internationalization</li>
              <li>• Future-proof layouts</li>
              <li>• Semantic naming</li>
            </ul>
          </div>
        </div>
      </div>
    ),
    layers: (
      <div className="space-y-4">
        <h4 className="text-responsive-lg font-heading">Cascade Layers Demo</h4>
        <div className="space-y-3">
          <div className="text-responsive-sm">
            <p className="font-semibold">Layer Order (lowest to highest priority):</p>
            <ol className="margin-inline-start-md space-y-1 text-xs margin-block-start-sm">
              <li>1. @layer reset</li>
              <li>2. @layer base</li>
              <li>3. @layer tokens</li>
              <li>4. @layer layout</li>
              <li>5. @layer components</li>
              <li>6. @layer widgets</li>
              <li>7. @layer utilities</li>
              <li>8. @layer overrides</li>
            </ol>
          </div>
          <div className="padding-md bg-primary/10 border-radius-md">
            <p className="text-responsive-sm">
              This demo widget uses styles from the <code>@layer widgets</code> layer,
              ensuring predictable cascade behavior.
            </p>
          </div>
        </div>
      </div>
    ),
    container: (
      <div className="space-y-4">
        <h4 className="text-responsive-lg font-heading">Container Queries Demo</h4>
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <Button
                key={size}
                variant={containerSize === size ? 'default' : 'outline'}
                size="sm"
                onClick={() => setContainerSize(size)}
                className="text-xs"
              >
                {size}
              </Button>
            ))}
          </div>
          <div 
            className="widget-container border border-primary/30 padding-md border-radius-lg transition-base"
            style={{
              width: containerSize === 'small' ? '200px' : 
                     containerSize === 'medium' ? '400px' : '600px'
            }}
          >
            <p className="text-responsive-md font-semibold">Responsive Content</p>
            <p className="text-responsive-sm margin-block-start-sm">
              This content adapts based on container size using container queries.
              Current size: <Badge variant="secondary">{containerSize}</Badge>
            </p>
            <div className="margin-block-start-md">
              <div className="text-xs">
                Font size: <code>var(--text-responsive-sm)</code><br/>
                Adapts using: <code>clamp(0.75rem, 2cqi, 0.875rem)</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    transitions: (
      <div className="space-y-4">
        <h4 className="text-responsive-lg font-heading">Modern Transitions Demo</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="padding-md bg-primary/10 border-radius-md transition-base hover:bg-primary/20 cursor-pointer">
              <p className="text-xs">Base Transition</p>
              <code className="text-2xs">var(--transition-base)</code>
            </div>
            <div className="padding-md bg-primary/10 border-radius-md transition-fast hover:bg-primary/20 cursor-pointer">
              <p className="text-xs">Fast Transition</p>
              <code className="text-2xs">var(--transition-fast)</code>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-responsive-sm font-semibold">Easing Functions:</p>
            <div className="text-xs space-y-1">
              <div>• <code>var(--easing-smooth)</code>: cubic-bezier(0.4, 0, 0.2, 1)</div>
              <div>• <code>var(--easing-emphasis)</code>: cubic-bezier(0.25, 0.46, 0.45, 0.94)</div>
              <div>• <code>var(--easing-bounce)</code>: cubic-bezier(0.68, -0.55, 0.265, 1.55)</div>
            </div>
          </div>
          <div className="padding-md bg-primary/10 border-radius-md">
            <p className="text-responsive-sm">
              Widget collapse/expand uses <code>var(--transition-collapse)</code> with
              emphasis easing for natural feel.
            </p>
          </div>
        </div>
      </div>
    )
  };

  return (
    <ModernWidgetFrame
      title="Modern CSS Architecture Demo"
      widgetInstanceId={widgetInstanceId}
      onCollapseChange={onCollapseChange}
      variant="emphasis"
      category="development"
    >
      <div className="space-y-4">
        {/* Demo Navigation */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'tokens', label: 'Custom Properties', icon: Palette },
            { key: 'logical', label: 'Logical Properties', icon: Layout },
            { key: 'layers', label: 'Cascade Layers', icon: Zap },
            { key: 'container', label: 'Container Queries', icon: Monitor },
            { key: 'transitions', label: 'Transitions', icon: Settings }
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={currentDemo === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentDemo(key as any)}
              className="text-xs gap-1"
            >
              <Icon className="w-3 h-3" />
              {label}
            </Button>
          ))}
        </div>

        <Separator />

        {/* Demo Content */}
        <div className="min-block-size-0">
          {demoContent[currentDemo]}
        </div>

        <Separator />

        {/* Architecture Features */}
        <Card className="bg-background/50">
          <CardHeader className="padding-block-sm">
            <CardTitle className="text-responsive-sm font-heading">Modern CSS Features</CardTitle>
            <CardDescription className="text-2xs">
              What this architecture provides
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 gap-2 text-2xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary border-radius-full"></div>
                <span>CSS Custom Properties for all dimensions & colors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary border-radius-full"></div>
                <span>Logical properties for internationalization</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary border-radius-full"></div>
                <span>Cascade layers for predictable styling</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary border-radius-full"></div>
                <span>Container queries for responsive widgets</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary border-radius-full"></div>
                <span>Cubic-bezier timing for smooth transitions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary border-radius-full"></div>
                <span>Semantic color system with HSL values</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary border-radius-full"></div>
                <span>Accessibility & reduced motion support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary border-radius-full"></div>
                <span>High contrast mode compatibility</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernWidgetFrame>
  );
};

export default ModernCSSDemo;