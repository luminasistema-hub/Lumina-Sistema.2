import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qsynfgjwjxmswwcpajxz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzeW5mZ2p3anhtc3d3Y3Bhanh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzYxNzYsImV4cCI6MjA3NTM1MjE3Nn0.awgsRzgt-dYDzDy2Z_gsPHKrDg4_MxMWWL_77_sTYbM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);