-- Configure Supabase security settings
-- Set OTP expiry to 10 minutes (600 seconds)
UPDATE auth.config SET value = '600' WHERE parameter = 'OTP_EXPIRY';

-- Set password requirements
UPDATE auth.config SET value = '8' WHERE parameter = 'PASSWORD_MIN_LENGTH';

-- Set session timeout to 24 hours
UPDATE auth.config SET value = '86400' WHERE parameter = 'SESSION_TIMEOUT';

-- Enable secure password requirements
UPDATE auth.config SET value = 'true' WHERE parameter = 'PASSWORD_REQUIRE_UPPERCASE';
UPDATE auth.config SET value = 'true' WHERE parameter = 'PASSWORD_REQUIRE_LOWERCASE';
UPDATE auth.config SET value = 'true' WHERE parameter = 'PASSWORD_REQUIRE_NUMBERS';