require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.log("Missing SUPABASE vars in .env.local", url, !!key);
    process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
    const ids = ["47abe231-60a5-4a63-9360-9e828347296d"];

    console.log("Querying consultation_sessions for user_id...");
    const { data: session } = await supabase.from('consultation_sessions').select('user_id').eq('user_id', ids[0]).limit(1);
    console.log("Session:", session);

    console.log("Querying profiles for id...");
    const { data: profile, error } = await supabase.from('profiles').select('*').in('id', ids);
    console.log("Profile Result:", profile, error);
}

check();
