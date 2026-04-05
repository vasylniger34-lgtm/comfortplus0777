import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://knfqgqursiflyxfefthr.supabase.co';
const supabaseAnonKey = 'sb_publishable_KatvO28-6LIwQdZeX0uIFA_gUwnPnHE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
