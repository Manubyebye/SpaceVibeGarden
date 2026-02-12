// ============================================ //
// SUPABASE CONFIGURATION - REQUIRED!           //
// ============================================ //

const SUPABASE_URL = 'https://dfwxocwkblhqbppulbyk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YckotTNlFqrmJw2NR5qeUw_48mC3bjk';

let supabaseClient = null;

try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            },
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            }
        });
        console.log('✅ Supabase client initialized');
    } else {
        console.error('❌ Supabase library not loaded');
    }
} catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
}

window.supabase = supabaseClient;
window.supabaseClient = supabaseClient;
window.supabaseAvailable = !!supabaseClient;