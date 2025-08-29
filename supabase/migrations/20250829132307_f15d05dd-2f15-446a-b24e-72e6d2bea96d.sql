-- Fix security vulnerability: Restrict profile SELECT policy to only allow users to view their own profiles
-- This prevents authenticated users from accessing other users' profile data

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create a new restrictive policy that only allows users to view their own profile
CREATE POLICY "Users can only view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);