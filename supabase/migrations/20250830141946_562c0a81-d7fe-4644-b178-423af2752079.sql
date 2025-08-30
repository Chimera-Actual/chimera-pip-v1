-- Remove the unique constraint that prevents duplicate tab names for the same user
-- This allows users to have multiple tabs with the same name, as each tab is uniquely identified by its ID
ALTER TABLE user_tabs DROP CONSTRAINT IF EXISTS user_tabs_user_id_name_key;