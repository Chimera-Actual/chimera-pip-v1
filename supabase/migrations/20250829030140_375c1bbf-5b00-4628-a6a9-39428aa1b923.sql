-- Remove the RadioWidget from widget definitions since it's been replaced by AudioPlayerWidget
DELETE FROM widget_definitions WHERE component_name = 'RadioWidget';