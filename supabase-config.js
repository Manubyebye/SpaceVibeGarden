// supabase-config.js
const SUPABASE_URL = 'https://dfwxocwkblhqbppulbyk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YckotTNlFqrmJw2NR5qeUw_48mC3bjk';

// Wait for Supabase to load
if (typeof window.supabase !== 'undefined') {
    // Create the client
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });
    
    // Also set the global variable
    window.supabase = window.supabaseClient;
    
    console.log('✅ Supabase client created successfully');
} else {
    console.error('❌ Supabase library not loaded yet');
}

// Export for modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { supabase: window.supabaseClient };
}