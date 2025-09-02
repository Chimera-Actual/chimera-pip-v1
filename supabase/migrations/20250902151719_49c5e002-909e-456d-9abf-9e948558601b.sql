-- Fix critical security issues identified in security scan

-- 1. Enable leaked password protection for better security
UPDATE auth.config 
SET enable_password_strength_checks = true,
    enable_leaked_password_protection = true;

-- 2. Reduce OTP expiry time to recommended 10 minutes (600 seconds)
UPDATE auth.config 
SET otp_expiry = 600;