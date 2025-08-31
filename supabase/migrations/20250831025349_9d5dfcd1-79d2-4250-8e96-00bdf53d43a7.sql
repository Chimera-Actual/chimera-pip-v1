-- Rename the assistant_webhooks table to agent_webhooks
ALTER TABLE assistant_webhooks RENAME TO agent_webhooks;

-- Update the assistant_id column to agent_id for clarity  
ALTER TABLE agent_webhooks RENAME COLUMN assistant_id TO agent_id;