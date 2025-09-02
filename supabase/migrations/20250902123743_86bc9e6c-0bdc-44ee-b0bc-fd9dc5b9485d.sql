-- Add the new dashboard widgets to widget_definitions table
INSERT INTO widget_definitions (id, name, description, icon, category, component_name, default_settings)
VALUES 
  (
    'add-widget-widget',
    'Add Widget',
    'Browse and add new widgets to your dashboard',
    'Plus',
    'Dashboard',
    'AddWidgetWidget',
    '{}'
  ),
  (
    'dashboard-settings-widget',
    'Dashboard Settings',
    'Configure dashboard theme and display options',
    'Settings',
    'Dashboard',
    'DashboardSettingsWidget',
    '{}'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  component_name = EXCLUDED.component_name,
  default_settings = EXCLUDED.default_settings;