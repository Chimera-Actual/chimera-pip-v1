-- Add AI agent widgets to the widget definitions
INSERT INTO public.widget_definitions (id, name, description, icon, category, component_name) VALUES
('claude-assistant', 'Claude AI Agent', 'Advanced reasoning and analysis assistant', '🤖', 'ai-agents', 'ClaudeAssistantWidget'),
('gpt-assistant', 'GPT AI Agent', 'General purpose AI assistant', '🧠', 'ai-agents', 'GPTAssistantWidget'),
('voice-assistant', 'Voice AI Agent', 'Voice-enabled AI conversation agent', '🎤', 'ai-agents', 'VoiceAssistantWidget'),
('custom-assistant', 'Custom AI Agent', 'Customizable AI assistant with webhook support', '⚙️', 'ai-agents', 'CustomAssistantWidget');