import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vszzqwxnumutiidaxjoe.supabase.co';
const supabaseAnonKey = 'sb_publishable_hWrQkcPSRaELIcRUKjy2IA_bSAKKSmB';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
