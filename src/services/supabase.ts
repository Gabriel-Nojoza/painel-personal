import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://sthtmnexxnxsxdlwnjay.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aHRtbmV4eG54c3hkbHduamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDA5NDMsImV4cCI6MjA4MDgxNjk0M30.mgLGemsbpVcNIx-9PrFpOkmDlDUTez3nS-AFtR-z3ok"
);
