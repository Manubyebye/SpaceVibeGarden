// ============================================ //
// SUPABASE CONFIGURATION - YOUR CREDENTIALS    //
// ============================================ //

const SUPABASE_URL = 'https://dfwxocwkblhqbppulbyk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YckotTNlFqrmJw2NR5qeUw_48mC3bjk';

let supabaseClient = null;

try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized');
    }
} catch (error) {
    console.error('❌ Supabase init failed:', error);
}

window.supabase = supabaseClient;
window.supabaseClient = supabaseClient;
window.supabaseAvailable = !!supabaseClient;