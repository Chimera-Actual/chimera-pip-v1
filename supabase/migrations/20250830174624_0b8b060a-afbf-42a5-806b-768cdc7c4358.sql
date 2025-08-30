-- Add Voice Agent Widget to widget definitions
INSERT INTO widget_definitions (
  id,
  name,
  description,
  icon,
  category,
  component_name,
  default_settings
) VALUES (
  'voice-agent',
  'Voice Assistant',
  'AI voice agent powered by ElevenLabs conversational AI',
  '🎤',
  'ai-agents',
  'VoiceAgentWidget',
  '{"agentId": "agent_5301k3y02gv7fhctk91r1dzk29dz", "title": "Voice Assistant"}'::jsonb
);