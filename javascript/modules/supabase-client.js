// =====================================================================
// SUPABASE CLIENT
// Configured once here and imported by any module that needs DB access.
// Using the CDN ESM build so no <script> tag or window.supabase needed.
// =====================================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL  = 'https://rfwmeaaclgdaxjrvemnj.supabase.co';
const SUPABASE_ANON = 'sb_publishable_U5iZNxy-kSRTFwNk-ck47A_wCN2nbvS';

export const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// The row key used in public.site_state for the to-do note
export const STATE_KEY = 'todo-note';

console.log('[supabase] Project URL :', SUPABASE_URL);
console.log('[supabase] Anon key    :', SUPABASE_ANON.slice(0, 24) + '…');
