// Simplified optimized client for basic retry logic
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://hwcndbqedbowkgpbinxl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3Y25kYnFlZGJvd2tncGJpbnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MDA5ODQsImV4cCI6MjA3MTk3Njk4NH0.mGjCCbnYh0QKT86rgknk5tgAZ-u2s-2Kt2sxrisabDU";

class OptimizedSupabaseClient {
  private client: SupabaseClient<Database>;

  constructor() {
    this.client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'X-Client-Info': 'pipboy-app/1.0.0',
        },
      },
    });
  }

  // Expose the original client
  get raw(): SupabaseClient<Database> {
    return this.client;
  }

  // Connection health check
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('widget_definitions')
        .select('id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const optimizedSupabase = new OptimizedSupabaseClient();