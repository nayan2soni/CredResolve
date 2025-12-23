
import { createClient } from '@supabase/supabase-js';

// Access environment variables in Vite using import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase Env vars in frontend!");
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
